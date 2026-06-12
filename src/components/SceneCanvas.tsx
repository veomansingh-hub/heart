'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

// ----------------------------------------------------
// DYNAMICS SIMULATION PHYSICS HELPER
// ----------------------------------------------------
const ROSE_COLORS = ['#9f1239', '#be123c', '#e11d48', '#881337'];
const FLOWER_COLORS = ['#be123c', '#9f1239', '#881337', '#e11d48'];

interface FallingItemProps {
  index: number;
  geometry: THREE.BufferGeometry;
  colors: string[];
  tiltRef: React.MutableRefObject<{ x: number; y: number }>;
  isFlower?: boolean;
}

function PhysicsFallingElement({ index, geometry, colors, tiltRef, isFlower = false }: FallingItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const [data] = useState(() => ({
    x: (Math.random() - 0.5) * 2.6,
    y: (Math.random() - 0.5) * 2.6,
    z: (Math.random() - 0.5) * 0.6,
    scale: Math.random() * 0.35 + (isFlower ? 0.85 : 0.8), // Broad physical scale
    speed: Math.random() * 0.0025 + 0.0035, // Normal natural falling speed (approx 3-5x faster than slow motion)
    swayFreq: Math.random() * 1.2 + 0.6,
    swayAmp: Math.random() * 0.002 + 0.001,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotSpeedX: (Math.random() - 0.5) * 0.025,
    rotSpeedY: (Math.random() - 0.5) * 0.025,
    rotSpeedZ: (Math.random() - 0.5) * 0.025,
  }));

  useFrame((state) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const time = state.clock.getElapsedTime();

    // Tilt gravity forces
    const tiltX = tiltRef.current.x * 0.006;
    const tiltY = tiltRef.current.y * 0.004;

    // Movement updates (normal falling speed)
    data.y -= data.speed + tiltY;
    data.x += Math.sin(time * data.swayFreq + index) * data.swayAmp + tiltX;

    // Boundary wrap
    if (data.y < -1.3) {
      data.y = 1.3;
      data.x = (Math.random() - 0.5) * 2.6;
    } else if (data.y > 1.3) {
      data.y = -1.3;
      data.x = (Math.random() - 0.5) * 2.6;
    }

    // Organic tumbling rotations
    mesh.rotation.x += data.rotSpeedX;
    mesh.rotation.y += data.rotSpeedY;
    mesh.rotation.z += data.rotSpeedZ;

    mesh.position.set(data.x, data.y, data.z);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} scale={data.scale}>
      <meshPhysicalMaterial
        color={data.color}
        roughness={isFlower ? 0.72 : 0.78}
        metalness={0.0}
        transmission={0.15}
        thickness={0.3}
        clearcoat={0.08}
        transparent
        opacity={0.95}
        side={THREE.DoubleSide}
        depthWrite={true}
        depthTest={true}
      />
    </mesh>
  );
}

// ----------------------------------------------------
// COMBINED ORGANIC ELEMENTS (PETALS & FLOWERS)
// ----------------------------------------------------
function CombinedOrganicElements({ tiltRef }: { tiltRef: React.MutableRefObject<{ x: number; y: number }> }) {
  
  // 1. Realistic Teardrop / Fan-shaped Rose Petal Geometry
  const petalGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.12, 0.16, 10, 10);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      const y = pos.getY(i);
      const normY = (y + 0.08) / 0.16;
      const shapeFactor = Math.sin(normY * Math.PI * 0.78 + 0.05);
      x *= shapeFactor;
      pos.setX(i, x);

      const z = - (x * x * 6.5) - (y * y * 2.0) + (y * 0.035);
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 2. Realistic Rose Flower Blossom Geometry
  // Wraps a flat plane into a cylindrical flared rosebud shape
  const flowerGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.15, 0.16, 12, 12);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      
      const normY = (y + 0.08) / 0.16;
      
      // Wrap X coordinates into a 3D cylindrical rosebud cone
      const angle = (x / 0.075) * Math.PI * 0.95;
      const radius = 0.03 + normY * 0.04; // flares outward at the top
      
      const newX = Math.sin(angle) * radius;
      const newZ = (Math.cos(angle) - 1.0) * radius + (y * y * 1.8);
      
      pos.setX(i, newX);
      pos.setZ(i, newZ);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <>
      {/* 15 Realistic Shape Rose Petals (Reduced count to avoid crowding) */}
      {Array.from({ length: 15 }).map((_, i) => (
        <PhysicsFallingElement
          key={`petal-${i}`}
          index={i}
          geometry={petalGeometry}
          colors={ROSE_COLORS}
          tiltRef={tiltRef}
          isFlower={false}
        />
      ))}

      {/* 15 Realistic Rose Flower Blossoms (Replacing leaves) */}
      {Array.from({ length: 15 }).map((_, i) => (
        <PhysicsFallingElement
          key={`flower-${i}`}
          index={i}
          geometry={flowerGeometry}
          colors={FLOWER_COLORS}
          tiltRef={tiltRef}
          isFlower={true}
        />
      ))}
    </>
  );
}

// ----------------------------------------------------
// ROOT SCENE CANVAS CONTAINER (TRANSPARENT GRAPHICS LAYER)
// ----------------------------------------------------
export default function SceneCanvas() {
  const tiltRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const rawX = e.gamma ? e.gamma / 90 : 0;
      const rawY = e.beta ? (e.beta - 45) / 90 : 0;
      tiltRef.current.x = THREE.MathUtils.clamp(rawX, -1, 1);
      tiltRef.current.y = THREE.MathUtils.clamp(rawY, -1, 1);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen -z-30 pointer-events-none bg-transparent">
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <OrthographicCamera
          makeDefault
          left={-1}
          right={1}
          top={1}
          bottom={-1}
          near={-2}
          far={2}
        />
        <ambientLight intensity={1.4} />
        <directionalLight position={[2, 3, 1]} intensity={1.8} />
        
        <color attach="background" args={['#fafbfc']} />
        
        {/* Curved Organic Rose Petals & Rose Flower Blossoms falling with physics */}
        <CombinedOrganicElements tiltRef={tiltRef} />
      </Canvas>
    </div>
  );
}
