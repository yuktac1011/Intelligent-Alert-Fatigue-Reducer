"use client"

import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Line, Sphere, Trail } from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

function NetworkNodes() {
  const group = useRef<THREE.Group>(null)
  const particlesCount = 100
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3)
    for (let i = 0; i < particlesCount * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [])
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y += 0.001
      group.current.rotation.x += 0.0005
    }
  })

  return (
    <group ref={group}>
      <Stars radius={50} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {Array.from({ length: particlesCount }).map((_, i) => (
        <Sphere 
          key={i} 
          position={[positions[i*3], positions[i*3+1], positions[i*3+2]]} 
          args={[0.08, 16, 16]}
        >
          <meshBasicMaterial color={Math.random() > 0.8 ? "#f43f5e" : "#0ea5e9"} />
        </Sphere>
      ))}

      {/* Lines connecting some nodes to simulate network */}
      {Array.from({ length: 40 }).map((_, i) => {
        const p1 = new THREE.Vector3(positions[i*3], positions[i*3+1], positions[i*3+2])
        const p2 = new THREE.Vector3(positions[i*3+3], positions[i*3+4], positions[i*3+5])
        return (
          <Line
            key={`line-${i}`}
            points={[p1, p2]}
            color="#334155"
            lineWidth={1}
            transparent
            opacity={0.3}
          />
        )
      })}
    </group>
  )
}

function DataStream() {
  const points = useMemo(() => {
    const pts = []
    for(let i=0; i<10; i++) {
      pts.push(new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15))
    }
    return pts
  }, [])

  return (
    <Trail
      width={1.5}
      length={8}
      color={'#10b981'}
      attenuation={(t) => t * t}
    >
      <mesh>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
    </Trail>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  return (
    <div className="relative w-full h-screen bg-[#030712] overflow-hidden flex items-center justify-center font-sans">
      
      {/* 3D Background */}
      <div className="absolute inset-0 z-0 opacity-70">
        <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <NetworkNodes />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-blue-500 blur-[60px] opacity-20 rounded-full"></div>
            <div className="w-24 h-24 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center rotate-45 hover:rotate-90 transition-all duration-700 shadow-[0_0_50px_rgba(14,165,233,0.3)]">
              <div className="-rotate-45 font-bold text-4xl text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600">
                N
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl">
            Kryven
          </h1>
          
          <p className="text-xl md:text-3xl text-slate-300 font-light mb-8 max-w-2xl tracking-wide leading-relaxed">
            From alert noise to <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">causality.</span>
          </p>
          
          <div className="flex space-x-6 mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => setHovered(true)}
              onHoverEnd={() => setHovered(false)}
              onClick={() => router.push('/dashboard')}
              className="relative group overflow-hidden px-10 py-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_40px_rgba(14,165,233,0.2)] hover:shadow-[0_0_60px_rgba(14,165,233,0.4)] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center text-lg font-bold text-white tracking-widest uppercase">
                Initialize Command Center
                <svg className={`w-5 h-5 ml-3 transition-transform duration-300 ${hovered ? 'translate-x-2' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>
      
      {/* Cinematic Vignette */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-[#030712] opacity-80"></div>
    </div>
  )
}
