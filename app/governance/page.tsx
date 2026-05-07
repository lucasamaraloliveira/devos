'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileCheck, 
  AlertCircle, 
  Flame,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const auditLogs = [
  { id: '1', system: 'Core API Gateway', scan: 'SAST Audit', result: 'Secure', date: '2h ago', score: 98 },
  { id: '2', system: 'Legacy PHP Monolith', scan: 'Vulnerability Scan', result: 'Critical', date: '5h ago', score: 32 },
  { id: '3', system: 'Auth Service', scan: 'Dependency Check', result: 'Pass', date: 'Yesterday', score: 95 },
  { id: '4', system: 'Data Processor', scan: 'Code Quality', result: 'Review Needed', date: '2d ago', score: 72 },
];

export default function GovernancePage() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">Governança & Riscos</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Conformidade e Segurança Técnica</p>
        </div>
      </header>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-500/10 rounded border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Sanidade Global</h3>
                <p className="text-[9px] text-slate-600 uppercase font-mono tracking-tighter">SOC2 / ISO 27001 Status</p>
              </div>
            </div>
            <div className="text-4xl font-mono font-bold text-white mb-2 italic">92%</div>
            <div className="h-1 w-full bg-white/5 mt-4 rounded-full overflow-hidden">
              <div className="h-full w-[92%] bg-emerald-500" />
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-500/10 rounded border border-blue-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Access Control</h3>
                <p className="text-[9px] text-slate-600 uppercase font-mono tracking-tighter">RBAC Health Audit</p>
              </div>
            </div>
            <div className="space-y-3">
              {['Permissões Granulares', 'OAuth Compliance', 'Secret Rotation'].map(item => (
                <div key={item} className="flex justify-between items-center text-[10px] uppercase font-mono text-slate-500 border-b border-white/[0.02] pb-1">
                  <span>{item}</span>
                  <span className="text-emerald-500 font-bold">Passed</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm">
             <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-red-500/10 rounded border border-red-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Dívida de Risco</h3>
                <p className="text-[9px] text-slate-600 uppercase font-mono tracking-tighter">Critical Vulnerabilities</p>
              </div>
            </div>
            <div className="text-4xl font-mono font-bold text-red-500 mb-2 italic">12</div>
            <p className="text-[10px] text-slate-500 font-mono mt-4 uppercase">Módulos legados com patches pendentes</p>
          </div>
        </div>

        <div className="bg-[#0C0C0E] border border-white/5 rounded-sm overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
             <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logs de Auditoria Automatizada</h3>
             <span className="text-[9px] text-slate-700 font-mono uppercase tracking-tighter italic">Live Sync System</span>
          </div>
          <div className="divide-y divide-white/5">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center gap-6 group hover:bg-white/[0.01] transition-colors">
                <div className="shrink-0">
                  {log.result === 'Secure' || log.result === 'Pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-white tracking-tight">{log.system}</span>
                      <span className="text-[9px] text-slate-600 font-mono uppercase border border-white/5 px-1.5 py-0.5 rounded-sm">{log.scan}</span>
                   </div>
                   <div className="text-[10px] text-slate-500 mt-1 font-mono">{log.date}</div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-[11px] font-mono font-bold italic mb-1",
                    log.score > 90 ? "text-emerald-500" : "text-red-500"
                  )}>SCORE: {log.score}%</div>
                  <button className="text-[10px] text-slate-600 hover:text-white underline underline-offset-4 flex items-center gap-1 justify-end ml-auto transition-colors">
                    LOG DATA <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
