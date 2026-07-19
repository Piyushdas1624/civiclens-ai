import { useState, useEffect, useCallback } from 'react'
import { pushComplaintsToNotifications } from './useNotifications'


/**
 * Custom hook for managing complaints state and API interactions.
 * Provides centralized state management with auto-refetch capabilities.
 */
export function useComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Transform backend complaint data to frontend format
  const transformComplaint = useCallback((complaint) => {
    return {
      ...complaint,
      // Map urgency to urgency_score (for backward compatibility)
      urgency_score: complaint.urgency || 5,
      // Map timestamp for display
      timestamp: complaint.created_at ? new Date(complaint.created_at) : new Date(),
      // Map title from category if not present
      title: complaint.title || `${complaint.category || 'Issue'} - ID ${complaint.id}`,
      // Ensure citizens affected is a number
      citizensAffected: complaint.citizens_affected || 0,
      // Calculate priority dynamically from SQLite urgency score (0-100)
      priority: (() => {
        const score = complaint.urgency || 50
        if (score >= 80) return 'critical'
        if (score >= 60) return 'high'
        if (score >= 40) return 'medium'
        return 'low'
      })(),
      // Map aiAnalysis for compatibility
      aiAnalysis: {
        professionalRewrite: complaint.professional_rewrite || '',
        detectedIssues: complaint.reasoning ? complaint.reasoning.split('\n').filter(r => r.trim()) : [],
        confidence: complaint.confidence || 0.5
      }
    }
  }, [])

  // Fetch all complaints from backend
  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/complaints', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      // Ensure data is an array
      const complaintsList = Array.isArray(data) ? data : data.complaints || []
      // Transform all complaints
      const transformed = complaintsList.map(transformComplaint)
      setComplaints(transformed)
      // Push to officer notification store
      pushComplaintsToNotifications(transformed)

    } catch (err) {
      console.warn('Failed to fetch complaints:', err.message)
      // Keep existing complaints on error
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [transformComplaint])

  // Update complaint status via backend
  const updateComplaintStatus = useCallback(async (id, newStatus) => {
    try {
      // Optimistic update: update UI immediately
      setComplaints(prevComplaints =>
        prevComplaints.map(complaint =>
          complaint.id === id
            ? { ...complaint, status: newStatus }
            : complaint
        )
      )

      // Send update to backend
      const response = await fetch(`/api/complaints/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const updatedComplaint = await response.json()

      // Update with server response (transformed)
      const transformed = transformComplaint(updatedComplaint)
      setComplaints(prevComplaints =>
        prevComplaints.map(complaint =>
          complaint.id === id
            ? transformed
            : complaint
        )
      )
    } catch (err) {
      console.error('Failed to update complaint status:', err.message)
      setError(err.message)
      // Revert optimistic update on error
      await fetchComplaints()
    }
  }, [fetchComplaints, transformComplaint])

  // Refetch complaints (called after new submission or external changes)
  const refetchComplaints = useCallback(async () => {
    await fetchComplaints()
  }, [fetchComplaints])

  // Initial fetch on mount
  useEffect(() => {
    fetchComplaints()
  }, [fetchComplaints])

  return {
    complaints,
    loading,
    error,
    updateComplaintStatus,
    refetchComplaints,
    fetchComplaints
  }
}
