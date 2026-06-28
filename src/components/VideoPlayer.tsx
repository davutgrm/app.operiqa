'use client'

interface Props {
  videoUrl: string
}

export default function VideoPlayer({ videoUrl }: Props) {
  return (
    <div className="rounded-xl overflow-hidden bg-black aspect-[9/16]">
      <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
    </div>
  )
}
