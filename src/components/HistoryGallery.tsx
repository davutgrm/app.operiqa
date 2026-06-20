'use client'

import { useState } from 'react'

interface Generation {
  id: string
  input_image_url: string
  output_image_urls: string[]
  video_url: string | null
  prompt: string
  created_at: string
}

interface Props {
  generations: Generation[]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export default function HistoryGallery({ generations }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const completed = generations.filter(g => g.output_image_urls.length > 0)
  if (completed.length === 0) return null

  return (
    <section className="mt-10">

      {/* Section header */}
      <div className="flex items-center gap-3 pb-4 border-b border-line mb-1">
        <h2 className="text-sm font-semibold text-hi">Geçmiş</h2>
        <span className="text-[11px] font-medium text-mute bg-raised border border-line rounded-full px-2 py-0.5">
          {completed.length}
        </span>
      </div>

      {/* Table-style list */}
      <div className="divide-y divide-line">
        {completed.map(gen => (
          <div key={gen.id}>
            <button
              onClick={() => setExpanded(expanded === gen.id ? null : gen.id)}
              className="w-full flex items-center gap-4 py-3.5 hover:bg-surface/50 transition-colors text-left rounded-lg px-2 -mx-2 group"
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0 flex gap-1">
                {gen.output_image_urls.slice(0, 1).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-10 h-10 rounded-md object-cover bg-raised border border-line"
                  />
                ))}
              </div>

              {/* Prompt + date */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-hi truncate leading-snug">{gen.prompt}</p>
                <p className="text-xs text-mute mt-0.5">{formatDate(gen.created_at)}</p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {gen.video_url && (
                  <span className="text-[10px] font-medium text-accent bg-accent-muted border border-accent-ring rounded-full px-2 py-0.5">
                    Video
                  </span>
                )}
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 rounded-full px-2 py-0.5">
                  {gen.output_image_urls.length} görsel
                </span>
                <svg
                  className={`w-4 h-4 text-mute group-hover:text-low transition-all ${expanded === gen.id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded */}
            {expanded === gen.id && (
              <div className="pb-4 px-2">
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {gen.output_image_urls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-lg overflow-hidden bg-raised border border-line hover:border-line-mid transition-colors"
                      style={{ aspectRatio: '4/3' }}
                    >
                      <img src={url} alt={`Varyant ${i + 1}`} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
                {gen.video_url && (
                  <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-line bg-black">
                    <video src={gen.video_url} controls loop className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
