'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, Cloud, BarChart3, TrendingDown, ArrowUpRight, AlertCircle, Plus, X, Loader2, Trash2, Settings } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
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
import { collection, onSnapshot, query, orderBy, setDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/components/FirebaseProvider';

interface CostMetric {
  id: string;
  system: string;
  provider: 'AWS' | 'Supabase' | 'GCP' | 'Azure';
  cost: number;
  month: string;
  ownerId: string;
  createdAt?: any;
}

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ef4444', '#f97316'];

export default function FinOpsPage() {
  const [costs, setCosts] = useState<CostMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systems, setSystems] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    system: '',
    provider: '' as any,
    cost: 0,
    month: 'Maio'
  });

  const [providerOptions, setProviderOptions] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_settings', 'providers'), (docSnap) => {
      if (docSnap.exists()) setProviderOptions(docSnap.data().values || []);
    });
    return () => unsub();
  }, []);

  const { user } = useAuth();

  useEffect(() => {
    // Sincronizar Custos
    const qCosts = query(collection(db, 'finops_costs'), orderBy('createdAt', 'desc'));
    const unsubCosts = onSnapshot(qCosts, (snapshot) => {
      setCosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CostMetric[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'finops_costs');
    });

    // Sincronizar Sistemas para o Select
    const qSystems = query(collection(db, 'systems'));
    const unsubSystems = onSnapshot(qSystems, (snapshot) => {
      setSystems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCosts();
      unsubSystems();
    };
  }, []);

  const handleCreateCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Faça login para registrar custos.');
    
    setIsSubmitting(true);
    const costId = crypto.randomUUID();
    
    try {
      await setDoc(doc(db, 'finops_costs', costId), {
        ...formData,
        createdAt: serverTimestamp(),
        ownerId: user.uid
      });
      
      setIsModalOpen(false);
      setFormData({ system: '', provider: 'AWS', cost: 0, month: 'Maio' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `finops_costs/${costId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCost = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'finops_costs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `finops_costs/${id}`);
    }
  };

  const calculateTotalBurn = () => {
    return costs.reduce((acc, c) => acc + c.cost, 0);
  };

  const getProviderShare = () => {
    const shares: Record<string, number> = {};
    costs.forEach(c => {
      shares[c.provider] = (shares[c.provider] || 0) + c.cost;
    });
    
    const total = calculateTotalBurn();
    return Object.entries(shares).map(([name, value]) => {
      let color = '#6366f1';
      if (name === 'AWS') color = '#f97316';
      else if (name === 'Supabase') color = '#10b981';
      else if (name === 'GCP') color = '#4285F4';
      else if (name === 'Azure') color = '#0078D4';
      
      return {
        name,
        value: total > 0 ? (value / total) * 100 : 0,
        color
      };
    });
  };

  const getCostBySystem = () => {
    const systemsMap: Record<string, number> = {};
    costs.forEach(c => {
      systemsMap[c.system] = (systemsMap[c.system] || 0) + c.cost;
    });

    return Object.entries(systemsMap).map(([name, cost], index) => ({
      name,
      cost,
      color: COLORS[index % COLORS.length]
    }));
  };

  const totalBurn = calculateTotalBurn();
  const providerData = getProviderShare();
  const costBySystem = getCostBySystem();

  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">FinOps (Cloud Economy)</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Governança Financeira de Infraestrutura</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/settings?cat=providers"
            className="p-2 hover:bg-white/5 rounded-sm text-slate-500 hover:text-white transition-colors border border-white/5"
            title="Configurar Providers"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar Gasto
          </button>
        </div>
      </header>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#0C0C0E] to-[#080808] border border-white/5 p-8 rounded-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded text-emerald-500 font-mono text-[10px] font-bold">
                  EFICIÊNCIA: {totalBurn > 10000 ? 'B+' : 'A+'}
               </div>
            </div>
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-2 font-bold">Burn Rate Mensal Atual (Acumulado)</div>
                <div className="text-6xl font-bold text-white tracking-tighter italic">
                  ${loading ? '...' : totalBurn.toLocaleString()} 
                  <span className="text-xl text-slate-600 font-mono">.00</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Projetado (Fim do Mês)', value: `$${(totalBurn * 1.2).toFixed(0)}`, sub: 'On Target' },
                { label: 'Savings Oportunity', value: `$${(totalBurn * 0.1).toFixed(0)}`, sub: 'High' },
                { label: 'Unit Cost / Asset', value: `$${(totalBurn / (systems.length || 1)).toFixed(2)}`, sub: 'Stable' },
                { label: 'Cloud Providers', value: providerData.length, sub: 'Active' },
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
            <div className="flex flex-wrap justify-center gap-4 mt-6">
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
                {loading ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
                ) : costBySystem.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono uppercase tracking-widest">Nenhum custo registrado</div>
                ) : (
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
                )}
             </div>
           </div>

           <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm flex flex-col">
              <h2 className="text-[10px] font-bold text-white uppercase tracking-widest mb-8">Registros Recentes de Custo</h2>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2">
                {costs.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       <div>
                         <div className="text-[11px] font-bold text-white tracking-tight uppercase">{c.system}</div>
                         <div className="text-[9px] text-slate-600 font-mono uppercase tracking-tighter">{c.provider} • {c.month}</div>
                       </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                       <div className="text-sm font-mono font-bold text-white">${c.cost}</div>
                       <button onClick={() => handleDeleteCost(c.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded transition-all">
                        <Trash2 className="w-3 h-3 text-red-500" />
                       </button>
                    </div>
                  </div>
                ))}
                {costs.length === 0 && (
                  <div className="h-full flex items-center justify-center text-xs text-slate-700 font-mono uppercase tracking-widest py-10">Sem registros</div>
                )}
              </div>
              <button className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2">
                Exportar Relatório FinOps <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
           </div>
        </div>
      </div>

      {/* Modal Custo */}
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
                <h3 className="text-white font-bold text-sm uppercase tracking-widest">Registrar Gasto de Cloud</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handleCreateCost} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Sistema / Ativo</label>
                    <select 
                      required
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                      value={formData.system}
                      onChange={e => setFormData({...formData, system: e.target.value})}
                    >
                      <option value="">Selecione um sistema</option>
                      {systems.map(s => (
                        <option key={s.id} value={s.name}>{s.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Provider</label>
                      <select 
                        required
                        className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                        value={formData.provider}
                        onChange={e => setFormData({...formData, provider: e.target.value as any})}
                      >
                        <option value="">Selecione...</option>
                        {providerOptions.map(opt => (
                          <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Mês de Referência</label>
                      <select 
                        className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                        value={formData.month}
                        onChange={e => setFormData({...formData, month: e.target.value})}
                      >
                        <option value="Janeiro">Janeiro</option>
                        <option value="Fevereiro">Fevereiro</option>
                        <option value="Março">Março</option>
                        <option value="Abril">Abril</option>
                        <option value="Maio">Maio</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Valor do Custo (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-sm">$</span>
                      <input 
                        type="number" 
                        required
                        min="0"
                        className="w-full bg-black border border-white/5 p-3 pl-8 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        value={formData.cost}
                        onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
                <button 
                  disabled={isSubmitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-black font-bold uppercase text-[11px] tracking-[0.3em] py-4 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Gasto'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
