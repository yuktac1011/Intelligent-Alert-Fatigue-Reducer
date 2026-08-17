"use client"
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Network, Activity, AlertTriangle, UserX, Database, Search } from 'lucide-react'

export function IncidentGraphDeep({ incident }: { incident: any }) {
  const [selectedEdge, setSelectedEdge] = useState<any>(null)
  
  // A simplified force-directed or static layout for the prototype
  // In a real app, use React Flow or similar graph library
  
  if (!incident || !incident.graph_nodes || incident.graph_nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm uppercase tracking-widest bg-black/50">
        No causal graph available
      </div>
    )
  }

  const nodes = incident.graph_nodes
  const edges = incident.graph_edges

  const getNodeIcon = (type: string) => {
    switch(type) {
      case 'ROOT_CAUSE': return <Database className="w-5 h-5 text-blue-400" />
      case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'EVENT': return <Activity className="w-4 h-4 text-slate-400" />
      case 'USER_IMPACT': return <UserX className="w-5 h-5 text-yellow-500" />
      default: return <Network className="w-4 h-4 text-cyan-400" />
    }
  }

  const getNodeColor = (type: string) => {
    switch(type) {
      case 'ROOT_CAUSE': return 'bg-blue-950/50 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
      case 'ERROR': return 'bg-red-950/30 border-red-500/50'
      case 'EVENT': return 'bg-slate-900 border-slate-700'
      case 'USER_IMPACT': return 'bg-yellow-950/50 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
      default: return 'bg-cyan-950/30 border-cyan-500/50'
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center shrink-0 z-10 bg-black/60 backdrop-blur-md">
        <Network className="w-5 h-5 text-blue-500 mr-3" />
        <h3 className="text-sm font-black text-white tracking-widest uppercase">Causal Graph Inspector</h3>
      </div>
      
      <div className="flex-1 relative p-8 overflow-y-auto overflow-x-hidden">
        {/* Static list visualization representing the graph for the prototype */}
        <div className="space-y-6 max-w-2xl mx-auto relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
          
          {nodes.map((node: any, idx: number) => {
            // Find edges targeting this node
            const incomingEdges = edges.filter((e: any) => e.target_id === node.id)
            
            return (
              <div key={node.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-slate-800 bg-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                  {getNodeIcon(node.node_type)}
                </div>
                
                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border p-4 rounded-lg cursor-pointer transition-all ${getNodeColor(node.node_type)} hover:brightness-125`} onClick={() => setSelectedEdge(incomingEdges[0])}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {node.node_type.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {new Date(node.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1 leading-tight">{node.label}</h4>
                  <div className="text-xs text-slate-400 font-mono break-all">{node.id}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Edge Details Overlay */}
      <AnimatePresence>
        {selectedEdge && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-4 left-4 right-4 bg-black/95 backdrop-blur-md border border-blue-500/50 p-6 rounded-xl shadow-[0_10px_40px_rgba(59,130,246,0.3)] z-50 flex items-start justify-between"
          >
            <div className="flex-1">
              <h4 className="text-xs font-black text-blue-400 tracking-widest uppercase mb-4 flex items-center">
                <Search className="w-4 h-4 mr-2" />
                Edge Evidence Inspector
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Relationship</div>
                  <div className="text-white font-mono font-bold">{selectedEdge.relationship_type.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Confidence</div>
                  <div className="text-blue-400 font-mono font-black drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
                    {(selectedEdge.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Time Delta</div>
                  <div className="text-slate-300 font-mono">{selectedEdge.time_delta_ms} ms</div>
                </div>
                <div className="col-span-2 mt-2 pt-4 border-t border-white/10">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Inferred Evidence</div>
                  <div className="text-slate-200 text-sm leading-relaxed border-l-2 border-blue-500 pl-3 py-1">
                    {selectedEdge.evidence}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedEdge(null)} className="p-2 hover:bg-white/10 rounded-full shrink-0 ml-4">
              <UserX className="w-5 h-5 text-slate-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
