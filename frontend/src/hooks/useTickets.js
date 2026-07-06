import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export const useTickets = (filters = {}) => {
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({})
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTickets = async (newFilters = {}) => {
    setLoading(true)
    try {
      const params = { ...filters, ...newFilters }
      const response = await api.get('/tickets', { params })
      const { tickets, stats, pagination } = response.data.data
      setTickets(tickets)
      setStats(stats)
      setPagination(pagination)
      setError(null)
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch tickets')
      toast.error(error.response?.data?.message || 'Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async (ticketData) => {
    try {
      const response = await api.post('/tickets', ticketData)
      toast.success('Ticket created successfully!')
      await fetchTickets()
      return { success: true, data: response.data.data }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create ticket')
      return { success: false, error: error.response?.data?.message }
    }
  }

  const updateTicket = async (id, data) => {
    try {
      const response = await api.put(`/tickets/${id}`, data)
      toast.success('Ticket updated successfully!')
      await fetchTickets()
      return { success: true, data: response.data.data }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update ticket')
      return { success: false, error: error.response?.data?.message }
    }
  }

  const changeStatus = async (id, status, resolution = '') => {
    try {
      const response = await api.patch(`/tickets/${id}/status`, { status, resolution })
      toast.success(`Ticket status changed to ${status}!`)
      await fetchTickets()
      return { success: true, data: response.data.data }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change status')
      return { success: false, error: error.response?.data?.message }
    }
  }

  const addComment = async (id, message, isInternal = false) => {
    try {
      const response = await api.post(`/tickets/${id}/comments`, { message, isInternal })
      toast.success('Comment added!')
      return { success: true, data: response.data.data }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment')
      return { success: false, error: error.response?.data?.message }
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  return {
    tickets,
    stats,
    pagination,
    loading,
    error,
    fetchTickets,
    createTicket,
    updateTicket,
    changeStatus,
    addComment
  }
}