'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | undefined;
    YT: any;
  }
}

export default function HeartbeatWidget() {
  const heartRef = useRef<HTMLDivElement>(null);
  const diskRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  
  const [isPlayingSong, setIsPlayingSong] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio API Heartbeat Synthesizer (Lub-Dub sound)
  const synthHeartbeat = () => {
    // iPhone & Android haptic feedback synchronization (double-pulse "Lub-Dub")
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([160, 60, 120]);
    }
    if (!audioEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Volume adjustments: 200% (1.4 gain) by default, lightens to 30% (0.22 gain) when music is playing
      const baseGain = isPlayingSong ? 0.22 : 1.4;

      // "Lub" Beat
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(58, now);
      osc1.frequency.exponentialRampToValueAtTime(10, now + 0.16);
      gain1.gain.setValueAtTime(baseGain, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.17);

      // "Dub" Beat (slightly softer and higher pitched)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      const dubTime = now + 0.16;
      osc2.frequency.setValueAtTime(53, dubTime);
      osc2.frequency.exponentialRampToValueAtTime(10, dubTime + 0.12);
      gain2.gain.setValueAtTime(baseGain * 0.75, dubTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, dubTime + 0.12);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(dubTime);
      osc2.stop(dubTime + 0.13);
    } catch (e) {
      // Autoplay block catch
    }
  };

  // Load YouTube Player API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    if (window.YT && window.YT.Player) {
      initializePlayer();
    }

    function initializePlayer() {
      playerRef.current = new window.YT.Player('yt-player-container', {
        height: '1',
        width: '1',
        videoId: 'Ar48yzjn1PE',
        playerVars: {
          start: 54,
          enablejsapi: 1,
          controls: 0,
          autoplay: 0,
          mute: 0,
        },
        events: {
          onReady: () => {
            setYtReady(true);
            playerRef.current.setVolume(35);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlayingSong(true);
            } else {
              setIsPlayingSong(false);
            }
          }
        }
      });
    }

    return () => {
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  // Continuous Heartbeat Squeeze Loop
  useEffect(() => {
    const handleDocClick = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };
    document.addEventListener('click', handleDocClick);

    const heart = heartRef.current;
    if (!heart) return;

    const heartTimeline = gsap.timeline({
      repeat: -1,
      repeatDelay: 0.85,
      onStart: synthHeartbeat,
      onRepeat: synthHeartbeat
    });

    heartTimeline
      .to(heart, { scaleX: 0.92, scaleY: 1.14, skewY: 2.5, filter: 'drop-shadow(0 0 35px rgba(239, 68, 68, 0.95))', duration: 0.12, ease: 'power3.out' })
      .to(heart, { scaleX: 1.06, scaleY: 0.95, skewY: -1.5, filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.5))', duration: 0.08, ease: 'power2.in' })
      .to(heart, { scaleX: 0.96, scaleY: 1.09, skewY: 1.2, filter: 'drop-shadow(0 0 25px rgba(239, 68, 68, 0.85))', duration: 0.08, ease: 'power2.out', delay: 0.04 })
      .to(heart, { scaleX: 1.0, scaleY: 1.0, skewY: 0, filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.4))', duration: 0.18, ease: 'power2.inOut' });

    return () => {
      heartTimeline.kill();
      document.removeEventListener('click', handleDocClick);
    };
  }, [audioEnabled, isPlayingSong]);

  // ScrollTrigger integration for autoplay/pause
  useEffect(() => {
    if (!ytReady || !playerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: '.letter-section',
      start: 'top 65%',
      end: 'bottom 25%',
      onEnter: () => {
        playerRef.current.playVideo();
        playerRef.current.setVolume(35);
        setIsPlayingSong(true);
      },
      onLeave: () => {
        playerRef.current.pauseVideo();
        setIsPlayingSong(false);
      },
      onEnterBack: () => {
        playerRef.current.playVideo();
        playerRef.current.setVolume(35);
        setIsPlayingSong(true);
      },
      onLeaveBack: () => {
        playerRef.current.pauseVideo();
        setIsPlayingSong(false);
      }
    });

    return () => {
      trigger.kill();
    };
  }, [ytReady]);

  // Disk Rotation Animation
  useEffect(() => {
    const disk = diskRef.current;
    if (!disk) return;

    let rotTween: gsap.core.Tween | null = null;
    if (isPlayingSong) {
      rotTween = gsap.to(disk, {
        rotation: 360,
        duration: 2.2,
        repeat: -1,
        ease: 'none'
      });
    } else {
      gsap.killTweensOf(disk);
    }

    return () => {
      if (rotTween) rotTween.kill();
    };
  }, [isPlayingSong]);

  const toggleManualPlayback = () => {
    if (!ytReady || !playerRef.current) return;
    
    if (audioCtxRef.current) {
      audioCtxRef.current.resume();
    }

    if (isPlayingSong) {
      playerRef.current.pauseVideo();
      setIsPlayingSong(false);
    } else {
      playerRef.current.playVideo();
      playerRef.current.setVolume(35);
      setIsPlayingSong(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-6 relative select-none w-full max-w-xs sm:max-w-md mx-auto">
      
      <div id="yt-player-container" className="absolute opacity-0 pointer-events-none w-1 h-1" />

      {/* Beating Ultra-Realistic Anatomical Heart Graphic (Sized responsively for mobile) */}
      <div className="relative flex flex-col items-center justify-center w-full">
        <div
          ref={heartRef}
          onClick={toggleManualPlayback}
          className="interactive cursor-pointer w-60 h-60 sm:w-72 sm:h-72 relative flex items-center justify-center will-change-transform filter"
          style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.4))' }}
        >
          <svg
            className="w-full h-full text-red-600 fill-current"
            viewBox="0 0 512 512"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="rightVentricleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>
              <linearGradient id="leftVentricleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
              <linearGradient id="aortaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>
              <linearGradient id="pulmonaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
              <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <path d="M170 110v50c-25 0-35-15-35-45V85c0-15 15-20 25-10 12 12 10 35 10 35z" fill="url(#pulmonaryGrad)" stroke="#1d4ed8" strokeWidth="2" />
            <path d="M260 50c-15-20-45-20-60 0-10 15-5 45 5 60h45c10-15 20-45 10-60zM310 70c-10-15-35-15-45 0-8 12-2 35 5 45h35c7-10 15-33 5-45z" fill="url(#aortaGrad)" stroke="#b91c1c" strokeWidth="2" />
            <path d="M230 110c-30 0-60-20-75 10s-10 70 30 80c35 10 45-20 45-90z" fill="url(#aortaGrad)" stroke="#991b1b" strokeWidth="2" />
            <path d="M295 110c25 0 50-15 65 10s5 60-25 70c-30 10-40-20-40-80z" fill="url(#pulmonaryGrad)" stroke="#1e40af" strokeWidth="2.5" />
            <path d="M140 210c-35 0-50 40-40 80 12 48 50 60 70 40 10-10 20-60-30-120z" fill="#991b1b" stroke="#7f1d1d" strokeWidth="2" />
            <path d="M372 210c35 0 50 40 40 80-12 48-50 60-70 40-10-10-20-60 30-120z" fill="#be123c" stroke="#881337" strokeWidth="2" />
            <path d="M256 160c-75 0-142 55-142 135 0 75 60 162 142 192V160z" fill="url(#rightVentricleGrad)" stroke="#7f1d1d" strokeWidth="3" />
            <path d="M256 160v327c82-30 142-117 142-192 0-80-67-135-142-135z" fill="url(#leftVentricleGrad)" stroke="#991b1b" strokeWidth="3" />
            
            <path
              d="M250 165c-10 40-40 90-80 120M256 220c15 35 30 75 45 110M256 310c-15 30-35 60-65 90M265 350c12 25 24 55 35 75"
              fill="none"
              stroke="#facc15"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.8"
              filter="url(#softGlow)"
            />
            <circle cx="256" cy="310" r="14" fill="#ffffff" filter="url(#softGlow)" className="animate-ping" />
          </svg>

          {/* Central dedication overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pt-10 sm:pt-12">
            <span className="font-mono text-[8px] sm:text-[9px] font-black text-white/95 uppercase tracking-widest bg-zinc-950/75 px-3 py-1 rounded-full border border-white/10 shadow-sm">
              M ♡ F
            </span>
          </div>
        </div>
      </div>

      {/* Manual Controller: Rotating Vinyl Record Disk Button */}
      <div className="flex flex-col items-center gap-4 w-full">
        
        {/* Rotating Vinyl Disk Button */}
        <div
          ref={diskRef}
          onClick={toggleManualPlayback}
          className="interactive cursor-pointer w-20 h-20 rounded-full bg-zinc-900 border-[3px] border-zinc-700/80 shadow-lg flex items-center justify-center relative select-none group hover:scale-105 active:scale-95 transition-all duration-300"
          style={{
            backgroundImage: `radial-gradient(circle, #27272a 15%, #09090b 16%, #09090b 35%, #18181b 36%, #18181b 50%, #27272a 51%, #09090b 70%)`
          }}
        >
          <div className="absolute inset-1 rounded-full border border-zinc-800/40 pointer-events-none" />
          <div className="absolute inset-3 rounded-full border border-zinc-800/20 pointer-events-none" />
          
          <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center border border-rose-500 shadow-[0_0_8px_#ef4444] z-10">
            {isPlayingSong ? (
              <div className="flex gap-0.5 items-center justify-center">
                <span className="w-1 h-3 bg-white rounded-full" />
                <span className="w-1 h-3 bg-white rounded-full" />
              </div>
            ) : (
              <svg className="w-3 h-3 fill-current text-white pl-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </div>

        <div className="text-center font-mono text-[9px] sm:text-[10px] tracking-wider text-zinc-500 space-y-1">
          <div className="font-bold text-zinc-700 uppercase">
            {isPlayingSong ? '💿 SONG SPINNING (35% VOL)' : '💿 SONG PAUSED'}
          </div>
          <div>Scroll down to read the letter and trigger autoplay.</div>
        </div>

        <button
          onClick={() => setAudioEnabled(prev => !prev)}
          className={`interactive px-4 py-1.5 rounded-full border text-[9px] sm:text-[10px] font-mono tracking-wider transition-all duration-300 ${
            audioEnabled
              ? 'bg-red-50/50 border-red-200 text-rose-500 hover:bg-red-100'
              : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:bg-zinc-100'
          }`}
        >
          {audioEnabled ? '🔊 HEARTBEAT: NON-STOP ACTIVE' : '🔇 HEARTBEAT: MUTED'}
        </button>
      </div>
    </div>
  );
}
