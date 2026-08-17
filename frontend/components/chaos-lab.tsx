"use client"
import { useState } from 'react'
import { Flame, PlayCircle, Loader2 } from 'lucide-react'

export function ChaosLab() {
  const [loading, setLoading] = useState(false)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)

  const triggerScenario = async (id: string) => {
    setLoading(true)
    try {
      await fetch(`http://localhost:8000/api/chaos/${id}`, { method: 'POST' })
      setActiveScenario(id)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const scenarios = [
    {
      id: 'db-exhaustion',
      name: 'PostgreSQL Pool Exhaustion',
      desc: 'Simulates a connection pool saturation leading to timeouts, cascading upstream to Payment and Order services.',
      color: 'bg-rose-500'
    },
    {
      id: 'redis-failure',
      name: 'Redis Cache Eviction Storm',
      desc: 'Simulates cache misses causing latency spikes in the Auth service.',
      color: 'bg-orange-500'
    },
    {
      id: 'network-partition',
      name: 'Network Partition',
      desc: 'Simulates a network split between the main cluster and Kafka.',
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Flame className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Chaos Engineering Lab</h1>
        <p className="text-slate-400 text-lg">Inject deterministic failures into the system to observe the Incident Intelligence engine in action.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {scenarios.map(s => (
          <div key={s.id} className={`bg-slate-900/80 border ${activeScenario === s.id ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'border-slate-800'} p-6 rounded-2xl flex items-center justify-between group transition-all`}>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`w-3 h-3 rounded-full ${s.color}`}></span>
                <h3 className="text-xl font-bold text-white">{s.name}</h3>
              </div>
              <p className="text-slate-400 max-w-2xl">{s.desc}</p>
            </div>
            <button 
              onClick={() => triggerScenario(s.id)}
              disabled={loading || activeScenario !== null}
              className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all ${
                activeScenario === s.id 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' 
                : 'bg-slate-800 hover:bg-slate-700 text-white'
              } disabled:opacity-50`}
            >
              {loading && activeScenario !== s.id ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 
               activeScenario === s.id ? <Flame className="w-5 h-5 mr-2" /> : <PlayCircle className="w-5 h-5 mr-2" />}
              {activeScenario === s.id ? 'RUNNING' : 'TRIGGER SCENARIO'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
