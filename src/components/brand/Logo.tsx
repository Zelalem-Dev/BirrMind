import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  imageClassName?: string;
  variant?: 'dark' | 'light' | 'primary';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'inline' | 'stacked';
  showText?: boolean;
}

export function Logo({
  className = '',
  imageClassName = '',
  variant = 'dark',
  size = 'md',
  layout = 'inline',
  showText = true,
}: LogoProps) {
  const textColors = {
    dark: 'text-stone-900',
    light: 'text-white',
    primary: 'text-stone-900',
  };

  // Dimensions scaled up smoothly to visually match the height of typography
  const iconHeights = {
    sm: 28, // Matches text-base (28px height)
    md: 36, // Matches text-xl (36px height)
    lg: 44, // Matches text-2xl (44px height)
    xl: 56, // Matches text-4xl (56px height)
  };

  const textSizeClasses = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold',
    xl: 'text-3xl sm:text-4xl font-bold',
  };

  const subtextSizeClasses = {
    sm: 'text-[10px] tracking-wider',
    md: 'text-xs tracking-wider',
    lg: 'text-sm tracking-widest',
    xl: 'text-base tracking-widest',
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-2.5',
    lg: 'gap-3',
    xl: 'gap-4',
  };

  const height = iconHeights[size];

  return (
    <div className={`inline-flex items-center ${gapClasses[size]} select-none shrink-0 ${className}`}>
      {/* Logo Icon — Preserves original 153:177 aspect ratio, never squished */}
      <motion.img
        src="/assets/logo-icon.png"
        alt="BirrMind Logo"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`object-contain shrink-0 ${imageClassName}`}
        style={{
          height: `${height}px`,
          width: 'auto',
          aspectRatio: '153 / 177',
        }}
        draggable={false}
      />

      {/* Brand Typography — Aligns side-by-side with icon */}
      {showText && (
        <div className={layout === 'inline' ? 'flex items-baseline gap-1.5 min-w-0' : 'flex flex-col justify-center min-w-0'}>
          <span className={`font-serif tracking-tight leading-none ${textSizeClasses[size]} ${textColors[variant]}`}>
            BirrMind
          </span>
          <span className={`font-sans font-bold uppercase text-amber-600 leading-none ${subtextSizeClasses[size]}`}>
            MERCATO AI
          </span>
        </div>
      )}
    </div>
  );
}

