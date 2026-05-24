import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

interface GlowButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-brand-purple/80 hover:bg-brand-purple text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] border border-brand-purple/50",
      secondary: "glass-panel hover:bg-glass-hover text-gray-200",
      ghost: "hover:bg-white/10 text-gray-300 hover:text-white",
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-xl",
      md: "px-5 py-2.5 rounded-2xl",
      lg: "px-8 py-4 text-lg rounded-3xl",
      icon: "p-3 rounded-2xl aspect-square flex items-center justify-center",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative transition-all duration-300 font-medium whitespace-nowrap overflow-hidden group",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        {variant === 'primary' && (
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-brand-indigo/0 via-white/20 to-brand-purple/0 opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
        )}
      </motion.button>
    );
  }
);
GlowButton.displayName = "GlowButton";
