'use client';

import React from 'react';
import { Wallet, DollarSign, Cloud, BarChart3, TrendingDown, ArrowUpRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const costBySystem = [
  { name: 'Core API', cost: 4200, color: '#10b981' },
  { name: 'Auth Svc', cost: 1800, color: '#06b6d4' },
  { name: 'Legacy Mono', cost: 6500, color: '#ef4444' },
  { name: 'Data Proc', cost: 1200, color: '#6366f1' },
];

const providerData = [
  { name: 'AWS', value: 72, color: '#f97316' },
  { name: 'Supabase', value: 28, color: '#10b981' },
];

export default function FinOpsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">FinOps (Cloud Economy)</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Governança Financeira de Infraestrutura</p>
        </div>
      </header>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#0C0C0E] to-[#080808] border border-white/5 p-8 rounded-sm">
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-2 font-bold">Burn Rate Mensal Atual (Acumulado)</div>
                <div className="text-6xl font-bold text-white tracking-tighter italic">$14,204 <span className="text-xl text-slate-600 font-mono">.32</span></div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded text-emerald-500 font-mono text-[10px] font-bold">
                 EFICIÊNCIA: A+
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Projetado (Fim do Mês)', value: '$18.2k', sub: 'On Target' },
                { label: 'Savings Oportunity', value: '$1.4k', sub: 'High' },
                { label: 'Unit Cost / Request', value: '$0.002', sub: 'Stable' },
                { label: 'Idle Resources', value: '14%', sub: 'Decreasing' },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-[9px] text-slate-600 uppercase font-mono tracking-tighter mb-1.5">{item.label}</div>
                  <div className="text-lg font-bold text-white tracking-tight">{item.value}</div>
                  <div className="text-[9px] text-slate-700 font-mono italic uppercase">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 w-full text-center">Share por Provider</h3>
            <div className="h-40 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={providerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {providerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Cloud className="w-5 h-5 text-slate-800 mb-1" />
                <span className="text-[10px] text-slate-600 font-mono">HYBRID</span>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              {providerData.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-[9px] text-slate-500 font-mono uppercase">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm min-h-[350px]">
             <h2 className="text-[10px] font-bold text-white uppercase tracking-widest mb-10">Custos Alocados por Ativo (VMS Alinhado)</h2>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costBySystem}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} fontFamily="monospace" />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dx={-10} fontFamily="monospace" />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="cost" radius={[2, 2, 0, 0]}>
                      {costBySystem.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} stroke={entry.color} strokeWidth={1} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
           </div>

           <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm flex flex-col justify-between">
              <h2 className="text-[10px] font-bold text-white uppercase tracking-widest mb-8">Recomendações de Otimização (Cleanup)</h2>
              <div className="space-y-4">
                {[
                  { label: 'Instâncias RDS Ociosas (Staging)', value: '$420', action: 'Kill' },
                  { label: 'Unused EIP Addresses', value: '$45', action: 'Release' },
                  { label: 'Old Snapshots (> 90 days)', value: '$180', action: 'Purge' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                       <div>
                         <div className="text-[11px] font-bold text-white tracking-tight">{item.label}</div>
                         <div className="text-[9px] text-slate-600 font-mono uppercase tracking-tighter">POTENTIAL MONTHLY SAVING</div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-mono font-bold text-emerald-500">+{item.value}</div>
                       <button className="text-[8px] font-black uppercase tracking-[0.2em] bg-white/5 px-2 py-0.5 rounded-sm hover:bg-white/10 transition-colors mt-1">{item.action}</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2">
                Executar Automação FinOps <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
