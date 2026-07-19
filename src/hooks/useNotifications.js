import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Notification types:
 *  - citizen: informational tips, ward safety alerts, seasonal hazard warnings
 *  - officer: new complaint alert (click → navigate to that complaint in Operations)
 */

const CITIZEN_TIPS = [
  { id: 'tip-1', type: 'citizen', icon: '💧', title: 'Water Conservation Alert', body: 'Siliguri Municipal Corporation: Please conserve water during peak hours (8–10 AM, 6–8 PM).', timestamp: new Date(Date.now() - 1000 * 60 * 45) },
  { id: 'tip-2', type: 'citizen', icon: '🌧️', title: 'Monsoon Road Advisory', body: 'Heavy rainfall expected in North Bengal. Avoid flooded underpasses. Report waterlogging using CivicLens.', timestamp: new Date(Date.now() - 1000 * 60 * 120) },
  { id: 'tip-3', type: 'citizen', icon: '⚡', title: 'Power Maintenance Scheduled', body: 'Scheduled outage in Ward 4, 5, 7: Sunday 10 AM–2 PM. Report any post-maintenance electrical issues.', timestamp: new Date(Date.now() - 1000 * 60 * 200) },
]

let globalComplaints = []
let globalSubscribers = []

function notifySubscribers() {
  globalSubscribers.forEach(fn => fn([...globalComplaints]))
}

export function useNotifications(mode = 'citizen') {
  const [notifications, setNotifications] = useState([])
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('civic_dismissed_notifs') || '[]'))
    } catch { return new Set() }
  })
  const prevComplaintIdsRef = useRef(new Set())

  // Citizen: static civic alerts from the city
  // Officer: dynamic notifications from new complaints added to the system
  useEffect(() => {
    if (mode === 'citizen') {
      setNotifications(CITIZEN_TIPS.filter(n => !dismissedIds.has(n.id)))
    }
  }, [mode, dismissedIds])

  // Officer: subscribe to complaint changes via shared global array
  useEffect(() => {
    if (mode !== 'officer') return

    const subscriber = (complaints) => {
      // Find any complaint IDs we haven't seen before
      const newNotifs = complaints
        .filter(c => !prevComplaintIdsRef.current.has(c.id) && !dismissedIds.has(`complaint-${c.id}`))
        .map(c => ({
          id: `complaint-${c.id}`,
          type: 'officer',
          complaintId: c.id,
          title: `New ${c.department || 'Issue'} Report`,
          body: c.description
            ? (c.description.length > 80 ? c.description.slice(0, 80) + '…' : c.description)
            : 'A new civic complaint has been filed.',
          priority: c.priority || 'medium',
          location: c.city || c.ward || 'Unknown area',
          timestamp: new Date(c.created_at || Date.now()),
        }))

      if (newNotifs.length > 0) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id))
          const fresh = newNotifs.filter(n => !existingIds.has(n.id))
          return [...fresh, ...prev].slice(0, 20) // cap at 20
        })
      }

      // Update seen set
      complaints.forEach(c => prevComplaintIdsRef.current.add(c.id))
    }

    globalSubscribers.push(subscriber)
    // Fire immediately if data already exists
    if (globalComplaints.length > 0) subscriber(globalComplaints)

    return () => {
      globalSubscribers = globalSubscribers.filter(fn => fn !== subscriber)
    }
  }, [mode, dismissedIds])

  const dismiss = useCallback((id) => {
    setDismissedIds(prev => {
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem('civic_dismissed_notifs', JSON.stringify([...next])) } catch {}
      return next
    })
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setNotifications(prev => {
      const ids = prev.map(n => n.id)
      setDismissedIds(d => {
        const next = new Set(d)
        ids.forEach(id => next.add(id))
        try { localStorage.setItem('civic_dismissed_notifs', JSON.stringify([...next])) } catch {}
        return next
      })
      return []
    })
  }, [])

  const unreadCount = notifications.filter(n => !dismissedIds.has(n.id)).length

  return { notifications, dismiss, dismissAll, unreadCount }
}

// Called by useComplaints hook after fetching to push data to officer notifications
export function pushComplaintsToNotifications(complaints) {
  globalComplaints = complaints
  notifySubscribers()
}
