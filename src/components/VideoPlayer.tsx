'use client'

interface Props {
  videoUrl: string
}

export default function VideoPlayer({ videoUrl }: Props) {
  return (
    <div className="w-full rounded-2xl overflow-hidden bg-black">
      <video
        src={videoUrl}
        controls
        loop
        playsInline
        preload="metadata"
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
    </div>
  )
}
