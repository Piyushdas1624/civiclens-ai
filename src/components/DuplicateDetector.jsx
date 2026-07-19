import React from 'react'
import { Copy, MapPin, Loader, Info } from 'lucide-react'

export default function DuplicateDetector({ nearby = [], duplicateCount = 0, location = {} }) {
  if (!nearby || nearby.length === 0) return null

  return (
    <div className="glass-card bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
          <Copy size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-heading-sm font-bold text-white mb-2">Similar Reports Nearby</h3>
          <p className="text-sm text-slate-300 mb-4">
            We found <span className="font-bold text-amber-400">{nearby.length}</span> similar complaint(s) within 180m of your location. This helps us prioritize and batch repairs.
          </p>
          
          <div className="space-y-3">
            {nearby.map((complaint, idx) => (
              <div key={idx} className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 transition-all hover:border-slate-700">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="font-bold text-white text-sm truncate">{complaint.title || complaint.category}</span>
                  <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-mono shrink-0">
                    {Math.round(complaint.distance || 0)}m away
                  </span>
                </div>
                <p className="text-slate-400 text-xs mb-3 flex items-center gap-1">
                  <MapPin size={12} /> {complaint.location || 'Siliguri'}
                </p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    complaint.status?.toLowerCase() === 'resolved' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                    complaint.status?.toLowerCase() === 'assigned' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' :
                    'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  }`}>
                    {complaint.status || 'Under Review'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {complaint.time_ago || 'recently'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 flex gap-2.5 items-start">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Pro Tip:</span> Related complaints are often fixed together, so resolution time may be faster!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
