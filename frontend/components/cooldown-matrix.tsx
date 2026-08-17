"use client"
import { useState, useEffect } from 'react'
import { ShieldAlert, Activity, Filter, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_URL } from '@/lib/config'

export function CooldownMatrix() {
  const [policies, setPolicies] = useState<any[]>([])

  useEffect(() => {
    const fetchCooldown = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cooldown`)
        const data = await res.json()
        setPolicies(data.policies || [])
      } catch (e) {
        console.error(e)
      }
    }
    fetchCooldown()
    const timer = setInterval(fetchCooldown, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-[#050505] p-8 relative overflow-hidden h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter flex items-center uppercase">
            <ShieldAlert className="w-6 h-6 mr-3 text-cyan-400" />
            Adaptive Cooldown Matrix
          </h2>
          <p className="text-cyan-500/70 text-xs font-mono tracking-widest mt-1">DYNAMIC ALERT SUPPRESSION POLICIES</p>
        </div>
      </div>
      
      {policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-white/5 bg-black/40 rounded-xl">
          <Filter className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">No Active Suppression Policies</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {policies.map((p, idx) => (
              <motion.div 
                key={`${p.service}-${p.event_type}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black border border-cyan-500/30 p-6 shadow-[0_0_20px_rgba(6,182,212,0.1)] relative group"
              >
                <div className="absolute top-0 right-0 p-2">
                  <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${p.is_escalated ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                    {p.is_escalated ? 'Escalated' : 'Suppressing'}
                  </span>
                </div>
                
                <h3 className="text-lg font-black text-white mb-1 tracking-tight">{p.service}</h3>
                <p className="text-xs font-mono text-slate-500 mb-6">{p.event_type}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-[10px] text-cyan-500/70 font-bold uppercase tracking-widest mb-1 flex items-center"><Activity className="w-3 h-3 mr-1"/> Modifier</div>
                    <div className="text-2xl font-black text-cyan-400 font-mono">{p.adaptive_modifier.toFixed(2)}x</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-cyan-500/70 font-bold uppercase tracking-widest mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> Window</div>
                    <div className="text-2xl font-black text-white font-mono">{p.current_suppression_window_sec}s</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Events Suppressed</span>
                  <span className="text-xl font-black text-fuchsia-400 font-mono drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]">{p.suppressed_count}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
