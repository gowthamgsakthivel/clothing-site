const OrderTimeline = ({ steps, current }) => {
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
