export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#89f5a2] border-t-transparent animate-spin" />
        <p className="text-[#89f5a2] text-sm">載入中...</p>
      </div>
    </div>
  )
}