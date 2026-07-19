import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, Edit2, Loader, X, Check } from 'lucide-react'

export default function InteractiveLocationPicker({ onLocationSelect, initialLocation = null }) {
  const [step, setStep] = useState(1)
  const [location, setLocation] = useState(initialLocation)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [address, setAddress] = useState('')
  const [ward, setWard] = useState('')
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [showFullscreenMap, setShowFullscreenMap] = useState(false)

  // Step 1: Request Permission
  const requestPermission = () => {
    setLoading(true)
    setError(null)
    
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        setStep(2)
        reverseGeocode(latitude, longitude)
        setLoading(false)
      },
      (err) => {
        setError('Permission denied. Please enable location access or pick manually.')
        setLoading(false)
      }
    )
  }

  // Refs
  const mapInitRef = useRef(false)
  // Single stable DOM node for the map — never unmounted, just moved
  const mapNodeRef = useRef(null)
  const normalSlotRef = useRef(null)
  const fullscreenSlotRef = useRef(null)

  // Step 2-3: Reverse Geocode via backend
  const reverseGeocode = async (lat, lng) => {
    try {
      setLoading(true)
      const response = await fetch('/api/location/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      })
      if (!response.ok) throw new Error(`Geocoding HTTP error: ${response.status}`)
      const data = await response.json()
      setAddress(data.address || 'Address not found')
      setWard(data.ward || 'Ward Unknown')
      setStep(3)
      setLoading(false)
    } catch (err) {
      setError('Failed to get address from coordinates')
      setLoading(false)
    }
  }

  // Use ref to track if map has been initialized (prevents double-init)
  // mapNodeRef is declared above

  // Callback ref to initialize Leaflet map the instant the container mounts
  const mapRefCallback = useCallback((node) => {
    if (node !== null && !mapInitRef.current) {
      mapInitRef.current = true
      mapNodeRef.current = node
      try {
        if (!window.L) {
          console.error('Leaflet is not loaded on window')
          return
        }

        const L = window.L
        const initialLat = location?.lat || 26.7271
        const initialLng = location?.lng || 88.3953

        // Clean up any stale Leaflet instance on this node
        if (node._leaflet_id) {
          node._leaflet_id = null
        }

        const mapInstance = L.map(node, {
          zoomControl: false,
          attributionControl: true
        }).setView([initialLat, initialLng], 16)

        // CartoDB Voyager: readable streets, road labels, place names — not pitch black
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }).addTo(mapInstance)

        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance)

        // Custom blue pulsing pin (like Rapido / Uber style)
        const pinIcon = L.divIcon({
          className: '',
          html: `<div style="width:26px;height:26px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 0 5px rgba(59,130,246,0.35),0 3px 10px rgba(0,0,0,0.4);cursor:grab;transition:box-shadow 0.2s;"></div>`,
          iconAnchor: [13, 13],
          iconSize: [26, 26]
        })

        const markerInstance = L.marker([initialLat, initialLng], {
          draggable: true,
          icon: pinIcon
        }).addTo(mapInstance)

        markerInstance.on('dragend', () => {
          const newPos = markerInstance.getLatLng()
          setLocation({ lat: newPos.lat, lng: newPos.lng })
          reverseGeocode(newPos.lat, newPos.lng)
        })

        // Click on map to teleport pin (like Rapido pick-up pin)
        mapInstance.on('click', (e) => {
          markerInstance.setLatLng(e.latlng)
          setLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
          reverseGeocode(e.latlng.lat, e.latlng.lng)
        })

        setMap(mapInstance)
        setMarker(markerInstance)

        // Force size recalculation after container paint
        setTimeout(() => mapInstance.invalidateSize(), 100)
        setTimeout(() => mapInstance.invalidateSize(), 500)
      } catch (err) {
        console.error('Map initialization failed:', err)
        mapInitRef.current = false
      }
    }
  }, [location])

  // Reset map state when entering step 4 so mapRefCallback always fires fresh
  useEffect(() => {
    if (step === 4) {
      mapInitRef.current = false
      setMap(null)
      setMarker(null)
    }
  }, [step])

  // Move the single map DOM node between normal slot and fullscreen slot
  useEffect(() => {
    const node = mapNodeRef.current
    if (!node) return
    if (showFullscreenMap) {
      if (fullscreenSlotRef.current && !fullscreenSlotRef.current.contains(node)) {
        fullscreenSlotRef.current.appendChild(node)
      }
    } else {
      if (normalSlotRef.current && !normalSlotRef.current.contains(node)) {
        normalSlotRef.current.appendChild(node)
      }
    }
    // Recalculate after DOM move
    if (map) {
      setTimeout(() => map.invalidateSize(), 100)
      setTimeout(() => map.invalidateSize(), 400)
    }
  }, [showFullscreenMap, map])

  // Invalidate map layout when fullscreen changes
  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize()
      }, 350)
    }
  }, [map, showFullscreenMap])

  const handleUseLocation = () => {
    onLocationSelect({
      lat: location.lat,
      lng: location.lng,
      address,
      ward,
    })
  }

  const handleEditAddress = () => {
    setStep(5)
  }

  // Step Variants
  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <motion.div
              key={s}
              className={`flex-1 h-1 rounded-full mx-1 ${
                s <= step
                  ? 'bg-gradient-to-r from-primary to-blue-500'
                  : 'bg-navy-700'
              }`}
              initial={false}
              animate={{ scaleX: s <= step ? 1 : 0.5 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
        <p className="text-sm text-gray-400">Step {step} of 5</p>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        {/* Step 1: Permission Request */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-card p-8 rounded-2xl border border-navy-700 border-opacity-30 backdrop-blur-xl bg-gradient-to-br from-navy-800 to-navy-900"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/50"
              >
                <MapPin size={32} className="text-white" />
              </motion.div>
              <h3 className="text-heading-sm font-bold mb-2">Enable Location Access</h3>
              <p className="text-gray-300 mb-6">We need your permission to find your exact location</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={requestPermission}
                disabled={loading}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-primary/50 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader size={20} className="animate-spin" />
                    Detecting location...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Navigation size={20} />
                    Enable Location
                  </div>
                )}
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setLocation({ lat: 26.7271, lng: 88.3953 })
                  setStep(4)
                }}
                className="mt-4 text-sm text-blue-400 hover:text-blue-300 underline transition-colors block mx-auto font-medium"
              >
                Or pick location manually on map
              </button>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm mt-4"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Auto-detecting */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-card p-8 rounded-2xl border border-navy-700 border-opacity-30 backdrop-blur-xl bg-gradient-to-br from-navy-800 to-navy-900 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, linear: true }}
              className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"
            />
            <p className="text-gray-300 mb-4">Finding your exact location...</p>
            <button
              type="button"
              onClick={() => {
                setLocation({ lat: 26.7271, lng: 88.3953 })
                setStep(4)
              }}
              className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors font-medium"
            >
              Skip and pick manually on map
            </button>
          </motion.div>
        )}

        {/* Step 3: Location Confirmed */}
        {step === 3 && location && (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <motion.div
              variants={containerVariants}
              className="glass-card p-6 rounded-2xl border border-navy-700 border-opacity-30 backdrop-blur-xl bg-gradient-to-br from-navy-800 to-navy-900"
            >
              <h3 className="text-heading-sm font-bold mb-4">Location Confirmed</h3>
              <motion.div
                variants={itemVariants}
                className="space-y-3"
              >
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400">Address</p>
                    <p className="text-white font-medium">{address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0 mt-1">✓</div>
                  <div>
                    <p className="text-sm text-gray-400">Ward</p>
                    <p className="text-white font-medium">{ward}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={containerVariants}
              className="flex gap-3"
            >
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(4)}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all"
              >
                View on Map
              </motion.button>
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEditAddress}
                className="flex-1 px-4 py-3 rounded-xl border border-navy-600 text-gray-300 font-semibold hover:bg-navy-700 hover:bg-opacity-30 transition-all flex items-center justify-center gap-2"
              >
                <Edit2 size={18} />
                Edit
              </motion.button>
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUseLocation}
              className="w-full px-4 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all"
            >
              Use This Location
            </motion.button>
          </motion.div>
        )}

        {/* Step 4: Interactive Map */}
        {step === 4 && location && (
          <motion.div
            key="step4"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            {/* Normal slot — map node lives here when not fullscreen */}
            <div
              className={`relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl ${showFullscreenMap ? 'invisible h-[360px]' : ''}`}
              style={{ minHeight: 360 }}
            >
              {/* This div is the initial mount target for mapRefCallback */}
              <div
                ref={(node) => {
                  if (node && !normalSlotRef.current) {
                    normalSlotRef.current = node
                    mapRefCallback(node)
                  }
                }}
                className="w-full h-[360px]"
                style={{ filter: 'brightness(0.8)', minHeight: 360 }}
              />
              {/* Loading overlay */}
              {loading && !showFullscreenMap && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[900]">
                  <div className="bg-slate-900 rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-white border border-slate-700">
                    <Loader size={14} className="animate-spin text-blue-400" />
                    Getting address…
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen overlay — fixed layer, map node is moved here */}
            {showFullscreenMap && (
              <div className="fixed inset-0 z-[300] flex flex-col bg-slate-950">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-700 backdrop-blur-sm shrink-0">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <MapPin size={16} className="text-blue-400" />
                    Drag pin or tap to set your location
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Check size={14} /> Confirm Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFullscreenMap(false)}
                      className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                {/* Fullscreen slot — map node gets moved here */}
                <div
                  ref={fullscreenSlotRef}
                  className="flex-1 w-full"
                  style={{ minHeight: 0, filter: 'brightness(0.8)' }}
                />
                {loading && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                    <div className="bg-slate-900 rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-white border border-slate-700">
                      <Loader size={14} className="animate-spin text-blue-400" />
                      Getting address…
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-center text-xs text-slate-500">
              📍 Tap on the map or drag the blue pin to set your exact location
            </p>

            <motion.div
              variants={containerVariants}
              className="flex gap-3"
            >
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFullscreenMap(true)}
                className="flex-1 px-4 py-3 rounded-xl border border-primary text-primary font-semibold hover:bg-primary/10 transition-all"
              >
                Fullscreen Map
              </motion.button>
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUseLocation}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                ✓ Confirm Location
              </motion.button>
            </motion.div>
          </motion.div>
        )}


        {/* Step 5: Edit Address */}
        {step === 5 && (
          <motion.div
            key="step5"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-card p-6 rounded-2xl border border-navy-700 border-opacity-30 backdrop-blur-xl bg-gradient-to-br from-navy-800 to-navy-900"
          >
            <h3 className="text-heading-sm font-bold mb-4">Edit Address</h3>
            <motion.div
              variants={containerVariants}
              className="space-y-4"
            >
              <motion.div variants={itemVariants}>
                <label className="block text-sm text-gray-400 mb-2">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-navy-900 border border-navy-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <label className="block text-sm text-gray-400 mb-2">Ward</label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-navy-900 border border-navy-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex gap-3 pt-4"
              >
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 px-4 py-2 rounded-lg border border-navy-600 text-gray-300 font-semibold hover:bg-navy-700 hover:bg-opacity-30 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all"
                >
                  Confirm
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
