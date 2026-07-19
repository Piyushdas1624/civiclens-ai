import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, AlertTriangle, Info, Zap, MapPin, CheckCircle2, ChevronRight } from 'lucide-react'

const PRIORITY_STYLE = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500', badge: 'text-red-400' },
  high:     { bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-500', badge: 'text-orange-400' },
  medium:   { bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-500', badge: 'text-amber-400' },
  low:      { bg: 'bg-blue-500/10', border: 'border-blue-500/30', dot: 'bg-blue-500', badge: 'text-blue-400' },
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationPanel({
  open,
  onClose,
  notifications,
  onDismiss,
  onDismissAll,
  mode,
  onNavigateToComplaint,
}) {
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute right-0 top-12 z-[200] w-[380px] max-w-[calc(100vw-1rem)] rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl shadow-black/40 overflow-hidden"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Bell size={18} className="text-blue-400" />
              <h3 className="font-bold text-white text-sm">
                {mode === 'officer' ? 'Incident Alerts' : 'City Notifications'}
              </h3>
              {notifications.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={onDismissAll}
                  className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 px-6 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                    <CheckCircle2 size={28} className="text-slate-600" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">All caught up!</p>
                  <p className="text-slate-600 text-xs mt-1">No new notifications</p>
                </motion.div>
              ) : (
                notifications.map((n) => {
                  const style = PRIORITY_STYLE[n.priority] || PRIORITY_STYLE.low
                  const isOfficerAlert = n.type === 'officer'

                  return (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`relative border-b border-slate-800/60 last:border-0 ${isOfficerAlert ? 'cursor-pointer group' : ''}`}
                      onClick={() => {
                        if (isOfficerAlert && onNavigateToComplaint) {
                          onNavigateToComplaint(n.complaintId)
                          onDismiss(n.id)
                          onClose()
                        }
                      }}
                    >
                      <div className={`px-5 py-4 flex gap-3 transition-colors ${isOfficerAlert ? 'hover:bg-slate-800/50' : ''}`}>
                        {/* Left: icon / dot */}
                        <div className="flex-shrink-0 mt-0.5">
                          {isOfficerAlert ? (
                            <div className={`w-9 h-9 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center`}>
                              <Zap size={16} className={style.badge} />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                              <span className="text-base">{n.icon}</span>
                            </div>
                          )}
                        </div>

                        {/* Middle: content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-white text-sm font-semibold leading-tight">{n.title}</p>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0 mt-0.5">
                              {timeAgo(n.timestamp)}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                          {isOfficerAlert && n.location && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <MapPin size={10} className="text-slate-500" />
                              <span className="text-[10px] text-slate-500">{n.location}</span>
                            </div>
                          )}
                          {isOfficerAlert && (
                            <div className="flex items-center gap-1 mt-2 text-blue-400">
                              <span className="text-[10px] font-semibold">View complaint</span>
                              <ChevronRight size={10} />
                            </div>
                          )}
                        </div>

                        {/* Right: dismiss */}
                        <button
                          onClick={(e) => { e.stopPropagation(); onDismiss(n.id) }}
                          className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-white transition-colors mt-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>

          {/* Footer hint for officers */}
          {mode === 'officer' && notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50">
              <p className="text-[10px] text-slate-500 text-center">
                Click any alert to jump to that complaint in Operations Center
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
