import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, Globe, FileText, Shield, Target, Settings2 } from 'lucide-react'

export default function Sidebar({ currentPage, onNavigate, userMode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const getNavItems = () => {
    const commonItems = [
      { id: 'project', label: 'Project Pitch', icon: <Target size={20} /> }
    ]
    
    if (userMode === 'citizen') {
      return [
        { id: 'report-issue', label: 'Report Issue', icon: <FileText size={20} /> },
        { id: 'safety', label: 'Safety Dashboard', icon: <Shield size={20} /> },
        ...commonItems
      ]
    } else {
      return [
        { id: 'operations', label: 'Operations Center', icon: <Settings2 size={20} /> },
        { id: 'safety', label: 'Safety Dashboard', icon: <Shield size={20} /> },
        ...commonItems
      ]
    }
  }

  const navItems = getNavItems()

  const handleNavigate = (id) => {
    onNavigate(id)
    setIsOpen(false)
  }

  const sidebarVariants = {
    hidden: { x: -280, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { x: -280, opacity: 0, transition: { duration: 0.2 } }
  }

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (i) => ({ 
      x: 0, 
      opacity: 1, 
      transition: { delay: i * 0.05, duration: 0.3 } 
    })
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="md:hidden fixed top-6 left-6 z-50 p-2 bg-gradient-to-br from-primary to-blue-600 rounded-xl text-white shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm md:hidden z-30"
        />
      )}

      {/* Sidebar — always visible on desktop, slide-in on mobile */}
      <motion.aside
        variants={sidebarVariants}
        initial={false}
        animate={isDesktop ? 'visible' : (isOpen ? 'visible' : 'hidden')}
        className="fixed md:relative w-72 h-screen glass-card flex flex-col z-40 md:z-auto shadow-2xl"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-6 border-b border-slate-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/40 glow-border">
              <Globe size={28} className="text-white" />
            </div>
            <h1 className="text-heading-sm font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              CivicLens AI
            </h1>
          </div>
          <p className="text-xs text-slate-400 ml-15 font-mono">MUNICIPAL INTELLIGENCE</p>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto md:overflow-y-auto scrollbar-hide">
          {navItems.map((item, index) => (
            <motion.button
              key={item.id}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              onClick={() => handleNavigate(item.id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden ${
                currentPage === item.id
                  ? 'text-white bg-slate-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {/* Background gradient sweep on hover */}
              <div
                className={`absolute inset-0 transition-opacity duration-300 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100`}
              />
              
              {/* Active Border */}
              {currentPage === item.id && (
                <motion.div
                  layoutId="activeBorder"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              
              {/* Content */}
              <div className="relative flex items-center gap-3">
                <span className={currentPage === item.id ? "text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "text-slate-400 group-hover:text-slate-300"}>
                  {item.icon}
                </span>
                <span className="font-semibold">{item.label}</span>
              </div>
            </motion.button>
          ))}
        </nav>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="px-6 py-4 border-t border-slate-800"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">v2.0.0-beta</span>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <span className="text-xs text-green-400 font-semibold uppercase tracking-wider">Live</span>
            </div>
          </div>
        </motion.div>
      </motion.aside>
    </>
  )
}
