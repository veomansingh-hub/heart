'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

// ----------------------------------------------------
// SHADER SOURCE CODE FOR PROCEDURAL FEATHERS & GLITTER
// ----------------------------------------------------
const featherVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const featherFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform vec3 uColor;

  // Simple pseudo-random hash for noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    // 1. Center quill shaft (glowing cylinder)
    float distFromShaft = abs(vUv.x - 0.5);
    float shaft = smoothstep(0.015, 0.0, distFromShaft);
    float shaftHighlight = smoothstep(0.005, 0.0, abs(vUv.x - 0.495)) * 0.25;
    
    // Warm golden glow radiating from the central spine
    float shaftGlow = smoothstep(0.09, 0.0, distFromShaft) * 0.85;
    vec3 glowColor = vec3(1.0, 0.72, 0.35); // Warm gold

    // 2. Asymmetric feather profile
    float side = sign(vUv.x - 0.5);
    float maxHalfWidth = mix(0.38, 0.45, step(0.0, side));
    
    // Sin curve tapering at both ends
    float widthFactor = sin(vUv.y * 3.14159);
    float d = distFromShaft / (maxHalfWidth * widthFactor + 0.015);
    float featherMask = smoothstep(1.0, 0.74, d);

    // 3. Pennaceous barbs (structured curved angled lines)
    // Adding quadratic factor makes barbs curve gracefully outwards
    float barbAngle = 0.48 * side;
    float barbCurve = 0.16 * (distFromShaft * distFromShaft);
    float barbCoord = vUv.y - distFromShaft * barbAngle + barbCurve;
    float barbPattern = sin(barbCoord * 480.0) * 0.5 + 0.5;

    // 4. Downy plumulaceous fluff (fuzzy micro-noises at the base)
    float baseFluffFactor = smoothstep(0.36, 0.06, vUv.y);
    float noiseValue = hash(vUv * 750.0);
    float fluffPattern = step(0.38, noiseValue);

    // Blend structured barbs with fuzzy fluff at the base
    float barbAlpha = mix(mix(0.42, 0.92, barbPattern), fluffPattern, baseFluffFactor * 0.8);

    // 5. Realistic splits (gaps in the feather vane)
    float splitSines = sin(vUv.y * 24.0 + side * 5.0) * cos(vUv.y * 12.0 - side * 9.0);
    float splitThreshold = mix(-0.85, -0.72, smoothstep(0.5, 0.9, vUv.y));
    float splitMask = step(splitThreshold, splitSines);
    
    // Apply splits only in middle and upper sections
    float finalAlpha = featherMask * barbAlpha * mix(1.0, splitMask, smoothstep(0.28, 0.75, vUv.y));
    
    // Soften attachment tip
    finalAlpha *= smoothstep(0.0, 0.16, vUv.y);

    // 6. Barb fiber bump-mapping & Anisotropic-like shading
    vec3 normalModel = normalize(vNormal);
    vec3 barbTangent = normalize(vec3(-side * barbAngle, 1.0, 0.0));
    vec3 perturbedNormal = normalize(normalModel + barbTangent * barbPattern * 0.3);
    
    if (!gl_FrontFacing) {
      perturbedNormal = -perturbedNormal;
    }

    vec3 lightDir = normalize(vec3(0.4, 0.9, 0.35));
    float diffuse = max(dot(perturbedNormal, lightDir), 0.0);

    // Soft translucency/glow effect at the thin edges
    vec3 viewDir = normalize(vViewPosition);
    float rim = 1.0 - max(dot(perturbedNormal, viewDir), 0.0);
    float rimFactor = pow(rim, 2.5) * 0.35 * (1.0 - baseFluffFactor * 0.4);

    // Dynamic blending of the base color (pure soft white mixed with warm gold glow)
    vec3 baseColor = uColor; // Soft pastel rainbow color
    baseColor = mix(baseColor, glowColor, shaftGlow * 0.88); // Radial glow from center
    
    // Blend in the solid quill shaft center
    baseColor = mix(baseColor, vec3(0.98, 0.94, 0.88), shaft * 0.6);
    baseColor += vec3(0.12) * shaftHighlight;

    vec3 finalColor = baseColor * (0.78 + diffuse * 0.24) + vec3(1.0, 0.85, 0.6) * rimFactor;

    gl_FragColor = vec4(finalColor, finalAlpha * 0.96);
  }
`;

const glitterVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glitterFragmentShader = `
  varying vec2 vUv;
  uniform float uOpacity;

  void main() {
    // 4-point sparkle star geometry
    float dist = abs(vUv.x - 0.5) + abs(vUv.y - 0.5);
    float glow = smoothstep(0.5, 0.0, dist);
    
    // Core center round spark
    float core = smoothstep(0.12, 0.0, length(vUv - vec2(0.5)));
    
    vec3 sparkleColor = vec3(1.0, 0.76, 0.3); // Warm gold sparkle
    
    gl_FragColor = vec4(sparkleColor, (glow * 0.72 + core * 0.28) * uOpacity);
  }
