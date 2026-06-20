'use client'

import { useState, useRef, useEffect } from 'react'
import Header from './Header'
import ImageUploader from './ImageUploader'
import GeneratedImages from './GeneratedImages'
import VideoPlayer from './VideoPlayer'

type GenStatus = 'idle' | 'uploading' | 'pending' | 'completed'

interface Generation {
  id: string
  input_image_url: string
  output_image_urls: string[]
  video_url: string | null
  prompt: string
  created_at: string
}

interface Props {
  userEmail: string
  initialGenerations: Generation[]
}

const DEFAULT_PROMPT =
  'A luxurious furniture piece styled in a modern Scandinavian living room with warm natural light, soft textures, and elegant decor.'

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

function formatDate(iso: string) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  )
}

export default function MainPage({ userEmail, initialGenerations }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)

  const [genStatus, setGenStatus] = useState<GenStatus>('idle')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [selectedForVideo, setSelectedForVideo] = useState<string | null>(null)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [videoStatus, setVideoStatus] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const [generations, setGenerations] = useState<Generation[]>(initialGenerations)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)

  const imagePollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoPollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pendingId) return

    const poll = async () => {
      let res: Response
      try {
        res = await fetch(`/api/generation-status?id=${pendingId}`)
      } catch {
        setPollCount(c => c + 1)
        imagePollingRef.current = setTimeout(poll, 10000)
        return
      }
      if (!res.ok) {
        setPollCount(c => c + 1)
        imagePollingRef.current = setTimeout(poll, 10000)
        return
      }
      const data = await res.json()
      setPollCount(c => c + 1)

      if (data.status === 'completed') {
        setGenStatus('completed')
        setGeneratedImages(data.generation.output_image_urls)
        setCurrentGenerationId(pendingId)
        setPendingId(null)
        setGenerations(prev => [data.generation, ...prev.filter((g: Generation) => g.id !== pendingId)])
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
        return
      }

      imagePollingRef.current = setTimeout(poll, 10000)
    }

    imagePollingRef.current = setTimeout(poll, 3000)
    return () => { if (imagePollingRef.current) clearTimeout(imagePollingRef.current) }
  }, [pendingId])

  function resetSession() {
    setImageFile(null)
    setImagePreview(null)
    setGeneratedImages([])
    setCurrentGenerationId(null)
    setPendingId(null)
    setPollCount(0)
    setGenStatus('idle')
    setSelectedForVideo(null)
    setVideoUrl(null)
    setVideoStatus('')
    setError('')
    if (imagePollingRef.current) clearTimeout(imagePollingRef.current)
    if (videoPollingRef.current) clearTimeout(videoPollingRef.current)
  }

  async function handleGenerate() {
    if (!imageFile) return
    setGenStatus('uploading')
    setError('')
    setGeneratedImages([])
    setCurrentGenerationId(null)
    setPendingId(null)
    setPollCount(0)
    setSelectedForVideo(null)
    setVideoUrl(null)
    setVideoStatus('')

    const fd = new FormData()
    fd.append('image', imageFile)
    fd.append('prompt', prompt)

    let res: Response
    try {
      res = await fetch('/api/generate-images', { method: 'POST', body: fd })
    } catch {
      setGenStatus('idle')
      setError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.')
      return
    }
    const data = await res.json()

    if (!res.ok) {
      setGenStatus('idle')
      setError(data.error ?? 'Görsel oluşturma başarısız oldu.')
      return
    }

    if (data.status === 'completed') {
      setGenStatus('completed')
      setGeneratedImages(data.generation.output_image_urls)
      setCurrentGenerationId(data.generation.id)
      setGenerations(prev => [data.generation, ...prev.filter((g: Generation) => g.id !== data.generation.id)])
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      return
    }

    setGenStatus('pending')
    setPendingId(data.generation.id)
  }

  async function handleSelectForVideo(imageUrl: string) {
    if (!currentGenerationId) return
    setSelectedForVideo(imageUrl)
    setGeneratingVideo(true)
    setVideoStatus('Video oluşturuluyor...')
    setVideoUrl(null)

    let res: Response
    try {
      res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, generationId: currentGenerationId }),
      })
    } catch {
      setVideoStatus('')
      setGeneratingVideo(false)
      setError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.')
      return
    }
    const data = await res.json()

    if (!res.ok) {
      setVideoStatus('')
      setGeneratingVideo(false)
      setError(data.error ?? 'Video başlatılamadı.')
      return
    }

    pollVideoStatus(data.requestId, currentGenerationId)
  }

  function pollVideoStatus(requestId: string, generationId: string) {
    setVideoStatus('Video işleniyor — 1–3 dakika sürebilir...')

    const check = async () => {
      let res: Response
      try {
        res = await fetch(
          `/api/video-status?requestId=${encodeURIComponent(requestId)}&generationId=${encodeURIComponent(generationId)}`
        )
      } catch {
        videoPollingRef.current = setTimeout(check, 12000)
        return
      }
      const data = await res.json()

      if (data.status === 'COMPLETED') {
        setGeneratingVideo(false)
        setVideoStatus('')
        setVideoUrl(data.videoUrl)
        setGenerations(prev =>
          prev.map(g => g.id === generationId ? { ...g, video_url: data.videoUrl } : g)
        )
        return
      }
      if (data.status === 'FAILED') {
        setGeneratingVideo(false)
        setVideoStatus('')
        setError('Video oluşturma başarısız oldu.')
        return
      }
      videoPollingRef.current = setTimeout(check, 12000)
    }

    check()
  }

  const isGenerating = genStatus === 'uploading' || genStatus === 'pending'
  const selectedHistoryGen = generations.find(g => g.id === selectedHistoryId) ?? null

  return (
    <div className="min-h-screen bg-canvas">
      <Header userEmail={userEmail} />

      <div className="pt-14">

        {/* ── Generate section ───────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-6 pt-16 pb-12">
          <div className="mb-10">
            <h1 className="text-3xl font-semibold text-hi tracking-tight">
              Lifestyle görsel oluştur
            </h1>
            <p className="text-base text-mid mt-2">
              Ürün fotoğrafı yükleyin, sahne tanımlayın, AI ile üretin.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-medium text-mute mb-2 uppercase tracking-widest">
                Ürün Fotoğrafı
              </label>
              <ImageUploader
                onImageSelected={(file, prev) => {
                  setImageFile(file)
                  setImagePreview(prev)
                  setGeneratedImages([])
                  setCurrentGenerationId(null)
                  setPendingId(null)
                  setGenStatus('idle')
                  setSelectedForVideo(null)
                  setVideoUrl(null)
                  setVideoStatus('')
                  setError('')
                }}
                preview={imagePreview}
                onClear={resetSession}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-mute mb-2 uppercase tracking-widest">
                Sahne Açıklaması
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
                placeholder="Mobilyanın nasıl bir ortamda olmasını istiyorsunuz?"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-hi placeholder:text-mute resize-none outline-none focus:border-line-heavy focus:ring-2 focus:ring-black/[0.04] transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!imageFile || isGenerating}
              className="w-full bg-hi text-canvas text-sm font-medium rounded-xl py-3 flex items-center justify-center gap-2 transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {genStatus === 'uploading' ? 'Yükleniyor...' : 'İşleniyor...'}
                </>
              ) : 'Görselleri Oluştur'}
            </button>
          </div>
        </section>

        {/* ── Results section ────────────────────────────────── */}
        {(genStatus === 'pending' || genStatus === 'completed') && (
          <section ref={resultsRef} className="border-t border-line bg-surface py-12">
            <div className="max-w-3xl mx-auto px-6">
              <p className="text-[11px] font-medium text-mute uppercase tracking-widest mb-6">
                {genStatus === 'pending' ? (
                  <>
                    İşleniyor
                    {pollCount > 0 && (
                      <span className="font-normal normal-case tracking-normal ml-2 text-mute">
                        · {pollCount}. kontrol
                      </span>
                    )}
                  </>
                ) : 'Sonuçlar'}
              </p>

              {genStatus === 'pending' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="skeleton rounded-xl" style={{ aspectRatio: '4/3' }} />
                  ))}
                </div>
              )}

              {genStatus === 'completed' && generatedImages.length > 0 && (
                <div className="space-y-6">
                  <GeneratedImages
                    images={generatedImages}
                    onSelectForVideo={handleSelectForVideo}
                    generatingVideo={generatingVideo}
                    selectedForVideo={selectedForVideo}
                  />
                  {videoStatus && (
                    <div className="flex items-center gap-3 bg-canvas border border-line rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 animate-spin flex-shrink-0 text-mid" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-sm text-mid">{videoStatus}</p>
                    </div>
                  )}
                  {videoUrl && <VideoPlayer videoUrl={videoUrl} />}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── History section ────────────────────────────────── */}
        {generations.length > 0 && (
          <section className="border-t border-line py-12 pb-20">
            <div className="max-w-3xl mx-auto px-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-hi">Geçmiş</h2>
                <span className="text-xs text-mute bg-raised border border-line rounded-full px-2.5 py-1">
                  {generations.length} üretim
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {generations.map(gen => {
                  const isSelected = selectedHistoryId === gen.id
                  return (
                    <button
                      key={gen.id}
                      onClick={() => setSelectedHistoryId(isSelected ? null : gen.id)}
                      className={`group text-left rounded-xl border overflow-hidden transition-all ${
                        isSelected
                          ? 'border-hi ring-1 ring-black/10'
                          : 'border-line hover:border-line-mid'
                      }`}
                    >
                      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                        <img
                          src={gen.output_image_urls[0]}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300" />
                        {gen.video_url && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                            Video
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2.5 bg-canvas border-t border-line">
                        <p className="text-xs text-hi font-medium truncate leading-snug">
                          {gen.prompt || 'Sahne açıklaması yok'}
                        </p>
                        <p className="text-[11px] text-mute mt-0.5">{formatDate(gen.created_at)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedHistoryGen && (
                <div className="mt-4 border border-line rounded-xl bg-surface p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-hi">
                        {selectedHistoryGen.prompt || 'Sahne açıklaması yok'}
                      </p>
                      <p className="text-xs text-mute mt-1">{formatDate(selectedHistoryGen.created_at)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedHistoryId(null)}
                      className="flex-shrink-0 w-7 h-7 rounded-lg border border-line flex items-center justify-center hover:bg-raised transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {selectedHistoryGen.output_image_urls.map((url, i) => (
                      <div
                        key={i}
                        className="group relative rounded-lg overflow-hidden border border-line hover:border-line-mid transition-all"
                        style={{ aspectRatio: '4/3' }}
                      >
                        <img
                          src={url}
                          alt={`Varyant ${i + 1}`}
                          className="w-full h-full object-cover transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => downloadImage(url, i)}
                            title="İndir"
                            className="w-8 h-8 bg-white/90 hover:bg-white backdrop-blur-sm rounded-lg flex items-center justify-center transition-colors border border-white/20"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                          </button>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Tam boyut aç"
                            className="w-8 h-8 bg-white/90 hover:bg-white backdrop-blur-sm rounded-lg flex items-center justify-center transition-colors border border-white/20"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedHistoryGen.video_url && (
                    <VideoPlayer videoUrl={selectedHistoryGen.video_url} />
                  )}
                </div>
              )}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
