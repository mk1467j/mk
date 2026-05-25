import React from 'react';
import { motion } from 'motion/react';
import { useSettings } from '@/context/SettingsContext';

export function AmbientBackground() {
  const { backgroundImage, bgOpacity, animationIntensity } = useSettings();

  // Scale motion durations based on animation settings
  const isAnimDisabled = animationIntensity === 'none';
  const multiplier = animationIntensity === 'slow' ? 1.7 : (animationIntensity === 'high' ? 0.6 : 1);

  const bubble1Anim = isAnimDisabled ? { scale: 1, opacity: 0.4, x: 0, y: 0 } : {
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.5, 0.3],
    x: [0, 50, 0],
    y: [0, -30, 0],
  };

  const bubble2Anim = isAnimDisabled ? { scale: 1, opacity: 0.3, x: 0, y: 0 } : {
    scale: [1, 1.3, 1],
    opacity: [0.2, 0.4, 0.2],
    x: [0, -40, 0],
    y: [0, 40, 0],
  };

  return (
    <div 
      className="fixed inset-0 z-[-2] overflow-hidden pointer-events-none transition-colors duration-1000"
      style={{ backgroundColor: 'var(--theme-bg, #040408)' }}
    >
      {/* Base Custom Wallpaper Background Layer */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 bg-no-repeat z-[0]"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            opacity: bgOpacity / 100,
          }}
        />
      )}

      {/* Dynamic Ambient Blur Lighting Bubbles */}
      <motion.div
        animate={bubble1Anim}
        transition={isAnimDisabled ? {} : {
          duration: 15 * multiplier,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
        className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[140px] z-[1] transition-colors duration-1000"
        style={{ backgroundColor: 'var(--theme-ambient-1, rgba(139, 92, 246, 0.18))' }}
      />
      <motion.div
        animate={bubble2Anim}
        transition={isAnimDisabled ? {} : {
          duration: 20 * multiplier,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
        className="absolute top-[35%] -right-[10%] w-[50vw] h-[50vw] rounded-full blur-[130px] z-[1] transition-colors duration-1000"
        style={{ backgroundColor: 'var(--theme-ambient-2, rgba(99, 102, 241, 0.14))' }}
      />

      {/* Ambient Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%] z-[2] mix-blend-multiply" />
    </div>
  );
}
