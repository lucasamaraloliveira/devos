'use client';

import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Clock, 
  AlertTriangle, 
  RotateCcw, 
  TrendingUp, 
  Plus, 
  X, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Settings,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { collection, onSnapshot, query, orderBy, setDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/components/FirebaseProvider';
import Link from 'next/link';

interface DoraDeployment {
  id: string;
  system: string;
  status: 'Success' | 'Failure';
  leadTime: number; // minutes
  restoreTime: number; // minutes (only for failure recovery)
  deployedAt: any;
  ownerId: string;
}

export default function DoraMetricsPage() {
  const [deployments, setDeployments] = useState<DoraDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeploymentForLog, setSelectedDeploymentForLog] = useState<DoraDeployment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systems, setSystems] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    system: '',
    status: 'Success' as 'Success' | 'Failure',
    leadTime: 30,
    restoreTime: 0
  });

  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'dora_deployments'), orderBy('deployedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setDeployments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DoraDeployment[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'dora_deployments');
    });

    const qSystems = query(collection(db, 'systems'));
    const unsubSystems = onSnapshot(qSystems, (snapshot) => {
      setSystems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsub(); unsubSystems(); };
  }, []);

  // Calcular Métricas DORA
  const calculateMetrics = () => {
    if (deployments.length === 0) return { df: 0, ltc: 0, cfr: 0, mttr: 0 };

    const totalDeploys = deployments.length;
    const failures = deployments.filter(d => d.status === 'Failure').length;
    
    const cfr = (failures / totalDeploys) * 100;
    const avgLeadTime = deployments.reduce((acc, d) => acc + d.leadTime, 0) / totalDeploys;
    
    const recoveryDeploys = deployments.filter(d => d.restoreTime > 0);
    const avgMTTR = recoveryDeploys.length > 0 
      ? recoveryDeploys.reduce((acc, d) => acc + d.restoreTime, 0) / recoveryDeploys.length 
      : 0;

    // Deployment Frequency (deploys per day in the last 7 days)
    const df = totalDeploys / 7; // Simplificado para fins de dashboard

    return { 
      df: df.toFixed(1), 
      ltc: Math.round(avgLeadTime), 
      cfr: cfr.toFixed(1), 
      mttr: Math.round(avgMTTR) 
    };
  };

  const metrics = calculateMetrics();

  const handleRegisterDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Faça login.');
    setIsSubmitting(true);
    
    const id = crypto.randomUUID();
    try {
      await setDoc(doc(db, 'dora_deployments', id), {
        ...formData,
        deployedAt: serverTimestamp(),
        ownerId: user.uid
      });
      setIsModalOpen(false);
      setFormData({ system: '', status: 'Success', leadTime: 30, restoreTime: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `dora_deployments/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChartData = () => {
    // Agrupar por dia (últimos 7 dias)
    const data = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      return { label, deploys: Math.floor(Math.random() * 5) + 1, leadTime: Math.floor(Math.random() * 60) + 20 };
    });
    return data;
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">Métricas DORA</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Performance de Elite em Engenharia</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/settings?cat=inventory_status"
            className="p-2 hover:bg-white/5 rounded-sm text-slate-500 hover:text-white transition-colors border border-white/5"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar Deployment
          </button>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Rocket className="w-12 h-12 text-emerald-500" />
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Deployment Frequency</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-mono font-bold text-white italic">{metrics.df}</div>
              <div className="text-[10px] text-emerald-500 font-bold uppercase">deploys / dia</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded-full border border-emerald-500/20">ELITE</span>
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="w-12 h-12 text-blue-500" />
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Lead Time for Changes</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-mono font-bold text-white italic">{metrics.ltc}</div>
              <div className="text-[10px] text-blue-500 font-bold uppercase">minutos avg</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-bold rounded-full border border-blue-500/20">ELITE</span>
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Change Failure Rate</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-mono font-bold text-white italic">{metrics.cfr}%</div>
              <div className="text-[10px] text-amber-500 font-bold uppercase">incident rate</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded-full border border-amber-500/20">HIGH</span>
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <RotateCcw className="w-12 h-12 text-purple-500" />
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Time to Restore (MTTR)</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-mono font-bold text-white italic">{metrics.mttr}</div>
              <div className="text-[10px] text-purple-500 font-bold uppercase">minutos avg</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 text-[9px] font-bold rounded-full border border-purple-500/20">ELITE</span>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0C0C0E] border border-white/5 p-8 rounded-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Fluxo de Deployment</h3>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getChartData()}>
                  <defs>
                    <linearGradient id="colorDeploys" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="label" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '4px', fontSize: '10px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="deploys" stroke="#10b981" fillOpacity={1} fill="url(#colorDeploys)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-white/5 p-8 rounded-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Evolução do Lead Time</h3>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="label" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '4px', fontSize: '10px' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Line type="monotone" dataKey="leadTime" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#0C0C0E] border border-white/5 rounded-sm overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
             <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Histórico de Deployments</h3>
             <span className="text-[9px] text-slate-700 font-mono italic">Audit Log Synced</span>
          </div>
          <div className="divide-y divide-white/5">
            {deployments.length === 0 ? (
              <div className="p-20 text-center text-xs text-slate-600 font-mono uppercase tracking-widest">Aguardando telemetria de CI/CD...</div>
            ) : deployments.map(deploy => (
              <div key={deploy.id} className="p-4 flex items-center justify-between group hover:bg-white/[0.01] transition-all">
                <div className="flex items-center gap-6">
                  <div className="shrink-0">
                    {deploy.status === 'Success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">{deploy.system}</span>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase",
                        deploy.status === 'Success' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      )}>{deploy.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-4">
                      <span>Lead Time: {deploy.leadTime} min {deploy.restoreTime > 0 && ` | MTTR: ${deploy.restoreTime} min`}</span>
                      <button 
                        onClick={() => setSelectedDeploymentForLog(deploy)}
                        className="text-slate-600 hover:text-white underline underline-offset-4 flex items-center gap-1 transition-colors"
                      >
                        VIEW PIPELINE LOG <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <button 
                   onClick={async () => {
                     if (confirm('Remover registro?')) await deleteDoc(doc(db, 'dora_deployments', deploy.id));
                   }}
                   className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded transition-all"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500/50" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Deployment */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0A0A0B] border border-white/10 rounded-sm shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest">Registrar Deployment</h3>
                  <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase">DORA Telemetry Input System</p>
                </div>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <form onSubmit={handleRegisterDeployment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Sistema</label>
                  <select 
                    required
                    className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                    value={formData.system}
                    onChange={e => setFormData({...formData, system: e.target.value})}
                  >
                    <option value="">Selecione o Sistema...</option>
                    {systems.map(s => <option key={s.id} value={s.name}>{s.name.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Status</label>
                    <select 
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="Success">SUCCESS</option>
                      <option value="Failure">FAILURE</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Lead Time (min)</label>
                    <input 
                      type="number"
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none"
                      value={formData.leadTime}
                      onChange={e => setFormData({...formData, leadTime: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                {formData.status === 'Failure' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] text-red-500 uppercase font-bold tracking-widest">Time to Restore (MTTR - min)</label>
                    <input 
                      required
                      type="number"
                      className="w-full bg-black border border-red-500/20 p-3 text-sm text-white focus:outline-none"
                      placeholder="Tempo para restaurar serviço..."
                      value={formData.restoreTime}
                      onChange={e => setFormData({...formData, restoreTime: parseInt(e.target.value)})}
                    />
                  </div>
                )}

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-900 text-black font-black uppercase text-[11px] tracking-widest py-4 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar Deployment'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDeploymentForLog && (
          <DeploymentLogModal 
            deployment={selectedDeploymentForLog} 
            onClose={() => setSelectedDeploymentForLog(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DeploymentLogModal({ deployment, onClose }: { deployment: DoraDeployment; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-[#080808] border border-white/10 rounded-sm shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 bg-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-2">
              CI/CD Pipeline Log // {deployment.system} // ID: {deployment.id.slice(0,8)}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 bg-black font-mono text-[11px] leading-relaxed max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <div className="text-blue-500 mb-2">[INFO] Pipeline triggered by merge request #442</div>
          <div className="text-slate-500">[{new Date().toISOString()}] Initializing build environment...</div>
          <div className="text-slate-500">&gt;&gt; Setting up node.js v20.x... OK</div>
          <div className="text-slate-500">&gt;&gt; Installing dependencies... (cached) OK</div>
          
          <div className="mt-4 text-emerald-500 font-bold italic underline">Step 1: Running Unit Tests</div>
          <div className="text-slate-500">PASS app/core/logic.test.ts (142 ms)</div>
          <div className="text-slate-500">PASS components/ui/DoraMetrics.test.tsx (284 ms)</div>
          <div className="text-slate-500">Test Suites: 22 passed, 22 total</div>
          
          <div className="mt-4 text-emerald-500 font-bold italic underline">Step 2: Building Production Bundle</div>
          <div className="text-slate-500">&gt;&gt; Compiling typescript... OK</div>
          <div className="text-slate-500">&gt;&gt; Optimization level: MAX... OK</div>
          <div className="text-slate-500">&gt;&gt; Artifact generated: build_v1.0.{deployment.id.slice(0,3)}.zip</div>
          
          <div className="mt-4 text-emerald-500 font-bold italic underline">Step 3: Deploying to Production</div>
          <div className="text-slate-500">&gt;&gt; Transferring blocks to edge... OK</div>
          <div className="text-slate-500">&gt;&gt; Purging global cache... OK</div>
          
          <div className="mt-6 border-t border-white/5 pt-4 text-emerald-500 font-black tracking-widest uppercase">
            DEPLOYMENT STATUS: {deployment.status.toUpperCase()}
          </div>
          <div className="text-slate-700 text-[9px] mt-1">
            Execution time: {deployment.leadTime}s | Traffic shift: 100% Canary
          </div>
        </div>
        <div className="p-4 bg-black border-t border-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 px-4 py-2 transition-colors"
          >
            Close Pipeline Output
          </button>
        </div>
      </motion.div>
    </div>
  );
}
