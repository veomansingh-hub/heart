'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function FalakLogo() {
  const [showHulk, setShowHulk] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Non-stop transformation loop between Falakraj text and walking Hulk character
    const interval = setInterval(() => {
      setShowHulk((prev) => !prev);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Smooth 3D flip card transition
    gsap.fromTo(containerRef.current,
      { rotateY: 90, opacity: 0, scale: 0.8 },
      { rotateY: 0, opacity: 1, scale: 1.0, duration: 0.6, ease: 'back.out(1.5)' }
    );
  }, [showHulk]);

  return (
    <div className="fixed top-8 left-8 z-[999] pointer-events-auto select-none" ref={containerRef}>
      {showHulk ? (
        // Walking Hulk Character (Neon Green Muscle Giant SVG with walking motion)
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.25)] transition-all duration-300">
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Animated SVG of a walking muscular giant (Hulk) */}
            <svg
              className="w-7 h-7 text-green-600 fill-current animate-[bounce_0.8s_infinite]"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Stylized muscular chest, neck, giant shoulders, and walking strides */}
              <path d="M12 2c.85 0 1.5.65 1.5 1.5S12.85 5 12 5s-1.5-.65-1.5-1.5S11.15 2 12 2zm6 5.5c-.85 0-1.5-.65-1.5-1.5S17.15 4.5 18 4.5 19.5 5.15 19.5 6 18.85 7.5 18 7.5zm-12 0C5.15 7.5 4.5 6.85 4.5 6S5.15 4.5 6 4.5 7.5 5.15 7.5 6 6.85 7.5 6 7.5zM12 7c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm7 1.5h-2c-.55 0-1 .45-1 1v2c0 .55-.45 1-1 1H9c-.55 0-1-.45-1-1v-2c0-.55-.45-1-1-1H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h1.5v5c0 .85.65 1.5 1.5 1.5s1.5-.65 1.5-1.5v-5h3v5c0 .85.65 1.5 1.5 1.5s1.5-.65 1.5-1.5v-5H19c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2z" />
            </svg>
            
            {/* Walking feet motion indicators */}
            <span className="absolute bottom-0 left-1 w-1.5 h-1 bg-green-500 rounded-full animate-ping" />
            <span className="absolute bottom-0 right-1 w-1.5 h-1 bg-green-500 rounded-full animate-ping [animation-delay:0.4s]" />
          </div>
          <span className="font-mono text-xs font-black tracking-widest text-green-700 uppercase">
            HULK MODE
          </span>
        </div>
      ) : (
        // Falakraj Text Logo
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-full border border-zinc-200/80 shadow-sm transition-all duration-300 hover:border-zinc-400">
          <span className="font-sans text-sm font-black tracking-widest text-zinc-900 uppercase">
            FALAKRAJ
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <span className="font-mono text-[10px] text-rose-500 font-bold tracking-wider border-l border-zinc-300 pl-2">
            FOREVER
          </span>
        </div>
      )}
    </div>
  );
}
