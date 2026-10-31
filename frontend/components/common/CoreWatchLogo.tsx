'use client';

import React from 'react';

interface CoreWatchLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  animated?: boolean;
}

export default function CoreWatchLogo({
  className = "h-10 w-auto",
  showText = false,
  textClassName = "text-xl font-black tracking-tight text-white",
  animated = true,
}: CoreWatchLogoProps) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none group">
      {/* 
        Container wraps an in-flow spacer image so it ALWAYS 
        has the EXACT natural width/height and aspect ratio of the logo 
        in any flexbox or button parent across all browsers!
      */}
      <div className="relative inline-block shrink-0">
        {/* In-flow spacer image to guarantee 100% correct responsive dimensions */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className={`${className} opacity-0 pointer-events-none block select-none`}
        />

        {/* Layer 0: Dark Cyber Eye Socket backing (when eye closes) */}
        <div 
          className="absolute inset-[24%_7%_24%_7%] rounded-[50%] bg-[#060914] shadow-[inset_0_0_12px_rgba(0,0,0,0.95)] opacity-95 pointer-events-none overflow-hidden" 
        >
          {/* Eyelid Seam Glow */}
          {animated && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="w-[90%] h-[1.5px] animate-corewatch-seam-glow"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.8) 30%, rgba(255, 255, 255, 1) 50%, rgba(56, 189, 248, 0.8) 70%, transparent 100%)',
                  boxShadow: '0 0 8px rgba(56, 189, 248, 0.95)',
                }}
              />
            </div>
          )}
        </div>

        {/* Layer 1: The Eye (Pupil, Camera Lens, Sclera) */}
        <div 
          className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${
            animated ? 'animate-corewatch-eyeball' : ''
          }`}
          style={{ transformOrigin: '52% 50.5%' }}
        >
          <img
            src="/logo-eye.png"
            alt="CoreWatch Eye"
            className="w-full h-full object-contain"
            draggable={false}
          />

          {/* Optical Camera Glare Scan */}
          {animated && (
            <div 
              className="absolute inset-0 pointer-events-none animate-corewatch-lens-scan overflow-hidden"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0) 35%, rgba(186, 230, 253, 0.5) 50%, rgba(56, 189, 248, 0) 65%, transparent 100%)',
                maskImage: 'radial-gradient(ellipse 26% 38% at 52% 50.5%, black 40%, transparent 80%)',
                WebkitMaskImage: 'radial-gradient(ellipse 26% 38% at 52% 50.5%, black 40%, transparent 80%)',
              }}
            />
          )}
        </div>

        {/* Layer 2: Real Physical Eyelids that sweep over the eye socket */}
        {animated && (
          <div className="absolute inset-[24%_7%_24%_7%] rounded-[50%] overflow-hidden pointer-events-none">
            {/* Upper Eyelid */}
            <div 
              className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#060a17] via-[#091124] to-[#0f1b36] border-b border-cyan-400/50 shadow-md animate-corewatch-upper-eyelid"
              style={{ transformOrigin: 'top center' }}
            />
            {/* Lower Eyelid */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#060a17] via-[#091124] to-[#0f1b36] border-t border-cyan-400/50 shadow-md animate-corewatch-lower-eyelid"
              style={{ transformOrigin: 'bottom center' }}
            />
          </div>
        )}

        {/* Layer 3: Static Outer Blue Frame on top (never moves!) */}
        <img
          src="/logo-frame.png"
          alt="CoreWatch Frame"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)] transition-transform duration-200 group-hover:scale-105"
          draggable={false}
        />
      </div>

      {/* Brand Text */}
      {showText && (
        <span className={textClassName}>
          CoreWatch
        </span>
      )}
    </div>
  );
}
