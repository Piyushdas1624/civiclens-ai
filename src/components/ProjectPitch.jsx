import React, { useState } from 'react'

export default function ProjectPitch() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    // Slide 1: Problem
    {
      title: 'The Problem',
      content: (
        <div className="space-y-6">
          <div className="text-5xl font-bold text-gray-900">
            Cities Can't Respond Fast Enough
          </div>
          <div className="space-y-4 text-lg text-gray-700">
            <p>💔 Citizens report issues, but there's no transparency</p>
            <p>❌ No automatic triaging or categorization</p>
            <p>⏰ Manual routing wastes critical response time</p>
            <p>🔄 Duplicate reports create inefficiency</p>
          </div>
        </div>
      )
    },

    // Slide 2: Current Problems
    {
      title: 'Current Pain Points',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-4xl mb-3">📞</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Fragmented Intake</h3>
              <p className="text-gray-700 text-sm">
                Citizens use phone, email, web, apps—no unified system. Average response: 48 hours.
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="text-4xl mb-3">🚫</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">No Intelligence</h3>
              <p className="text-gray-700 text-sm">
                Manual reading of text descriptions. No image analysis. No context engine.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="text-4xl mb-3">😞</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Zero Visibility</h3>
              <p className="text-gray-700 text-sm">
                Citizens get confirmation #, but no real-time updates on status or ETA.
              </p>
            </div>
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
              <div className="text-4xl mb-3">📉</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Duplicate Chaos</h3>
              <p className="text-gray-700 text-sm">
                Same pothole reported 50 times. Workflow spends time de-duping. Lost context.
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600 italic">
            Result: Frustrated citizens, overwhelmed operations teams, slow resolution.
          </div>
        </div>
      )
    },

    // Slide 3: Solution
    {
      title: 'Our Solution',
      content: (
        <div className="space-y-6">
          <div className="text-5xl font-bold text-blue-600 mb-4">
            CivicLens AI
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              AI-Powered Civic Operating System
            </h3>
            <p className="text-lg text-gray-700">
              Real-time intelligence platform that ingests citizen reports, analyzes them with vision AI, routes to the right department, detects duplicates, and provides total transparency.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6 text-sm">
              <div>
                <span className="font-bold text-blue-600">📸</span> Vision Analysis
              </div>
              <div>
                <span className="font-bold text-blue-600">🧠</span> Context Engine
              </div>
              <div>
                <span className="font-bold text-blue-600">🚦</span> Smart Router
              </div>
              <div>
                <span className="font-bold text-blue-600">🔍</span> Duplicate Detection
              </div>
              <div>
                <span className="font-bold text-blue-600">📊</span> Real-Time Dashboard
              </div>
              <div>
                <span className="font-bold text-blue-600">👥</span> Citizen Transparency
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Slide 4: Architecture
    {
      title: 'System Architecture',
      content: (
        <div className="space-y-6">
          <div className="bg-gray-900 text-white rounded-lg p-8 font-mono text-sm space-y-2">
            <div>┌─────────────────────────────────────────────────┐</div>
            <div>│  Frontend Layer (React + Vite + TailwindCSS)   │</div>
            <div>│  - Citizen Report Interface                    │</div>
            <div>│  - Officer Dashboard                           │</div>
            <div>│  - Safety Intelligence                         │</div>
            <div>└──────────────────┬──────────────────────────────┘</div>
            <div>                   │</div>
            <div>┌──────────────────▼──────────────────────────────┐</div>
            <div>│  API Layer (FastAPI)                            │</div>
            <div>│  - Issue Submission                             │</div>
            <div>│  - Analytics & Querying                         │</div>
            <div>└──────────────────┬──────────────────────────────┘</div>
            <div>                   │</div>
            <div>┌──────────────────▼──────────────────────────────┐</div>
            <div>│  AI Service Layer                               │</div>
            <div>│  - Vision Analysis | Context Engine             │</div>
            <div>│  - Priority Router | Duplicate Detector         │</div>
            <div>└──────────────────┬──────────────────────────────┘</div>
            <div>                   │</div>
            <div>┌──────────────────▼──────────────────────────────┐</div>
            <div>│  Data Layer                                     │</div>
            <div>│  - Issue Store | Metrics | History              │</div>
            <div>└─────────────────────────────────────────────────┘</div>
          </div>
        </div>
      )
    },

    // Slide 5: AI Pipeline
    {
      title: 'AI Pipeline',
      content: (
        <div className="space-y-6">
          <h3 className="text-3xl font-bold text-gray-900">From Report to Resolution</h3>
          <div className="space-y-3">
            {[
              { step: 1, emoji: '👤', label: 'Citizen Reports', desc: 'Photo + location + description' },
              { step: 2, emoji: '🔍', label: 'Vision Analysis', desc: 'Extract objects, damage severity, type' },
              { step: 3, emoji: '🧠', label: 'Context Engine', desc: 'Enrich with location data, history, priority' },
              { step: 4, emoji: '⚡', label: 'Urgency Scorer', desc: 'Compute priority and impact radius' },
              { step: 5, emoji: '🚦', label: 'Department Router', desc: 'Route to Electrical, Roads, Water, etc.' },
              { step: 6, emoji: '🔎', label: 'Duplicate Detector', desc: 'Find similar reports, consolidate' },
              { step: 7, emoji: '📋', label: 'Queue Management', desc: 'Prioritize and assign to teams' }
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{item.emoji} {item.label}</p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },

    // Slide 6: Impact
    {
      title: 'Impact & Outcomes',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-4xl font-bold text-green-600 mb-2">-65%</div>
              <p className="text-lg font-bold text-gray-900">Response Time</p>
              <p className="text-sm text-gray-600">From 48h to under 16 hours</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">+40%</div>
              <p className="text-lg font-bold text-gray-900">Citizen Engagement</p>
              <p className="text-sm text-gray-600">Transparency drives participation</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="text-4xl font-bold text-purple-600 mb-2">-80%</div>
              <p className="text-lg font-bold text-gray-900">Duplicates</p>
              <p className="text-sm text-gray-600">Auto-consolidation reduces noise</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="text-4xl font-bold text-orange-600 mb-2">+55%</div>
              <p className="text-lg font-bold text-gray-900">Team Efficiency</p>
              <p className="text-sm text-gray-600">Smart routing, less manual work</p>
            </div>
          </div>
          <div className="text-center text-sm text-gray-600 italic">
            Projected outcomes for a city of 500K over 12 months
          </div>
        </div>
      )
    },

    // Slide 7: Future Roadmap
    {
      title: 'Future & Scalability',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2">Phase 2: Mobile App</h4>
              <p className="text-sm text-gray-700">Native iOS/Android with push notifications and real-time tracking</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2">Phase 3: Predictive Analytics</h4>
              <p className="text-sm text-gray-700">ML models to forecast high-risk areas and maintenance needs</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2">Phase 4: Multi-City Federation</h4>
              <p className="text-sm text-gray-700">Connect multiple cities for regional insights and best practices</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2">Phase 5: Integration Suite</h4>
              <p className="text-sm text-gray-700">APIs for work management systems, GIS, permit systems, budgeting</p>
            </div>
          </div>
          <div className="text-center text-sm text-gray-600 italic">
            Designed to scale from 50K to 5M+ citizens
          </div>
        </div>
      )
    },

    // Slide 8: Tech Stack
    {
      title: 'Technology Stack',
      content: (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-4">Frontend</h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-bold text-gray-900">React 18</p>
                <p className="text-sm text-gray-600">Component library & UI</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-bold text-gray-900">Vite</p>
                <p className="text-sm text-gray-600">Build tool & dev server</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-bold text-gray-900">TailwindCSS</p>
                <p className="text-sm text-gray-600">Utility-first styling</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-bold text-gray-900">Axios</p>
                <p className="text-sm text-gray-600">HTTP client</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-4">Backend</h4>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="font-bold text-gray-900">FastAPI</p>
                <p className="text-sm text-gray-600">High-perf async API framework</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="font-bold text-gray-900">Claude AI API</p>
                <p className="text-sm text-gray-600">Vision & reasoning analysis</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="font-bold text-gray-900">PostgreSQL</p>
                <p className="text-sm text-gray-600">Persistent data store</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="font-bold text-gray-900">Redis</p>
                <p className="text-sm text-gray-600">Caching & real-time sync</p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Slide 9: Team
    {
      title: 'Our Team',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {[
              { role: 'Product Lead', emoji: '🎯', desc: 'Civic tech vision' },
              { role: 'AI Engineer', emoji: '🤖', desc: 'Vision & routing models' },
              { role: 'Full-Stack Dev', emoji: '💻', desc: 'Frontend & backend' },
              { role: 'UX/Product', emoji: '🎨', desc: 'Design & user flows' },
              { role: 'Data Engineer', emoji: '📊', desc: 'Analytics & insights' },
              { role: 'DevOps', emoji: '🚀', desc: 'Infrastructure & scaling' }
            ].map((member, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-3">{member.emoji}</div>
                <p className="font-bold text-lg text-gray-900">{member.role}</p>
                <p className="text-sm text-gray-600">{member.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-gray-700">
              <span className="font-bold">Hackathon Team</span> - Building for Product Space × CodeBenders AI Agent Hackathon 2024
            </p>
          </div>
        </div>
      )
    }
  ]

  const nextSlide = () => setCurrentSlide((current) => (current + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((current) => (current - 1 + slides.length) % slides.length)

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      {/* Main Slide */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-5xl">
          <h1 className="text-3xl md:text-5xl font-bold text-blue-400 mb-6 md:mb-12">
            {slides[currentSlide].title}
          </h1>
          <div className="text-lg">
            {slides[currentSlide].content}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-900 border-t border-gray-700 px-6 md:px-12 py-4 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <button
          onClick={prevSlide}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-blue-500 w-8'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        <div className="text-sm text-gray-400">
          Slide {currentSlide + 1} of {slides.length}
        </div>

        <button
          onClick={nextSlide}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
