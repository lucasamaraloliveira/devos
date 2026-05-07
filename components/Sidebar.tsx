'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  Zap, 
  ShieldCheck, 
  Users, 
  Wallet,
  LogOut,
  Settings,
  ChevronUp,
  Rocket,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from './FirebaseProvider';
import { auth, signInWithGoogle } from '@/lib/firebase';

const menuItems = [
  { name: 'Dashboard Mission Control', hRef: '/', icon: LayoutDashboard },
  { name: 'Inventário de Software', hRef: '/inventory', icon: Database },
  { name: 'Engenharia de Valor', hRef: '/value-stream', icon: Zap },
  { name: 'Métricas DORA', hRef: '/dora', icon: Rocket },
  { name: 'Gestão de Incidentes', hRef: '/incidents', icon: Flame },
  { name: 'Governança & Riscos', hRef: '/governance', icon: ShieldCheck },
  { name: 'Gestão de Talentos', hRef: '/talents', icon: Users },
  { name: 'FinOps (Cloud)', hRef: '/finops', icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <aside className="w-64 bg-[#0A0A0B] border-r border-white/5 flex flex-col h-screen shrink-0 relative z-50">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-black rotate-45"></div>
          </div>
          <h1 className="text-white font-bold tracking-tight text-xl uppercase italic">
            Dev<span className="text-emerald-500">OS</span>
          </h1>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-2">Sist. Nervoso Central</p>
      </div>
      
      <div className="flex-1 py-6 overflow-y-auto">
        <nav className="px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.hRef;
            return (
              <Link 
                key={item.hRef} 
                href={item.hRef}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "text-slate-400 hover:text-white hover:bg-white/5 opacity-70 hover:opacity-100"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-white/5 relative">
        {!loading && user ? (
          <div className="relative">
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 w-full mb-2 bg-[#121214] border border-white/10 rounded-sm shadow-2xl overflow-hidden py-1"
                >
                  <Link 
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-colors uppercase font-bold tracking-widest"
                  >
                    <Settings className="w-3.5 h-3.5" /> Configurações
                  </Link>
                  <button 
                    onClick={() => {
                      auth.signOut();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[11px] text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-colors uppercase font-bold tracking-widest"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sair do DevOS
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center justify-between w-full p-2 rounded-sm hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    user.email?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-[11px] font-bold text-white truncate uppercase tracking-tight">{user.displayName || 'Usuário'}</span>
                  <span className="text-[9px] text-slate-500 font-mono truncate block">{user.email}</span>
                </div>
              </div>
              <ChevronUp className={cn("w-3.5 h-3.5 text-slate-600 transition-transform", showProfileMenu && "rotate-180")} />
            </button>
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            Entrar no DevOS
          </button>
        )}
        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-4 uppercase tracking-widest">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          Sistemas Ativos
        </div>
      </div>
    </aside>
  );
}
