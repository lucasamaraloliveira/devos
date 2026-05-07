'use client';

import React from 'react';
import { 
  Users, 
  Settings, 
  Zap, 
  Star,
  Mail,
  UserPlus,
  BrainCircuit,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';

const skillData = [
  { subject: 'Node.js', A: 120, fullMark: 150 },
  { subject: 'Go', A: 98, fullMark: 150 },
  { subject: 'AI/ML', A: 86, fullMark: 150 },
  { subject: 'K8s', A: 99, fullMark: 150 },
  { subject: 'FinOps', A: 85, fullMark: 150 },
  { subject: 'React', A: 65, fullMark: 150 },
];

const teamMembers = [
  { id: '1', name: 'Lucas Silva', role: 'Staff Engineer', squad: 'Platform', capacity: 0.9, skills: ['Node.js', 'Go', 'K8s'] },
  { id: '2', name: 'Marina Costa', role: 'Principal Dev', squad: 'Auth', capacity: 0.7, skills: ['Go', 'Security', 'Rust'] },
  { id: '3', name: 'Ana Pereira', role: 'Senior Data', squad: 'Analytics', capacity: 1.0, skills: ['Python', 'SQL', 'Spark'] },
];

export default function TalentsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">Gestão de Talentos</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Skills, Capacity e Performance</p>
        </div>
        <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
          <UserPlus className="w-3.5 h-3.5" /> Quadro de Alocação
        </button>
      </header>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#0C0C0E] border border-white/5 p-8 rounded-sm min-h-[400px]">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-10 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-500" />
              Intelligence Radar (Engineering Skills)
            </h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }} />
                  <PolarRadiusAxis hide />
                  <Radar
                     name="Média Coletiva"
                     dataKey="A"
                     stroke="#10b981"
                     fill="#10b981"
                     fillOpacity={0.2}
                   />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm flex-1">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Mapeamento de Capacity</h3>
              <div className="space-y-6">
                {[
                  { label: 'Células em Overstress', value: '2', sub: 'High Risk' },
                  { label: 'Disponibilidade Agregada', value: '14%', sub: 'Limited' },
                  { label: 'Matriz de Skills (Avg)', value: 'B+', sub: 'Increasing' },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="text-[10px] text-slate-600 uppercase font-mono tracking-tighter">{stat.label}</div>
                    <div className="flex items-baseline gap-3 mt-1">
                      <div className="text-2xl font-mono font-bold text-white">{stat.value}</div>
                      <div className="text-[10px] text-slate-700 font-mono italic">{stat.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
              <div className="relative z-10">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2 italic">Oportunidade de Mentoria</div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  3 desenvolvedores sênior com Skill <span className="text-white">Go</span> estão disponíveis para mentoring este sprint.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0C0C0E] border border-white/5 rounded-sm overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alocação por Squad (Snapshot)</h3>
          </div>
          <div className="divide-y divide-white/5">
            {teamMembers.map((member) => (
              <div key={member.id} className="p-4 flex items-center gap-6 hover:bg-white/[0.01] transition-colors group">
                <div className="w-10 h-10 bg-black border border-white/5 rounded flex items-center justify-center font-mono font-bold text-slate-500 text-sm">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-white tracking-tight">{member.name}</span>
                      <span className="text-[9px] text-slate-600 font-mono uppercase">{member.role}</span>
                   </div>
                   <div className="flex gap-2 mt-1.5">
                      {member.skills.map(s => (
                        <span key={s} className="text-[9px] text-slate-500 uppercase font-mono px-1.5 bg-black/40 border border-white/5 rounded-sm">{s}</span>
                      ))}
                   </div>
                </div>
                <div className="text-right px-6 border-l border-white/5 shrink-0">
                  <div className="text-[9px] text-slate-600 uppercase font-mono mb-1">Squad</div>
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{member.squad}</div>
                </div>
                <div className="min-w-[150px] px-6 border-l border-white/5">
                  <div className="text-[9px] text-slate-600 uppercase font-mono mb-1 text-right">Ocupação: {member.capacity * 100}%</div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full", member.capacity > 0.8 ? "bg-amber-500/40" : "bg-emerald-500/40")} style={{ width: `${member.capacity * 100}%` }} />
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button className="p-1.5 hover:bg-white/10 rounded-sm"><Mail className="w-3 h-3 text-slate-500" /></button>
                  <button className="p-1.5 hover:bg-white/10 rounded-sm"><Settings className="w-3 h-3 text-slate-500" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
