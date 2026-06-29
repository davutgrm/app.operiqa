'use client'

interface Props {
  videoUrl: string
}

export default function VideoPlayer({ videoUrl }: Props) {
  return (
    <video
      src={videoUrl}
      controls
      loop
      playsInline
      preload="metadata"
      style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '12px' }}
    />
  )
}
