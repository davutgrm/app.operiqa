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
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  )
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export default function MainPage({ userEmail, initialGenerations }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const [analyzeError, setAnalyzeError] = useState(false)
  const [transparentBg, setTransparentBg] = useState(false)
  const [copied, setCopied] = useState(false)
  const [videoMode, setVideoMode] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

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
  const [videoImageUrl, setVideoImageUrl] = useState<string | null>(null)
  const [videoGenId, setVideoGenId] = useState<string | null>(null)

  const [credits, setCredits] = useState<number | null>(null)

  const imagePollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoPollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const videoModeRef = useRef(videoMode)

  useEffect(() => { videoModeRef.current = videoMode }, [videoMode])

  async function fetchCredits() {
    try {
      const res = await fetch('/api/credits')
      if (!res.ok) return
      const data = await res.json()
      setCredits(data.credits ?? 0)
    } catch {}
  }

  useEffect(() => { fetchCredits() }, [])

  // Layered Escape: modal first, then drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (selectedHistoryId) { setSelectedHistoryId(null); return }
      if (historyOpen) setHistoryOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [historyOpen, selectedHistoryId])

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
        const genId = pendingId
        setGenStatus('completed')
        setGeneratedImages(urls)
        setCurrentGenerationId(genId)
        setPendingId(null)
        setGenerations(prev => [data.generation, ...prev.filter((g: Generation) => g.id !== pendingId)])
        fetchCredits()
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
        if (videoModeRef.current && urls.length > 0) startVideoGeneration(urls[0], genId!)
        return
      }

      imagePollingRef.current = setTimeout(poll, 10000)
    }

    imagePollingRef.current = setTimeout(poll, 3000)
    return () => { if (imagePollingRef.current) clearTimeout(imagePollingRef.current) }
  }, [pendingId])

  async function analyzeImage(file: File) {
    setAnalyzingImage(true)
    setPrompt('')
    try {
      const data = await new Promise<{ base64: string; mediaType: string }>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const [header, base64] = dataUrl.split(',')
          const mediaType = header.replace('data:', '').replace(';base64', '')
          resolve({ base64, mediaType })
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: data.base64, mediaType: data.mediaType }),
      })
      const json = await res.json()
      if (res.ok && json.description) {
        setPrompt(json.description)
        setAnalyzeError(false)
      } else {
        console.error('[analyze-image] API hatası:', json)
        setAnalyzeError(true)
      }
    } catch (err) {
      console.error('[analyze-image] fetch hatası:', err)
      setAnalyzeError(true)
    } finally {
      setAnalyzingImage(false)
    }
  }

  async function checkTransparency(file: File): Promise<boolean> {
    if (!file.type.includes('png')) return false
    return new Promise(resolve => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) { URL.revokeObjectURL(url); resolve(false); return }
        ctx.drawImage(img, 0, 0)
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        for (let i = 3; i < data.length; i += 16) {
          if (data[i] < 250) { resolve(true); return }
        }
        resolve(false)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(false) }
      img.src = url
    })
  }

  function resetSession() {
    setImageFile(null)
    setImagePreview(null)
    setPrompt('')
    setAnalyzingImage(false)
    setAnalyzeError(false)
    setTransparentBg(false)
    setGeneratedImages([])
    setCurrentGenerationId(null)
    setPendingId(null)
    setPollCount(0)
    setGenStatus('idle')
    setSelectedForVideo(null)
    setVideoUrl(null)
    setVideoStatus('')
    setError('')
    setVideoImageUrl(null)
    setVideoGenId(null)
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
      setError('Impossible de se connecter au serveur. Veuillez réessayer.')
      return
    }
    const data = await res.json()

    if (!res.ok) {
      setGenStatus('idle')
      setError(data.error ?? 'Échec de la création de l\'image.')
      return
    }

    if (data.status === 'completed') {
      const urls: string[] = data.generation.output_image_urls
      const genId: string = data.generation.id
      setGenStatus('completed')
      setGeneratedImages(urls)
      setCurrentGenerationId(genId)
      setGenerations(prev => [data.generation, ...prev.filter((g: Generation) => g.id !== genId)])
      fetchCredits()
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      if (videoMode && urls.length > 0) startVideoGeneration(urls[0], genId)
      return
    }

    setGenStatus('pending')
    setPendingId(data.generation.id)
  }

  async function startVideoGeneration(imageUrl: string, generationId: string) {
    setSelectedForVideo(imageUrl)
    setGeneratingVideo(true)
    setVideoStatus('Génération de la vidéo...')
    setVideoUrl(null)

    let res: Response
    try {
      res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, generationId }),
      })
    } catch {
      setVideoStatus('')
      setGeneratingVideo(false)
      setError('Impossible de se connecter au serveur. Veuillez réessayer.')
      return
    }
    const data = await res.json()
    if (!res.ok) {
      setVideoStatus('')
      setGeneratingVideo(false)
      setError(data.error ?? 'Impossible de démarrer la vidéo.')
      return
    }
    pollVideoStatus(generationId)
  }

  function handleSelectForVideo(imageUrl: string) {
    if (!currentGenerationId) return
    setVideoImageUrl(imageUrl)
    setVideoGenId(currentGenerationId)
    setVideoMode(true)
    setPrompt('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function pollVideoStatus(generationId: string) {
    setVideoStatus('Vidéo en cours de traitement — 1 à 3 minutes...')
    let attempts = 0
    const MAX_ATTEMPTS = 40

    const check = async () => {
      attempts++
      let res: Response
      try {
        res = await fetch(`/api/video-status?generationId=${encodeURIComponent(generationId)}`)
      } catch {
        if (attempts >= MAX_ATTEMPTS) { setGeneratingVideo(false); setVideoStatus(''); setError('La génération de la vidéo a expiré.'); return }
        videoPollingRef.current = setTimeout(check, 12000)
        return
      }
      const data = await res.json()

      if (data.status === 'COMPLETED') {
        setGeneratingVideo(false)
        setVideoStatus('')
        setVideoUrl(data.videoUrl)
        setGenerations(prev => prev.map(g => g.id === generationId ? { ...g, video_url: data.videoUrl } : g))
        fetchCredits()
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 200)
        return
      }

      if (attempts >= MAX_ATTEMPTS) { setGeneratingVideo(false); setVideoStatus(''); setError('La génération de la vidéo a expiré. Veuillez réessayer.'); return }
      videoPollingRef.current = setTimeout(check, 12000)
    }
    check()
  }



  function selectForHistoryVideo(gen: Generation, imageUrl: string) {
    setSelectedHistoryId(null)
    setHistoryOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setVideoImageUrl(imageUrl)
    setVideoGenId(gen.id)
    setVideoMode(true)
    setPrompt('')
    setVideoUrl(null)
    setVideoStatus('')
    setGeneratingVideo(false)
    setSelectedForVideo(null)
    setError('')
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const isGenerating = genStatus === 'uploading' || genStatus === 'pending'
  const outOfCredits = credits !== null && credits < 1
  const notEnoughCreditsForVideo = credits !== null && credits < 5
  const selectedHistoryGen = generations.find(g => g.id === selectedHistoryId) ?? null

  return (
    <div className="min-h-screen bg-canvas">
      <Header
        userEmail={userEmail}
        historyOpen={historyOpen}
        onToggleHistory={() => setHistoryOpen(o => !o)}
      />

      {/* ── Video generating banner ────────────────────────── */}
      {generatingVideo && (
        <div className="fixed top-14 inset-x-0 z-30 bg-neutral-900 text-white">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
            <svg className="w-4 h-4 animate-spin flex-shrink-0 text-white/70" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm font-medium">Votre vidéo est en cours de préparation — elle apparaîtra ci-dessous dans quelques minutes</p>
          </div>
        </div>
      )}

      <div className="pt-14">

        {/* ── Generate section ───────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-6 pt-14 pb-12">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold text-hi tracking-tight">Créer un visuel lifestyle</h1>
              <p className="text-sm text-mid mt-1.5">Importez une photo produit, décrivez la scène, générez avec l'IA.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-mute bg-raised border border-line rounded-xl px-3.5 py-2.5 flex-shrink-0">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {credits === null ? (
                <span className="text-mute">...</span>
              ) : (
                <span className={credits === 0 ? 'text-red-500 font-medium' : ''}>
                  {credits} kredi kaldı
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left */}
            <div>
              <label className="block text-[11px] font-medium text-mute mb-2 uppercase tracking-widest">Product Image</label>
              {videoImageUrl ? (
                <div className="relative rounded-2xl border border-line overflow-hidden bg-raised" style={{ minHeight: 200 }}>
                  <img
                    src={videoImageUrl}
                    alt="Image sélectionnée pour la vidéo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/65 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-lg">
                    Image sélectionnée pour la vidéo
                  </div>
                  <button
                    onClick={() => { setVideoImageUrl(null); setVideoGenId(null) }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/65 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/85 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <ImageUploader
                    onImageSelected={(file, prev) => {
                      setImageFile(file); setImagePreview(prev); setGeneratedImages([]); setCurrentGenerationId(null)
                      setPendingId(null); setGenStatus('idle'); setSelectedForVideo(null); setVideoUrl(null)
                      setVideoStatus(''); setError(''); setVideoImageUrl(null); setVideoGenId(null)
                      setAnalyzeError(false); setTransparentBg(false)
                      analyzeImage(file)
                      checkTransparency(file).then(setTransparentBg)
                    }}
                    preview={imagePreview}
                    onClear={resetSession}
                  />
                  {transparentBg && (
                    <div className="mt-2.5 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl px-3 py-2.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                      L'arrière-plan de votre produit semble transparent. Une photo sur fond blanc est recommandée pour un meilleur résultat.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right */}
            <div className="flex flex-col gap-4">
              {/* Video Mode toggle */}
              <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-hi">Video Mode</p>
                  <p className="text-xs text-mute mt-0.5">
                    {videoMode ? 'Une vidéo est générée automatiquement après l\'image' : 'Seule l\'image est générée'}
                  </p>
                </div>
                <button
                  type="button" onClick={() => setVideoMode(v => !v)}
                  aria-checked={videoMode} role="switch"
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${videoMode ? 'bg-hi' : 'bg-line-mid'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${videoMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Prompt */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-medium text-mute uppercase tracking-widest">Prompt</label>
                  {!videoImageUrl && (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setPrompt('')} title="Effacer"
                        className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-mute hover:text-hi hover:bg-raised transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button type="button" onClick={handleCopyPrompt} title="Copier"
                        className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-mute hover:text-hi hover:bg-raised transition-colors">
                        {copied
                          ? <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        }
                      </button>
                    </div>
                  )}
                </div>
                {videoImageUrl ? (
                  <div className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-mute select-none" style={{ minHeight: 120 }}>
                    Slow cinematic camera drift around a modern living room, soft natural light filtering through sheer curtains, highlighting the texture of the sofa and wooden coffee table, photorealistic
                  </div>
                ) : (
                  <textarea
                    value={prompt} onChange={e => setPrompt(e.target.value)} disabled={analyzingImage} rows={6}
                    placeholder={analyzingImage ? 'Analyse en cours...' : analyzeError ? 'Décrivez la scène' : 'Dans quel environnement souhaitez-vous placer le meuble ?'}
                    className="w-full flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-hi placeholder:text-mute resize-none outline-none focus:border-line-heavy focus:ring-2 focus:ring-black/[0.04] transition-all disabled:opacity-60 disabled:cursor-wait"
                  />
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {videoImageUrl ? (
                <>
                  {notEnoughCreditsForVideo && (
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Krediniz bitti. Video için 5 kredi gereklidir.{' '}
                        <a href="/pricing" className="underline font-medium">Kredi satın al →</a>
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => startVideoGeneration(videoImageUrl, videoGenId!)}
                    disabled={generatingVideo || notEnoughCreditsForVideo}
                    className="w-full bg-hi text-canvas text-sm font-medium rounded-xl py-3 flex items-center justify-center gap-2 transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {generatingVideo ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Génération de la vidéo...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Générer la vidéo
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {outOfCredits && (
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Krediniz bitti.{' '}
                        <a href="/pricing" className="underline font-medium">Kredi satın al →</a>
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleGenerate} disabled={!imageFile || isGenerating || analyzingImage || outOfCredits}
                    className="w-full bg-hi text-canvas text-sm font-medium rounded-xl py-3 flex items-center justify-center gap-2 transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                  {isGenerating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {genStatus === 'uploading' ? 'Chargement...' : 'Traitement...'}
                    </>
                  ) : videoMode ? 'Générer image + vidéo' : 'Générer les images'}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Results section ────────────────────────────────── */}
        {(genStatus === 'pending' || genStatus === 'completed') && (
          <section ref={resultsRef} className="border-t border-line bg-surface py-12">
            <div className="max-w-4xl mx-auto px-6">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[11px] font-medium text-mute uppercase tracking-widest">
                  {genStatus === 'pending' ? (
                    <>Traitement{pollCount > 0 && <span className="font-normal normal-case tracking-normal ml-2">· vérification n°{pollCount}</span>}</>
                  ) : 'Résultats'}
                </p>
                {genStatus === 'completed' && generatedImages.length > 0 && (
                  <span className="text-xs text-mute bg-raised border border-line rounded-full px-2.5 py-0.5">{generatedImages.length} variante(s)</span>
                )}
              </div>

              {genStatus === 'pending' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map(i => <div key={i} className="skeleton rounded-2xl" style={{ minHeight: 400 }} />)}
                </div>
              )}

              {genStatus === 'completed' && generatedImages.length > 0 && (
                <div className="space-y-6">
                  <GeneratedImages images={generatedImages} onSelectForVideo={handleSelectForVideo} generatingVideo={generatingVideo} selectedForVideo={selectedForVideo} />
                  {videoUrl && !videoImageUrl && <VideoPlayer videoUrl={videoUrl} />}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ── Video from history results ─────────────────────── */}
      {videoImageUrl && videoUrl && (
        <section className="border-t border-line bg-surface py-10">
          <div className="max-w-4xl mx-auto px-6 space-y-4">
            <p className="text-[11px] font-medium text-mute uppercase tracking-widest">Vidéo prête</p>
            {(
              <div className="space-y-3">
                <VideoPlayer videoUrl={videoUrl} />
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = `/api/download-video?url=${encodeURIComponent(videoUrl)}`
                    link.download = 'operiqa-video.mp4'
                    link.click()
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-hi text-canvas text-sm font-medium rounded-xl py-3 hover:opacity-80 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Télécharger la vidéo
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── My Images drawer ───────────────────────────────── */}
      <div className={`fixed inset-0 z-40 ${historyOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${historyOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setHistoryOpen(false)}
        />
        <div className={`absolute top-14 right-0 bottom-0 w-full sm:w-[480px] bg-canvas border-l border-line shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${historyOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-hi">Mes images</h2>
              <span className="text-xs text-mute bg-raised border border-line rounded-full px-2 py-0.5">{generations.length}</span>
            </div>
            <button onClick={() => setHistoryOpen(false)} className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-mid hover:text-hi hover:bg-raised transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer body */}
          <div className="flex-1 overflow-y-auto p-4">
            {generations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-2xl bg-raised border border-line flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-mute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-hi mb-1">Aucune création pour l'instant</p>
                <p className="text-xs text-mute">Créez votre première image.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {generations.map(gen => (
                  <div
                    key={gen.id}
                    className="group rounded-xl border border-line overflow-hidden cursor-pointer hover:border-line-mid hover:shadow-sm transition-all"
                    onClick={() => setSelectedHistoryId(gen.id)}
                  >
                    {/* Square cover */}
                    <div className="relative aspect-square overflow-hidden bg-raised">
                      <img
                        src={gen.output_image_urls[0]}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300" />
                      {gen.video_url && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                          <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Video
                        </div>
                      )}
                      {videoGenId === gen.id && generatingVideo && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="px-3 py-2.5 bg-canvas border-t border-line">
                      <p className="text-[11px] text-mute">{formatDate(gen.created_at)}</p>
                      <p className="text-xs text-hi font-medium mt-0.5 leading-snug">
                        {truncate(gen.prompt || 'Pas de description', 30)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Generation detail modal ────────────────────────── */}
      {selectedHistoryGen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedHistoryId(null)}
          />

          {/* Panel */}
          <div className="relative z-10 bg-canvas rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line flex-shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-hi leading-snug line-clamp-2">
                  {selectedHistoryGen.prompt || 'Pas de description'}
                </p>
                <p className="text-xs text-mute mt-1">{formatDate(selectedHistoryGen.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedHistoryId(null)}
                className="flex-shrink-0 w-8 h-8 rounded-xl border border-line flex items-center justify-center text-mid hover:text-hi hover:bg-raised transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Images horizontal scroll */}
              <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
                {selectedHistoryGen.output_image_urls.map((url, i) => (
                  <div key={i} className="flex-shrink-0 w-64 space-y-2.5">
                    <div className="rounded-xl overflow-hidden border border-line bg-raised" style={{ aspectRatio: '4/3' }}>
                      <img src={url} alt={`Variante ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadImage(url, i)}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-line text-hi text-xs font-medium rounded-lg py-2 hover:bg-raised transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Télécharger
                      </button>
                      <button
                        onClick={() => selectForHistoryVideo(selectedHistoryGen, url)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-hi text-canvas text-xs font-medium rounded-lg py-2 hover:opacity-80 transition-opacity"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Créer vidéo
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Video section */}
              {selectedHistoryGen.video_url && (
                <div className="space-y-3">
                  <VideoPlayer videoUrl={selectedHistoryGen.video_url} />
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = `/api/download-video?url=${encodeURIComponent(selectedHistoryGen.video_url!)}`
                      link.download = 'operiqa-video.mp4'
                      link.click()
                    }}
                    className="flex items-center justify-center gap-2 w-full bg-hi text-canvas text-sm font-medium rounded-xl py-3 hover:opacity-80 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Télécharger la vidéo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
