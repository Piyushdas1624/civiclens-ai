import React, { useState, useEffect } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { AlertTriangle, TrendingUp, Clock, CheckCircle, MapPin, Activity, Shield, ArrowRight } from 'lucide-react'
import { useComplaints } from '../hooks/useComplaints'
import CityMap from './CityMap'

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1,
      onUpdate: (v) => setDisplayValue(Math.floor(v))
    })
    return controls.stop
  }, [value])
  
  return <span style={{ fontFamily: '"Fira Code", monospace' }}>{displayValue}</span>
}

export default function SafetyDashboard() {
  const { complaints } = useComplaints()

  // Live timestamp
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate metrics
  const criticalCount = complaints.filter(c => c.priority === 'critical').length
  const highCount = complaints.filter(c => c.priority === 'high').length
  const resolvingCount = complaints.filter(c => c.status === 'assigned').length
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length

  // Get critical areas
  const criticalAreas = complaints
    .filter(c => c.urgency_score >= 70)
    .sort((a, b) => b.urgency_score - a.urgency_score)
    .slice(0, 4)

  // Get recent reports
  const recentReports = complaints
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6)

  // Department workload
  const departments = {}
  complaints.forEach(c => {
    departments[c.department] = (departments[c.department] || 0) + 1
  })

  const wardSafetyScore = Math.max(
    0,
    100 - (criticalCount * 15 + highCount * 5 + resolvingCount * 2)
  )

  const getSafetyColor = (score) => {
    if (score >= 80) return '#10B981' // emerald-500
    if (score >= 60) return '#F59E0B' // amber-500
    return '#EF4444' // red-500
  }

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (wardSafetyScore / 100) * circumference

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/50 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Shield className="text-[#10B981] drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" size={32} />
              <h1 className="text-3xl font-bold">Safety Intelligence Dashboard</h1>
            </div>
            <p className="text-slate-400 mt-1">Real-time civic threat assessment — Siliguri Municipal Corporation</p>
          </div>
          <div className="glass-card px-4 py-2 rounded-lg border border-slate-700/50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span style={{ fontFamily: '"Fira Code", monospace' }} className="text-sm text-slate-300">
              {currentTime.toLocaleString()}
            </span>
          </div>
        </header>

        {/* Top Section: Hero Ring & KPI Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Hero: Animated Safety Score Ring */}
          <div className="glass-card rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-md p-6 flex flex-col items-center justify-center lg:col-span-1">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                {/* Background Ring */}
                <circle
                  cx="70" cy="70" r={radius}
                  stroke="rgba(51,65,85,0.5)"
                  strokeWidth="8" fill="none"
                />
                {/* Animated Ring */}
                <motion.circle
                  cx="70" cy="70" r={radius}
                  stroke={getSafetyColor(wardSafetyScore)}
                  strokeWidth="8" fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{ dropShadow: `0 0 8px ${getSafetyColor(wardSafetyScore)}` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold" style={{ fontFamily: '"Fira Code", monospace', color: getSafetyColor(wardSafetyScore) }}>
                  <AnimatedNumber value={wardSafetyScore} />
                </span>
                <span className="text-xs text-slate-400 font-medium">Safety Score</span>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-xs font-semibold">
                ⚠ {criticalCount} Critical
              </div>
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold">
                ↗ {highCount} High
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
                ✓ {resolvedCount} Resolved
              </div>
            </div>
          </div>

          {/* Metric Cards (Bento Grid) */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[
              { label: 'Critical Issues', value: criticalCount, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50 drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]', icon: AlertTriangle },
              { label: 'High Priority', value: highCount, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-slate-700/50', icon: TrendingUp },
              { label: 'In Progress', value: resolvingCount, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-slate-700/50', icon: Clock },
              { label: 'Resolved', value: resolvedCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-slate-700/50', icon: CheckCircle },
            ].map((metric, idx) => {
              const Icon = metric.icon
              return (
                <div key={idx} className={`glass-card rounded-xl border ${metric.border} bg-slate-800/60 backdrop-blur-md p-5 flex flex-col justify-between`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${metric.bg} ${metric.color}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-1" style={{ fontFamily: '"Fira Code", monospace' }}>
                      <AnimatedNumber value={metric.value} />
                    </div>
                    <div className="text-sm text-slate-400">{metric.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Critical Areas List */}
          <div className="glass-card rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-md p-6 lg:col-span-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <span className="text-red-500">⚡</span> Active Threat Zones
            </h2>
            <div className="space-y-4">
              {criticalAreas.length === 0 ? (
                <p className="text-slate-400 text-sm">No active threats.</p>
              ) : (
                criticalAreas.map((area, idx) => (
                  <motion.div
                    key={area.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="pl-4 border-l-2 border-red-500 py-1 relative group cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-sm text-slate-200 truncate pr-2">
                        {area.ward ? `${area.ward}, ${area.city || 'Siliguri'}` : (area.city || 'Siliguri')}
                      </h3>
                      <ArrowRight size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-red-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${area.urgency_score}%` }}
                        />
                      </div>
                      <span className="text-xs text-red-400 font-bold" style={{ fontFamily: '"Fira Code", monospace' }}>
                        {area.urgency_score}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* City Map Section */}
          <div className="lg:col-span-2 flex flex-col">
            <CityMap />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Feed */}
          <div className="glass-card rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-md p-6">
            <h2 className="text-xl font-bold text-white mb-6">Recent Reports</h2>
            <div className="relative pl-6 space-y-6">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-700" />
              
              {recentReports.length === 0 ? (
                <p className="text-slate-400 text-sm">No recent activity.</p>
              ) : (
                recentReports.map((report, idx) => {
                  let dotColor = 'bg-slate-500'
                  if (report.priority === 'critical') dotColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                  else if (report.priority === 'high') dotColor = 'bg-amber-500'
                  else if (report.status === 'resolved') dotColor = 'bg-emerald-500'
                  else if (report.status === 'assigned') dotColor = 'bg-blue-500'

                  return (
                    <motion.div 
                      key={report.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative"
                    >
                      <div className={`absolute -left-6 w-3 h-3 rounded-full top-1 border-2 border-[#020617] ${dotColor}`} />
                      <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
                        <p className="text-sm text-slate-200 font-medium mb-1">{report.title}</p>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> 
                            {report.ward ? `${report.ward}, ${report.city || 'Siliguri'}` : (report.city || 'Siliguri')}
                          </span>
                          <span>{new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>

          {/* Department Workload */}
          <div className="glass-card rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-md p-6">
            <h2 className="text-xl font-bold text-white mb-6">Department Workload</h2>
            <div className="space-y-4">
              {Object.entries(departments)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count], idx) => {
                  const maxCount = Math.max(...Object.values(departments), 1)
                  return (
                    <div key={dept}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300 font-medium">{dept}</span>
                        <span className="text-slate-400 font-bold" style={{ fontFamily: '"Fira Code", monospace' }}>
                          {count} <span className="text-slate-600 font-normal">/ {complaints.length}</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / maxCount) * 100}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    </div>
                  )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
