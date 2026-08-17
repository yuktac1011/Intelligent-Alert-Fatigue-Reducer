"use client"
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, FastForward, Rewind, X, AlertTriangle, ShieldCheck } from 'lucide-react'
import { TopologyGraph } from './topology-graph'

export function IncidentReplay({ incident, baseTopology, onClose }: { incident: any, baseTopology: any, onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [progress, setProgress] = useState(0) // 0 to 100
  const [events, setEvents] = useState<any[]>([])
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/incidents/${incident.id}/events`)
        const data = await res.json()
        setEvents(data)
      } catch (e) {
        console.error(e)
      }
    }
    fetchEvents()
  }, [incident.id])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isPlaying && progress < 100 && events.length > 0) {
      timer = setInterval(() => {
        setProgress(prev => {
          const next = prev + (0.5 * speed)
          if (next >= 100) {
            setIsPlaying(false)
            return 100
          }
          return next
        })
      }, 50)
    }
    return () => clearInterval(timer)
  }, [isPlaying, progress, speed, events.length])

  // Derive topology state based on progress and real events
  const simulatedTopology = useMemo(() => {
    // Deep clone base topology
    const nodes = JSON.parse(JSON.stringify(baseTopology.nodes || []))
    const edges = JSON.parse(JSON.stringify(baseTopology.edges || []))
    
    // Reset to healthy
    nodes.forEach((n: any) => { n.health = 'healthy'; n.error_rate = 0; n.latency = 50 })
    edges.forEach((e: any) => { e.error_propagation = false })
    
    if (events.length === 0) return { nodes, edges }
    
    // Determine how many events to apply based on progress %
    const eventCount = Math.floor((progress / 100) * events.length)
    const activeEvents = events.slice(0, eventCount)
    
    const serviceErrorCounts: Record<string, number> = {}
    
    activeEvents.forEach(evt => {
      if (evt.severity === 'error' || evt.severity === 'critical') {
        serviceErrorCounts[evt.service] = (serviceErrorCounts[evt.service] || 0) + 1
      }
      
      const node = nodes.find((n: any) => n.id === evt.service)
      if (node) {
        if (evt.severity === 'critical') node.health = 'critical'
        else if (evt.severity === 'error' && node.health !== 'critical') node.health = 'error'
        else if (evt.severity === 'warning' && node.health === 'healthy') node.health = 'warning'
        
        if (evt.latency_ms) node.latency = Math.max(node.latency, evt.latency_ms)
      }
    })
    
    // Compute edge propagation based on target service failures
    edges.forEach((e: any) => {
      if (serviceErrorCounts[e.target] > 5) {
        e.error_propagation = true
      }
    })
    
    return { nodes, edges }
  }, [baseTopology, progress, events])

  const latestEvent = useMemo(() => {
    if (events.length === 0) return null
    const idx = Math.min(Math.floor((progress / 100) * events.length), events.length - 1)
    return events[idx]
  }, [progress, events])

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
    >
      <div className="flex justify-between items-center p-6 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter flex items-center">
            <FastForward className="w-6 h-6 mr-3 text-cyan-400" />
            INCIDENT REPLAY ENGINE
          </h2>
          <p className="text-cyan-500/70 text-xs font-mono tracking-widest mt-1">SIMULATING {events.length} EVENTS FOR: {incident.id}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>
      
      <div className="flex-1 relative">
        <TopologyGraph data={simulatedTopology} />
        
        {/* Latest Event Overlay */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase mb-2">Live Replay Feed</span>
          <AnimatePresence mode="popLayout">
            {latestEvent && (
              <motion.div 
                key={latestEvent.id}
                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -10 }}
                className={`px-6 py-3 border rounded-none font-black text-sm tracking-tight shadow-2xl backdrop-blur-md max-w-xl text-center
                  ${latestEvent.severity === 'critical' ? 'bg-fuchsia-950/80 text-fuchsia-400 border-fuchsia-500/50 shadow-[0_0_30px_rgba(217,70,239,0.3)]' :
                    latestEvent.severity === 'error' ? 'bg-red-950/80 text-red-400 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' :
                    'bg-yellow-950/80 text-yellow-400 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)]'
                  }`}
              >
                [{latestEvent.service.toUpperCase()}] {latestEvent.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="h-32 border-t border-white/10 bg-[#050505] p-6 flex items-center space-x-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => { setProgress(0); setIsPlaying(true) }} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors">
            <Rewind className="w-5 h-5" />
          </button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-black transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button onClick={() => setSpeed(s => s === 1 ? 2 : s === 2 ? 4 : 1)} className={`px-4 py-3 rounded-xl font-black transition-colors ${speed > 1 ? 'bg-fuchsia-500 text-black' : 'bg-white/5 text-white'}`}>
            {speed}x
          </button>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-slate-500 font-bold tracking-widest mb-2">
            <span>START</span>
            <span>END ({events.length} EVENTS)</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress} 
            onChange={(e) => { setProgress(Number(e.target.value)); setIsPlaying(false) }}
            className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>
    </motion.div>
  )
}
