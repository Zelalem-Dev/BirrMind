import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light' | 'primary';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function Logo({ className = '', variant = 'dark', size = 'md', showText = true }: LogoProps) {
  const textColors = {
    dark: 'text-stone-900',
    light: 'text-white',
    primary: 'text-emerald-700',
  };

  const subtextColors = {
    dark: 'text-stone-500',
    light: 'text-stone-300',
    primary: 'text-emerald-500',
  };

  // Logo image dimensions per size
  const imgSizes = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 44, height: 44 },
    xl: { width: 60, height: 60 },
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  const subtextSizeClasses = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-2.5',
    lg: 'gap-3',
    xl: 'gap-4',
  };

  const { width, height } = imgSizes[size];

  return (
    <div className={`inline-flex flex-row items-center ${gapClasses[size]} select-none ${className}`}>
      {/* Logo Image */}
      <motion.img
        src="/assets/logo.png"
        alt="BirrMind Logo"
        width={width}
        height={height}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="rounded-lg object-contain flex-shrink-0"
        style={{ width, height }}
        draggable={false}
      />

      {/* App Name — side by side with logo */}
      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <span className={`font-serif font-bold tracking-tight leading-tight ${textSizeClasses[size]} ${textColors[variant]}`}>
            BirrMind
          </span>
          {size !== 'sm' && (
            <span className={`${subtextSizeClasses[size]} tracking-widest font-medium uppercase leading-tight ${subtextColors[variant]}`}>
              Mercato AI
            </span>
          )}
        </div>
      )}
    </div>
  );
}
