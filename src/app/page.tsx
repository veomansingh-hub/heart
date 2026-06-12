'use client';

import React from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import HeartbeatWidget from '@/components/HeartbeatWidget';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  useGSAP(() => {
    // Elegant reveals for letter sections
    gsap.fromTo('.letter-reveal',
      { y: 35, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.4,
        ease: 'power3.out',
        stagger: 0.2,
        scrollTrigger: {
          trigger: '.letter-section',
          start: 'top 75%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  return (
    <div className="w-full text-zinc-950 flex flex-col font-sans select-none bg-transparent">
      {/* Hero Intro with Beating Heart */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-8 py-20 bg-transparent text-center">
        <div className="max-w-4xl space-y-6 mt-12 flex flex-col items-center">
          <span className="text-rose-500 font-mono tracking-widest text-xs uppercase border-b border-rose-200 pb-2">
            M ♡ F • Udaipur
          </span>
          
          <h1 className="text-4xl sm:text-6xl font-light tracking-tight leading-tight text-zinc-900">
            A Beautiful <span className="font-semibold text-rose-500">Leap of Faith</span>.
          </h1>

          {/* Detailed Beating Heart Widget */}
          <div className="py-2">
            <HeartbeatWidget />
          </div>

          <p className="max-w-2xl text-base sm:text-lg text-zinc-500 font-light leading-relaxed">
            Every beat of this heart tells a story. A story that began with a single click and became a promise of a lifetime.
          </p>
        </div>
      </section>

      {/* The Love Letter Section */}
      <section className="letter-section min-h-screen flex flex-col justify-center px-8 sm:px-16 md:px-24 py-32 bg-transparent">
        <div className="max-w-3xl space-y-12 mx-auto">
          <h2 className="letter-reveal text-3xl sm:text-5xl font-light tracking-tight text-zinc-900 leading-tight">
            Thank you for taking <span className="text-rose-500 font-medium">the risk</span>.
          </h2>
          
          <div className="space-y-8 text-lg sm:text-xl text-zinc-700 font-light leading-relaxed">
            <p className="letter-reveal">
              Among the millions of voices in this world, I am so incredibly thankful that you chose to respond to me on <span className="font-medium text-rose-600">Jeevansathi</span>. It was the spark that set our journey in motion.
            </p>
            
            <p className="letter-reveal">
              When you took that leap of faith—the risk to travel, come, and meet me in the beautiful city of lakes, <span className="font-medium text-rose-600">Udaipur</span>—you gave our story its beginning.
            </p>
            
            <p className="letter-reveal text-2xl font-normal text-zinc-900 italic border-l-4 border-rose-400 pl-6 my-10">
              “I promise you, with everything I am, that this will be the best risk of your life.”
            </p>

            <p className="letter-reveal">
              Our rhythms are aligned, and our hearts beat as one. From that first meeting in Udaipur to forever, I am devoted to walking this path beside you.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 sm:px-16 md:px-24 py-16 border-t border-zinc-100 bg-transparent flex justify-between items-center text-zinc-400 font-mono text-xs font-semibold">
        <p>© 2026. Devoted Forever.</p>
        <span className="text-rose-500 font-bold tracking-widest animate-pulse">MANSINGH ♡ FALAKRAJ</span>
      </footer>
    </div>
  );
}
