"use client"
import { useMemo } from 'react'
import ReactFlow, { Background, Controls, MarkerType, Handle, Position } from 'reactflow'
import 'reactflow/dist/style.css'
import { Server, Database, Cloud } from 'lucide-react'
import { motion } from 'framer-motion'

const ServiceNode = ({ data }: any) => {
  const isHealthy = data.health === 'healthy'
  const isWarning = data.health === 'warning'
  
  const bgColor = isHealthy ? 'bg-[#0a0a0a]' : isWarning ? 'bg-yellow-950/40' : 'bg-fuchsia-950/40'
  const borderColor = isHealthy ? 'border-cyan-500/30' : isWarning ? 'border-yellow-500' : 'border-fuchsia-500'
  const iconColor = isHealthy ? 'text-cyan-400' : isWarning ? 'text-yellow-400' : 'text-fuchsia-500'
  const shadow = isHealthy ? 'shadow-[0_0_15px_rgba(6,182,212,0.15)]' : isWarning ? 'shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'shadow-[0_0_30px_rgba(217,70,239,0.6)]'

  return (
    <div className={`px-5 py-4 rounded-none border-l-4 border-y border-r ${bgColor} ${borderColor} ${shadow} min-w-[200px] backdrop-blur-xl relative overflow-hidden group`}>
      {!isHealthy && (
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }} 
          transition={{ repeat: Infinity, duration: 1 }} 
          className={`absolute inset-0 ${isWarning ? 'bg-yellow-500' : 'bg-fuchsia-500'} pointer-events-none`}
        />
      )}
      
      <Handle type="target" position={Position.Top} className="!bg-cyan-500 w-3 h-3 !border-none !rounded-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-2 bg-black border border-white/10 ${iconColor}`}>
          {data.id.includes('database') || data.id.includes('postgres') || data.id.includes('redis') ? <Database size={20} /> :
           data.id.includes('gateway') ? <Cloud size={20} /> : <Server size={20} />}
        </div>
        <div className="font-black text-sm text-white font-mono tracking-widest uppercase ml-3 text-right">{data.id.replace('-service', '')}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-xs mt-4 pt-3 border-t border-white/10 font-mono relative z-10">
        <div>
          <div className="text-slate-500 tracking-widest uppercase text-[9px] mb-1">LATENCY</div>
          <div className={`font-bold text-lg ${data.latency > 100 ? 'text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]' : 'text-cyan-400'}`}>{data.latency.toFixed(0)}ms</div>
        </div>
        <div>
          <div className="text-slate-500 tracking-widest uppercase text-[9px] mb-1">ERRORS</div>
          <div className={`font-bold text-lg ${data.error_rate > 5 ? 'text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]' : 'text-cyan-400'}`}>{data.error_rate.toFixed(1)}%</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 w-3 h-3 !border-none !rounded-none" />
    </div>
  )
}

const nodeTypes = { serviceNode: ServiceNode }

const nodePositions: Record<string, {x: number, y: number}> = {
  'api-gateway': { x: 300, y: 50 },
  'auth-service': { x: 50, y: 250 },
  'order-service': { x: 300, y: 250 },
  'notification-service': { x: 550, y: 250 },
  'redis': { x: 50, y: 450 },
  'payment-service': { x: 300, y: 450 },
  'kafka': { x: 550, y: 450 },
  'postgresql': { x: 300, y: 650 },
  'worker-service': { x: 550, y: 650 },
}

export function TopologyGraph({ data }: { data: any }) {
  const nodes = useMemo(() => {
    if (!data || !data.nodes) return []
    return data.nodes.map((n: any) => ({
      id: n.id,
      type: 'serviceNode',
      position: nodePositions[n.id] || { x: Math.random() * 500, y: Math.random() * 500 },
      data: n
    }))
  }, [data])

  const edges = useMemo(() => {
    if (!data || !data.edges) return []
    return data.edges.map((e: any) => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      animated: true,
      style: { 
        stroke: e.error_propagation ? '#d946ef' : '#06b6d4', 
        strokeWidth: e.error_propagation ? 4 : 2,
        opacity: e.error_propagation ? 1 : 0.4
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: e.error_propagation ? '#d946ef' : '#06b6d4',
      },
    }))
  }, [data])

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background color="#164e63" gap={40} size={2} className="opacity-20" />
        <Controls className="!bg-black !border-cyan-900 !fill-cyan-500 rounded-none shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
        <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-md border border-white/10 p-4 z-10 font-mono text-xs shadow-lg">
          <div className="font-bold text-white mb-3 tracking-widest uppercase text-[10px]">Node Status</div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-3 bg-cyan-500/20 border border-cyan-500 rounded-sm"></div>
            <span className="text-cyan-400">Healthy</span>
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500 rounded-sm"></div>
            <span className="text-yellow-400">Warning (Latency/Anomalies)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-fuchsia-500/20 border border-fuchsia-500 rounded-sm"></div>
            <span className="text-fuchsia-400">Critical (Errors/Saturation)</span>
          </div>
        </div>
      </ReactFlow>
    </div>
  )
}
