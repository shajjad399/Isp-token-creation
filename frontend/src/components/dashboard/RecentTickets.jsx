import React from 'react'
import { Link } from 'react-router-dom'
import Card, { CardBody, CardHeader } from '../ui/Card'
import Badge from '../ui/Badge'
import Avatar from '../ui/Avatar'

const RecentTickets = ({ tickets = [] }) => {
  const getStatusVariant = (status) => {
    const map = {
      'open': 'primary',
      'in-progress': 'warning',
      'resolved': 'success',
      'closed': 'default'
    }
    return map[status] || 'default'
  }

  if (!tickets || tickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Tickets</h3>
            <Link to="/tickets" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No tickets found</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Tickets</h3>
          <Link to="/tickets" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {tickets.slice(0, 5).map((ticket) => (
            <Link
              key={ticket._id}
              to={`/tickets/${ticket._id}`}
              className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar name={ticket.customer?.name || 'Unknown'} size="sm" />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white line-clamp-1">{ticket.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      #{ticket.ticketId} • {ticket.customer?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusVariant(ticket.status)}>
                    {ticket.status}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

export default RecentTickets