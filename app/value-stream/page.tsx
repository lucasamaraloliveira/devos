'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Clock, TrendingDown, Timer, Rocket, HelpCircle, Plus, Loader2, X, Trash2, Edit2, Settings } from 'lucide-react';
import Link from 'next/link';
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
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { collection, onSnapshot, query, orderBy, setDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/components/FirebaseProvider';

interface StreamMetric {
  id: string;
  squadName: string;
  leadTime: number;
  cycleTime: number;
  period: string; // Ex: Jan, Fev ou S1, S2
  createdAt?: any;
}

const defaultBottleneckData = [
  { stage: 'Proposta', time: 15, color: 'rgba(255,255,255,0.1)' },
  { stage: 'Reqs', time: 22, color: 'rgba(255,255,255,0.1)' },
  { stage: 'Coding', time: 10, color: '#10b981' },
  { stage: 'Review', time: 18, color: 'rgba(255,255,255,0.1)' },
  { stage: 'QA', time: 25, color: '#f59e0b' },
  { stage: 'Deploy', time: 2, color: '#06b6d4' },
];

export default function ValueStreamPage() {
  const [metrics, setMetrics] = useState<StreamMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    squadName: '',
    leadTime: 10,
    cycleTime: 4,
    period: 'Jan'
  });

  const [squadOptions, setSquadOptions] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_settings', 'squads'), (docSnap) => {
      if (docSnap.exists()) setSquadOptions(docSnap.data().values || []);
    });
    return () => unsub();
  }, []);

  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'value_stream'), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StreamMetric[];
      setMetrics(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'value_stream');
    });

    return () => unsubscribe();
  }, []);

  const handleCreateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Faça login para registrar métricas.');
    
    setIsSubmitting(true);
    const metricId = crypto.randomUUID();
    
    try {
      await setDoc(doc(db, 'value_stream', metricId), {
        ...formData,
        createdAt: serverTimestamp(),
        ownerId: user.uid
      });
      
      setIsModalOpen(false);
      setFormData({ squadName: 'Squad Alpha', leadTime: 10, cycleTime: 4, period: 'Jan' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `value_stream/${metricId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMetric = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'value_stream', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `value_stream/${id}`);
    }
  };

  // Processamento de dados para os gráficos
  const getChartData = () => {
    if (metrics.length === 0) return [
      { name: 'N/A', lead: 0, cycle: 0 }
    ];
    
    return metrics.map(m => ({
      name: m.period,
      lead: m.leadTime,
      cycle: m.cycleTime,
      squad: m.squadName
    }));
  };

  const getGlobalAvgLeadTime = () => {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.leadTime, 0);
    return (sum / metrics.length).toFixed(1);
  };

  const getSquadAverages = () => {
    const squads: Record<string, { sum: number, count: number }> = {};
    metrics.forEach(m => {
      if (!squads[m.squadName]) squads[m.squadName] = { sum: 0, count: 0 };
      squads[m.squadName].sum += m.leadTime;
      squads[m.squadName].count += 1;
    });

    return Object.entries(squads).map(([name, data]) => ({
      name,
      time: (data.sum / data.count).toFixed(1)
    }));
  };

  const chartData = getChartData();
  const globalLeadTime = getGlobalAvgLeadTime();
  const squadAverages = getSquadAverages();

  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">Engenharia de Valor</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Value Stream Management (VSM)</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/settings?cat=squads"
            className="p-2 hover:bg-white/5 rounded-sm text-slate-500 hover:text-white transition-colors border border-white/5"
            title="Configurar Squads"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar Métrica
          </button>
        </div>
      </header>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0C0C0E] border border-white/5 p-8 rounded-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-2">Lead Time Médio Global</div>
                <div className="text-6xl font-bold text-white tracking-tighter">
                  {loading ? '...' : globalLeadTime} <span className="text-xl text-slate-600 font-mono">DIAS</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold mb-1 uppercase font-mono">
                  <TrendingDown className="w-3 h-3" /> REAL-TIME MONITOR
                </div>
                <div className="text-[9px] text-slate-600 font-mono uppercase">VMS ENGINE ACTIVE</div>
              </div>
            </div>

            <div className="relative h-1 w-full bg-white/5 rounded-full mb-10 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Number(globalLeadTime) * 10)}%` }}
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
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">Fluxo por Squad (Lead Time Médio)</h3>
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-emerald-500 animate-spin" /></div>
              ) : squadAverages.length === 0 ? (
                <div className="text-[10px] text-slate-600 uppercase font-mono text-center py-10">Nenhuma squad com métricas</div>
              ) : squadAverages.map((squad) => (
                <div key={squad.name} className="flex flex-col gap-2">
                  <div className="flex justify-between text-[11px] font-medium text-slate-300">
                    <span>{squad.name}</span>
                    <span className="font-mono text-white">{squad.time} dias</span>
                  </div>
                  <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500/40" style={{width: `${Math.min(100, (Number(squad.time) / 20) * 100)}%`}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm min-h-[300px]">
            <h2 className="text-[10px] font-bold text-white uppercase tracking-widest mb-10 flex items-center gap-2">
              Tendência Lead Time (Histórico)
              <HelpCircle className="w-3 h-3 text-slate-700" />
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
            <h2 className="text-[10px] font-bold text-white uppercase tracking-widest mb-10">Análise de Gargalos (Global)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defaultBottleneckData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="stage" type="category" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={80} fontFamily="monospace" />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="time" radius={[0, 2, 2, 0]}>
                    {defaultBottleneckData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 bg-black/40 border border-white/5 flex items-center gap-4">
              <Rocket className="w-5 h-5 text-emerald-500" />
              <p className="text-[10px] text-slate-500 font-mono uppercase leading-relaxed">
                <span className="text-white font-bold">Insight:</span> {Number(globalLeadTime) > 10 ? 'Gargalo detectado. Recomenda-se auditoria nos estágios de QA e Deploy.' : 'Fluxo saudável. Continue monitorando os ciclos de entrega por squad.'}
              </p>
            </div>
          </div>
        </div>

        {/* List of recent metrics */}
        <div className="bg-[#0C0C0E] border border-white/5 rounded-sm overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logs de Métricas Registradas</h3>
          </div>
          <div className="divide-y divide-white/5 text-[11px]">
            {metrics.map(m => (
              <div key={m.id} className="p-4 flex items-center justify-between group hover:bg-white/[0.01]">
                <div className="flex items-center gap-6">
                  <div className="text-slate-500 font-mono">{m.period}</div>
                  <div className="font-bold text-white uppercase tracking-tight">{m.squadName}</div>
                </div>
                <div className="flex gap-8 items-center font-mono">
                  <div className="text-emerald-500">Lead: {m.leadTime}d</div>
                  <div className="text-slate-400">Cycle: {m.cycleTime}d</div>
                  <button onClick={() => handleDeleteMetric(m.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all">
                    <Trash2 className="w-3 h-3 text-red-500/50 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Métrica */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0A0A0B] border border-white/10 rounded-sm shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-bold text-sm uppercase tracking-widest">Registrar Métrica VMS</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handleCreateMetric} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Squad</label>
                    <select 
                      required
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                      value={formData.squadName}
                      onChange={e => setFormData({...formData, squadName: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {squadOptions.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Lead Time (Dias)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        value={formData.leadTime}
                        onChange={e => setFormData({...formData, leadTime: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Cycle Time (Dias)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        value={formData.cycleTime}
                        onChange={e => setFormData({...formData, cycleTime: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Período / Sprint</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Jan, Fev, S1, S2"
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={formData.period}
                      onChange={e => setFormData({...formData, period: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  disabled={isSubmitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-black font-bold uppercase text-[11px] tracking-[0.3em] py-4 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Métricas'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
