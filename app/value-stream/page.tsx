'use client';

import React from 'react';
import { Zap, Clock, TrendingDown, Timer, Rocket, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const historyData = [
  { name: 'S1', lead: 12, cycle: 4 },
  { name: 'S2', lead: 11, cycle: 4.5 },
  { name: 'S3', lead: 9, cycle: 3.2 },
  { name: 'S4', lead: 10, cycle: 3.5 },
  { name: 'S5', lead: 8.5, cycle: 2.8 },
];

const bottleneckData = [
  { stage: 'Proposta', time: 15, color: 'rgba(255,255,255,0.1)' },
  { stage: 'Reqs', time: 22, color: 'rgba(255,255,255,0.1)' },
  { stage: 'Coding', time: 10, color: '#10b981' },
  { stage: 'Review', time: 18, color: 'rgba(255,255,255,0.1)' },
  { stage: 'QA', time: 25, color: '#f59e0b' },
  { stage: 'Deploy', time: 2, color: '#06b6d4' },
];

export default function ValueStreamPage() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">Engenharia de Valor</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Value Stream Management (VSM)</p>
        </div>
      </header>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0C0C0E] border border-white/5 p-8 rounded-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-2">Lead Time Médio Global</div>
                <div className="text-6xl font-bold text-white tracking-tighter">9.2 <span className="text-xl text-slate-600 font-mono">DIAS</span></div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold mb-1 uppercase font-mono">
                  <TrendingDown className="w-3 h-3" /> 18.5% IMPROVEMENT
                </div>
                <div className="text-[9px] text-slate-600 font-mono uppercase">vs. LAST QUARTER</div>
              </div>
            </div>

            <div className="relative h-1 w-full bg-white/5 rounded-full mb-10 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '85%' }}
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              <span>Backlog / Idea</span>
              <span>In Development</span>
              <span>QA / Staging</span>
              <span>Production Release</span>
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">Fluxo por Squad</h3>
            <div className="space-y-6">
              {[
                { name: 'Squad Alpha', time: 7.2, trend: 'up' },
                { name: 'Squad Beta', time: 12.4, trend: 'down' },
                { name: 'Plataforma', time: 4.8, trend: 'up' },
              ].map((squad) => (
                <div key={squad.name} className="flex flex-col gap-2">
                  <div className="flex justify-between text-[11px] font-medium text-slate-300">
                    <span>{squad.name}</span>
                    <span className="font-mono text-white">{squad.time} dias</span>
                  </div>
                  <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", squad.trend === 'up' ? "bg-emerald-500/40" : "bg-amber-500/40")} style={{width: `${(squad.time / 15) * 100}%`}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm min-h-[300px]">
            <h2 className="text-[10px] font-bold text-white uppercase tracking-widest mb-10 flex items-center gap-2">
              Tendência Lead Time
              <HelpCircle className="w-3 h-3 text-slate-700" />
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} fontFamily="monospace" />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dx={-10} fontFamily="monospace" />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)' }} />
                  <Line type="monotone" dataKey="lead" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                  <Line type="monotone" dataKey="cycle" stroke="#475569" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm min-h-[300px]">
            <h2 className="text-[10px] font-bold text-white uppercase tracking-widest mb-10">Análise de Gargalos (Tempo Médio/Etapa)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bottleneckData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="stage" type="category" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={80} fontFamily="monospace" />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="time" radius={[0, 2, 2, 0]}>
                    {bottleneckData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 bg-black/40 border border-white/5 flex items-center gap-4">
              <Rocket className="w-5 h-5 text-emerald-500" />
              <p className="text-[10px] text-slate-500 font-mono uppercase leading-relaxed">
                <span className="text-white font-bold">Insight:</span> Gargalo no estágio de QA detectado. Redução potencial de 40% no Lead Time via automatização de testes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
