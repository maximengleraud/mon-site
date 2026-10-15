// Wilson score confidence interval (lower bound)
export function wilsonScore(likes: number, dislikes: number): number {
  const n = likes + dislikes
  if (n === 0) return 0
  const p = likes / n
  const z = 1.96 // 95% confidence
  const denominator = 1 + (z * z) / n
  const center = p + (z * z) / (2 * n)
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)
  return (center - spread) / denominator
}
