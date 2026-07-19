import React from 'react'
import { ShieldAlert, CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react'

const SAFETY_TIPS_BY_CATEGORY = {
  electrical: {
    title: 'HIGH VOLTAGE HAZARD',
    color: 'bg-red-500/5 border-red-500/20 text-red-200',
    iconColor: 'text-red-400',
    tips: [
      'Do not approach downed electrical wires',
      'Keep at least 10 meters (30 feet) distance',
      'Do not touch any conductive materials',
      'Keep children and pets away',
      'Stay away in wet weather or storms'
    ],
    action: 'Electrical Department notified',
    timing: 'Dispatch in ~30 minutes'
  },
  road: {
    title: 'ROAD HAZARD',
    color: 'bg-amber-500/5 border-amber-500/20 text-amber-200',
    iconColor: 'text-amber-400',
    tips: [
      'Drive cautiously around the area',
      'Watch for uneven surfaces',
      'Avoid the damaged section if possible',
      'Report to traffic authorities if blocking traffic',
      'Use headlights and caution signs if available'
    ],
    action: 'Roads Department notified',
    timing: 'Dispatch in ~1-2 hours'
  },
  water: {
    title: 'WATER HAZARD',
    color: 'bg-blue-500/5 border-blue-500/20 text-blue-200',
    iconColor: 'text-blue-400',
    tips: [
      'Do not drink from affected water sources',
      'Avoid contact with contaminated water',
      'Do not allow children to play in affected areas',
      'Report to health department for testing',
      'Use bottled or boiled water temporarily'
    ],
    action: 'Water Department notified',
    timing: 'Dispatch in ~2-4 hours'
  },
  sanitation: {
    title: 'SANITATION HAZARD',
    color: 'bg-amber-500/5 border-amber-500/20 text-amber-200',
    iconColor: 'text-amber-400',
    tips: [
      'Avoid direct contact with waste or debris',
      'Do not let children play in the area',
      'Maintain proper hygiene and handwashing',
      'Report to public health if health risk exists',
      'Keep area cordoned off if possible'
    ],
    action: 'Sanitation Department notified',
    timing: 'Dispatch in ~24-48 hours'
  },
  parks: {
    title: 'FACILITY HAZARD',
    color: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200',
    iconColor: 'text-emerald-400',
    tips: [
      'Avoid using damaged play equipment',
      'Do not let children use compromised facilities',
      'Report to parks maintenance immediately',
      'Keep area blocked off if unsafe',
      'Report any injuries or near-misses'
    ],
    action: 'Parks Department notified',
    timing: 'Dispatch in ~1-3 days'
  },
  other: {
    title: 'CIVIC ISSUE REPORTED',
    color: 'bg-slate-500/5 border-slate-500/20 text-slate-200',
    iconColor: 'text-slate-400',
    tips: [
      'Maintain a safe distance from the area',
      'Report any immediate hazards to authorities',
      'Follow all safety guidelines',
      'Do not interfere with the area',
      'Keep updated on resolution progress'
    ],
    action: 'Relevant Department notified',
    timing: 'Dispatch in ~2-4 hours'
  }
}

export default function SafetyAdvice({ category = 'other', urgency = 50, department = '' }) {
  const normalizeCategory = (cat) => {
    const c = (cat || '').toLowerCase()
    if (c.includes('electric') || c.includes('power') || c.includes('voltage')) return 'electrical'
    if (c.includes('road') || c.includes('street') || c.includes('pavement') || c.includes('pothole')) return 'road'
    if (c.includes('water') || c.includes('flood') || c.includes('drain') || c.includes('sewage') || c.includes('pipe')) return 'water'
    if (c.includes('sanit') || c.includes('garbage') || c.includes('waste') || c.includes('trash')) return 'sanitation'
    if (c.includes('park') || c.includes('garden') || c.includes('tree') || c.includes('green')) return 'parks'
    return 'other'
  }
  const tips = SAFETY_TIPS_BY_CATEGORY[normalizeCategory(category)] || SAFETY_TIPS_BY_CATEGORY.other

  // Dynamic response time based on urgency score
  const getResponseTime = (score) => {
    if (score >= 80) return '~30 minutes (Emergency Priority)'
    if (score >= 65) return '~2–4 hours (High Priority)'
    if (score >= 40) return '~1–2 business days'
    return '~3–5 business days'
  }

  // Dynamic action based on real department if provided
  const actionText = department
    ? `${department} Department notified and processing your report`
    : tips.action

  return (
    <div className={`border rounded-2xl p-6 glass-card shadow-lg ${tips.color}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <ShieldAlert className={tips.iconColor} size={22} />
        <h3 className="text-sm font-bold tracking-wide uppercase text-white">{tips.title}</h3>
      </div>

      <div className="space-y-4">
        {/* Safety Tips */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Stay Safe</p>
          <ul className="space-y-2">
            {tips.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200">
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action & Timing — NOW DYNAMIC */}
        <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/80">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <AlertCircle size={10} className="text-blue-400" /> Next Steps
              </p>
              <p className="text-xs font-bold text-white leading-relaxed">{actionText}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock size={10} className="text-blue-400" /> Response Time
              </p>
              <p className="text-xs font-bold text-white leading-relaxed">{getResponseTime(urgency)}</p>
            </div>
          </div>
        </div>

        {/* Urgency Alert Badges */}
        {urgency >= 80 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex gap-2.5 items-start">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-red-400 leading-relaxed uppercase tracking-wider">CRITICAL: Emergency dispatch has been prioritized.</p>
          </div>
        )}
        {urgency >= 50 && urgency < 80 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex gap-2.5 items-start">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber-400 leading-relaxed uppercase tracking-wider">HIGH: This issue is being treated as high priority.</p>
          </div>
        )}

      </div>
    </div>
  )
}
