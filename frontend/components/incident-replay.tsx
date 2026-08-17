"use client"
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, FastForward, Rewind, X } from 'lucide-react'
import { TopologyGraph } from './topology-graph'

export function IncidentReplay({ incident, baseTopology, onClose }: { incident: any, baseTopology: any, onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [progress, setProgress] = useState(0) // 0 to 100
  const [currentStage, setCurrentStage] = useState(0)

  const stages = [
    { label: "SYSTEM HEALTHY", time: 0 },
    { label: "FIRST ANOMALY DETECTED", time: 20 },
    { label: "RESOURCE SATURATION", time: 40 },
    { label: "DATABASE FAILURE", time: 60 },
    { label: "DOWNSTREAM DEGRADATION", time: 80 },
    { label: "ALERT STORM COMPRESSED", time: 100 }
  ]

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isPlaying && progress < 100) {
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
  }, [isPlaying, progress, speed])

  useEffect(() => {
    // Determine stage based on progress
    let stageIndex = 0
    for (let i = stages.length - 1; i >= 0; i--) {
      if (progress >= stages[i].time) {
        stageIndex = i
        break
      }
    }
    setCurrentStage(stageIndex)
  }, [progress])

  // Derive topology state based on progress
  const deriveTopology = () => {
    const rcService = incident.root_cause?.service || 'postgresql'
    
    // Deep clone base topology
    const nodes = JSON.parse(JSON.stringify(baseTopology.nodes || []))
    const edges = JSON.parse(JSON.stringify(baseTopology.edges || []))
    
    // Reset to healthy
    nodes.forEach((n: any) => { n.health = 'healthy'; n.error_rate = 0; n.latency = 50 })
    edges.forEach((e: any) => { e.error_propagation = false })
    
    if (progress >= 20) {
      const rcNode = nodes.find((n: any) => n.id === rcService)
      if (rcNode) { rcNode.health = 'warning'; rcNode.latency = 250 }
    }
    
    if (progress >= 40) {
      const rcNode = nodes.find((n: any) => n.id === rcService)
      if (rcNode) { rcNode.health = 'critical'; rcNode.latency = 5000 }
    }
    
    if (progress >= 60) {
      const paymentNode = nodes.find((n: any) => n.id === 'payment-service')
      if (paymentNode) { paymentNode.health = 'critical'; paymentNode.error_rate = 60 }
      const rcEdge = edges.find((e: any) => e.target === rcService)
      if (rcEdge) rcEdge.error_propagation = true
    }
    
    if (progress >= 80) {
      const orderNode = nodes.find((n: any) => n.id === 'order-service')
      const gatewayNode = nodes.find((n: any) => n.id === 'api-gateway')
      if (orderNode) { orderNode.health = 'critical'; orderNode.error_rate = 40 }
      if (gatewayNode) { gatewayNode.health = 'warning'; gatewayNode.error_rate = 25 }
      edges.forEach((e: any) => {
        if (e.target === 'payment-service' || e.target === 'order-service') e.error_propagation = true
      })
    }
    
    return { nodes, edges }
  }

  const simulatedTopology = deriveTopology()

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
    >
      <div className="flex justify-between items-center p-6 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter flex items-center">
            <FastForward className="w-6 h-6 mr-3 text-cyan-400" />
            INCIDENT REPLAY
          </h2>
          <p className="text-cyan-500/70 text-xs font-mono tracking-widest mt-1">SIMULATING TIMELINE FOR: {incident.id}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>
      
      <div className="flex-1 relative">
        <TopologyGraph data={simulatedTopology} />
        
        {/* Stage Overlay */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase mb-2">Current Phase</span>
          <motion.div 
            key={currentStage}
            initial={{ scale: 0.8, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className={`px-6 py-3 border rounded-none font-black text-xl tracking-tight shadow-2xl backdrop-blur-md
              ${currentStage === 0 ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]' :
                currentStage < 3 ? 'bg-yellow-950/80 text-yellow-400 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)]' :
                'bg-fuchsia-950/80 text-fuchsia-400 border-fuchsia-500/50 shadow-[0_0_30px_rgba(217,70,239,0.3)]'
              }`}
          >
            {stages[currentStage].label}
          </motion.div>
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
          <button onClick={() => setSpeed(s => s === 1 ? 2 : 1)} className={`px-4 py-3 rounded-xl font-black transition-colors ${speed === 2 ? 'bg-fuchsia-500 text-black' : 'bg-white/5 text-white'}`}>
            2x
          </button>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-slate-500 font-bold tracking-widest mb-2">
            <span>T-00:00:00</span>
            <span>T-00:05:00</span>
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
