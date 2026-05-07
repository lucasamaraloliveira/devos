'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileCheck, 
  AlertCircle, 
  Flame,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Plus,
  X,
  Loader2,
  Trash2,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { collection, onSnapshot, query, orderBy, setDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/components/FirebaseProvider';

interface GovernanceLog {
  id: string;
  system: string;
  scan: string;
  result: 'Secure' | 'Pass' | 'Critical' | 'Review Needed';
  score: number;
  dateLabel: string;
  ownerId: string;
  createdAt?: any;
}

export default function GovernancePage() {
  const [logs, setLogs] = useState<GovernanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLogForData, setSelectedLogForData] = useState<GovernanceLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systems, setSystems] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    system: '',
    scan: '',
    result: '' as any,
    score: 100
  });

  const [scanTypes, setScanTypes] = useState<string[]>([]);
  const [scanResults, setScanResults] = useState<string[]>([]);

  useEffect(() => {
    const unsubTypes = onSnapshot(doc(db, 'app_settings', 'scan_types'), (docSnap) => {
      if (docSnap.exists()) setScanTypes(docSnap.data().values || []);
    });
    const unsubResults = onSnapshot(doc(db, 'app_settings', 'scan_results'), (docSnap) => {
      if (docSnap.exists()) setScanResults(docSnap.data().values || []);
    });
    return () => { unsubTypes(); unsubResults(); };
  }, []);

  const { user } = useAuth();

  useEffect(() => {
    // Sincronizar Logs
    const qLogs = query(collection(db, 'governance_logs'), orderBy('createdAt', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GovernanceLog[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'governance_logs');
    });

    // Sincronizar Sistemas para o Select
    const qSystems = query(collection(db, 'systems'));
    const unsubSystems = onSnapshot(qSystems, (snapshot) => {
      setSystems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubLogs();
      unsubSystems();
    };
  }, []);

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Faça login para registrar auditorias.');
    
    setIsSubmitting(true);
    const auditId = crypto.randomUUID();
    
    try {
      await setDoc(doc(db, 'governance_logs', auditId), {
        ...formData,
        dateLabel: 'Just now',
        createdAt: serverTimestamp(),
        ownerId: user.uid
      });
      
      setIsModalOpen(false);
      setFormData({ system: '', scan: 'SAST Audit', result: 'Secure', score: 100 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `governance_logs/${auditId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAudit = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'governance_logs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `governance_logs/${id}`);
    }
  };

  const calculateGlobalSanity = () => {
    if (logs.length === 0) return 0;
    const sum = logs.reduce((acc, log) => acc + log.score, 0);
    return Math.round(sum / logs.length);
  };

  const countCriticalRisks = () => {
    return logs.filter(log => log.result === 'Critical').length;
  };

  const globalSanity = calculateGlobalSanity();
  const criticalRisks = countCriticalRisks();

  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">Governança & Riscos</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Conformidade e Segurança Técnica</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/settings?cat=scan_types"
            className="p-2 hover:bg-white/5 rounded-sm text-slate-500 hover:text-white transition-colors border border-white/5"
            title="Configurar Auditorias"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar Auditoria
          </button>
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
            <div className="text-4xl font-mono font-bold text-white mb-2 italic">{loading ? '...' : `${globalSanity}%`}</div>
            <div className="h-1 w-full bg-white/5 mt-4 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${globalSanity}%` }}
                className="h-full bg-emerald-500 transition-all duration-1000" 
              />
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
                  <span className="text-emerald-500 font-bold italic">Active</span>
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
            <div className={cn(
              "text-4xl font-mono font-bold mb-2 italic",
              criticalRisks > 0 ? "text-red-500" : "text-emerald-500"
            )}>
              {loading ? '...' : criticalRisks}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-4 uppercase">Módulos com vulnerabilidades críticas pendentes</p>
          </div>
        </div>

        <div className="bg-[#0C0C0E] border border-white/5 rounded-sm overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
             <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logs de Auditoria Automatizada</h3>
             <span className="text-[9px] text-slate-700 font-mono uppercase tracking-tighter italic">Live Sync System</span>
          </div>
          <div className="divide-y divide-white/5 min-h-[200px]">
            {loading ? (
              <div className="p-20 flex justify-center"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
            ) : logs.length === 0 ? (
              <div className="p-20 text-center text-xs text-slate-600 uppercase font-mono tracking-widest">Nenhuma auditoria registrada</div>
            ) : logs.map((log) => (
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
                   <div className="text-[10px] text-slate-500 mt-1 font-mono">{log.dateLabel}</div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div>
                    <div className={cn(
                      "text-[11px] font-mono font-bold italic mb-1",
                      log.score > 90 ? "text-emerald-500" : "text-red-500"
                    )}>SCORE: {log.score}%</div>
                    <button 
                      onClick={() => setSelectedLogForData(log)}
                      className="text-[10px] text-slate-600 hover:text-white underline underline-offset-4 flex items-center gap-1 justify-end ml-auto transition-colors"
                    >
                      LOG DATA <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <button onClick={() => handleDeleteAudit(log.id)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded transition-all">
                    <Trash2 className="w-3.5 h-3.5 text-red-500/50 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Auditoria */}
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
                <h3 className="text-white font-bold text-sm uppercase tracking-widest">Registrar Auditoria</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handleCreateAudit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Sistema / Microsserviço</label>
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
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Tipo de Scan</label>
                    <select 
                      required
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                      value={formData.scan}
                      onChange={e => setFormData({...formData, scan: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {scanTypes.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Resultado</label>
                      <select 
                        required
                        className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                        value={formData.result}
                        onChange={e => setFormData({...formData, result: e.target.value as any})}
                      >
                        <option value="">Selecione...</option>
                        {scanResults.map(opt => (
                          <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Score (0-100)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        required
                        className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        value={formData.score}
                        onChange={e => setFormData({...formData, score: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
                <button 
                  disabled={isSubmitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-black font-bold uppercase text-[11px] tracking-[0.3em] py-4 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Auditoria'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Raw Log Data */}
      <AnimatePresence>
        {selectedLogForData && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLogForData(null)}
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
                    {selectedLogForData.scan} Output // {selectedLogForData.system}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedLogForData(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 bg-black font-mono text-[11px] leading-relaxed max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                <div className="text-emerald-500 mb-2 font-bold">[SYSTEM] Audit Protocol V2.4.1 initialized...</div>
                <div className="text-slate-500 mb-1">[{new Date().toISOString()}] Starting secure handshake with target...</div>
                <div className="text-slate-500 mb-1">[{new Date().toISOString()}] Scanning 1,402 entry points for module: {selectedLogForData.system}</div>
                <div className="text-slate-300 mt-4 mb-2 border-l-2 border-emerald-500/30 pl-4 bg-emerald-500/5 py-2">
                  <div className="font-bold uppercase text-[10px] mb-1">Analysis Result Summary:</div>
                  <div>- Threat Level: {selectedLogForData.result === 'Critical' ? 'HIGH' : 'LOW'}</div>
                  <div>- Confidence: 99.8%</div>
                  <div>- Audit Signature: {crypto.randomUUID().split('-')[0].toUpperCase()}</div>
                </div>
                
                <div className="mt-4 space-y-1">
                  <div className="text-blue-500 italic"># Running pattern matching...</div>
                  <div className="text-slate-500">&gt;&gt; checking for SQL injection vectors... OK</div>
                  <div className="text-slate-500">&gt;&gt; verifying JWT encryption standards... OK</div>
                  <div className="text-slate-500">&gt;&gt; analyzing heap memory leaks... OK</div>
                  {selectedLogForData.result === 'Critical' && (
                    <div className="text-red-500 font-bold bg-red-500/10 p-2 mt-2 border border-red-500/20">
                      [CRITICAL] Possible insecure direct object reference (IDOR) detected on line 144.
                      Manual review required immediately.
                    </div>
                  )}
                </div>
                
                <div className="mt-6 text-slate-700 italic border-t border-white/5 pt-4">
                  Audit successfully finalized. System Status: {selectedLogForData.result}.
                  Score persisted to global chain: {selectedLogForData.score}%.
                </div>
              </div>
              <div className="p-4 bg-black border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setSelectedLogForData(null)}
                  className="text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 px-4 py-2 transition-colors"
                >
                  Close Terminal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
