import json, os, sys, concurrent.futures, urllib.request, re

ENV = '/home/ubuntu/plateforme_politique/nextjs_space/.env'
key = None
for line in open(ENV):
    if line.startswith('ABACUSAI_API_KEY='):
        key = line.split('=', 1)[1].strip().strip('"')
OUT = '/home/ubuntu/plateforme_politique/nextjs_space/data/programmes'
os.makedirs(OUT, exist_ok=True)

PARTIES = {
  'npa': 'NPA - Nouveau Parti anticapitaliste (programme de Philippe Poutou, présidentielle 2022)',
  'lo': 'Lutte ouvrière (programme de Nathalie Arthaud, présidentielle 2022 et européennes 2024)',
  'lfi': "La France insoumise (programme « L'Avenir en commun », 2022, et programme du Nouveau Front populaire 2024)",
  'ps': 'Parti socialiste (programme d\'Anne Hidalgo 2022 et programme du Nouveau Front populaire 2024)',
  'eelv': "Les Écologistes / EELV (programme de Yannick Jadot 2022 « Le temps de l'écologie » et NFP 2024)",
  'pcf': 'Parti communiste français (programme de Fabien Roussel « La France des jours heureux », 2022, et NFP 2024)',
  're': "Renaissance (programme d'Emmanuel Macron 2022 « Avec vous » et programme Ensemble législatives 2024)",
  'modem': 'MoDem - Mouvement démocrate (positions officielles, participation au programme Ensemble 2022/2024, propositions de François Bayrou)',
  'horizons': "Horizons (propositions officielles d'Édouard Philippe et du parti Horizons, programme Ensemble 2024)",
  'lr': 'Les Républicains (programme de Valérie Pécresse 2022 et programme LR législatives 2024)',
  'udi': 'UDI - Union des démocrates et indépendants (positions et propositions officielles, européennes 2024)',
  'rn': 'Rassemblement national (programme de Marine Le Pen 2022 et programme de Jordan Bardella législatives 2024)',
  'reconquete': "Reconquête (programme d'Éric Zemmour 2022 « Pour que la France reste la France » et européennes 2024)",
  'dlf': "Debout La France (programme de Nicolas Dupont-Aignan 2022)",
}

PROMPT = """Tu es un documentaliste politique rigoureux et neutre. Restitue fidèlement le programme officiel du parti suivant : {party}.

Règles strictes :
- N'invente AUCUNE mesure. N'inclus que des mesures réellement présentes dans les programmes officiels cités ou dans les positions officielles documentées du parti. Si tu n'es pas sûr d'un chiffre, ne le donne pas.
- Reformule de manière neutre, factuelle, sans jugement ni commentaire.
- Organise par thèmes. Utilise de préférence ces thèmes quand le parti les traite : Économie, Fiscalité, Éducation, Santé, Sécurité, Immigration, Environnement, Énergie, Institutions, Politique étrangère, Travail, Logement. Tu peux ajouter d'autres thèmes réellement présents dans le programme (ex. Retraites, Agriculture, Culture, Numérique, Europe, Défense, Justice, Services publics, Outre-mer, Jeunesse).
- N'inclus PAS un thème que le parti ne traite pas.
- Il n'y a AUCUNE limite au nombre de mesures par thème : liste toutes les mesures principales et significatives du programme pour chaque thème (souvent entre 3 et 12).
- Chaque mesure a : un titre court (max 90 caractères), un résumé d'une phrase, et un texte détaillé de 2 à 5 phrases expliquant le contenu, les modalités et l'objectif affiché par le parti.

Réponds uniquement en JSON brut avec cette structure :
{{"source": "nom exact du ou des programmes utilisés", "themes": [{{"title": "Santé", "points": [{{"title": "...", "summary": "...", "details": "..."}}]}}]}}"""

def call(slug, desc):
    path = f'{OUT}/{slug}.json'
    if os.path.exists(path):
        return slug, 'skip'
    body = json.dumps({
        'model': 'claude-opus-5-5',
        'messages': [{'role': 'user', 'content': PROMPT.format(party=desc)}],
        'response_format': {'type': 'json_object'},
        'max_tokens': 32000,
        'temperature': 0.1,
    }).encode()
    for attempt in range(3):
        if attempt == 2:
            body = body.replace(b'claude-opus-5-5', b'claude-sonnet-4-5')
        try:
            req = urllib.request.Request('https://apps.abacus.ai/v1/chat/completions', data=body, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key}', 'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=900) as r:
                res = json.loads(r.read())
            txt = res['choices'][0]['message']['content']
            txt = re.sub(r'^```(json)?|```$', '', txt.strip()).strip()
            data = json.loads(txt)
            assert data.get('themes')
            json.dump(data, open(path, 'w'), ensure_ascii=False, indent=1)
            n = sum(len(t['points']) for t in data['themes'])
            return slug, f"ok {len(data['themes'])} thèmes / {n} mesures"
        except Exception as e:
            err = str(e)
    return slug, 'FAIL ' + err

with concurrent.futures.ThreadPoolExecutor(7) as ex:
    for slug, status in ex.map(lambda kv: call(*kv), PARTIES.items()):
        print(slug, status, flush=True)
