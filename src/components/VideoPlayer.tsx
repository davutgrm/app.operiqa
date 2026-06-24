'use client'

interface Props {
  videoUrl: string
}

export default function VideoPlayer({ videoUrl }: Props) {
  return (
    <div className="rounded-xl overflow-hidden bg-black">
      <video src={videoUrl} controls autoPlay loop className="w-full aspect-video object-contain" />
    </div>
  )
}
