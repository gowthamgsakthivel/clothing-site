export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 pt-16 md:pt-20 pb-28 md:pb-16">
      <div className="px-4 sm:px-6 md:px-16 lg:px-32 space-y-6">
        <div className="rounded-3xl bg-white p-6 border border-orange-100 shadow-sm animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="mt-3 h-4 w-64 bg-gray-200 rounded" />
          <div className="mt-5 flex gap-2">
            <div className="h-6 w-28 bg-gray-200 rounded-full" />
            <div className="h-6 w-28 bg-gray-200 rounded-full" />
            <div className="h-6 w-28 bg-gray-200 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-6 animate-pulse">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="mt-4 h-16 w-full bg-gray-100 rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-6 animate-pulse">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="mt-4 h-24 w-full bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
