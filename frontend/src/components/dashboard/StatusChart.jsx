import React from 'react'
import Card, { CardBody, CardHeader } from '../ui/Card'

const StatusChart = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Ticket Status</h3>
        </CardHeader>
        <CardBody>
          <p className="text-center text-gray-500 py-8">No data available</p>
        </CardBody>
      </Card>
    )
  }

  const chartData = [
    { name: 'Open', value: data?.open || 0, color: '#3B82F6' },
    { name: 'In Progress', value: data?.['in-progress'] || 0, color: '#F59E0B' },
    { name: 'Resolved', value: data?.resolved || 0, color: '#10B981' },
    { name: 'Closed', value: data?.closed || 0, color: '#6B7280' }
  ]

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Ticket Status</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {chartData.map((item) => (
            <div key={item.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

export default StatusChart