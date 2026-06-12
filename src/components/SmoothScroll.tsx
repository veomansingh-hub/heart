'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';

const ScrollContext = createContext<Lenis | null>(null);

export function useScroll() {
  return useContext(ScrollContext);
}

interface SmoothScrollProps {
  children: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 1. Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // standard expo out curve
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    // 2. Hook up GSAP's ticker to coordinate raf loop centrally
    const updateScroll = (time: number) => {
      // gsap.ticker passes elapsed time in seconds, lenis expects milliseconds
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateScroll);

    // 3. Setup Lenis callbacks if needed (e.g. logging or syncing scroll properties)
    lenis.on('scroll', () => {
      // Trigger scroll-related updates if needed
    });

    // Cleanup on unmount
    return () => {
      gsap.ticker.remove(updateScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <ScrollContext.Provider value={lenisRef.current}>
      {children}
    </ScrollContext.Provider>
  );
}
