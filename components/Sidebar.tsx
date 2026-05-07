'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  Zap, 
  ShieldCheck, 
  Users, 
  Wallet,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from './FirebaseProvider';
import { auth, signInWithGoogle } from '@/lib/firebase';

const menuItems = [
  { name: 'Dashboard Mission Control', hRef: '/', icon: LayoutDashboard },
  { name: 'Inventário de Software', hRef: '/inventory', icon: Database },
  { name: 'Engenharia de Valor', hRef: '/value-stream', icon: Zap },
  { name: 'Governança & Riscos', hRef: '/governance', icon: ShieldCheck },
  { name: 'Gestão de Talentos', hRef: '/talents', icon: Users },
  { name: 'FinOps (Cloud)', hRef: '/finops', icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

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

      <div className="p-6 border-t border-white/5">
        {!loading && user ? (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
              ) : (
                user.email?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-white truncate">{user.displayName || 'Usuário'}</span>
              <button 
                onClick={() => auth.signOut()}
                className="text-[10px] text-slate-500 hover:text-emerald-400 text-left transition-colors flex items-center gap-1"
              >
                Sair <LogOut className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            Entrar com Google
          </button>
        )}
        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-4 uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Sistemas Operacionais
        </div>
      </div>
    </aside>
  );
}
