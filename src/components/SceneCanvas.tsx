'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

// ----------------------------------------------------
// DYNAMICS SIMULATION PHYSICS HELPER
// ----------------------------------------------------
const ROSE_COLORS = ['#9f1239', '#be123c', '#e11d48', '#881337'];
const LEAF_COLORS = ['#15803d', '#166534', '#14532d', '#1e3a1e'];

interface FallingItemProps {
  index: number;
  geometry: THREE.BufferGeometry;
  colors: string[];
  tiltRef: React.MutableRefObject<{ x: number; y: number }>;
  isLeaf?: boolean;
}

function PhysicsFallingElement({ index, geometry, colors, tiltRef, isLeaf = false }: FallingItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const [data] = useState(() => ({
    x: (Math.random() - 0.5) * 2.6,
    y: (Math.random() - 0.5) * 2.6,
    z: (Math.random() - 0.5) * 0.6,
    scale: Math.random() * 0.35 + (isLeaf ? 0.65 : 0.8),
    speed: Math.random() * 0.001 + 0.0006,
    swayFreq: Math.random() * 1.1 + 0.5,
    swayAmp: Math.random() * 0.0015 + 0.0005,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotSpeedX: (Math.random() - 0.5) * 0.015,
    rotSpeedY: (Math.random() - 0.5) * 0.015,
    rotSpeedZ: (Math.random() - 0.5) * 0.015,
  }));

  useFrame((state) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const time = state.clock.getElapsedTime();

    const tiltX = tiltRef.current.x * 0.004;
    const tiltY = tiltRef.current.y * 0.0025;

    data.y -= data.speed + tiltY;
    data.x += Math.sin(time * data.swayFreq + index) * data.swayAmp + tiltX;

    if (data.y < -1.3) {
      data.y = 1.3;
      data.x = (Math.random() - 0.5) * 2.6;
    } else if (data.y > 1.3) {
      data.y = -1.3;
      data.x = (Math.random() - 0.5) * 2.6;
    }

    mesh.rotation.x += data.rotSpeedX;
    mesh.rotation.y += data.rotSpeedY;
    mesh.rotation.z += data.rotSpeedZ;

    mesh.position.set(data.x, data.y, data.z);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} scale={data.scale}>
      <meshPhysicalMaterial
        color={data.color}
        roughness={isLeaf ? 0.65 : 0.78}
        metalness={0.0}
        transmission={0.12}
        thickness={0.25}
        clearcoat={isLeaf ? 0.2 : 0.05}
        transparent
        opacity={0.94}
        side={THREE.DoubleSide}
        depthWrite={true}
        depthTest={true}
      />
    </mesh>
  );
}

// ----------------------------------------------------
// COMBINED ORGANIC ELEMENTS (PETAL & LEAF GEOMETRIES)
// ----------------------------------------------------
function CombinedOrganicElements({ tiltRef }: { tiltRef: React.MutableRefObject<{ x: number; y: number }> }) {
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

  const leafGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.08, 0.14, 8, 8);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      const y = pos.getY(i);
      const factor = (0.07 - y) / 0.14;
      x *= Math.sin(factor * Math.PI * 0.5);
      pos.setX(i, x);

      const z = - (x * x * 8.5) - (y * y * 2.0) + (y * 0.03);
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <>
      {Array.from({ length: 25 }).map((_, i) => (
        <PhysicsFallingElement
          key={`petal-${i}`}
          index={i}
          geometry={petalGeometry}
          colors={ROSE_COLORS}
          tiltRef={tiltRef}
          isLeaf={false}
        />
      ))}

      {Array.from({ length: 25 }).map((_, i) => (
        <PhysicsFallingElement
          key={`leaf-${i}`}
          index={i}
          geometry={leafGeometry}
          colors={LEAF_COLORS}
          tiltRef={tiltRef}
          isLeaf={true}
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
    // Set to -z-30 and transparent background so it sits below the EKG line (-z-10)
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
        
        {/* Transparent canvas, background is handled by layout body and EKG grid */}
        <CombinedOrganicElements tiltRef={tiltRef} />
      </Canvas>
    </div>
  );
}
