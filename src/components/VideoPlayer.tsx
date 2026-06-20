'use client'

import { useState } from 'react'

interface Props {
  videoUrl: string
}

export default function VideoPlayer({ videoUrl }: Props) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(videoUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = 'operiqa-video.mp4'
      a.click()
      URL.revokeObjectURL(blobUrl)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="border border-line rounded-xl overflow-hidden bg-surface">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald-500" />
          <span className="text-sm font-medium text-hi">Video hazır</span>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 text-xs text-low hover:text-hi transition-colors border border-line hover:border-line-mid rounded-md px-2.5 py-1.5 disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {downloading ? 'İndiriliyor...' : 'İndir'}
        </button>
      </div>
      <div className="aspect-video bg-black">
        <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
      </div>
    </div>
  )
}
