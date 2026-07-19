import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react'

export default function ApiKeyModal({ isOpen, onClose, onSaveKey, onUseDemoMode }) {
  const [apiKey, setApiKey] = useState(sessionStorage.getItem('GEMINI_API_KEY') || '')
  const [saved, setSaved] = useState(false)

  // Re-sync input state whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setApiKey(sessionStorage.getItem('GEMINI_API_KEY') || '')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = (e) => {
    e.preventDefault()
    const trimmed = apiKey.trim()
    if (trimmed) {
      sessionStorage.setItem('GEMINI_API_KEY', trimmed)
      onSaveKey(trimmed)
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onClose()
      }, 500)
    }
  }

  const handleDemo = () => {
    sessionStorage.removeItem('GEMINI_API_KEY')
    setApiKey('')
    onUseDemoMode()
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg glass-card rounded-2xl p-6 md:p-8 border border-slate-700/60 shadow-2xl bg-slate-900/90 text-white relative overflow-hidden"
        >
          {/* Decorative Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Key size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Welcome to CivicLens AI</h2>
              <p className="text-xs text-slate-400">Municipal Intelligence Hackathon Demo</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            To use live AI vision & reasoning without key exposure, please enter your <strong>Google Gemini API Key</strong>. Your key is stored strictly in your browser session memory and is never saved to our database.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={!apiKey.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {saved ? (
                  <>
                    <Check size={16} /> Saved!
                  </>
                ) : (
                  <>
                    Set API Key <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase font-semibold">or</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={handleDemo}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} className="text-amber-400" />
            Continue in Demo Mode (Simulated AI)
          </button>

          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" /> Zero Key Persistence
            </span>
            <span>Siliguri MC Demo</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
