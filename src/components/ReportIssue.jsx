import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, MapPin, Loader, Check, X, AlertCircle, FolderOpen, AlertTriangle } from 'lucide-react'
import { DEPARTMENTS, PRIORITY_COLORS } from '../utils/prototypeData'
import { useComplaints } from '../hooks/useComplaints'
import SafetyAdvice from './SafetyAdvice'
import DuplicateDetector from './DuplicateDetector'
import InteractiveLocationPicker from './InteractiveLocationPicker'

const MOCK_ANALYSIS = {
  category: 'electrical',
  urgency_score: 75,
  urgency_explanation: [
    'Public safety hazard in residential area',
    'Extended issue duration (2+ weeks)',
    'Affects multiple citizens'
  ],
  confidence: 0.87,
  professional_rewrite: 'Critical infrastructure concern requiring immediate departmental assessment and repair scheduling.',
  department: 'Electrical',
  duplicate_count: 0,
  duplicate_reason: null,
  citizen_message: 'Thank you for reporting this issue. Your report helps us improve the city.'
}

export default function ReportIssue() {
  const [currentStep, setCurrentStep] = useState(1)
  const [imagePreview, setImagePreview] = useState(null)
  const [location, setLocation] = useState(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [imageBase64, setImageBase64] = useState(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [isHoveringDrop, setIsHoveringDrop] = useState(false)

  const { refetchComplaints } = useComplaints()

  const handleFile = (file) => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result)
        setImageBase64(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = (e) => {
    handleFile(e.target.files?.[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsHoveringDrop(false)
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsHoveringDrop(true)
  }

  const handleDragLeave = () => {
    setIsHoveringDrop(false)
  }

  const handleCameraCapture = () => {
    // Trigger the dedicated camera input (capture='environment' opens rear camera)
    document.getElementById('camera-input-hidden').click()
  }

  const submitToBackend = async (formData) => {
    try {
      setLoading(true)
      setError(null)

      const payload = {
        description: formData.description,
        latitude: formData.location.lat,
        longitude: formData.location.lng,
        image_base64: formData.image_base64 || null
      }

      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      const analysisData = {
        id: data.id,
        category: data.category,
        urgency_score: data.urgency,
        urgency_explanation: data.reasoning ? data.reasoning.split('\n').filter(r => r.trim()) : [],
        confidence: data.confidence,
        professional_rewrite: data.professional_rewrite,
        department: data.department,
        duplicate_count: data.duplicate_count,
        duplicate_reason: null,
        citizen_message: `Your issue has been submitted (ID: ${data.id}). Thank you for helping improve the city.`
      }

      setAnalysis(analysisData)
      setSubmitted(true)
      setCurrentStep(3)
      await refetchComplaints()
      return analysisData
    } catch (err) {
      console.warn('Backend unavailable, using mock data:', err.message)
      const mockWithId = { ...MOCK_ANALYSIS, id: 9999 }
      setAnalysis(mockWithId)
      setSubmitted(true)
      setCurrentStep(3)
      await refetchComplaints()
      return mockWithId
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!description.trim() || !location) {
      setError('Description and location are required')
      return
    }

    await submitToBackend({
      description,
      location,
      image_base64: imageBase64
    })
  }

  const handleReset = () => {
    setSubmitted(false)
    setAnalysis(null)
    setImagePreview(null)
    setLocation(null)
    setDescription('')
    setCurrentStep(1)
    setShowLocationPicker(false)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-primary to-blue-200 bg-clip-text text-transparent mb-3">
            CivicLens AI
          </h1>
          <p className="text-lg text-gray-400">
            Intelligent issue reporting for a better city
          </p>
        </motion.div>

        {/* Form Container */}
        <div className="relative glass-card bg-slate-900/60 backdrop-blur-[16px] rounded-3xl border border-slate-700/50 p-6 md:p-10 shadow-2xl overflow-hidden">
          
          {/* Stepper */}
          {!submitted && (
            <div className="mb-10">
              <div className="flex items-center justify-between relative px-2">
                <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-800 -z-10"></div>
                <div 
                  className="absolute top-5 left-10 h-0.5 bg-blue-500 -z-10 transition-all duration-500 ease-in-out" 
                  style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
                ></div>
                
                {[
                  { num: 1, label: 'Upload & Location' },
                  { num: 2, label: 'Describe' },
                  { num: 3, label: 'AI Results' }
                ].map((step) => {
                  const isActive = currentStep === step.num
                  const isCompleted = currentStep > step.num
                  return (
                    <div key={step.num} className="flex flex-col items-center gap-3">
                      <motion.div 
                        animate={{
                          boxShadow: isActive ? '0 0 15px 5px rgba(59, 130, 246, 0.4)' : 'none',
                          borderColor: isActive || isCompleted ? '#3B82F6' : '#334155',
                          backgroundColor: isCompleted ? '#3B82F6' : '#020617'
                        }}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isActive ? 'ring-4 ring-blue-500/20 scale-110' : ''}`}
                      >
                        {isCompleted ? <Check size={20} className="text-white" /> : <span className={`font-mono text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-500'}`}>{step.num}</span>}
                      </motion.div>
                      <span className={`text-xs md:text-sm font-medium ${isActive ? 'text-white' : isCompleted ? 'text-blue-300' : 'text-slate-500'}`}>{step.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 rounded-xl border border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
                  <p className="text-red-200 font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State Overlay */}
          {loading && (
            <div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
              <Loader className="text-blue-500 animate-spin mb-4" size={48} />
              <p className="text-xl font-semibold text-white animate-pulse">AI is analyzing your report...</p>
            </div>
          )}

          {/* Content Area */}
          <AnimatePresence mode="wait">
            {/* Step 1: Upload & Location */}
            {currentStep === 1 && !submitted && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Image Upload Area */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                    <Camera className="text-blue-400" size={24} /> Add Evidence
                  </h3>
                  
                  {imagePreview ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative group rounded-2xl overflow-hidden border-2 border-slate-700">
                      <img src={imagePreview} alt="Preview" className="w-full h-64 md:h-80 object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                        <div className="flex justify-between items-center">
                          <span className="bg-black/50 px-3 py-1 rounded-full text-xs font-mono text-blue-300">image_evidence.jpg</span>
                          <button 
                            type="button"
                            onClick={() => { setImagePreview(null); setImageBase64(null) }}
                            className="w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative w-full h-64 md:h-80 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 ${isHoveringDrop ? 'border-blue-400 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'border-blue-500/30 hover:border-blue-400/60 hover:bg-slate-800/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]'}`}
                    >
                      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl pointer-events-none"></div>
                      
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="mb-4 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                          <Camera size={48} />
                        </div>
                        <p className="text-lg font-semibold text-white mb-2">Drop image here or tap to upload</p>
                        <p className="text-sm text-slate-400 mb-8">Supports JPG, PNG, HEIC</p>
                        
                        <div className="flex flex-wrap gap-4 justify-center">
                          <button
                            type="button"
                            onClick={handleCameraCapture}
                            className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
                          >
                            <Camera size={18} className="text-blue-400" /> Take Photo
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => document.getElementById('image-input-hidden').click()}
                            className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
                          >
                            <FolderOpen size={18} className="text-blue-400" /> Upload File
                          </button>
                        </div>
                        <input
                          id="image-input-hidden"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={loading}
                        />
                        {/* Dedicated camera input — capture=environment opens device camera directly */}
                        <input
                          id="camera-input-hidden"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Area */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                    <MapPin className="text-blue-400" size={24} /> Pin Location
                  </h3>
                  
                  <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
                    {location ? (
                      <div className="mb-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                          <MapPin size={16} className="animate-pulse" />
                          <span className="font-medium text-sm">Location Set</span>
                          <span className="font-mono text-xs opacity-70">({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</span>
                        </div>
                        <p className="text-white font-medium pl-1">{location.address || "Custom Location Pinned"}</p>
                      </div>
                    ) : null}
                    
                    <button 
                      type="button"
                      onClick={() => setShowLocationPicker(true)} 
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-primary text-primary hover:bg-primary/10 transition-colors font-semibold shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    >
                      <MapPin size={20} />
                      {location ? "Change Location" : "Pick Location on Map"}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!location) {
                        setError("Please set a location before proceeding.")
                        return
                      }
                      setError(null)
                      setCurrentStep(2)
                    }}
                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/40"
                  >
                    Continue to Description
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Describe */}
            {currentStep === 2 && !submitted && (
              <motion.form
                key="step2"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-white">Describe the Issue</h3>
                  <p className="text-slate-400 mb-6">Provide details to help AI categorize and prioritize your report accurately.</p>
                  
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the civic issue in detail. AI will enhance your report..."
                      className="w-full min-h-[150px] p-5 rounded-2xl bg-[#0f172a] text-white border-2 border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none resize-none transition-all shadow-inner text-lg"
                      maxLength={500}
                    />
                    
                    <div className="flex justify-between items-center mt-3 px-1">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)] text-sm font-medium">
                        <span className="animate-pulse">✨</span> AI Enhancement Active
                      </div>
                      <span className="text-sm font-mono text-slate-500">{description.length} / 500</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors flex-1"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!description.trim() || !location}
                    className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/50 flex-[2] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Report for AI Analysis
                  </button>
                </div>
              </motion.form>
            )}

            {/* Step 3: Success / AI Results */}
            {currentStep === 3 && submitted && analysis && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Evidence & Location Preview */}
                {(imagePreview || location) && (
                  <div className="grid grid-cols-2 gap-3 mb-6 rounded-2xl overflow-hidden">
                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-700">
                        <img src={imagePreview} alt="Submitted evidence" className="w-full h-32 object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                          <p className="text-xs text-slate-200 font-medium">📷 Evidence Photo</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-700 bg-slate-800/50 h-32 flex flex-col items-center justify-center gap-2">
                        <Camera size={22} className="text-slate-500" />
                        <p className="text-xs text-slate-500">No photo attached</p>
                      </div>
                    )}
                    {location && (
                      <div className="relative rounded-xl overflow-hidden border border-slate-700 h-32">
                        <iframe
                          title="location-preview"
                          width="100%"
                          height="100%"
                          loading="lazy"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.003},${location.lat - 0.003},${location.lng + 0.003},${location.lat + 0.003}&layer=mapnik&marker=${location.lat},${location.lng}`}
                          style={{ border: 0 }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                          <p className="text-xs text-slate-200 font-medium truncate">📍 {location.address || 'Pinned Location'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                >
                  <Check size={48} className="text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Report #{analysis.id || 'Submitted'}</h2>
                <p className="text-slate-400 text-lg mb-6">AI has routed your report to the <strong className="text-white">{analysis.department}</strong> department.</p>
                
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                  <Loader size={16} className="animate-spin text-blue-400" />
                  <span>Expected response: <strong>{analysis.urgency_score >= 80 ? '~30 minutes' : analysis.urgency_score >= 60 ? '2–4 hours' : '1–3 days'}</strong></span>
                </div>

                {/* AI Intelligence Report */}
                <AIAnalysisCard analysis={analysis} />

                {/* Additional modules */}
                <div className="space-y-4">
                  <SafetyAdvice category={analysis.category} urgency={analysis.urgency_score} department={analysis.department} />
                  {analysis.duplicate_count > 0 && (
                    <DuplicateDetector count={analysis.duplicate_count} reason={analysis.duplicate_reason} />
                  )}
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleReset}
                    className="w-full px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors shadow-lg border border-slate-700"
                  >
                    Report Another Issue
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Location Picker Modal */}
      <AnimatePresence>
        {showLocationPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8"
            onClick={() => setShowLocationPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="text-blue-400" /> Select Location
                </h3>
                <button 
                  onClick={() => setShowLocationPicker(false)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-0 bg-slate-950">
                <InteractiveLocationPicker
                  onLocationSelect={(loc) => {
                    setLocation(loc)
                    setShowLocationPicker(false)
                  }}
                  initialLocation={location}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AIAnalysisCard({ analysis }) {
  const getUrgencyColor = (score) => {
    if (score >= 71) return { bar: 'bg-red-500', text: 'text-red-400', shadow: 'shadow-red-500' }
    if (score >= 41) return { bar: 'bg-amber-500', text: 'text-amber-400', shadow: 'shadow-amber-500' }
    return { bar: 'bg-emerald-500', text: 'text-emerald-400', shadow: 'shadow-emerald-500' }
  }

  const getPriorityLabel = (score) => {
    if (score >= 71) return 'HIGH 🔴'
    if (score >= 41) return 'MEDIUM 🟡'
    return 'LOW 🟢'
  }

  const urgencyStyle = getUrgencyColor(analysis.urgency_score)

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/60 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">🤖</span> AI Analysis Complete
        </h3>
        <span className="text-sm font-mono text-blue-300/80">[confidence: {Math.round(analysis.confidence * 100)}%]</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Urgency Score */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Urgency Score</span>
            <span className={`font-mono font-bold text-lg ${urgencyStyle.text}`}>{analysis.urgency_score}/100</span>
          </div>
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden mb-2 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${analysis.urgency_score}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${urgencyStyle.bar} shadow-[0_0_10px_currentColor]`}
            />
          </div>
          <p className="text-sm text-slate-300 italic">"{analysis.category} issue detected"</p>
        </div>

        <div className="h-px bg-slate-700/50 w-full"></div>

        {/* Badges */}
        <div className="flex flex-wrap gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-200 font-semibold shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <span className="text-slate-400 text-sm font-normal">Department:</span>
            <span>[{analysis.department.toUpperCase()}]</span>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 font-semibold ${urgencyStyle.text}`}>
            <span className="text-slate-400 text-sm font-normal">Priority:</span>
            <span>[{getPriorityLabel(analysis.urgency_score)}]</span>
          </div>
        </div>

        <div className="h-px bg-slate-700/50 w-full"></div>

        {/* Key Factors */}
        <div>
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Factors</h4>
          <ul className="space-y-2">
            {analysis.urgency_explanation?.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-200">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="h-px bg-slate-700/50 w-full"></div>

        {/* Enhanced Report Message */}
        <div>
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">AI-Enhanced Report</h4>
          <div className="p-4 rounded-xl bg-blue-500/10 border-l-4 border-blue-500 text-blue-100 font-medium leading-relaxed">
            "{analysis.professional_rewrite}"
          </div>
        </div>
      </div>
    </div>
  )
}
