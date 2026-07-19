import React, { useEffect, useRef } from 'react'
import { useComplaints } from '../hooks/useComplaints'
import { Map, Layers, BarChart3, Building2, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function CityMap() {
  const mapRef = useRef(null)
  const { complaints } = useComplaints()
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  // Color mapping based on urgency/priority
  const getSafetyColor = (urgency) => {
    if (urgency >= 80) return '#EF4444' // Red - Critical
    if (urgency >= 50) return '#F59E0B' // Amber - High
    return '#10B981' // Green - Safe
  }

  const getSafetyLabel = (urgency) => {
    if (urgency >= 80) return 'Critical'
    if (urgency >= 50) return 'Moderate'
    return 'Safe'
  }

  // Calculate ward color based on average urgency in that ward
  const getWardScore = (wardName) => {
    const wardComplaints = complaints.filter(c => c.ward === wardName)
    if (wardComplaints.length === 0) return 0
    const avgUrgency = wardComplaints.reduce((sum, c) => sum + (c.urgency_score || 0), 0) / wardComplaints.length
    return avgUrgency
  }

  useEffect(() => {
    // Check if Leaflet is loaded
    if (!window.L || !mapRef.current) return

    const L = window.L

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView([26.7271, 88.3953], 13) // Center on Siliguri

      // CartoDB Dark Matter tiles (perfect for dark mode dashboards)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current)

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current)
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add markers for each complaint
    complaints.forEach(complaint => {
      const lat = parseFloat(complaint.location_lat || complaint.latitude)
      const lng = parseFloat(complaint.location_lng || complaint.longitude)

      if (isNaN(lat) || isNaN(lng)) return

      const color = getSafetyColor(complaint.urgency_score || 50)

      // Custom divIcon for glowing indicator dot
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-4 h-4 rounded-full border border-white shadow-[0_0_8px_${color}] transition-all duration-300 hover:scale-125" style="background-color: ${color}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current)

      // Bind custom dark styled popup
      marker.bindPopup(`
        <div class="p-3 text-slate-200 min-w-[200px] font-sans">
          <div class="font-bold text-sm mb-1.5 text-white border-b border-slate-700 pb-1">${complaint.title || `Issue #${complaint.id}`}</div>
          <div class="text-xs text-slate-400 mb-1"><span class="font-semibold text-slate-300">Ward:</span> ${complaint.ward || 'Unknown Ward'}</div>
          <div class="text-xs text-slate-400 mb-1"><span class="font-semibold text-slate-300">Urgency:</span> <span class="font-mono font-bold" style="color: ${color}">${complaint.urgency_score || 50}/100</span></div>
          <div class="text-xs text-slate-400"><span class="font-semibold text-slate-300">Status:</span> <span class="uppercase font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">${complaint.status || 'Open'}</span></div>
        </div>
      `, {
        className: 'dark-popup'
      })

      markersRef.current.push(marker)
    })

    // Fit map bounds to complaints
    if (complaints.length > 0) {
      const validPoints = complaints
        .map(c => [parseFloat(c.location_lat || c.latitude), parseFloat(c.location_lng || c.longitude)])
        .filter(pt => !isNaN(pt[0]) && !isNaN(pt[1]))

      if (validPoints.length > 0) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(validPoints), { padding: [45, 45] })
      }
    }
  }, [complaints])

  return (
    <div className="w-full space-y-6">
      {/* Map Container */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden h-96 relative shadow-lg">
        <div ref={mapRef} className="w-full h-full z-10" />
      </div>

      {/* Grid: Legend & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Legend Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Layers className="text-primary" size={20} />
              <h3 className="text-heading-sm font-bold text-white">Incident Legend</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Critical */}
              <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-red-500/20">
                  <ShieldAlert size={12} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-400">Critical</p>
                  <p className="text-[10px] text-slate-400">Score 80+</p>
                </div>
              </div>

              {/* Moderate */}
              <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-500/20">
                  <AlertTriangle size={12} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-400">Moderate</p>
                  <p className="text-[10px] text-slate-400">Score 50-80</p>
                </div>
              </div>

              {/* Safe */}
              <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-400">Low Threat</p>
                  <p className="text-[10px] text-slate-400">Score &lt;50</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2.5 mb-4">
            <BarChart3 className="text-primary" size={20} />
            <h3 className="text-heading-sm font-bold text-white">Map Statistics</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold text-white font-mono">{complaints.length}</p>
            </div>
            <div className="bg-red-500/5 p-3.5 rounded-xl border border-red-500/10">
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">Critical</p>
              <p className="text-2xl font-bold text-red-500 font-mono">
                {complaints.filter(c => (c.urgency_score || 0) >= 80).length}
              </p>
            </div>
            <div className="bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/10">
              <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Moderate</p>
              <p className="text-2xl font-bold text-amber-500 font-mono">
                {complaints.filter(c => (c.urgency_score || 0) >= 50 && (c.urgency_score || 0) < 80).length}
              </p>
            </div>
            <div className="bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-500/10">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Avg Urgency</p>
              <p className="text-2xl font-bold text-emerald-400 font-mono">
                {complaints.length > 0
                  ? Math.round(
                      complaints.reduce((sum, c) => sum + (c.urgency_score || 0), 0) / complaints.length
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Ward Breakdown Card */}
      {complaints.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2.5 mb-4">
            <Building2 className="text-primary" size={20} />
            <h3 className="text-heading-sm font-bold text-white">Ward Safety Index</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {[...new Set(complaints.map(c => c.ward).filter(Boolean))].map(ward => {
              const wardComplaints = complaints.filter(c => c.ward === ward)
              const avgScore = Math.round(
                wardComplaints.reduce((sum, c) => sum + (c.urgency_score || 0), 0) / wardComplaints.length
              )
              const barColor = getSafetyColor(avgScore)
              return (
                <div key={ward} className="flex items-center justify-between bg-slate-900/30 p-3 rounded-xl border border-slate-800/40">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-bold text-white">{ward}</p>
                    <p className="text-xs text-slate-400">{wardComplaints.length} incident{wardComplaints.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: barColor,
                          width: `${avgScore}%`,
                          boxShadow: `0 0 8px ${barColor}`
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white font-mono w-12 text-right">{avgScore}/100</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
