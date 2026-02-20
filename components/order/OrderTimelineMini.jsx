const OrderTimelineMini = ({ current }) => {
  const steps = ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered']

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isComplete = index <= current
        return (
          <div key={step} className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${isComplete ? 'bg-green-600' : 'bg-gray-300'}`} />
            <span className={`text-[10px] font-semibold ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-4 ${isComplete ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default OrderTimelineMini
