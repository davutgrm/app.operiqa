'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { interpolate } from '@/lib/i18n/format'
import type { Dictionary } from '@/lib/i18n/dictionaries'

const MIN_WIDTH = 1000
const MIN_HEIGHT = 800

interface Props {
  onImageSelected: (file: File, preview: string) => void
  preview: string | null
  onClear: () => void
  dict: Dictionary['imageUploader']
}

export default function ImageUploader({ onImageSelected, preview, onClear, dict }: Props) {
  const [resWarn, setResWarn] = useState<{ w: number; h: number } | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img
      setResWarn(w < MIN_WIDTH || h < MIN_HEIGHT ? { w, h } : null)
      onImageSelected(file, objectUrl)
    }
    img.src = objectUrl
  }, [onImageSelected])

  const handleClear = useCallback(() => {
    setResWarn(null)
    onClear()
  }, [onClear])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.avif'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    noClick: !!preview,
    noDrag: !!preview,
  })

  if (preview) {
    return (
      <div>
        <div
          className="relative rounded-lg overflow-hidden border border-line bg-raised"
          style={{ aspectRatio: '4/3' }}
        >
          <img src={preview} alt={dict.productPhotoAlt} className="w-full h-full object-contain" />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 text-xs text-mid hover:text-hi bg-canvas/80 hover:bg-raised border border-line rounded-md px-2.5 py-1 transition-colors backdrop-blur-sm"
          >
            {dict.change}
          </button>
        </div>
        {resWarn && (
          <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-amber-700 leading-snug">
              {interpolate(dict.lowResolutionWarning, { w: resWarn.w, h: resWarn.h, minW: MIN_WIDTH, minH: MIN_HEIGHT })}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200
          flex flex-col items-center justify-center gap-3 p-8
          ${isDragActive
            ? 'border-accent bg-accent-muted'
            : 'border-line-mid hover:border-accent hover:bg-accent-muted'
          }
        `}
        style={{ minHeight: 180 }}
      >
        <input {...getInputProps()} />
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isDragActive ? 'bg-accent-muted' : 'bg-raised'}`}
        >
          <svg
            className={`w-5 h-5 transition-colors ${isDragActive ? 'text-accent' : 'text-low'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div className="text-center">
          <p className={`text-sm font-medium transition-colors ${isDragActive ? 'text-accent-hover' : 'text-mid'}`}>
            {isDragActive ? dict.dropActive : dict.dropIdle}
          </p>
          <p className="text-xs text-mute mt-1">{interpolate(dict.formatsHint, { minW: MIN_WIDTH, minH: MIN_HEIGHT })}</p>
        </div>
      </div>

    </div>
  )
}
