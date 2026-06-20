export function extractImageUrls(body: unknown): string[] {
  if (!body) return []
  if (Array.isArray(body) && typeof body[0] === 'string') return body as string[]
  if (Array.isArray(body)) {
    const urls = (body as Record<string, unknown>[]).flatMap(item => {
      const v = item['url'] ?? item['image_url'] ?? item['output_url'] ?? item['result']
      return typeof v === 'string' ? [v] : []
    })
    if (urls.length) return urls
  }
  if (typeof body === 'object' && body !== null) {
    const obj = body as Record<string, unknown>
    for (const key of ['images', 'output_image_urls', 'urls', 'results', 'outputs', 'data']) {
      const val = obj[key]
      if (Array.isArray(val)) {
        const flat = val.flatMap(v =>
          typeof v === 'string' ? [v] : typeof v === 'object' && v !== null
            ? [((v as Record<string, unknown>)['url'] ?? (v as Record<string, unknown>)['image_url'])].filter((u): u is string => typeof u === 'string')
            : []
        )
        if (flat.length) return flat
      }
    }
    const single = obj['url'] ?? obj['image_url'] ?? obj['output_url']
    if (typeof single === 'string') return [single]
  }
  return []
}
