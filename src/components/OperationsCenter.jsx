import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DEPARTMENTS, STATUS_COLORS } from '../utils/prototypeData'
import { useComplaints } from '../hooks/useComplaints'
import { ChevronDown, MapPin, AlertCircle, CheckCircle, Clock, Zap, Command, SlidersHorizontal, Inbox, Users } from 'lucide-react'

export default function OperationsCenter({ highlightComplaintId, onHighlightConsumed }) {
  const [filters, setFilters] = useState({
    department: '',
    priority: '',
    status: '',
    dateRange: 'all'
  })
  const [expandedId, setExpandedId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState(null)

  const { complaints, updateComplaintStatus } = useComplaints()

  // Handle navigation and auto-expansion from notification click
  useEffect(() => {
    if (highlightComplaintId) {
      const complaint = complaints.find(c => c.id === highlightComplaintId)
      if (complaint) {
        // Reset filters so it shows in list
        setFilters({
          department: '',
          priority: '',
          status: '',
          dateRange: 'all'
        })
        setExpandedId(highlightComplaintId)
        setSelectedStatus(complaint.status)

        // Smooth scroll to the highlighted complaint item
        setTimeout(() => {
          const el = document.getElementById(`complaint-${highlightComplaintId}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 150)
      }
      if (onHighlightConsumed) {
        onHighlightConsumed()
      }
    }
  }, [highlightComplaintId, complaints, onHighlightConsumed])

  // Stats
  const stats = {
    total: complaints.length,
    critical: complaints.filter(c => c.priority === 'critical').length,
    inProgress: complaints.filter(c => c.status === 'pending' || c.status === 'assigned').length,
    resolved: complaints.filter(c => c.status === 'resolved').length
  }

  // Apply filters
  const filtered = complaints.filter(complaint => {
    if (filters.department && complaint.department !== filters.department) return false
    if (filters.priority && complaint.priority !== filters.priority) return false
    if (filters.status && complaint.status !== filters.status) return false

    if (filters.dateRange !== 'all') {
      const days = {
        '1day': 1,
        '7days': 7,
        '30days': 30
      }[filters.dateRange] || 30
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      if (new Date(complaint.timestamp) < cutoff) return false
    }

    return true
  })

  // Sort by priority and date
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const sorted = filtered.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return new Date(b.timestamp) - new Date(a.timestamp)
  })

  const getPriorityColor = (priority) => {
    const colors = {
      critical: { hex: '#EF4444', bg: 'bg-[#EF4444]', text: 'text-[#EF4444]', border: 'border-[#EF4444]' },
      high: { hex: '#F97316', bg: 'bg-[#F97316]', text: 'text-[#F97316]', border: 'border-[#F97316]' },
      medium: { hex: '#F59E0B', bg: 'bg-[#F59E0B]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]' },
      low: { hex: '#10B981', bg: 'bg-[#10B981]', text: 'text-[#10B981]', border: 'border-[#10B981]' }
    }
    return colors[priority] || colors.low
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-[#F59E0B] text-white',
      assigned: 'bg-[#3B82F6] text-white',
      resolved: 'bg-[#10B981] text-white',
      rejected: 'bg-[#EF4444] text-white'
    }
    return colors[status] || 'bg-gray-500 text-white'
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  const getRelativeTime = (date) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    const hoursDifference = Math.round((new Date(date) - new Date()) / (1000 * 60 * 60));
    
    if (Math.abs(hoursDifference) < 24) {
      return rtf.format(hoursDifference, 'hour');
    }
    return rtf.format(daysDifference, 'day');
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 font-inter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <Command className="text-[#3B82F6]" size={32} />
              Operations Command
            </h1>
            <p className="text-gray-400">
              Municipal Incident Management System
            </p>
          </div>
          
          {/* Live Stats Bar */}
          <div className="flex gap-4 flex-wrap bg-[#1E293B]/60 backdrop-blur-[16px] border border-[#334155] p-4 rounded-xl">
            <div className="flex flex-col items-center px-4 border-r border-[#334155] last:border-0">
              <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total</span>
              <span className="text-xl font-bold font-fira">{stats.total}</span>
            </div>
            <div className="flex flex-col items-center px-4 border-r border-[#334155] last:border-0">
              <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Critical</span>
              <span className="text-xl font-bold font-fira text-[#EF4444] bg-[#EF4444]/10 px-3 py-0.5 rounded-full">{stats.critical}</span>
            </div>
            <div className="flex flex-col items-center px-4 border-r border-[#334155] last:border-0">
              <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">In Progress</span>
              <span className="text-xl font-bold font-fira text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-0.5 rounded-full">{stats.inProgress}</span>
            </div>
            <div className="flex flex-col items-center px-4 border-r border-[#334155] last:border-0">
              <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Resolved</span>
              <span className="text-xl font-bold font-fira text-[#10B981] bg-[#10B981]/10 px-3 py-0.5 rounded-full">{stats.resolved}</span>
            </div>
          </div>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 p-6 rounded-2xl bg-[#1E293B]/60 backdrop-blur-[16px] border border-[#334155]"
        >
          <div className="flex items-center gap-3 mb-6">
            <SlidersHorizontal className="text-[#3B82F6]" size={24} />
            <h2 className="text-lg font-bold">Filters</h2>
          </div>
          
          <div className="space-y-6">
            {/* Department */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <span className="text-sm text-gray-400 w-24 shrink-0">Department</span>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                <button
                  onClick={() => setFilters({ ...filters, department: '' })}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${!filters.department ? 'bg-[#3B82F6] text-white' : 'bg-transparent border border-[#334155] text-gray-400 hover:text-white'}`}
                >
                  All
                </button>
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setFilters({ ...filters, department: dept })}
                    className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${filters.department === dept ? 'bg-[#3B82F6] text-white' : 'bg-transparent border border-[#334155] text-gray-400 hover:text-white'}`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority & Status Row */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="text-sm text-gray-400 w-24 shrink-0">Priority</span>
                <div className="flex gap-2 flex-wrap">
                  {['', 'critical', 'high', 'medium', 'low'].map(p => (
                    <button
                      key={p || 'all'}
                      onClick={() => setFilters({ ...filters, priority: p })}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all ${filters.priority === p ? 'bg-[#3B82F6] text-white' : 'bg-transparent border border-[#334155] text-gray-400 hover:text-white'}`}
                    >
                      {p && <span className={`w-2 h-2 rounded-full ${getPriorityColor(p).bg}`} />}
                      {p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="text-sm text-gray-400 w-16 shrink-0">Status</span>
                <div className="flex gap-2 flex-wrap">
                  {['', 'pending', 'assigned', 'resolved', 'rejected'].map(s => (
                    <button
                      key={s || 'all'}
                      onClick={() => setFilters({ ...filters, status: s })}
                      className={`px-4 py-1.5 rounded-full text-sm transition-all ${filters.status === s ? 'bg-[#3B82F6] text-white' : 'bg-transparent border border-[#334155] text-gray-400 hover:text-white'}`}
                    >
                      {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Range & Clear */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="text-sm text-gray-400 w-24 shrink-0">Timeframe</span>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { val: 'all', label: 'All Time' },
                    { val: '1day', label: 'Today' },
                    { val: '7days', label: '7 Days' },
                    { val: '30days', label: '30 Days' }
                  ].map(d => (
                    <button
                      key={d.val}
                      onClick={() => setFilters({ ...filters, dateRange: d.val })}
                      className={`px-4 py-1.5 rounded-full text-sm transition-all ${filters.dateRange === d.val ? 'bg-[#3B82F6] text-white' : 'bg-transparent border border-[#334155] text-gray-400 hover:text-white'}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {(filters.department || filters.priority || filters.status || filters.dateRange !== 'all') && (
                <button
                  onClick={() => setFilters({ department: '', priority: '', status: '', dateRange: 'all' })}
                  className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Complaints List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {sorted.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="py-16 text-center"
            >
              <Inbox size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">No reports match the current filters</h3>
              <p className="text-gray-500">Try adjusting your filters to see more results.</p>
              <button
                onClick={() => setFilters({ department: '', priority: '', status: '', dateRange: 'all' })}
                className="mt-6 px-6 py-2 bg-transparent border border-[#334155] rounded-full text-sm hover:bg-[#334155]/50 transition-colors"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            sorted.map((complaint, idx) => {
              const priorityInfo = getPriorityColor(complaint.priority)
              const isExpanded = expandedId === complaint.id
              
              return (
                <motion.div
                  key={complaint.id}
                  id={`complaint-${complaint.id}`}
                  variants={itemVariants}
                  className="bg-[#1E293B]/60 backdrop-blur-[16px] border border-[#334155] rounded-xl overflow-hidden transition-all hover:border-gray-500"
                  style={{ borderLeftWidth: '4px', borderLeftColor: priorityInfo.hex }}
                >
                  {/* Main Card */}
                  <div
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedId(null)
                      } else {
                        setExpandedId(complaint.id)
                        setSelectedStatus(complaint.status)
                      }
                    }}
                    className="p-4 md:p-5 cursor-pointer flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
                  >
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${priorityInfo.bg} text-white shadow-[0_0_10px_rgba(0,0,0,0.2)] shadow-${priorityInfo.hex}/50`}>
                          {complaint.priority}
                        </span>
                        <h3 className="font-bold text-white text-lg truncate">{complaint.title}</h3>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> 
                          {complaint.ward ? `${complaint.ward}, ${complaint.city || 'Siliguri'}` : (complaint.city || 'Siliguri')}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1"><Clock size={14} /> {getRelativeTime(complaint.timestamp)}</span>
                        {complaint.citizens_affected > 0 && (
                          <>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1 text-[#3B82F6]"><Users size={14} /> {complaint.citizens_affected}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <span className="px-3 py-1 bg-[#020617] rounded-full text-xs text-gray-300 border border-[#334155]">
                        {complaint.department}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-[#334155]"
                      >
                        <div className="p-5 md:p-6 bg-[#020617]/30 space-y-6">
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-6">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Description</h4>
                                <p className="text-gray-200 leading-relaxed text-sm md:text-base">{complaint.description}</p>
                              </div>

                              {/* Evidence Image if attached */}
                              {complaint.image_url && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Evidence Photo</h4>
                                  <div className="relative max-w-lg rounded-xl overflow-hidden border border-[#334155] bg-slate-950/80 shadow-md">
                                    <img 
                                      src={complaint.image_url} 
                                      alt={`Evidence for complaint #${complaint.id}`} 
                                      className="w-full max-h-[300px] object-cover hover:scale-[1.02] transition-transform duration-300"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Status Update section */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Update Status</h4>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                  <div className="flex gap-2 flex-wrap">
                                    {['pending', 'assigned', 'resolved', 'rejected'].map(s => (
                                      <button
                                        key={s}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedStatus(s)
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedStatus === s ? getStatusColor(s) : 'bg-transparent border border-[#334155] text-gray-400 hover:text-white'}`}
                                      >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      if (selectedStatus && selectedStatus !== complaint.status) {
                                        setUpdatingId(complaint.id)
                                        await updateComplaintStatus(complaint.id, selectedStatus)
                                        setUpdatingId(null)
                                      }
                                    }}
                                    disabled={updatingId === complaint.id || selectedStatus === complaint.status}
                                    className="px-6 py-2 bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-full transition-colors flex items-center gap-2 ml-auto sm:ml-0"
                                  >
                                    {updatingId === complaint.id ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      'Update Status'
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
                                <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Complaint ID</h4>
                                <p className="font-fira text-lg text-white">#{complaint.id}</p>
                                
                                <div className="mt-4 pt-4 border-t border-[#334155]">
                                  <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Reported</h4>
                                  <p className="text-sm text-gray-300">{formatDate(complaint.timestamp)}</p>
                                </div>
                              </div>

                              {complaint.aiAnalysis && (
                                <div className="bg-[#3B82F6]/10 p-4 rounded-xl border border-[#3B82F6]/30">
                                  <h4 className="text-xs font-semibold text-[#3B82F6] mb-2 uppercase tracking-wider flex items-center gap-2">
                                    <Zap size={14} /> AI Analysis
                                  </h4>
                                  
                                  <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-400">Urgency Score</span>
                                      <span className="text-white font-medium">{Math.round((complaint.aiAnalysis.confidence || 0.85) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-[#1E293B] rounded-full h-1.5">
                                      <div 
                                        className="bg-[#3B82F6] h-1.5 rounded-full" 
                                        style={{ width: `${Math.round((complaint.aiAnalysis.confidence || 0.85) * 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  
                                  <p className="text-xs text-gray-300">
                                    {complaint.aiAnalysis.professional_rewrite || complaint.aiAnalysis.professionalRewrite}
                                  </p>
                                </div>
                              )}

                              {/* Incident Location Mini Map */}
                              {complaint.location_lat && complaint.location_lng && (
                                <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden shadow-md">
                                  <h4 className="text-xs font-semibold text-gray-400 p-3 bg-slate-900/60 border-b border-[#334155] uppercase tracking-wider flex items-center gap-1.5">
                                    <MapPin size={12} className="text-blue-400" /> Pinned Location
                                  </h4>
                                  <div className="h-44 w-full bg-slate-950 relative">
                                    <iframe
                                      title={`location-preview-${complaint.id}`}
                                      width="100%"
                                      height="100%"
                                      loading="lazy"
                                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${complaint.location_lng - 0.0025},${complaint.location_lat - 0.0025},${complaint.location_lng + 0.0025},${complaint.location_lat + 0.0025}&layer=mapnik&marker=${complaint.location_lat},${complaint.location_lng}`}
                                      style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </div>
    </div>
  )
}

