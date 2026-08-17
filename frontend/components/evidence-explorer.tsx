"use client"
import { motion } from 'framer-motion'
import { Target, Clock, Network, Activity, ArrowRightLeft, Database, Search } from 'lucide-react'

export function EvidenceExplorer({ rootCause }: { rootCause: any }) {
  if (!rootCause || !rootCause.evidence) return null;
  
  const { evidence, confidence } = rootCause;
  
  const factors = [
    {
      id: 'temporal',
      label: 'Temporal Precedence',
      score: evidence.temporal_precedence,
      max: 25.0,
      icon: Clock,
      desc: 'Chronological origin of the anomaly sequence'
    },
    {
      id: 'dependency',
      label: 'Dependency Centrality',
      score: evidence.dependency_centrality,
      max: 20.0,
      icon: Network,
      desc: 'Topological position (leaf node vs edge node)'
    },
    {
      id: 'magnitude',
      label: 'Anomaly Magnitude',
      score: evidence.anomaly_magnitude,
      max: 20.0,
      icon: Activity,
      desc: 'Volume of errors relative to baseline'
    },
    {
      id: 'propagation',
      label: 'Propagation Strength',
      score: evidence.propagation_strength,
      max: 20.0,
      icon: ArrowRightLeft,
      desc: 'Correlation with downstream failure cascades'
    },
    {
      id: 'impact',
      label: 'Downstream Impact',
      score: evidence.downstream_impact,
      max: 15.0,
      icon: Target,
      desc: 'Blast radius measured in estimated failed requests'
    },
    {
      id: 'historical',
      label: 'Historical Correlation',
      score: evidence.historical_correlation,
      max: 10.0,
      icon: Database,
      desc: 'Similarity to past confirmed incidents'
    }
  ]
  
  return (
    <div className="bg-[#050505] border border-blue-500/30 p-6 flex flex-col h-full shadow-[inset_0_0_50px_rgba(59,130,246,0.05)]">
      <div className="flex items-center justify-between mb-8 border-b border-blue-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <Search className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase">Causal Evidence</h3>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black text-blue-400 font-mono drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            {confidence.toFixed(1)}%
          </span>
          <span className="text-[9px] text-blue-500/70 font-bold uppercase tracking-widest">Total Confidence</span>
        </div>
      </div>
      
      <div className="flex-1 space-y-5 overflow-y-auto pr-2 scrollbar-hide">
        {factors.map((factor, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={factor.id} 
            className="group cursor-pointer"
          >
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center space-x-3">
                <factor.icon className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{factor.label}</span>
              </div>
              <span className="text-sm font-black font-mono text-blue-400">+{factor.score.toFixed(1)}</span>
            </div>
            
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mb-1 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(factor.score / factor.max) * 100}%` }}
                transition={{ duration: 1, delay: idx * 0.1 + 0.3 }}
                className="absolute top-0 left-0 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
              />
            </div>
            <p className="text-[10px] text-slate-600 font-mono">{factor.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
