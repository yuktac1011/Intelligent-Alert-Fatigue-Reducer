"use client"
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Beaker, Sliders, ArrowRight, Save, X } from 'lucide-react'

export function WhatIfEngine() {
  const [loading, setLoading] = useState(false)
  const [simulation, setSimulation] = useState<any>(null)
  
  const [poolSize, setPoolSize] = useState(100)
  const [timeoutMs, setTimeoutMs] = useState(5000)

  const runSimulation = async (scenario: string, params: any) => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/simulate/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, parameters: params })
      })
      const data = await res.json()
      setSimulation(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div className="bg-[#050505] p-8 border-l border-white/5 relative h-full flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter flex items-center uppercase">
            <Beaker className="w-6 h-6 mr-3 text-fuchsia-400" />
            Counterfactual Engine
          </h2>
          <p className="text-fuchsia-500/70 text-xs font-mono tracking-widest mt-1">DETERMINISTIC &quot;WHAT IF&quot; SIMULATIONS</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-8 pr-4">
        {/* Scenario 1: DB Pool */}
        <div className="bg-black border border-white/10 p-6 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-white tracking-widest uppercase text-sm">PostgreSQL Connection Pool</h3>
            <span className="px-2 py-1 bg-white/10 text-[9px] uppercase tracking-widest font-bold">Parameters</span>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                <span>Max Pool Size</span>
                <span className="text-cyan-400">{poolSize} connections</span>
              </div>
              <input 
                type="range" min="10" max="500" step="10" 
                value={poolSize} onChange={(e) => setPoolSize(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-fuchsia-500"
              />
            </div>
            
            <button 
              onClick={() => runSimulation('db-pool', { pool_size: poolSize })}
              disabled={loading}
              className="w-full py-3 bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/50 hover:bg-fuchsia-600/40 font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center"
            >
              <Sliders className="w-4 h-4 mr-2" />
              Simulate Impact
            </button>
          </div>
        </div>
        
        {/* Scenario 2: Circuit Breaker Timeout */}
        <div className="bg-black border border-white/10 p-6 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-white tracking-widest uppercase text-sm">API Gateway Timeout Tuning</h3>
            <span className="px-2 py-1 bg-white/10 text-[9px] uppercase tracking-widest font-bold">Parameters</span>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                <span>Request Timeout</span>
                <span className="text-cyan-400">{timeoutMs} ms</span>
              </div>
              <input 
                type="range" min="500" max="10000" step="500" 
                value={timeoutMs} onChange={(e) => setTimeoutMs(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-fuchsia-500"
              />
            </div>
            
            <button 
              onClick={() => runSimulation('timeout-tuning', { timeout_ms: timeoutMs })}
              disabled={loading}
              className="w-full py-3 bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/50 hover:bg-fuchsia-600/40 font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center"
            >
              <Sliders className="w-4 h-4 mr-2" />
              Simulate Impact
            </button>
          </div>
        </div>
      </div>
      
      {/* Simulation Results Overlay */}
      <AnimatePresence>
        {simulation && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 w-full h-[60%] bg-black/95 backdrop-blur-2xl border-t-2 border-fuchsia-500 shadow-[0_-20px_50px_rgba(217,70,239,0.2)] p-8 flex flex-col z-50"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="px-2 py-1 bg-fuchsia-500 text-black text-[10px] font-black uppercase tracking-[0.3em] mb-2 inline-block">Estimated Results</span>
                <h3 className="text-2xl font-black text-white tracking-tight">{simulation.scenario_id.replace('_', ' ').toUpperCase()}</h3>
              </div>
              <button onClick={() => setSimulation(null)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 flex-1">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Failed Requests (Est.)</p>
                <p className="text-3xl font-black text-fuchsia-400 font-mono drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]">
                  {simulation.estimated_failed_requests.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-2 line-through">vs 18,421 current</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Affected Users (Est.)</p>
                <p className="text-3xl font-black text-yellow-400 font-mono drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">
                  {simulation.estimated_affected_users_percent.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400 mt-2 line-through">vs 31.0% current</p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-fuchsia-950/30 border border-fuchsia-500/30 text-sm text-fuchsia-100 font-mono">
              <span className="text-fuchsia-500 font-bold mr-2">&gt;</span>
              {simulation.estimated_service_degradation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
