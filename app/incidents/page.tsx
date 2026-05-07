'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Flame, 
  Activity, 
  Clock, 
  CheckCircle2, 
  Plus, 
  X, 
  Loader2, 
  ShieldAlert,
  Search,
  ChevronRight,
  ExternalLink,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { collection, onSnapshot, query, orderBy, setDoc, doc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/components/FirebaseProvider';

interface Incident {
  id: string;
  title: string;
  system: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
  description: string;
  rootCause?: string;
  startedAt: any;
  resolvedAt?: any;
  ownerId: string;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systems, setSystems] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    system: '',
    severity: 'Medium' as any,
    status: 'Open' as any,
    description: ''
  });

  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'incidents'), orderBy('startedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Incident[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'incidents');
    });

    const qSystems = query(collection(db, 'systems'));
    const unsubSystems = onSnapshot(qSystems, (snapshot) => {
      setSystems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsub(); unsubSystems(); };
  }, []);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    
    const id = crypto.randomUUID();
    try {
      await setDoc(doc(db, 'incidents', id), {
        ...formData,
        startedAt: serverTimestamp(),
        ownerId: user.uid
      });
      setIsModalOpen(false);
      setFormData({ title: '', system: '', severity: 'Medium', status: 'Open', description: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `incidents/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveIncident = async (incident: Incident) => {
    try {
      await updateDoc(doc(db, 'incidents', incident.id), {
        status: 'Resolved',
        resolvedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `incidents/${incident.id}`);
    }
  };

  const calculateMTTR = () => {
    const resolved = incidents.filter(i => i.resolvedAt && i.startedAt);
    if (resolved.length === 0) return 0;
    
    const totalTime = resolved.reduce((acc, i) => {
      const start = i.startedAt.toDate().getTime();
      const end = i.resolvedAt.toDate().getTime();
      return acc + (end - start);
    }, 0);
    
    return Math.round(totalTime / resolved.length / (1000 * 60)); // MTTR in minutes
  };

  const mttr = calculateMTTR();
  const openIncidents = incidents.filter(i => i.status !== 'Resolved').length;

  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-500/10 rounded flex items-center justify-center border border-red-500/20">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-white font-medium text-lg tracking-tight">Centro de Resposta a Incidentes</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Monitoramento SRE e Gestão de Crise</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> Reportar Incidente
        </button>
      </header>

      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Incidentes Abertos</div>
            <div className="text-4xl font-mono font-bold text-red-500 italic">{openIncidents}</div>
            <div className="mt-4 flex items-center gap-2">
              <Activity className="w-3 h-3 text-red-500" />
              <span className="text-[9px] text-slate-600 uppercase font-mono">Monitoramento Ativo</span>
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">MTTR (Mean Time to Repair)</div>
            <div className="text-4xl font-mono font-bold text-white italic">{mttr}m</div>
            <div className="mt-4 flex items-center gap-2">
              <Clock className="w-3 h-3 text-blue-500" />
              <span className="text-[9px] text-slate-600 uppercase font-mono text-blue-500">Média de Recuperação</span>
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-white/5 p-6 rounded-sm">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">SLA de Confiabilidade</div>
            <div className="text-4xl font-mono font-bold text-emerald-500 italic">99.98%</div>
            <div className="mt-4 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] text-slate-600 uppercase font-mono">Acima do Target</span>
            </div>
          </div>
        </div>

        {/* Incident List */}
        <div className="bg-[#0C0C0E] border border-white/5 rounded-sm overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
             <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Live Incident Feed</h3>
             <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[9px] text-slate-600 uppercase font-mono">Critical</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500" />
                 <span className="text-[9px] text-slate-600 uppercase font-mono">Warning</span>
               </div>
             </div>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-20 flex justify-center"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
            ) : incidents.length === 0 ? (
              <div className="p-20 text-center text-xs text-slate-600 uppercase font-mono tracking-widest">Nenhum incidente registrado. Todos os sistemas operacionais.</div>
            ) : incidents.map(incident => (
              <div key={incident.id} className="p-6 flex items-start justify-between group hover:bg-white/[0.01] transition-all">
                <div className="flex gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded border flex items-center justify-center shrink-0",
                    incident.status === 'Resolved' ? "bg-emerald-500/10 border-emerald-500/20" : 
                    incident.severity === 'Critical' ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"
                  )}>
                    {incident.status === 'Resolved' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <ShieldAlert className={cn(
                        "w-6 h-6",
                        incident.severity === 'Critical' ? "text-red-500" : "text-amber-500"
                      )} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-white tracking-tight">{incident.title}</span>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                        incident.severity === 'Critical' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}>{incident.severity.toUpperCase()}</span>
                      <span className="text-[9px] text-slate-500 font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded-sm">{incident.system}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 max-w-2xl">{incident.description}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="text-[9px] text-slate-600 uppercase font-mono">
                        Status: <span className={cn(
                          "font-bold",
                          incident.status === 'Resolved' ? "text-emerald-500" : "text-amber-500"
                        )}>{incident.status.toUpperCase()}</span>
                      </div>
                      <div className="text-[9px] text-slate-700 font-mono italic">
                        Iniciado em: {incident.startedAt?.toDate().toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {incident.status !== 'Resolved' && (
                    <button 
                      onClick={() => handleResolveIncident(incident)}
                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black border border-emerald-500/20 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase transition-all"
                    >
                      Resolver
                    </button>
                  )}
                  <button 
                    onClick={async () => {
                      if (confirm('Deletar incidente?')) await deleteDoc(doc(db, 'incidents', incident.id));
                    }}
                    className="p-2 hover:bg-red-500/10 rounded-sm transition-all"
                  >
                    <X className="w-4 h-4 text-slate-700 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Incidente */}
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
              className="relative w-full max-w-xl bg-[#0A0A0B] border border-white/10 rounded-sm shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest">Reportar Incidente Técnico</h3>
                  <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase">SRE Crisis Management Protocol</p>
                </div>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <form onSubmit={handleCreateIncident} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Título do Incidente</label>
                    <input 
                      required
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                      placeholder="Ex: Latência alta no checkout"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Sistema Afetado</label>
                    <select 
                      required
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
                      value={formData.system}
                      onChange={e => setFormData({...formData, system: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {systems.map(s => <option key={s.id} value={s.name}>{s.name.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Severidade</label>
                    <select 
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                      value={formData.severity}
                      onChange={e => setFormData({...formData, severity: e.target.value as any})}
                    >
                      <option value="Critical">CRITICAL (P0)</option>
                      <option value="High">HIGH (P1)</option>
                      <option value="Medium">MEDIUM (P2)</option>
                      <option value="Low">LOW (P3)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Status Inicial</label>
                    <select 
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="Open">OPEN</option>
                      <option value="Investigating">INVESTIGATING</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Descrição / Sinais Clínicos</label>
                  <textarea 
                    required
                    className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none h-24 resize-none"
                    placeholder="Descreva o que está acontecendo..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-900 text-white font-black uppercase text-[11px] tracking-widest py-4 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Abrir Incidente de Guerra'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
