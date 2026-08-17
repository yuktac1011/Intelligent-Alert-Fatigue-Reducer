"use client"
import { useState, useEffect } from 'react'
import { TopologyGraph } from '@/components/topology-graph'
import { ChaosLab } from '@/components/chaos-lab'
import { IncidentView } from '@/components/incident-view'
import { AlertStormAnalysis } from '@/components/alert-storm-analysis'
import { EvidenceExplorer } from '@/components/evidence-explorer'
import { IncidentReplay } from '@/components/incident-replay'
import { KryvenComparison } from '@/components/kryven-comparison'
import { CooldownMatrix } from '@/components/cooldown-matrix'
import { WhatIfEngine } from '@/components/what-if-engine'
import { API_URL, WS_URL } from '@/lib/config'
import { Activity, ShieldAlert, Zap, Network, SplitSquareHorizontal, Shield, Beaker } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('live')
  const [incidents, setIncidents] = useState<any[]>([])
  const [topology, setTopology] = useState({ nodes: [], edges: [] })
  const [metrics, setMetrics] = useState({
    raw_alerts: 0,
    noise_reduction_ratio: 0,
    active_incidents: 0,
    unique_fingerprints: 0
  })
  
  const [replayIncident, setReplayIncident] = useState<any>(null)
  const [showComparison, setShowComparison] = useState(false)
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/metrics/noise`)
        const data = await res.json()
        setMetrics(data)
      } catch (e) {}
    }
    const fetchTopology = async () => {
      try {
        const res = await fetch(`${API_URL}/api/topology`)
        const data = await res.json()
        setTopology(data)
      } catch (e) {}
    }
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/incidents`)
        const data = await res.json()
        setIncidents(data)
      } catch (e) {}
    }

    fetchMetrics()
    fetchTopology()
    fetchIncidents()

    const ws = new WebSocket(`${WS_URL}/api/ws/events`)
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'incident_update') {
        setIncidents(prev => {
          const exists = prev.find(i => i.id === msg.data.id)
          if (exists) return prev.map(i => i.id === msg.data.id ? msg.data : i)
          return [msg.data, ...prev]
        })
      }
      if (msg.type === 'topology_update') {
        setTopology(msg.data)
      }
      if (msg.type === 'event') {
        fetchMetrics()
      }
    }
    
    return () => ws.close()
  }, [])

  return (
    <div className="h-screen bg-[#050505] text-slate-200 flex flex-col font-sans overflow-hidden">
      
      {/* Intense Top Header */}
      <header className="border-b-2 border-cyan-500/30 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-cyan-500 p-[2px] shadow-[0_0_20px_rgba(6,182,212,0.6)]"
          >
            <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
          </motion.div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-400">Kryven</h1>
            <p className="text-[10px] text-cyan-400 font-bold tracking-[0.2em] uppercase shadow-cyan-500/50 drop-shadow-md">Command Center</p>
          </div>
        </div>
        
        <div className="flex bg-black/50 rounded-lg p-1 border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('live')}
            className={`px-6 py-2 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-slate-500 hover:text-cyan-300'}`}
          >
            Topology
          </button>
          <button 
            onClick={() => setActiveTab('incidents')}
            className={`px-6 py-2 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'incidents' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'text-slate-500 hover:text-fuchsia-300'} flex items-center`}
          >
            Incidents
            <AnimatePresence>
              {incidents.length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="ml-3 bg-fuchsia-600 text-white text-[10px] px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(217,70,239,0.8)]"
                >
                  {incidents.length}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button 
            onClick={() => setActiveTab('chaos')}
            className={`px-6 py-2 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'chaos' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'text-slate-500 hover:text-yellow-300'}`}
          >
            Chaos Lab
          </button>
          
          <button 
            onClick={() => setActiveTab('cooldown')}
            className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'cooldown' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-slate-500 hover:text-cyan-300'} flex items-center`}
          >
            <Shield className="w-4 h-4 mr-2" />
            Cooldown
          </button>
          
          <button 
            onClick={() => setActiveTab('what-if')}
            className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'what-if' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'text-slate-500 hover:text-fuchsia-300'} flex items-center`}
          >
            <Beaker className="w-4 h-4 mr-2" />
            What If
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-2 self-center"></div>
          
          <button 
            onClick={() => setShowComparison(true)}
            className="px-6 py-2 rounded-md text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-white flex items-center transition-all"
          >
            <SplitSquareHorizontal className="w-4 h-4 mr-2" />
            Compare
          </button>
        </div>
        
        <div className="flex items-center space-x-3 px-4 py-2 bg-black/80 border border-cyan-500/30 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-2.5 h-2.5 rounded-full ${incidents.length > 0 ? 'bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,1)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]'}`}
          />
          <span className={`font-mono text-xs font-bold tracking-widest ${incidents.length > 0 ? 'text-fuchsia-400' : 'text-cyan-400'}`}>
            {incidents.length > 0 ? 'CRITICAL EVENT' : 'SYS ONLINE'}
          </span>
        </div>
      </header>

      {/* Extreme KPI Strip */}
      <div className="grid grid-cols-5 gap-0 border-b border-white/5 bg-black/40">
        <KPIBox title="RAW NOISE" value={metrics.raw_alerts.toLocaleString()} color="text-slate-300" />
        <KPIBox title="COMPRESSION" value={`${(metrics.noise_reduction_ratio * 100).toFixed(1)}%`} color="text-cyan-400" glow="shadow-[inset_0_0_30px_rgba(6,182,212,0.15)]" />
        <KPIBox title="FINGERPRINTS" value={metrics.unique_fingerprints} color="text-yellow-400" />
        <KPIBox title="ACTIVE INCIDENTS" value={incidents.length} color={incidents.length > 0 ? 'text-fuchsia-500 drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]' : 'text-slate-600'} />
        <KPIBox title="ROOT CONFIDENCE" value={incidents[0]?.confidence ? `${incidents[0].confidence.toFixed(1)}%` : '--'} color="text-blue-400" />
      </div>

      <main className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex w-full h-full">
              <div className="flex-1 relative bg-[#020202] w-full h-full flex flex-col">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#050505] to-black z-0 pointer-events-none"></div>
                <div className="flex-1 relative">
                  {topology.nodes.length > 0 && <TopologyGraph data={topology} />}
                </div>
                
                {/* Timeline Sync Slider */}
                {incidents.length > 0 && (
                  <div className="h-24 border-t border-white/5 bg-black/80 backdrop-blur-xl p-4 flex flex-col justify-center relative z-10 mx-4 mb-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <div className="flex justify-between text-[10px] text-cyan-500 font-bold tracking-widest mb-2 uppercase">
                      <span>Live Event Feed</span>
                      <span>Timeline Sync Active</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        defaultValue="100"
                        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-not-allowed accent-cyan-500 opacity-50"
                        title="Timeline scrubbing disabled in live mode. Use Replay Engine for historical analysis."
                      />
                    </div>
                  </div>
                )}
              </div>
              {incidents.length > 0 && (
                <motion.div 
                  initial={{ x: 500, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="absolute right-0 top-0 bottom-0 w-[500px] border-l-2 border-fuchsia-500/30 bg-black/80 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(217,70,239,0.15)] z-20 flex flex-col"
                >
                  <IncidentView incident={incidents[0]} />
                </motion.div>
              )}
            </motion.div>
          )}
          
          {activeTab === 'chaos' && (
            <motion.div key="chaos" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="flex-1 p-8 bg-[#050505] overflow-auto">
              <ChaosLab />
            </motion.div>
          )}

          {activeTab === 'cooldown' && (
            <motion.div key="cooldown" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="flex-1 bg-[#050505] overflow-auto">
              <CooldownMatrix />
            </motion.div>
          )}

          {activeTab === 'what-if' && (
            <motion.div key="what-if" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="flex-1 bg-[#050505] overflow-auto">
              <WhatIfEngine />
            </motion.div>
          )}

          {activeTab === 'incidents' && (
            <motion.div key="incidents" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="flex-1 p-8 overflow-auto bg-[#050505]">
              {incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                   <motion.div animate={{ rotateZ: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="w-32 h-32 border-4 border-cyan-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                     <ShieldAlert className="w-12 h-12 text-cyan-500/50" />
                   </motion.div>
                   <h2 className="text-3xl font-black text-cyan-900 tracking-widest uppercase">System Secure</h2>
                </div>
              ) : (
                <div className="w-full space-y-8">
                  <h2 className="text-4xl font-black text-fuchsia-500 tracking-tighter drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">ACTIVE INCIDENTS</h2>
                  <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
                    {incidents.map((inc, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={inc.id} 
                        className="bg-black border border-fuchsia-500/50 rounded-none p-8 hover:border-fuchsia-400 transition-all shadow-[0_0_30px_rgba(217,70,239,0.15)] group relative overflow-hidden flex flex-col"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500 group-hover:w-2 transition-all"></div>
                        <div className="flex justify-between items-start mb-8 pl-4">
                          <div>
                            <div className="flex items-center space-x-4 mb-4">
                              <span className="px-3 py-1 bg-fuchsia-500 text-black text-xs font-black uppercase tracking-[0.3em]">{inc.severity}</span>
                              <span className="text-fuchsia-500/70 text-sm font-mono tracking-widest">{inc.id}</span>
                            </div>
                            <h3 className="text-3xl font-black text-white tracking-tight leading-none mb-2">{inc.title}</h3>
                            <p className="text-slate-500 text-sm font-mono mt-2">DETECTED: {new Date(inc.created_at).toLocaleTimeString()}</p>
                          </div>
                          <div className="text-right border border-cyan-500/30 p-4 bg-cyan-950/20 rounded-lg shrink-0 ml-4">
                            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.2em] mb-1">Compression Ratio</p>
                            <p className="text-4xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">{(inc.noise_reduction_ratio * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8 flex-1">
                          <div className="col-span-1 xl:h-[650px] min-h-[500px]">
                            <AlertStormAnalysis incident={inc} onReplay={() => setReplayIncident(inc)} />
                          </div>
                          <div className="col-span-1 xl:h-[650px] min-h-[500px]">
                            <EvidenceExplorer rootCause={inc.root_cause} />
                          </div>
                          <div className="col-span-1 xl:h-[650px] min-h-[500px] overflow-hidden bg-black/80 backdrop-blur-md border border-fuchsia-500/30">
                            <IncidentView incident={inc} compact={true} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {replayIncident && (
          <IncidentReplay 
            incident={replayIncident} 
            baseTopology={topology} 
            onClose={() => setReplayIncident(null)} 
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showComparison && (
          <KryvenComparison
            incident={incidents[0]}
            onClose={() => setShowComparison(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function KPIBox({ title, value, color, glow = '' }: { title: string, value: any, color: string, glow?: string }) {
  return (
    <div className={`p-6 border-r border-white/5 flex flex-col justify-center ${glow}`}>
      <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] mb-2">{title}</p>
      <p className={`text-4xl font-black tracking-tighter font-mono ${color}`}>{value}</p>
    </div>
  )
}
