"use client"
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Layers, Database, Target, ArrowDown } from 'lucide-react'
import { useState, useEffect } from 'react'

export function AlertStormAnalysis({ incident, onReplay }: { incident: any, onReplay?: () => void }) {
  const [stage, setStage] = useState(0)
  
  // Stages: 0 (Raw), 1 (Fingerprints), 2 (Clusters), 3 (Incident)
  useEffect(() => {
    const timer = setInterval(() => {
      setStage(prev => (prev < 3 ? prev + 1 : prev))
    }, 1500)
    return () => clearInterval(timer)
  }, [])
  
  const rawCount = incident.raw_alerts_count || 190
  const fpCount = incident.unique_fingerprints || 7
  const clusterCount = incident.correlated_clusters || 3
  
  const steps = [
    {
      id: 0,
      label: "RAW TELEMETRY EVENTS",
      count: rawCount,
      icon: Database,
      color: "text-slate-400",
      bg: "bg-slate-900",
      border: "border-slate-700"
    },
    {
      id: 1,
      label: "SEMANTIC FINGERPRINTS",
      count: fpCount,
      icon: Filter,
      color: "text-cyan-400",
      bg: "bg-cyan-950/40",
      border: "border-cyan-500/50"
    },
    {
      id: 2,
      label: "CAUSAL CLUSTERS",
      count: clusterCount,
      icon: Layers,
      color: "text-fuchsia-400",
      bg: "bg-fuchsia-950/40",
      border: "border-fuchsia-500/50"
    },
    {
      id: 3,
      label: "ACTIONABLE INCIDENT",
      count: 1,
      icon: Target,
      color: "text-yellow-400",
      bg: "bg-yellow-950/40",
      border: "border-yellow-500/50"
    }
  ]
  
  return (
    <div className="bg-black/60 border border-white/5 p-8 flex flex-col items-center justify-center min-h-[400px]">
      <h3 className="text-xl font-black text-white tracking-tighter mb-8 uppercase text-center">
        Alert Storm Compression
      </h3>
      
      <div className="w-full max-w-lg space-y-2 relative">
        {steps.map((step, idx) => (
          <AnimatePresence key={step.id}>
            {stage >= step.id && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex flex-col items-center w-full"
              >
                {idx > 0 && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 24, opacity: 1 }}
                    className="w-[2px] bg-gradient-to-b from-white/20 to-white/5 my-2 flex items-center justify-center overflow-visible"
                  >
                    <ArrowDown className="w-4 h-4 text-white/30 absolute translate-y-3" />
                  </motion.div>
                )}
                
                <div className={`w-full ${step.bg} border ${step.border} p-6 flex items-center justify-between shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full bg-black/50 border ${step.border}`}>
                      <step.icon className={`w-6 h-6 ${step.color}`} />
                    </div>
                    <span className="font-bold text-sm tracking-widest text-white/80">{step.label}</span>
                  </div>
                  <motion.span 
                    initial={{ scale: 2, opacity: 0, filter: "blur(10px)" }}
                    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className={`text-4xl font-black font-mono ${step.color} drop-shadow-md`}
                  >
                    {step.count}
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
        
        {stage === 3 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="absolute top-1/2 left-full ml-12 -translate-y-1/2 w-48 text-center"
          >
            <div className="text-[10px] font-bold text-cyan-500 tracking-[0.3em] uppercase mb-2">Noise Reduction</div>
            <div className="text-6xl font-black text-cyan-400 font-mono drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
              {(incident.noise_reduction_ratio * 100).toFixed(1)}%
            </div>
          </motion.div>
        )}
      </div>
      
      {stage === 3 && (
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          onClick={() => { setStage(0); if (onReplay) onReplay(); }}
          className="mt-8 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
        >
          Replay Incident Sequence
        </motion.button>
      )}
    </div>
  )
}