`;

// ----------------------------------------------------
// DYNAMICS SIMULATION PHYSICS HELPER
// ----------------------------------------------------
const RAINBOW_PASTEL_COLORS = [
  new THREE.Color('#ffffff'), // Pure White
  new THREE.Color('#ffe5ec'), // Soft Pink
  new THREE.Color('#ffebd3'), // Soft Peach/Orange
  new THREE.Color('#fff9db'), // Soft Yellow
  new THREE.Color('#e8f8f5'), // Soft Mint/Teal
  new THREE.Color('#eef2ff'), // Soft Lavender Blue
  new THREE.Color('#fae8ff'), // Soft Lilac/Purple
  new THREE.Color('#fcfaff'), // Soft Off-White
];

interface FallingItemProps {
  index: number;
  geometry: THREE.BufferGeometry;
  colors: any[];
  tiltRef: React.MutableRefObject<{ x: number; y: number }>;
  isFlower?: boolean;
}

interface TrailNode {
  x: number;
  y: number;
  z: number;
  opacity: number;
  scale: number;
}

function PhysicsFallingElement({ index, geometry, colors, tiltRef, isFlower = false }: FallingItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const trailRef = useRef<TrailNode[]>([]);

  // Glitter plane geometry
  const glitterGeo = useMemo(() => new THREE.PlaneGeometry(0.045, 0.045), []);

  const [data] = useState(() => {
    return {
      baseX: (Math.random() - 0.5) * 2.2, // Stable horizontal center line
      y: Math.random() * 2.6 - 1.3,        // Evenly distribute feathers vertically on load
      z: (Math.random() - 0.5) * 0.6,
      scale: Math.random() * 0.2 + 0.85,   // Elegant sizing
      speed: Math.random() * 0.0006 + 0.0008, // Slow, peaceful fall speed
      swayFreq: Math.random() * 0.35 + 0.45,  // Very slow sway cycles (harmonic frequency)
      swayWidth: Math.random() * 0.16 + 0.12, // Physical sway width limit
      baseRotZ: (Math.random() - 0.5) * 0.3,  // Slight organic offset tilt
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  });

  useFrame((state) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const time = state.clock.getElapsedTime();

    const tiltX = tiltRef.current.x * 0.006;
    const tiltY = tiltRef.current.y * 0.003;

    // 1. Slow vertical progression
    data.y -= data.speed + tiltY;

    // 2. Absolute harmonic sway (eliminates framerate jitter and drift)
    const timeOffset = time * data.swayFreq + index * 2.5;
    const currentSway = Math.sin(timeOffset) * data.swayWidth;
    const posX = data.baseX + currentSway + tiltX * 8.0;

    // 3. Smooth bounds recycling (top to bottom)
    if (data.y < -1.3) {
      data.y = 1.3; // Recycle to top
      data.baseX = (Math.random() - 0.5) * 2.2;
      trailRef.current = []; // Clear trail coordinates
    } else if (data.y > 1.3) {
      data.y = -1.3;
      data.baseX = (Math.random() - 0.5) * 2.2;
      trailRef.current = [];
    }

    // 4. Ultra-smooth float angles matching sway velocity
    // Roll (Z) tilts smoothly into the direction of horizontal travel (cosine)
    mesh.rotation.z = data.baseRotZ + Math.cos(timeOffset) * 0.45;
    
    // Pitch (X) rocks gently forward to keep the glowing vane facing the screen
    mesh.rotation.x = 0.55 + Math.sin(timeOffset * 2.0) * 0.15;
    
    // Yaw (Y) twists slowly
    mesh.rotation.y = Math.sin(timeOffset * 0.5) * 0.25;

    mesh.position.set(posX, data.y, data.z);

    // 5. Update golden sparkle trail
    const currentPos = {
      x: posX - Math.sin(mesh.rotation.z) * 0.04 + (Math.random() - 0.5) * 0.015,
      y: data.y + (Math.random() - 0.5) * 0.012,
      z: data.z,
      opacity: 0.75 + 0.25 * Math.sin(time * 25.0 + index), // Sparkle flicker
      scale: Math.random() * 0.4 + 0.6 // Multi-sized sparks
    };
    
    trailRef.current.unshift(currentPos);
    if (trailRef.current.length > 8) {
      trailRef.current.pop();
    }
  });

  return (
    <group>
      {trailRef.current.map((node, i) => {
        const trailOpacity = node.opacity * (1.0 - (i / 8.0));
        if (trailOpacity <= 0.01) return null;
        return (
          <mesh 
            key={`trail-${i}`} 
            position={[node.x, node.y, node.z]} 
            geometry={glitterGeo}
            scale={node.scale * (1.0 - i * 0.08)}
          >
            <shaderMaterial
              vertexShader={glitterVertexShader}
              fragmentShader={glitterFragmentShader}
              uniforms={{ uOpacity: { value: trailOpacity } }}
              transparent
              depthWrite={false}
              depthTest={true}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}

      <mesh ref={meshRef} geometry={geometry} scale={data.scale}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={featherVertexShader}
          fragmentShader={featherFragmentShader}
          uniforms={{
            uColor: { value: data.color }
          }}
          transparent
          depthWrite={true}
          depthTest={true}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------
// COMBINED ORGANIC ELEMENTS (ONLY FEATHERS RENDERED)
// ----------------------------------------------------
interface CombinedProps {
  scrollProgress: number;
  tiltRef: React.MutableRefObject<{ x: number; y: number }>;
}

function CombinedOrganicElements({ scrollProgress, tiltRef }: CombinedProps) {
  const featherGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.14, 0.32, 12, 12);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const normY = (y + 0.16) / 0.32;
      const zCurve = 0.035 * Math.sin(normY * Math.PI) - (x * x * 2.2);
      pos.setZ(i, zCurve);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <>
      {Array.from({ length: 45 }).map((_, i) => (
        <PhysicsFallingElement
          key={`feather-${i}`}
          index={i}
          geometry={featherGeometry}
          colors={RAINBOW_PASTEL_COLORS}
          tiltRef={tiltRef}
          isFlower={false}
        />
      ))}
    </>
  );
}

// ----------------------------------------------------
// ROOT SCENE CANVAS CONTAINER
// ----------------------------------------------------
export default function SceneCanvas() {
  const tiltRef = useRef({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        
        <CombinedOrganicElements scrollProgress={scrollProgress} tiltRef={tiltRef} />
      </Canvas>
    </div>
  );
}
