'use client'

interface Props {
  images: string[]
  onSelectForVideo: (imageUrl: string) => void
  generatingVideo: boolean
  selectedForVideo: string | null
}

export default function GeneratedImages({ images, onSelectForVideo, generatingVideo, selectedForVideo }: Props) {
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

            {/* Dark overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200" />

            {/* Actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
              <button
                onClick={() => onSelectForVideo(url)}
                disabled={generatingVideo}
                title="Video oluştur"
                className="w-8 h-8 bg-surface/90 hover:bg-surface backdrop-blur-sm rounded-lg flex items-center justify-center transition-colors border border-line disabled:opacity-40"
              >
                <svg className="w-3.5 h-3.5 text-hi" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Selected indicator */}
            {selectedForVideo === url && (
              <div className="absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide bg-hi text-canvas">
                Video
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-mute mt-2">Görselin üzerine gelin → video için oynat ikonuna tıklayın</p>
    </div>
  )
}
