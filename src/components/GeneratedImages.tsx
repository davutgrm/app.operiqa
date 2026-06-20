'use client'

interface Props {
  images: string[]
}

async function downloadImage(url: string, index: number) {
  const res = await fetch(url)
  const blob = await res.blob()
  const ext = blob.type === 'image/png' ? 'png' : 'jpg'
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = `operiqa-${index + 1}.${ext}`
  a.click()
  URL.revokeObjectURL(blobUrl)
}

export default function GeneratedImages({ images }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-medium text-mute uppercase tracking-widest">Sonuçlar</p>
        <span className="text-xs text-mute bg-raised border border-line rounded-full px-2.5 py-0.5">{images.length} varyant</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {images.map((url, i) => (
          <div
            key={i}
            className="group relative rounded-lg overflow-hidden bg-raised border border-line"
            style={{ aspectRatio: '4/3' }}
          >
            <img src={url} alt={`Varyant ${i + 1}`} className="w-full h-full object-cover" />

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200" />

            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => downloadImage(url, i)}
                title="İndir"
                className="w-8 h-8 bg-surface/90 hover:bg-surface backdrop-blur-sm rounded-lg flex items-center justify-center transition-colors border border-line"
              >
                <svg className="w-3.5 h-3.5 text-hi" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title="Tam boyut aç"
                className="w-8 h-8 bg-surface/90 hover:bg-surface backdrop-blur-sm rounded-lg flex items-center justify-center transition-colors border border-line"
              >
                <svg className="w-3.5 h-3.5 text-hi" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-mute mt-2">Görselin üzerine gelin → indirin veya tam boyut açın</p>
    </div>
  )
}
