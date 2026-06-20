'use client'

import { useState, useRef, useEffect } from 'react'
import ImageUploader from './ImageUploader'
import GeneratedImages from './GeneratedImages'
import VideoPlayer from './VideoPlayer'

type GenerationStatus = 'idle' | 'uploading' | 'pending' | 'completed'

const DEFAULT_PROMPT =
  'A luxurious furniture piece styled in a modern Scandinavian living room with warm natural light, soft textures, and elegant decor.'

export default function GeneratePage() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)

  const [genStatus, setGenStatus] = useState<GenerationStatus>('idle')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [selectedForVideo, setSelectedForVideo] = useState<string | null>(null)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [videoStatus, setVideoStatus] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

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
        const urls: string[] = data.generation.output_image_urls
        setGenStatus('completed')
        setGeneratedImages(urls)
        setCurrentGenerationId(pendingId)
        setPendingId(null)
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

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-8 py-12">

        {/* Page title */}
        <div className="mb-10">
          <h1
            className="font-serif font-light text-hi"
            style={{ fontSize: '2rem', letterSpacing: '0.06em', lineHeight: 1.2 }}
          >
            Lifestyle Görsel Oluştur
          </h1>
          <p className="text-sm text-low mt-2.5 tracking-wide">
            Ürün fotoğrafı yükleyin, sahne tanımlayın, AI ile üretin.
          </p>
        </div>

        {/* Input area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">

          {/* Upload card */}
          <div className="card-premium luxury-card rounded-xl p-5">
            <p className="text-[10px] font-medium text-mute uppercase tracking-[0.14em] mb-4">
              Ürün Fotoğrafı
            </p>
            <ImageUploader
              onImageSelected={(file, preview) => {
                setImageFile(file)
                setImagePreview(preview)
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

          {/* Prompt card */}
          <div className="card-premium luxury-card rounded-xl p-5 flex flex-col">
            <p className="text-[10px] font-medium text-mute uppercase tracking-[0.14em] mb-4">
              Sahne Açıklaması
            </p>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={6}
              placeholder="Mobilyanın nasıl bir ortamda olmasını istiyorsunuz?"
              className="luxury-input flex-1 w-full rounded-lg px-3.5 py-3 text-sm resize-none"
            />
            <div className="mt-4 space-y-2.5">
              <button
                onClick={handleGenerate}
                disabled={!imageFile || isGenerating}
                className="btn-gold w-full rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin opacity-70" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {genStatus === 'uploading' ? 'Yükleniyor...' : 'İşleniyor...'}
                  </>
                ) : 'Görselleri Oluştur'}
              </button>
              {!imageFile && (
                <p className="text-[11px] text-mute text-center tracking-wide">
                  Önce bir ürün fotoğrafı yükleyin
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl px-4 py-3.5 bg-red-950/15 border border-red-900/25">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Pending */}
        {genStatus === 'pending' && (
          <div ref={resultsRef} className="card-premium luxury-card mt-6 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-4 h-4 animate-spin flex-shrink-0 text-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-hi">Görseller işleniyor</p>
                <p className="text-xs text-low mt-0.5 tracking-wide">
                  10 saniyede bir kontrol ediliyor
                  {pollCount > 0 && <span className="text-mute"> · {pollCount}. deneme</span>}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="skeleton rounded-lg" style={{ aspectRatio: '4/3' }} />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {genStatus === 'completed' && generatedImages.length > 0 && (
          <div ref={resultsRef} className="card-premium luxury-card mt-6 rounded-xl p-5 space-y-5">
            <GeneratedImages
              images={generatedImages}
              onSelectForVideo={handleSelectForVideo}
              generatingVideo={generatingVideo}
              selectedForVideo={selectedForVideo}
            />
            {videoStatus && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent-muted border border-accent-ring">
                <svg className="w-4 h-4 animate-spin flex-shrink-0 text-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-mid tracking-wide">{videoStatus}</p>
              </div>
            )}
            {videoUrl && <VideoPlayer videoUrl={videoUrl} />}
          </div>
        )}

      </div>
    </div>
  )
}
