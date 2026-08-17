"use client"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BellRing, Target, ArrowRight } from 'lucide-react'
import { API_URL } from '@/lib/config'

export function KryvenComparison({ onClose, incident }: { onClose: () => void, incident: any }) {
  const [showWithKryven, setShowWithKryven] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/metrics/comparison`)
        const data = await res.json()
        setMetrics(data)
      } catch (e) {
        console.error(e)
      }
    }
    fetchMetrics()
    // Poll for updates in case events are still arriving
    const timer = setInterval(fetchMetrics, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center font-sans overflow-hidden"
    >
      <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full transition-colors z-50">
        <X className="w-8 h-8 text-slate-400" />
      </button>

      <div className="flex w-full max-w-6xl h-[600px] rounded-3xl border border-white/10 overflow-hidden relative shadow-[0_0_100px_rgba(217,70,239,0.1)]">
        
        {/* WITHOUT KRYVEN */}
        <div className={`w-1/2 p-12 flex flex-col relative transition-all duration-1000 ${showWithKryven ? 'opacity-20 grayscale scale-95 blur-sm' : 'opacity-100 scale-100 bg-red-950/20'}`}>
          <div className="absolute inset-0 border-r border-white/10 pointer-events-none"></div>
          
          <h2 className="text-3xl font-black text-red-500 mb-2 tracking-tighter uppercase">Without Kryven</h2>
          <p className="text-slate-400 font-mono text-sm mb-12">Raw Telemetry & Alert Fatigue</p>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
             <BellRing className="w-24 h-24 text-red-500/20 mb-6" />
             <p className="text-slate-300 text-lg leading-relaxed">
               Without causal intelligence, on-call engineers receive an unthrottled stream of independent alerts, requiring manual correlation across services.
             </p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-red-500/20 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest mb-1">Alerts Fired</div>
              <div className="text-4xl font-black text-white font-mono">{metrics?.without_kryven?.raw_alerts.toLocaleString() || '...'}</div>
            </div>
            <div>
              <div className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest mb-1">PagerDuty Threads</div>
              <div className="text-4xl font-black text-white font-mono">{metrics?.without_kryven?.pagerduty_threads || '...'}</div>
            </div>
          </div>
        </div>
        
        {/* WITH KRYVEN */}
        <div className={`w-1/2 p-12 flex flex-col relative transition-all duration-1000 ${showWithKryven ? 'opacity-100 scale-100 bg-cyan-950/20 shadow-[inset_0_0_50px_rgba(6,182,212,0.1)]' : 'opacity-20 grayscale scale-95 blur-sm'}`}>
          <h2 className="text-3xl font-black text-cyan-400 mb-2 tracking-tighter uppercase">With Kryven</h2>
          <p className="text-slate-400 font-mono text-sm mb-12">Causal Intelligence & Compression</p>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            {showWithKryven && (
              <motion.div 
                initial={{ scale: 0, filter: "blur(20px)" }}
                animate={{ scale: 1, filter: "blur(0px)" }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="w-full bg-black border border-cyan-500 p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none"></div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <span className="px-3 py-1 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-[0.3em]">Critical Incident</span>
                  <Target className="w-6 h-6 text-cyan-500" />
                </div>
                
                <h3 className="text-2xl font-black text-white tracking-tight mb-8">
                  {incident?.title || 'System Degradation'}
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-[10px] text-cyan-500/70 font-bold uppercase tracking-widest mb-1">Root Cause</div>
                    <div className="text-2xl font-black text-cyan-400 font-mono">{incident?.root_cause?.service || 'Calculating...'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-cyan-500/70 font-bold uppercase tracking-widest mb-1">Confidence</div>
                    <div className="text-2xl font-black text-white font-mono">{incident?.confidence ? `${incident.confidence.toFixed(1)}%` : '--'}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="mt-8 pt-8 border-t border-cyan-500/20 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-cyan-500/70 font-bold uppercase tracking-widest mb-1">Noise Reduction</div>
              <div className="text-4xl font-black text-cyan-400 font-mono drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                {metrics ? (metrics.with_kryven.noise_reduction_ratio * 100).toFixed(1) : '...'}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-cyan-500/70 font-bold uppercase tracking-widest mb-1">Actionable Incident</div>
              <div className="text-4xl font-black text-white font-mono">{metrics?.with_kryven?.actionable_incidents || '...'}</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <button 
            onClick={() => setShowWithKryven(!showWithKryven)}
            className="w-20 h-20 bg-fuchsia-600 rounded-full flex flex-col items-center justify-center text-white shadow-[0_0_30px_rgba(217,70,239,0.8)] hover:scale-110 transition-transform border-4 border-black"
          >
            <ArrowRight className={`w-8 h-8 transition-transform duration-500 ${showWithKryven ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-slate-500 font-mono text-sm tracking-widest uppercase">Click the center button to toggle intelligence</p>
    </motion.div>
  )
}
