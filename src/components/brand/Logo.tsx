import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light' | 'primary';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function Logo({ className = '', variant = 'dark', size = 'md', showText = true }: LogoProps) {
  // Brand colors
  const colors = {
    dark: 'text-stone-900',
    light: 'text-white',
    primary: 'text-emerald-700', // Modern Ethiopian green vibe
  };

  const bgColors = {
    dark: 'bg-stone-900',
    light: 'bg-white',
    primary: 'bg-emerald-700',
  };

  const iconColors = {
    dark: 'text-white',
    light: 'text-emerald-700',
    primary: 'text-white',
  };

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-14 w-14',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative flex items-center justify-center rounded-xl shadow-sm ${sizeClasses[size]} overflow-hidden`}
      >
        <img src="/assets/logo.png" alt="Mercato AI Logo" className="w-full h-full object-cover" />
      </motion.div>

      {/* Wordmark */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-serif font-bold tracking-tight leading-none ${textSizeClasses[size]} ${colors[variant]}`}>
            BirrMind
          </span>
          {size !== 'sm' && (
            <span className={`text-[10px] tracking-widest font-medium uppercase mt-0.5 ${variant === 'light' ? 'text-stone-300' : 'text-stone-500'}`}>
              Powered by Mercato AI
            </span>
          )}
        </div>
      )}
    </div>
  );
}
