'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ImageUploader from './ImageUploader'
import GeneratedImages from './GeneratedImages'
import VideoPlayer from './VideoPlayer'
import HistoryGallery from './HistoryGallery'

interface Generation {
  id: string
  input_image_url: string
  output_image_urls: string[]
  video_url: string | null
  prompt: string
  created_at: string
}

type GenerationStatus = 'idle' | 'uploading' | 'pending' | 'completed'

interface Props {
  initialGenerations: Generation[]
  userEmail: string
}

const DEFAULT_PROMPT =
  'A luxurious furniture piece styled in a modern Scandinavian living room with warm natural light, soft textures, and elegant decor.'

export default function Dashboard({ initialGenerations, userEmail }: Props) {
  const router = useRouter()
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

  const [generations, setGenerations] = useState<Generation[]>(initialGenerations)

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
        setGenerations(prev =>
          prev.map(g => g.id === pendingId ? { ...g, output_image_urls: urls } : g)
        )
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
      setGenerations(prev => [data.generation, ...prev])
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      return
    }

    setGenStatus('pending')
    setGenerations(prev => [data.generation, ...prev])
    setPendingId(data.generation.id)
  }

  async function handleSelectForVideo(imageUrl: string, imageIndex: number) {
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
        body: JSON.stringify({ imageUrl, generationId: currentGenerationId, imageIndex }),
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

    pollVideoStatus(currentGenerationId, imageIndex)
  }

  function pollVideoStatus(generationId: string, imageIndex: number) {
    setVideoStatus('Vidéo en cours de traitement — 4–5 minutes...')
    const check = async () => {
      try {
        const res = await fetch(`/api/video-status?generationId=${encodeURIComponent(generationId)}&imageIndex=${imageIndex}`)
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
          setError('Échec de la création vidéo.')
          return
        }
      } catch {}
      videoPollingRef.current = setTimeout(check, 12000)
    }
    check()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isGenerating = genStatus === 'uploading' || genStatus === 'pending'

  return (
    <div className="min-h-screen bg-canvas">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line" style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-hi tracking-tight">Operiqa</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-mute hidden sm:block">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-mid hover:text-hi border border-line hover:border-line-mid rounded-md px-3 py-1.5 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-hi">Lifestyle görsel oluştur</h1>
          <p className="text-sm text-low mt-1">Ürün fotoğrafı yükleyin, sahne tanımlayın, AI ile üretin.</p>
        </div>

        {/* Input area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">

          {/* Upload card */}
          <div className="bg-surface border border-line rounded-xl p-5">
            <p className="text-[11px] font-medium text-mute uppercase tracking-widest mb-3">Ürün fotoğrafı</p>
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
          <div className="bg-surface border border-line rounded-xl p-5 flex flex-col">
            <p className="text-[11px] font-medium text-mute uppercase tracking-widest mb-3">Sahne açıklaması</p>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={6}
              placeholder="Mobilyanın nasıl bir ortamda olmasını istiyorsunuz?"
              className="flex-1 w-full bg-raised border border-line-mid rounded-lg px-3 py-2.5 text-sm text-hi placeholder-mute focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring transition-colors resize-none"
            />
            <div className="mt-4 space-y-2.5">
              <button
                onClick={handleGenerate}
                disabled={!imageFile || isGenerating}
                className="w-full bg-accent hover:bg-accent-hover text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              {!imageFile && (
                <p className="text-xs text-mute text-center">Önce bir ürün fotoğrafı yükleyin</p>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2.5 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Pending */}
        {genStatus === 'pending' && (
          <div ref={resultsRef} className="mt-6 bg-surface border border-line rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <svg className="w-4 h-4 text-accent animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-hi">Görseller işleniyor</p>
                <p className="text-xs text-low mt-0.5">
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
          <div ref={resultsRef} className="mt-6 bg-surface border border-line rounded-xl p-5 space-y-5">
            <GeneratedImages
              images={generatedImages}
              onSelectForVideo={handleSelectForVideo}
              generatingVideo={generatingVideo}
              selectedForVideo={selectedForVideo}
            />
            {videoStatus && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-accent-muted border border-accent-ring rounded-lg">
                <svg className="w-4 h-4 text-accent animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-mid">{videoStatus}</p>
              </div>
            )}
            {videoUrl && <VideoPlayer videoUrl={videoUrl} />}
          </div>
        )}

        {/* Divider before history */}
        {generations.filter(g => g.output_image_urls.length > 0).length > 0 && (
          <div className="mt-12 mb-0">
            <HistoryGallery generations={generations} />
          </div>
        )}
      </main>
    </div>
  )
}
