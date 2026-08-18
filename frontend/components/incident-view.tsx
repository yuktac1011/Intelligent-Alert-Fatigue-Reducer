"use client"
import { AlertCircle, Target, Activity, ShieldCheck, Network, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { IncidentGraphDeep } from './incident-graph'
import { API_URL } from '@/lib/config'

export function IncidentView({ incident, compact = false }: { incident: any, compact?: boolean }) {
  if (!incident) return null;

  return (
    <div className="flex flex-col h-full bg-transparent text-white font-sans">
      {!compact && (
        <div className="p-8 border-b border-white/5 bg-black/40 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-[50px]"></div>
        
          <div className="flex justify-between items-center mb-6 relative z-10">
            <motion.span 
              animate={{ opacity: [1, 0.5, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="px-4 py-1.5 bg-fuchsia-500 text-black text-[10px] font-black rounded-none uppercase tracking-[0.3em] flex items-center border border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.5)]"
            >
              {incident.severity}
            </motion.span>
            <span className="text-fuchsia-500/50 font-mono text-xs tracking-widest">{incident.id}</span>
          </div>
          
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 leading-tight mb-4 relative z-10 tracking-tighter">
            {incident.title}
          </h2>
          
          <div className="flex items-center text-cyan-400 text-xs font-mono tracking-widest relative z-10">
            <Activity className="w-4 h-4 mr-2" />
            <span>COMPRESSED {incident.raw_alerts_count} ALERTS → 1 INCIDENT</span>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto scrollbar-hide ${compact ? 'p-4 space-y-4' : 'p-8 space-y-8'}`}>
        
        {incident.root_cause && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-black border border-white/10 rounded-none group hover:border-blue-500/50 transition-colors"
          >
            <div className="bg-[#050505] px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                <Target className="w-4 h-4 mr-3 text-blue-500" />
                Root Cause Analysis
              </h3>
              <span className="text-[10px] font-black px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {incident.root_cause.confidence.toFixed(1)}% CONFIDENCE
              </span>
            </div>
            <div className="p-6">
              <div className="text-2xl font-black text-blue-400 font-mono mb-6 uppercase tracking-tight drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                {incident.root_cause.service}
              </div>
              <ul className="space-y-4">
                {incident.root_cause.explanation.map((ev: string, idx: number) => (
                  <li key={idx} className="flex items-start text-xs text-slate-300 font-mono tracking-wide">
                    <span className="text-cyan-500 mr-3 font-bold">{'>'}</span>
                    {ev.replace('✓ ', '')}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {incident.blast_radius && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-black border border-white/10 rounded-none group hover:border-yellow-500/50 transition-colors"
          >
            <div className="bg-[#050505] px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                <AlertCircle className="w-4 h-4 mr-3 text-yellow-500" />
                Blast Radius
              </h3>
              <div className="group/tooltip relative flex items-center">
                <Info className="w-4 h-4 text-slate-600 hover:text-slate-300 cursor-help" />
                <div 
                  className="absolute right-0 w-[180px] sm:w-64 bg-slate-900 border border-slate-700 p-3 text-xs text-slate-300 hidden group-hover/tooltip:block z-[100] shadow-xl rounded-md pointer-events-none"
                  style={{ bottom: 'calc(100% + 8px)' }}
                >
                  Calculated based on {incident.blast_radius.affected_services} downstream dependencies. User impact is derived from the proportion of traffic passing through degraded endpoints over the last {incident.blast_radius.dependency_depth} minutes.
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-8">
              <div className="group/metric relative cursor-help">
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-2 font-bold flex items-center">
                  Services Affected <Info className="w-3 h-3 ml-1 opacity-50" />
                </p>
                <p className="text-3xl font-black text-white font-mono">{incident.blast_radius.affected_services}</p>
                <div className="absolute left-0 bottom-14 w-48 bg-slate-900 border border-slate-700 p-2 text-[10px] text-slate-300 hidden group-hover/metric:block z-50">
                  Number of unique microservices exhibiting &gt;2x latency or &gt;1% error rates concurrently.
                </div>
              </div>
              <div className="group/metric relative cursor-help">
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-2 font-bold flex items-center">
                  Failed Requests <Info className="w-3 h-3 ml-1 opacity-50" />
                </p>
                <p className="text-3xl font-black text-fuchsia-500 font-mono drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">{incident.blast_radius.estimated_failed_requests.toLocaleString()}</p>
                <div className="absolute right-0 bottom-14 w-[150px] sm:w-48 bg-slate-900 border border-slate-700 p-2 text-[10px] text-slate-300 hidden group-hover/metric:block z-[100]">
                  Total HTTP 5xx responses served across all affected endpoints during this incident.
                </div>
              </div>
              <div className="group/metric relative cursor-help">
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-2 font-bold flex items-center">
                  User Impact <Info className="w-3 h-3 ml-1 opacity-50" />
                </p>
                <p className="text-3xl font-black text-yellow-500 font-mono drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">{incident.blast_radius.user_impact_percent}%</p>
                <div className="absolute left-0 bottom-14 w-48 bg-slate-900 border border-slate-700 p-2 text-[10px] text-slate-300 hidden group-hover/metric:block z-50">
                  Estimated percentage of active users experiencing degraded functionality.
                </div>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-2 font-bold">Depth</p>
                <p className="text-3xl font-black text-white font-mono">{incident.blast_radius.dependency_depth} <span className="text-sm text-slate-500 tracking-normal">levels</span></p>
              </div>
            </div>
          </motion.div>
        )}

        {!compact && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="h-96 border border-white/10"
          >
            <IncidentGraphDeep incident={incident} />
          </motion.div>
        )}

        {incident.recommendation && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-black border border-white/10 rounded-none group hover:border-cyan-500/50 transition-colors"
          >
            <div className="bg-[#050505] px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                <ShieldCheck className="w-4 h-4 mr-3 text-cyan-500" />
                Recommended Action
              </h3>
              <span className="text-[10px] font-black px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                PRIORITY {incident.recommendation.priority}
              </span>
            </div>
            <div className="p-6">
              <p className="text-sm text-cyan-100/70 italic mb-6 bg-cyan-950/20 p-4 border-l-2 border-cyan-500">
                "{incident.recommendation.reason}"
              </p>
              <ol className="space-y-4 pl-0 list-none text-slate-300 font-mono text-xs tracking-wide">
                {incident.recommendation.actions.map((act: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-cyan-500 font-black mr-4">0{idx + 1}</span>
                    {act}
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
        
      </div>
      
      <div className={`${compact ? 'p-4' : 'p-6'} bg-[#050505] border-t border-white/5 shrink-0`}>
        <button 
          onClick={async () => {
            try {
              await fetch(`${API_URL}/api/incidents/${incident.id}/neutralize`, { method: 'POST' })
            } catch (e) {}
          }}
          disabled={incident.status === 'resolved'}
          className={`w-full font-black tracking-widest uppercase py-4 rounded-none transition-all flex items-center justify-center group
            ${incident.status === 'resolved' ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-black shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_40px_rgba(217,70,239,0.8)]'}`}
        >
          {incident.status === 'resolved' ? 'Neutralized' : 'Acknowledge & Neutralize'}
          <Target className={`w-5 h-5 ml-3 ${incident.status !== 'resolved' ? 'group-hover:scale-125 transition-transform' : ''}`} />
        </button>
      </div>
    </div>
  )
}
