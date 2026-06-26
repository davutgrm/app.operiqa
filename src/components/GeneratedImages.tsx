'use client'

interface Props {
  images: string[]
  onSelectForVideo: (imageUrl: string) => void
  generatingVideo: boolean
  selectedForVideo: string | null
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

export default function GeneratedImages({ images, onSelectForVideo, generatingVideo, selectedForVideo }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {images.map((url, i) => (
        <div
          key={i}
          className="relative rounded-2xl overflow-hidden bg-raised border border-line"
          style={{ minHeight: 400 }}
        >
          <img
            src={url}
            alt={`Variante ${i + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {selectedForVideo === url && (
            <div className="absolute top-3 left-3 bg-hi text-canvas text-[11px] font-medium px-2 py-1 rounded-lg">
              Vidéo sélectionnée
            </div>
          )}

          {/* Buttons always visible, no overlay/gradient */}
          <div className="absolute bottom-0 inset-x-0 px-3 pb-3 flex items-center gap-2">
            <button
              onClick={() => downloadImage(url, i)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-xs font-medium rounded-xl py-2.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Télécharger
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-xs font-medium rounded-xl py-2.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Plein format
            </a>
            <button
              onClick={() => onSelectForVideo(url)}
              disabled={generatingVideo}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-xs font-medium rounded-xl py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Vidéo
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
