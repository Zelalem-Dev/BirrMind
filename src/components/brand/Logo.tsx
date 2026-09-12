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
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
    xl: 'h-14 w-14 text-lg',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Abstract Logo Icon (BirrMind M/B monogram concept) */}
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative flex items-center justify-center rounded-xl shadow-sm ${sizeClasses[size]} ${bgColors[variant]}`}
      >
        <div className={`font-serif font-bold ${iconColors[variant]} z-10`}>B</div>
        {/* Decorative element */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl pointer-events-none" />
      </motion.div>

      {/* Wordmark */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-serif font-bold tracking-tight leading-none ${textSizeClasses[size]} ${colors[variant]}`}>
            BirrMind
          </span>
          {size !== 'sm' && (
            <span className={`text-[10px] tracking-widest font-medium uppercase mt-0.5 ${variant === 'light' ? 'text-stone-300' : 'text-stone-500'}`}>
              Powered by Mercato
            </span>
          )}
        </div>
      )}
    </div>
  );
}
