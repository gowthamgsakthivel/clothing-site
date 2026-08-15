const OrderTimeline = ({ steps, current, status, cancellationReason, cancellationNotes, refundStatus, totalAmount, cancelledAt }) => {
  const normalizedStatus = (status || '').toLowerCase()
  const isCancelled = ['cancelled', 'failed', 'rejected', 'rto'].includes(normalizedStatus)

  if (isCancelled) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 space-y-3">
        <div className="flex items-start gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-base font-black shrink-0">
            ✕
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-rose-900">Order {status || 'Cancelled'}</p>
              {cancelledAt && (
                <span className="text-xs text-rose-500 font-medium">
                  • {new Date(cancelledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            <p className="text-xs text-rose-800 mt-1">
              <strong>Reason:</strong> {cancellationReason || 'Item unavailable during quality inspection'}
            </p>
          </div>
        </div>

        {cancellationNotes && (
          <p className="text-xs text-rose-800 bg-white/70 p-3 rounded-xl border border-rose-100 italic">
            &quot;{cancellationNotes}&quot;
          </p>
        )}

        {refundStatus && refundStatus !== 'not_applicable' && (
          <div className="pt-2 border-t border-rose-200/70 flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <span>💰 Refund Status:</span>
            <span className="bg-emerald-100 text-emerald-900 px-3 py-0.5 rounded-full capitalize font-bold">
              {refundStatus} {totalAmount ? `(₹${Number(totalAmount).toFixed(2)})` : ''}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {steps.map((step, index) => {
          const isComplete = index <= current
          return (
            <div key={step} className="flex md:flex-col items-center md:items-start gap-3 md:gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${isComplete ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {index + 1}
              </div>
              <div className="flex-1 w-full">
                <p className={`text-xs md:text-sm font-semibold ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step}
                </p>
                <div className="mt-2 hidden md:block h-1 w-full rounded-full bg-gray-100">
                  <div className={`h-1 rounded-full ${isComplete ? 'bg-green-600' : 'bg-gray-200'}`} style={{ width: isComplete ? '100%' : '0%' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default OrderTimeline
