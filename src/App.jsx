import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Shield, Bell, Key } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ReportIssue from './components/ReportIssue'
import OperationsCenter from './components/OperationsCenter'
import SafetyDashboard from './components/SafetyDashboard'
import InteractiveProjectPitch from './components/InteractiveProjectPitch'
import NotificationPanel from './components/NotificationPanel'
import ApiKeyModal from './components/ApiKeyModal'
import { useNotifications } from './hooks/useNotifications'

export default function App() {
  const [currentPage, setCurrentPage] = useState('report-issue')
  const [userMode, setUserMode] = useState('citizen')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notifOpen, setNotifOpen] = useState(false)
  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(!!sessionStorage.getItem('GEMINI_API_KEY'))
  // Expose a way for OperationsCenter to receive a highlight complaint id
  const [highlightComplaintId, setHighlightComplaintId] = useState(null)

  const { notifications, dismiss, dismissAll, unreadCount } = useNotifications(userMode)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (userMode === 'officer' && currentPage === 'report-issue') {
      setCurrentPage('operations')
    } else if (userMode === 'citizen' && currentPage === 'operations') {
      setCurrentPage('report-issue')
    }
  }, [userMode, currentPage])

  // Prompt key modal on first visit if no key is present
  useEffect(() => {
    const key = sessionStorage.getItem('GEMINI_API_KEY')
    if (!key && !sessionStorage.getItem('DEMO_MODE_SEEN')) {
      setKeyModalOpen(true)
    }
  }, [])

  const handleSaveKey = (key) => {
    sessionStorage.setItem('GEMINI_API_KEY', key)
    sessionStorage.setItem('DEMO_MODE_SEEN', 'true')
    setHasApiKey(true)
  }

  const handleUseDemoMode = () => {
    sessionStorage.setItem('DEMO_MODE_SEEN', 'true')
    setHasApiKey(false)
  }

  // Navigate to a specific complaint from a notification
  const handleNavigateToComplaint = (complaintId) => {
    setHighlightComplaintId(complaintId)
    setCurrentPage('operations')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'report-issue':
        return <ReportIssue />
      case 'operations':
        return <OperationsCenter highlightComplaintId={highlightComplaintId} onHighlightConsumed={() => setHighlightComplaintId(null)} />
      case 'safety':
        return <SafetyDashboard />
      case 'project':
        return <InteractiveProjectPitch />
      default:
        return <ReportIssue />
    }
  }

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden text-slate-50 font-sans">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        userMode={userMode}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card h-16 border-b border-slate-800 px-6 md:px-8 flex items-center justify-between shrink-0 relative z-50"
        >
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-heading-sm font-bold md:hidden animated-gradient-text"
          >
            CivicLens AI
          </motion.h2>
          <div className="hidden md:block">
            {/* Empty space for desktop where sidebar holds logo */}
          </div>
          
          <div className="flex items-center gap-3 md:gap-5">
            {/* Live Clock */}
            <div className="hidden md:flex items-center text-sm font-mono text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-md border border-slate-800">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>

            {/* API Key Indicator / Trigger */}
            <button
              onClick={() => setKeyModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                hasApiKey
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
              title={hasApiKey ? 'Custom Gemini API Key active' : 'Click to set Gemini API Key'}
            >
              <Key size={12} />
              <span className="hidden sm:inline">{hasApiKey ? 'Custom Key' : 'Demo Mode'}</span>
            </button>

            {/* Notification Bell — wired up */}
            <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
              >
                <Bell size={20} />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <NotificationPanel
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                notifications={notifications}
                onDismiss={dismiss}
                onDismissAll={dismissAll}
                mode={userMode}
                onNavigateToComplaint={handleNavigateToComplaint}
              />
            </div>

            {/* Animated Mode Toggle */}
            <div 
              className="flex items-center bg-slate-800 p-1 rounded-full cursor-pointer border border-slate-700 relative"
              onClick={() => setUserMode(userMode === 'citizen' ? 'officer' : 'citizen')}
            >
              <div 
                className={`absolute w-1/2 h-[calc(100%-8px)] top-1 rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform duration-300 ease-in-out ${userMode === 'officer' ? 'translate-x-full' : 'translate-x-0'}`} 
              />
              
              <div className="relative z-10 flex items-center justify-center px-4 py-1.5 gap-2 text-sm font-semibold transition-colors duration-300">
                <User size={14} className={userMode === 'citizen' ? 'text-white' : 'text-slate-400'} />
                <span className={userMode === 'citizen' ? 'text-white' : 'text-slate-400 hidden md:block'}>Citizen</span>
              </div>
              <div className="relative z-10 flex items-center justify-center px-4 py-1.5 gap-2 text-sm font-semibold transition-colors duration-300">
                <Shield size={14} className={userMode === 'officer' ? 'text-white' : 'text-slate-400'} />
                <span className={userMode === 'officer' ? 'text-white' : 'text-slate-400 hidden md:block'}>Officer</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </main>

      {/* Gemini API Key Modal */}
      <ApiKeyModal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        onSaveKey={handleSaveKey}
        onUseDemoMode={handleUseDemoMode}
      />
    </div>
  )
}

