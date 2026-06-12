'use client';

import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

export default function EcgBackground() {
  const [bpm, setBpm] = useState(72);
  const ecgPathRef = useRef<SVGPathElement>(null);

  // Live heart rate fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(() => Math.floor(Math.random() * 6) + 68);
    }, 1250);

    return () => clearInterval(interval);
  }, []);

  // EKG Trace sweep
  useEffect(() => {
    const ecgPath = ecgPathRef.current;
    if (ecgPath) {
      gsap.fromTo(ecgPath,
        { strokeDashoffset: 1200 },
        {
          strokeDashoffset: 0,
          duration: 1.8,
          repeat: -1,
          ease: 'none'
        }
      );
    }
  }, []);

  const pathD = "M 0 100 L 400 100 L 420 100 L 430 90 Q 436 84 442 100 T 450 100 L 462 160 L 480 20 L 498 130 L 510 100 L 525 100 Q 535 110 542 100 T 550 100 L 1200 100";

  return (
    <div className="fixed inset-0 w-screen h-screen -z-10 pointer-events-none select-none overflow-hidden bg-transparent">
      
      {/* High-visibility clinical red grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.045)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* SVG Container for EKG trace (centered behind the heart) */}
      <svg 
        className="absolute w-full h-48 top-1/2 -translate-y-[62%] left-0 overflow-visible" 
        viewBox="0 0 1200 200" 
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="intenseRedGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="3" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Static dim trace guide */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(239, 68, 68, 0.12)"
          strokeWidth="2.5"
        />

        {/* 2. Super glowing bold red active trace line */}
        <path
          ref={ecgPathRef}
          d={pathD}
          fill="none"
          stroke="#ef4444"
          strokeWidth="3.5"
          strokeDasharray="1200"
          strokeDashoffset="1200"
          filter="url(#intenseRedGlow)"
        />

        {/* 3. Glowing star/point running along the path */}
        <circle r="7.5" fill="#ffffff" filter="url(#intenseRedGlow)">
          <animateMotion
            dur="1.8s"
            repeatCount="indefinite"
            path={pathD}
            rotate="auto"
          />
        </circle>
      </svg>

      {/* 4. Highly visible watermark digital telemetry readout - Sized Responsively for Mobile */}
      <div className="absolute right-6 sm:right-12 top-1/4 -translate-y-1/2 flex flex-col items-end opacity-[0.15] font-mono text-rose-600 pointer-events-none text-right">
        <div className="flex items-baseline gap-1.5">
          <span className="text-6xl sm:text-9xl font-black tracking-tighter drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">{bpm}</span>
          <span className="text-xl sm:text-2xl font-bold">BPM</span>
        </div>
        <div className="text-xs sm:text-sm font-bold tracking-widest mt-1 sm:mt-2">MANSINGH ♡ FALAK</div>
        <div className="text-[9px] sm:text-xs space-y-0.5 mt-0.5 sm:mt-1">
          <div>UDAIPUR: FOREVER</div>
          <div>EST: JEEVANSATHI</div>
          <div>STATUS: COMPATIBLE</div>
        </div>
      </div>
    </div>
  );
}
