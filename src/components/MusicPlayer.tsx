'use client';

import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wavesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.45;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.log("Autoplay blocked by browser policy:", err);
      });
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (!wavesRef.current) return;
    const bars = wavesRef.current.children;

    if (isPlaying) {
      // Animate waveform
      gsap.to(bars, {
        scaleY: 'random(0.3, 1.8)',
        duration: 0.45,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        stagger: {
          each: 0.08,
          from: 'center'
        }
      });
    } else {
      // Reset waveform
      gsap.killTweensOf(bars);
      gsap.to(bars, {
        scaleY: 0.35,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }, [isPlaying]);

  return (
    <div className="fixed bottom-8 right-8 z-[999] pointer-events-auto select-none">
      <button
        onClick={togglePlayback}
        className="flex items-center gap-3 bg-white/75 hover:bg-white backdrop-blur-md px-4 py-2.5 rounded-full border border-zinc-200 shadow-sm transition-all duration-300 active:scale-95 text-zinc-800"
      >
        {/* Play/Pause icon indicator */}
        <div className="relative w-4 h-4 flex items-center justify-center">
          {isPlaying ? (
            <div className="flex gap-0.5">
              <span className="w-1 h-3.5 bg-zinc-800 rounded-full" />
              <span className="w-1 h-3.5 bg-zinc-800 rounded-full" />
            </div>
          ) : (
            <svg className="w-4 h-4 fill-current pl-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>

        <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
          {isPlaying ? 'PAUSE AMBIENCE' : 'PLAY AMBIENCE'}
        </span>

        {/* Waves Animation */}
        <div ref={wavesRef} className="flex gap-0.5 items-center h-4 w-6 overflow-hidden">
          <span className="w-0.5 h-4 bg-zinc-400 origin-bottom" style={{ transform: 'scaleY(0.35)' }} />
          <span className="w-0.5 h-4 bg-zinc-500 origin-bottom" style={{ transform: 'scaleY(0.35)' }} />
          <span className="w-0.5 h-4 bg-zinc-600 origin-bottom" style={{ transform: 'scaleY(0.35)' }} />
          <span className="w-0.5 h-4 bg-zinc-500 origin-bottom" style={{ transform: 'scaleY(0.35)' }} />
          <span className="w-0.5 h-4 bg-zinc-400 origin-bottom" style={{ transform: 'scaleY(0.35)' }} />
        </div>
      </button>
    </div>
  );
}
