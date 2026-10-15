"""Montages photo des membres de chaque parti à partir de photos libres de droits (Wikimedia Commons)."""
import json, os, re, sys, time, urllib.parse, urllib.request, io, html
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

UA = {'User-Agent': 'PlateformePolitique/1.0 (montage photos; contact maximeengleraud@gmail.com)'}
OUT = '/home/ubuntu/plateforme_politique/nextjs_space/public/parties'
CREDITS = '/home/ubuntu/plateforme_politique/nextjs_space/data/photo-credits.json'
CACHE = '/home/ubuntu/party_photos/cache'
os.makedirs(CACHE, exist_ok=True)

PARTIES = {
  'npa': ['Philippe Poutou', 'Olivier Besancenot', 'Christine Poupin', 'Pauline Salingue', 'Alain Krivine'],
  'lo': ['Nathalie Arthaud', 'Arlette Laguiller', 'Jean-Pierre Mercier (syndicaliste)', 'Robert Barcia'],
  'lfi': ['Jean-Luc Mélenchon', 'Mathilde Panot', 'Manuel Bompard', 'Clémence Guetté', 'Éric Coquerel'],
  'ps': ['Olivier Faure', 'Boris Vallaud', 'Carole Delga', 'Anne Hidalgo', 'Patrick Kanner'],
  'eelv': ['Marine Tondelier', 'Yannick Jadot', 'Sandrine Rousseau', 'Cyrielle Chatelain', 'Éric Piolle'],
  'pcf': ['Fabien Roussel', 'Léon Deffontaines', 'Ian Brossat', 'André Chassaigne', 'Elsa Faucillon'],
  're': ['Gabriel Attal', 'Élisabeth Borne', 'Gérald Darmanin', 'Aurore Bergé', 'Stéphane Séjourné'],
  'modem': ['François Bayrou', 'Marc Fesneau', 'Jean-Noël Barrot', 'Geneviève Darrieussecq', 'Sarah El Haïry'],
  'horizons': ['Édouard Philippe', 'Christophe Béchu', 'Laurent Marcangeli', 'Frédéric Valletoux'],
  'lr': ['Bruno Retailleau', 'Laurent Wauquiez', 'Valérie Pécresse', 'François-Xavier Bellamy', 'Michel Barnier'],
  'udi': ['Hervé Marseille', 'Jean-Christophe Lagarde', 'Jean-Louis Borloo', 'Valérie Létard', 'Yves Jégo'],
  'rn': ['Marine Le Pen', 'Jordan Bardella', 'Sébastien Chenu', 'Jean-Philippe Tanguy', 'Laure Lavalette'],
  'reconquete': ['Éric Zemmour', 'Sarah Knafo', 'Stanislas Rigault', 'Laurence Trochu', 'Jérôme Rivière'],
  'dlf': ['Nicolas Dupont-Aignan', 'Emmanuelle Gave', 'Jean-Philippe Tanguy', 'Laurent Jacobelli'],
}
# Personnes ayant quitté le parti : utilisées seulement si rien d'autre (on les retire pour rester fidèle).
EXCLUDE = {('dlf', 'Jean-Philippe Tanguy'), ('dlf', 'Laurent Jacobelli')}

def get(url):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return r.read()
        except Exception as e:
            print('  retry', e, file=sys.stderr); time.sleep(2 + i * 3)
    raise RuntimeError(url)

def api(params, host='fr.wikipedia.org'):
    q = urllib.parse.urlencode({**params, 'format': 'json', 'formatversion': 2})
    return json.loads(get(f'https://{host}/w/api.php?{q}'))

def strip(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s or '')).strip()

def lookup_en(title):
    return lookup(title, False, 'en.wikipedia.org')

def lookup(title, host_fallback=True, host='fr.wikipedia.org'):
    d = api({'action': 'query', 'titles': title, 'prop': 'pageimages', 'piprop': 'name', 'redirects': 1}, host)
    page = d['query']['pages'][0]
    fname = page.get('pageimage')
    if not fname and host_fallback:
        return lookup_en(title)
    if not fname: return None
    info = api({'action': 'query', 'titles': f'File:{fname}', 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 1000}, 'commons.wikimedia.org')
    p = info['query']['pages'][0]
    if 'imageinfo' not in p: return None
    ii = p['imageinfo'][0]; md = ii.get('extmetadata', {})
    lic = strip(md.get('LicenseShortName', {}).get('value'))
    if not re.search(r'CC|Public domain|Domaine public|PD|GFDL|Attribution|European Parliament|Licence Ouverte|Open Licence', lic, re.I): return None
    return {'name': re.sub(r' \(.*\)$', '', page['title']), 'file': fname, 'thumb': ii['thumburl'], 'page': ii['descriptionurl'],
            'author': strip(md.get('Artist', {}).get('value'))[:120] or 'Auteur inconnu', 'license': lic}

face = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def crop_panel_simple(img, w, h):
    W, H = img.size; s = max(w / W, h / H)
    img = img.resize((round(W * s) + 1, round(H * s) + 1))
    l = (img.width - w) // 2; t = (img.height - h) // 2
    return img.crop((l, t, l + w, t + h))

def crop_panel(img, w, h):
    """Recadre en w×h centré sur le visage (tête dans le tiers supérieur)."""
    W, H = img.size
    if w > h:  # panneau large (1 seule personne) : portrait entier sur fond flou
        bg = crop_panel_simple(img, w, h).filter(ImageFilter.GaussianBlur(30))
        fg = img.resize((round(W * h / H), h), Image.LANCZOS)
        if fg.width > w: fg = fg.crop(((fg.width - w) // 2, 0, (fg.width - w) // 2 + w, h))
        bg.paste(fg, ((w - fg.width) // 2, 0))
        return bg
    arr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)
    m = max(40, int(min(W, H) * 0.1))
    faces = face.detectMultiScale(arr, 1.1, 6, minSize=(m, m))
    if len(faces):
        x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])
        cx, cy = x + fw / 2, y + fh / 2
        scale = max(w / (fw * 3.2), h / (fh * 4.2))  # visage ≈ 1/3.2 de la largeur
        scale = max(scale, w / W, h / H)
    else:
        cx, cy = W / 2, H * 0.35
        scale = max(w / W, h / H)
    img = img.resize((max(w, round(W * scale)), max(h, round(H * scale))), Image.LANCZOS)
    cx, cy = cx * scale, cy * scale
    left = min(max(0, cx - w / 2), img.width - w)
    top = min(max(0, cy - h * 0.38), img.height - h)
    return img.crop((round(left), round(top), round(left) + w, round(top) + h))

try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
except OSError:
    FONT = ImageFont.load_default()

def montage(people, W=1280, H=720):
    n = len(people); canvas = Image.new('RGB', (W, H), (20, 20, 30))
    gap = 4; pw = (W - gap * (n - 1)) // n
    for i, (p, img) in enumerate(people):
        panel = crop_panel(img, pw, H)
        x = i * (pw + gap)
        canvas.paste(panel, (x, 0))
    # dégradé bas pour lisibilité des noms
    grad = Image.new('L', (1, 160)); [grad.putpixel((0, y), int(200 * (y / 159) ** 1.5)) for y in range(160)]
    shade = Image.new('RGB', (W, 160), (0, 0, 0))
    canvas.paste(shade, (0, H - 160), grad.resize((W, 160)))
    d = ImageDraw.Draw(canvas)
    for i, (p, _) in enumerate(people):
        x = i * (pw + gap); tw = d.textlength(p['name'], font=FONT)
        f = FONT if tw <= pw - 16 else ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
        tw = d.textlength(p['name'], font=f)
        d.text((x + (pw - tw) / 2, H - 46), p['name'], font=f, fill='white')
    return canvas

credits = {}
for slug, names in PARTIES.items():
    print('==', slug)
    found = []
    for nm in names:
        if (slug, nm) in EXCLUDE: continue
        if len(found) >= 4: break
        try:
            r = lookup(nm)
        except Exception as e:
            print('  err', nm, e); r = None
        if not r: print('  pas de photo libre :', nm); continue
        path = os.path.join(CACHE, re.sub(r'\W+', '_', r['file']))
        if not os.path.exists(path):
            open(path, 'wb').write(get(r['thumb'])); time.sleep(0.5)
        img = Image.open(path).convert('RGB')
        found.append((r, img)); print('  ok', r['name'], '|', r['license'])
    if not found: print('  AUCUNE photo pour', slug); continue
    m = montage(found)
    m.save(f'{OUT}/{slug}-membres.webp', quality=82)
    m.resize((480, 270), Image.LANCZOS).save(f'{OUT}/{slug}-membres-sm.webp', quality=80)
    credits[slug] = [{k: r[k] for k in ('name', 'author', 'license', 'page')} for r, _ in found]

os.makedirs(os.path.dirname(CREDITS), exist_ok=True)
json.dump(credits, open(CREDITS, 'w'), ensure_ascii=False, indent=1)
print('done', len(credits))
