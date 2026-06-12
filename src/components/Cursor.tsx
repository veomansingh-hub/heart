'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const POKEMON_ROSTER = [
  { id: 25, name: 'Pikachu', color: '#fde047' },
  { id: 4, name: 'Charmander', color: '#ea580c' },
  { id: 7, name: 'Squirtle', color: '#0ea5e9' },
  { id: 1, name: 'Bulbasaur', color: '#16a34a' },
  { id: 133, name: 'Eevee', color: '#d97706' },
  { id: 94, name: 'Gengar', color: '#9333ea' },
  { id: 151, name: 'Mew', color: '#ec4899' }
];

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);
  
  const [index, setIndex] = useState(0);
  const activePokemon = POKEMON_ROSTER[index];

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });

    const handleMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleWindowClick = () => {
      if (!particleContainerRef.current || !imageRef.current) return;
      
      const container = particleContainerRef.current;
      const currentImg = imageRef.current;
      const currentColor = activePokemon.color;

      // 1. Dispersion explosion particles
      const numParticles = 24;
      for (let i = 0; i < numParticles; i++) {
        const el = document.createElement('div');
        el.className = 'absolute w-1.5 h-1.5 rounded-full pointer-events-none will-change-transform';
        el.style.backgroundColor = currentColor;
        el.style.boxShadow = `0 0 5px ${currentColor}`;
        container.appendChild(el);

        const angle = (i / numParticles) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const radius = 25 + Math.random() * 45;
        
        gsap.fromTo(el,
          { x: 0, y: 0, scale: 1.2, opacity: 1 },
          {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            scale: 0.1,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => el.remove()
          }
        );
      }

      // Hide active Pokémon and switch
      gsap.to(currentImg, {
        opacity: 0,
        scale: 0.2,
        duration: 0.25,
        ease: 'power2.inOut',
        onComplete: () => {
          setIndex((prev) => {
            const nextIdx = (prev + 1) % POKEMON_ROSTER.length;
            const nextPokemon = POKEMON_ROSTER[nextIdx];

            // 2. Converging assembly particles
            for (let i = 0; i < 18; i++) {
              const el = document.createElement('div');
              el.className = 'absolute w-1.5 h-1.5 rounded-full pointer-events-none will-change-transform';
              el.style.backgroundColor = nextPokemon.color;
              el.style.boxShadow = `0 0 5px ${nextPokemon.color}`;
              container.appendChild(el);

              const angle = Math.random() * Math.PI * 2;
              const radius = 70 + Math.random() * 30;

              gsap.fromTo(el,
                {
                  x: Math.cos(angle) * radius,
                  y: Math.sin(angle) * radius,
                  scale: 0.2,
                  opacity: 0
                },
                {
                  x: 0,
                  y: 0,
                  scale: 1.0,
                  opacity: 0.8,
                  duration: 0.4,
                  ease: 'power2.in',
                  onComplete: () => el.remove()
                }
              );
            }

            // Reveal new Pokémon
            gsap.fromTo(currentImg,
              { opacity: 0, scale: 0.1 },
              {
                opacity: 1,
                scale: 1.0,
                duration: 0.5,
                ease: 'elastic.out(1.1, 0.45)',
                delay: 0.12
              }
            );

            return nextIdx;
          });
        }
      });
    };

    window.addEventListener('click', handleWindowClick);

    // Hover scale effects on interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.classList.contains('interactive')
      ) {
        gsap.to(cursor, { scale: 1.3, duration: 0.3, ease: 'power2.out' });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.classList.contains('interactive')
      ) {
        gsap.to(cursor, { scale: 1.0, duration: 0.3, ease: 'power2.out' });
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleWindowClick);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, [index, activePokemon]);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center will-change-transform select-none"
      style={{ transform: 'translate3d(-100px, -100px, 0)' }}
    >
      {/* Particle container for dispersion/convergence effects */}
      <div ref={particleContainerRef} className="absolute inset-0 flex items-center justify-center overflow-visible" />
      
      {/* Pokemon sprite - glow removed */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${activePokemon.id}.png`}
        alt={activePokemon.name}
        className="w-14 h-14 relative drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] pointer-events-none"
      />
    </div>
  );
}
