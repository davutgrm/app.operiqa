'use client'

import { useState } from 'react'
import VideoPlayer from './VideoPlayer'

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
  return (
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  )
}

export default function HistoryPage({ generations }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'video'>('all')

  const filtered = filter === 'video' ? generations.filter(g => g.video_url) : generations
  const selectedGen = generations.find(g => g.id === selected) ?? null

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1
              className="font-serif font-light text-hi"
              style={{ fontSize: '2rem', letterSpacing: '0.06em', lineHeight: 1.2 }}
            >
              Historique
            </h1>
            <p className="text-sm text-low mt-2.5 tracking-wide">Toutes les créations terminées.</p>
          </div>
          <span className="text-[11px] text-mute rounded-full px-3 py-1 tracking-[0.10em] border border-line bg-raised">
            {filtered.length} création(s)
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-8">
          {(['all', 'video'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelected(null) }}
              className={`px-4 py-1.5 text-[12px] font-medium rounded-lg transition-all tracking-wide ${
                filter === f
                  ? 'text-accent bg-accent-muted border border-accent-ring'
                  : 'text-low hover:text-mid border border-transparent hover:bg-raised'
              }`}
            >
              {f === 'all' ? 'Tout' : 'Avec vidéo'}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-14 h-14 rounded-xl mx-auto mb-5 flex items-center justify-center luxury-card">
              <svg className="w-6 h-6 text-mute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M7.5 8.25h.008v.008H7.5V8.25zM4.5 19.5h15a.75.75 0 00.75-.75V6.75a.75.75 0 00-.75-.75h-15a.75.75 0 00-.75.75v12a.75.75 0 00.75.75z" />
              </svg>
            </div>
            <p className="text-sm text-low tracking-wide">Aucune création pour l'instant.</p>
            {filter === 'video' && (
              <p className="text-[11px] text-mute mt-1.5 tracking-wide">Aucune création avec vidéo.</p>
            )}
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filtered.map(gen => {
              const isSelected = selected === gen.id
              return (
                <button
                  key={gen.id}
                  onClick={() => setSelected(isSelected ? null : gen.id)}
                  className={`card-premium text-left rounded-xl overflow-hidden transition-all duration-300 luxury-card ${
                    isSelected ? 'ring-1 ring-accent-ring border-accent' : ''
                  }`}
                  style={isSelected ? { boxShadow: '0 0 0 1px var(--color-accent-ring), 0 0 24px var(--color-accent-muted)' } : undefined}
                >
                  {/* Cover image */}
                  <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    <img
                      src={gen.output_image_urls[0]}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-2.5 left-2.5 flex gap-1.5">
                      <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-md text-mid"
                        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
                        {gen.output_image_urls.length} image(s)
                      </span>
                      {gen.video_url && (
                        <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-md text-accent"
                          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
                          Vidéo
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Meta */}
                  <div className="px-3.5 py-3">
                    <p className="text-[13px] text-hi font-medium truncate leading-snug tracking-wide">
                      {gen.prompt || 'Pas de description'}
                    </p>
                    <p className="text-[11px] text-mute mt-1 tracking-wide">{formatDate(gen.created_at)}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Detail panel */}
        {selectedGen && (
          <div className="card-premium luxury-card mt-6 rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-hi tracking-wide">
                  {selectedGen.prompt || 'Pas de description'}
                </p>
                <p className="text-[11px] text-mute mt-1.5 tracking-wide">{formatDate(selectedGen.created_at)}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors luxury-card hover:border-line-mid"
              >
                <svg className="w-3.5 h-3.5 text-low" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedGen.output_image_urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-lg overflow-hidden border border-line hover:border-line-mid transition-all duration-300"
                  style={{ aspectRatio: '4/3' }}
                >
                  <img
                    src={url}
                    alt={`Variante ${i + 1}`}
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
            {selectedGen.video_url && <VideoPlayer videoUrl={selectedGen.video_url} />}
          </div>
        )}

      </div>
    </div>
  )
}
