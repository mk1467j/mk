import React, { useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { Sparkles, Bell, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export function ComingSoon({ title }: { title: string }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
      }, 3000);
    }
  };

  return (
    <div className="h-full flex items-center justify-center min-h-[65vh] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out py-8">
      <GlassCard className="max-w-xl w-full text-center p-8 md:p-12 space-y-8 relative overflow-hidden glow-purple border-white/10 bg-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/10 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-brand-indigo/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="w-16 h-16 mx-auto rounded-full bg-brand-purple/10 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.2)]">
          <Sparkles className="w-6 h-6 text-brand-purple" />
        </div>

        <div className="space-y-3">
          <span className="mono-label text-brand-indigo/80 text-xs">Module Status: Scheduled</span>
          <h2 className="text-3xl md:text-4xl serif-title tracking-tight text-white mb-2">{title}</h2>
          <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            We are designing this space to feel like a futuristic, cinematic productivity laboratory. Sign up below to unlock beta access during the next compile cycle.
          </p>
        </div>

        <div className="max-w-md mx-auto pt-2">
          {subscribed ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Scholar credentials registered. We will notify you!</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter scholar email..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 focus:bg-white/10 transition-all font-sans"
              />
              <GlowButton type="submit" size="sm" className="sm:py-3 px-6 rounded-2xl flex items-center justify-center gap-2">
                <Bell className="w-4 h-4" />
                Notify Me
              </GlowButton>
            </form>
          )}
        </div>

        <div className="pt-4 border-t border-white/5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-mono text-gray-500">
          <span>COGNITIVE RESONANCE LAB</span>
          <span>•</span>
          <span>STABILITY RATING: ALPHA 24</span>
        </div>
      </GlassCard>
    </div>
  );
}
