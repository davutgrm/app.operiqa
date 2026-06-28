'use client'

import { useState, useRef } from 'react'

interface Generation {
  id: string
  input_image_url: string
  output_image_urls: string[]
  video_url: string | null
  video_urls: Record<string, string>
  prompt: string
  created_at: string
}

interface Props {
  generations: Generation[]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  )
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

export default function HistoryPage({ generations: initialGenerations }: Props) {
  const [generations, setGenerations] = useState<Generation[]>(initialGenerations)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [generatingKey, setGeneratingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoPollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedGen = generations.find(g => g.id === selectedId) ?? null

  function hasAnyVideo(gen: Generation) {
    return gen.video_url || Object.keys(gen.video_urls ?? {}).length > 0
  }

  function pollVideoStatus(generationId: string, imageIndex: number) {
    let attempts = 0
    const MAX_ATTEMPTS = 40

    const check = async () => {
      attempts++
      try {
        const res = await fetch(`/api/video-status?generationId=${encodeURIComponent(generationId)}&imageIndex=${imageIndex}`)
        const data = await res.json()

        if (data.status === 'COMPLETED') {
          setGeneratingKey(null)
          setGenerations(prev => prev.map(g => g.id === generationId ? {
            ...g,
            video_urls: { ...(g.video_urls ?? {}), [String(imageIndex)]: data.videoUrl },
          } : g))
          return
        }

        if (data.status === 'FAILED') {
          setGeneratingKey(null)
          setError('Échec de la création vidéo.')
          return
        }
      } catch {}

      if (attempts >= MAX_ATTEMPTS) {
        setGeneratingKey(null)
        setError('La génération de la vidéo a expiré. Veuillez réessayer.')
        return
      }
      videoPollingRef.current = setTimeout(check, 12000)
    }
    check()
  }

  async function handleCreateVideo(gen: Generation, imageUrl: string, imageIndex: number) {
    const key = `${gen.id}-${imageIndex}`
    setGeneratingKey(key)
    setError(null)

    let res: Response
    try {
      res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, generationId: gen.id, imageIndex }),
      })
    } catch {
      setGeneratingKey(null)
      setError('Impossible de se connecter au serveur.')
      return
    }

    const data = await res.json()

    if (!res.ok) {
      setGeneratingKey(null)
      setError(data.error ?? 'Impossible de démarrer la vidéo.')
      return
    }

    if (data.status === 'ALREADY_EXISTS') {
      setGeneratingKey(null)
      setGenerations(prev => prev.map(g => g.id === gen.id ? {
        ...g,
        video_urls: { ...(g.video_urls ?? {}), [String(imageIndex)]: data.videoUrl },
      } : g))
      return
    }

    pollVideoStatus(gen.id, imageIndex)
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header bar */}
      <div className="border-b border-line bg-canvas/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-mid hover:text-hi transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <h1 className="text-sm font-semibold text-hi">Mes images</h1>
            <span className="text-xs text-mute bg-raised border border-line rounded-full px-2 py-0.5">{generations.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Empty state */}
        {generations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-14 h-14 rounded-2xl bg-raised border border-line flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-mute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-hi mb-1">Aucune création pour l'instant</p>
            <p className="text-xs text-mute">Créez votre première image depuis la page d'accueil.</p>
            <a href="/" className="mt-5 text-xs font-medium text-hi bg-hi/10 hover:bg-hi/20 border border-line rounded-xl px-4 py-2.5 transition-colors">
              Créer une image →
            </a>
          </div>
        )}

        {/* 3-column grid */}
        {generations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {generations.map(gen => (
              <div
                key={gen.id}
                onClick={() => setSelectedId(gen.id)}
                className="group rounded-2xl border border-line overflow-hidden cursor-pointer hover:border-line-mid hover:shadow-lg transition-all duration-300 bg-surface"
              >
                {/* Cover image */}
                <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  <img
                    src={gen.output_image_urls[0]}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Hover overlay buttons */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white/90 backdrop-blur-sm text-black text-xs font-semibold px-4 py-2 rounded-xl shadow">
                      Voir les détails
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    {hasAnyVideo(gen) && (
                      <div className="flex items-center gap-1 bg-black/70 text-white text-[10px] font-semibold px-2 py-1 rounded-lg backdrop-blur-sm">
                        <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        Vidéo
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="text-[10px] font-medium text-white/80 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      {gen.output_image_urls.length} image{gen.output_image_urls.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="px-4 py-3">
                  <p className="text-xs font-medium text-hi line-clamp-2 leading-snug">
                    {gen.prompt || 'Sans description'}
                  </p>
                  <p className="text-[11px] text-mute mt-1.5">{formatDate(gen.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedGen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={() => setSelectedId(null)}
          />
          <div className="relative z-10 w-full sm:max-w-4xl max-h-[92vh] flex flex-col overflow-hidden sm:rounded-3xl shadow-2xl border border-white/[0.08]" style={{ background: '#0a0a0a' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] flex-shrink-0">
              <p className="text-sm font-medium text-white truncate flex-1 min-w-0 pr-4">
                {selectedGen.prompt || 'Sans description'}
              </p>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] text-white/40 hidden sm:block">{formatDate(selectedGen.created_at)}</span>
                <button
                  onClick={() => setSelectedId(null)}
                  className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2.5 px-6 py-3 bg-red-950/60 border-b border-red-900/40 text-red-400 text-xs flex-shrink-0">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
                <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-300">✕</button>
              </div>
            )}

            {/* Generating banner */}
            {generatingKey && (
              <div className="flex items-center gap-2.5 px-6 py-3 border-b border-white/[0.06] text-white/70 text-xs flex-shrink-0" style={{ background: '#111' }}>
                <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Vidéo en cours de génération — 1 à 3 minutes...
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-4">
                {selectedGen.output_image_urls.map((url, i) => {
                  const hasVideo = !!(selectedGen.video_urls?.[String(i)])
                  const vidUrl = selectedGen.video_urls?.[String(i)] ?? null
                  const isGeneratingThis = generatingKey === `${selectedGen.id}-${i}`

                  return (
                    <div key={i} className="rounded-2xl border border-white/[0.08]" style={{ background: '#111' }}>

                      {/* Image with hover buttons */}
                      <div className="group relative w-full">
                        <img src={url} alt={`Variante ${i + 1}`} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '12px' }} />

                        {/* Generating overlay */}
                        {isGeneratingThis && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          </div>
                        )}

                        {/* Hover buttons */}
                        <div className="absolute bottom-0 inset-x-0 p-2.5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center text-xs font-medium text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl py-2 px-3 transition-colors"
                          >
                            ↗ Ouvrir
                          </a>
                          <button
                            onClick={() => downloadImage(url, i)}
                            className="flex-1 flex items-center justify-center text-xs font-medium text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl py-2 px-3 transition-colors"
                          >
                            ↓ Image
                          </button>
                          <button
                            onClick={() => !isGeneratingThis && !hasVideo && handleCreateVideo(selectedGen, url, i)}
                            disabled={!!generatingKey || hasVideo}
                            className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium backdrop-blur-sm border rounded-xl py-2 px-3 transition-colors ${
                              isGeneratingThis
                                ? 'text-white/40 bg-white/10 border-white/10 cursor-wait'
                                : hasVideo
                                  ? 'text-white/40 bg-white/10 border-white/10 cursor-default'
                                  : 'text-white bg-white/15 hover:bg-white/25 border-white/20'
                            }`}
                          >
                            {isGeneratingThis ? (
                              <>
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                En cours
                              </>
                            ) : hasVideo ? 'Vidéo créée' : '▶ Vidéo'}
                          </button>
                        </div>
                      </div>

                      {/* Video section */}
                      {hasVideo && vidUrl && (
                        <div className="p-3 border-t border-white/[0.06] space-y-2">
                          <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Vidéo de ce visuel</p>
                          <video
                            src={vidUrl}
                            controls
                            loop
                            playsInline
                            preload="metadata"
                            style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '12px' }}
                          />
                          <button
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = `/api/download-video?url=${encodeURIComponent(vidUrl)}`
                              link.download = 'operiqa-video.mp4'
                              link.click()
                            }}
                            className="w-full flex items-center justify-center text-xs font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-xl py-2.5 transition-colors"
                          >
                            ↓ Télécharger la vidéo
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
