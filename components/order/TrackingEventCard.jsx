const TrackingEventCard = ({ event }) => {
  const status = event?.status || event?.current_status || 'Status update'
  const location = event?.location || event?.current_location || 'Location pending'
  const date = event?.date || event?.event_date || 'Time pending'

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4">
      <div className="h-2 w-2 rounded-full bg-orange-600 mt-2" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{status}</p>
        <p className="text-xs text-gray-600 mt-1">{location} • {date}</p>
      </div>
    </div>
  )
}

export default TrackingEventCard
