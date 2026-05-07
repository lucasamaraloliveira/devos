'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Code2,
  User,
  ArrowUpRight,
  MoreVertical,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/FirebaseProvider';

interface System {
  id: string;
  name: string;
  language: string;
  ownerId: string;
  technicalDebt: number;
  status: string;
  healthScore: number;
  createdAt?: any;
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    language: '',
    status: 'active',
    healthScore: 100,
    technicalDebt: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'systems'), orderBy('healthScore', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as System[];
      setSystems(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'systems');
    });

    return () => unsubscribe();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Você precisa estar logado para adicionar um ativo.');
    
    setIsSubmitting(true);
    const systemId = crypto.randomUUID();
    
    try {
      await setDoc(doc(db, 'systems', systemId), {
        ...formData,
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({ name: '', language: '', status: 'active', healthScore: 100, technicalDebt: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `systems/${systemId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSystems = systems.filter(sys => 
    sys.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sys.language.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">Inventário de Software</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Controle de Ativos de Engenharia</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> Novo Ativo
        </button>
      </header>

      <div className="p-8">
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Filtro rápido: buscar sistema ou linguagem..."
              className="w-full bg-[#0C0C0E] border border-white/5 rounded-sm py-2.5 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-white/10 transition-colors text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-[#0C0C0E] border border-white/5 px-4 py-2 rounded-sm text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white flex items-center gap-2 transition-colors">
            <Filter className="w-3 h-3" /> Avançado
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-mono">Sincronizando com o Cloud...</span>
          </div>
        ) : filteredSystems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-sm">
            <Code2 className="w-12 h-12 text-slate-800 mb-4" />
            <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest">Nenhum ativo encontrado</h3>
            <p className="text-[10px] text-slate-600 mt-2 font-mono">Inicie o mapeamento clicando em "Novo Ativo"</p>
          </div>
        ) : (
          <div className="bg-[#0C0C0E] border border-white/5 rounded-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-black/20">
                  <th className="p-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Asset / Engine</th>
                  <th className="p-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center">Health</th>
                  <th className="p-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Owner ID</th>
                  <th className="p-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center">Debt</th>
                  <th className="p-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSystems.map((sys, i) => (
                  <motion.tr 
                    key={sys.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black border border-white/5 rounded flex items-center justify-center group-hover:border-emerald-500/30 transition-colors">
                          <Code2 className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-white tracking-tight">{sys.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{sys.language}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "text-[11px] font-mono font-bold italic",
                        sys.healthScore > 90 ? "text-emerald-500" : sys.healthScore > 70 ? "text-amber-500" : "text-red-500"
                      )}>
                        {sys.healthScore}%
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-slate-600" />
                        <span className="text-[11px] text-slate-500 font-mono truncate max-w-[120px]">{sys.ownerId}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-[10px] font-mono font-bold mb-1.5",
                          sys.technicalDebt > 50 ? "text-red-400" : "text-slate-500"
                        )}>
                          {sys.technicalDebt}%
                        </span>
                        <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full", sys.technicalDebt > 50 ? "bg-red-500/50" : "bg-slate-700")} 
                            style={{ width: `${sys.technicalDebt}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest border",
                        sys.status === 'active' ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : "border-slate-800 text-slate-500 bg-transparent"
                      )}>
                        {sys.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-white/5 rounded text-slate-500 hover:text-white">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 hover:bg-white/5 rounded text-slate-500 hover:text-white">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Asset Modal */}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0A0B] border border-white/10 rounded-sm shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest">Registrar Novo Ativo</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-tighter italic">DevOS Engine / Inventory Protocol</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAsset} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Nome do Sistema</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Auth Service Gateway"
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-800"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Linguagem / Stack</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Node.js, Go, Python"
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-800"
                      value={formData.language}
                      onChange={e => setFormData({...formData, language: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Status Inicial</label>
                    <select 
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="active">ATIVO (PRODUCTION)</option>
                      <option value="maintained">MANUTENÇÃO</option>
                      <option value="deprecated">DEPRECATED</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Health Score (0-100)</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      max="100"
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={formData.healthScore}
                      onChange={e => setFormData({...formData, healthScore: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Dívida Técnica (%)</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      max="100"
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={formData.technicalDebt}
                      onChange={e => setFormData({...formData, technicalDebt: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:cursor-not-allowed text-black font-black uppercase text-[11px] tracking-[0.3em] py-4 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>Sincronizando... <Loader2 className="w-4 h-4 animate-spin" /></>
                  ) : (
                    <>Confirmar Registro de Ativo</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
