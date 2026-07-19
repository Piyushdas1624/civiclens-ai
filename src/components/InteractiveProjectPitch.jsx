import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { AlertTriangle, Zap, Workflow, TrendingUp, Cpu, Rocket, X, Brain, MapPin } from 'lucide-react'

function AnimatedNumber({ value, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      onUpdate: (v) => setDisplayValue(v)
    })
    return controls.stop
  }, [value])
  
  return (
    <span style={{ fontFamily: '"Fira Code", monospace' }}>
      {Number.isInteger(value) ? Math.floor(displayValue) : displayValue.toFixed(1)}
      {suffix}
    </span>
  )
}

export default function InteractiveProjectPitch() {
  const [activeSection, setActiveSection] = useState(0)

  // Animated counters state (keeping logic as requested)
  const [displayNumbers, setDisplayNumbers] = useState({
    citizens: 0,
    departments: 0,
    issuesResolved: 0,
    avgTime: 0
  })

  useEffect(() => {
    const targets = { citizens: 245000, departments: 8, issuesResolved: 12458, avgTime: 3.2 }
    let interval = setInterval(() => {
      setDisplayNumbers(prev => ({
        citizens: Math.min(prev.citizens + 5000, targets.citizens),
        departments: Math.min(prev.departments + 0.2, targets.departments),
        issuesResolved: Math.min(prev.issuesResolved + 200, targets.issuesResolved),
        avgTime: Math.min(prev.avgTime + 0.05, targets.avgTime)
      }))
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const sections = [
    {
      id: 'problem',
      title: 'The Problem',
      subtitle: 'Cities Can\'t Respond Fast Enough',
      icon: AlertTriangle,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'No Transparency', desc: 'Citizens don\'t know when issues will be fixed' },
              { title: 'Manual Routing', desc: 'Issues stuck in bureaucratic silos' },
              { title: 'Slow Response', desc: 'Critical issues take weeks to assess' },
              { title: 'No Intelligence', desc: 'Cities can\'t predict or prevent problems' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 glass-card rounded-xl bg-slate-800/60 backdrop-blur-md border-l-4 border-l-red-500 border-t border-t-slate-700/50 border-r border-r-slate-700/50 border-b border-b-slate-700/50 flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <X className="text-red-500" size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="p-6 glass-card rounded-xl border border-red-500/50 bg-red-500/5 backdrop-blur-md"
          >
            <p className="text-lg font-semibold text-red-400 mb-2">💡 The Impact</p>
            <p className="text-slate-300">
              A pothole reported today might not be fixed for weeks. A downed power line threatens lives. A flooded basement destroys homes. Without real-time intelligence and routing, cities are reactive, not proactive.
            </p>
          </motion.div>
        </motion.div>
      )
    },
    {
      id: 'solution',
      title: 'Our Solution',
      subtitle: 'CivicLens AI',
      icon: Zap,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent pb-2">
              CivicLens AI
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: MapPin, title: 'Citizens Report', desc: 'Snap a photo. We handle location and context instantly.' },
              { icon: Brain, title: 'AI Triage', desc: 'Gemini analyzes urgency, damage type, and required resources.' },
              { icon: Zap, title: 'Smart Dispatch', desc: 'Routed immediately to the right department dashboard.' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-8 glass-card rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 text-center group hover:bg-slate-700/50 transition-colors"
                >
                  <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="text-blue-400" size={32} />
                  </div>
                  <h3 className="font-bold text-white mb-3 text-xl">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      subtitle: 'Streamlined Pipeline',
      icon: Workflow,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="py-12"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 rounded-full overflow-hidden z-0">
              <motion.div 
                className="h-full bg-blue-500/50" 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>
            
            {/* Connecting line (mobile) */}
            <div className="block md:hidden absolute left-[31px] top-0 bottom-0 w-1 bg-slate-800 rounded-full z-0" />
            
            {[
              { step: 1, title: 'Citizen Reports', desc: 'Mobile photo upload' },
              { step: 2, title: 'AI Analyzes', desc: 'Vision model detects issue' },
              { step: 3, title: 'Smart Routing', desc: 'Dispatched to department' },
              { step: 4, title: 'Resolution', desc: 'Tracked to completion' }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                className="relative z-10 flex md:flex-col items-center gap-6 md:gap-4 mb-8 md:mb-0 w-full md:w-1/4 text-left md:text-center"
              >
                <div className="w-16 h-16 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )
    },
    {
      id: 'impact',
      title: 'Impact & Stats',
      subtitle: 'Measuring Success',
      icon: TrendingUp,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 glass-card rounded-2xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-md drop-shadow-[0_0_15px_rgba(59,130,246,0.1)] text-center">
              <div className="text-5xl font-bold text-blue-400 mb-2">
                <AnimatedNumber value={displayNumbers.citizens} />
              </div>
              <div className="text-slate-300 font-medium">Citizens Served</div>
            </div>
            
            <div className="p-8 glass-card rounded-2xl border border-purple-500/30 bg-purple-500/5 backdrop-blur-md drop-shadow-[0_0_15px_rgba(168,85,247,0.1)] text-center">
              <div className="text-5xl font-bold text-purple-400 mb-2">
                <AnimatedNumber value={displayNumbers.departments} />
              </div>
              <div className="text-slate-300 font-medium">Departments Integrated</div>
            </div>
            
            <div className="p-8 glass-card rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-md drop-shadow-[0_0_15px_rgba(16,185,129,0.1)] text-center">
              <div className="text-5xl font-bold text-emerald-400 mb-2">
                <AnimatedNumber value={displayNumbers.issuesResolved} />
              </div>
              <div className="text-slate-300 font-medium">Issues Resolved (YTD)</div>
            </div>
            
            <div className="p-8 glass-card rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-md drop-shadow-[0_0_15px_rgba(245,158,11,0.1)] text-center">
              <div className="text-5xl font-bold text-amber-400 mb-2">
                <AnimatedNumber value={displayNumbers.avgTime} suffix="d" />
              </div>
              <div className="text-slate-300 font-medium">Avg Response Time</div>
            </div>
          </div>
        </motion.div>
      )
    },
    {
      id: 'technology',
      title: 'Technology Stack',
      subtitle: 'Built for Scale',
      icon: Cpu,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6 text-center"
        >
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Google Gemini', color: 'bg-purple-500/20 text-purple-300 border-purple-500/50' },
              { name: 'FastAPI', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' },
              { name: 'React', color: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
              { name: 'Framer Motion', color: 'bg-pink-500/20 text-pink-300 border-pink-500/50' },
              { name: 'Tailwind CSS', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' },
              { name: 'SQLite', color: 'bg-blue-400/20 text-blue-200 border-blue-400/50' },
              { name: 'Google Maps', color: 'bg-red-500/20 text-red-300 border-red-500/50' }
            ].map((tech, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`px-6 py-3 rounded-full border backdrop-blur-md font-semibold ${tech.color}`}
              >
                {tech.name}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )
    },
    {
      id: 'cta',
      title: 'Join the Movement',
      subtitle: 'CivicLens AI',
      icon: Rocket,
      content: (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative overflow-hidden rounded-3xl p-12 text-center"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 z-0">
            {/* Particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full opacity-20"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.1, 0.5, 0.1]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Smarter Cities Start with <br/><span className="text-blue-400">Better Data</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Built for the civic intelligence hackathon. We're proving that AI can bridge the gap between citizens and local government.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                View Live Demo
              </button>
              <button className="px-8 py-4 rounded-xl bg-transparent border-2 border-slate-400 text-slate-200 hover:border-white hover:text-white font-bold transition-colors">
                GitHub Repository
              </button>
            </div>
          </div>
        </motion.div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-white pb-32">
      {/* Top Navigation Pills */}
      <div className="sticky top-0 z-50 pt-8 pb-4 bg-[#020617]/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {sections.map((section, idx) => {
              const Icon = section.icon
              const isActive = activeSection === idx
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(idx)}
                  className={`relative px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon size={16} />
                  <span className="font-medium text-sm whitespace-nowrap">{section.title}</span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-blue-600/20 border border-blue-500/50 rounded-full z-[-1] shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 border border-slate-800 rounded-full z-[-1]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {sections[activeSection].content}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent pointer-events-none">
        <div className="max-w-5xl mx-auto flex justify-between items-center pointer-events-auto">
          <button
            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
            className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold hover:border-slate-500 disabled:opacity-30 transition-all"
          >
            ← Previous
          </button>
          
          <button
            onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
            disabled={activeSection === sections.length - 1}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-30 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
