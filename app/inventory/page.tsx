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
  Loader2,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Undo2,
  Calendar,
  Activity,
  History,
  Shield,
  Clock,
  Edit2,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy, setDoc, doc, serverTimestamp, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
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
  
  // Novos estados para modais e Undo
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [systemToDelete, setSystemToDelete] = useState<System | null>(null);
  const [lastDeletedSystem, setLastDeletedSystem] = useState<System | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  
  // Estado para Edição
  const [systemToEdit, setSystemToEdit] = useState<System | null>(null);
  
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    language: '',
    status: 'active',
    healthScore: 100,
    technicalDebt: 0
  });

  const [statusOptions, setStatusOptions] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_settings', 'inventory_status'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().values?.length > 0) {
        setStatusOptions(docSnap.data().values);
        if (!systemToEdit) {
           setFormData(prev => ({ ...prev, status: docSnap.data().values[0] }));
        }
      }
    });
    return () => unsub();
  }, [systemToEdit]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'systems', id), {
        status: newStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `systems/${id}`);
    }
  };

  const confirmDelete = async () => {
    if (!systemToDelete) return;
    
    try {
      setLastDeletedSystem(systemToDelete);
      await deleteDoc(doc(db, 'systems', systemToDelete.id));
      setSystemToDelete(null);
      setShowUndoToast(true);
      
      // Esconde o toast após 5 segundos
      setTimeout(() => setShowUndoToast(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `systems/${systemToDelete.id}`);
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedSystem) return;
    
    try {
      const { id, ...data } = lastDeletedSystem;
      await setDoc(doc(db, 'systems', id), data);
      setShowUndoToast(false);
      setLastDeletedSystem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `systems/${lastDeletedSystem.id}`);
    }
  };

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

  const handleCreateOrUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Você precisa estar logado para realizar esta ação.');

    setIsSubmitting(true);
    const systemId = systemToEdit ? systemToEdit.id : crypto.randomUUID();

    try {
      if (systemToEdit) {
        await updateDoc(doc(db, 'systems', systemId), {
          ...formData,
        });
      } else {
        await setDoc(doc(db, 'systems', systemId), {
          ...formData,
          ownerId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setSystemToEdit(null);
      setFormData({ name: '', language: '', status: 'active', healthScore: 100, technicalDebt: 0 });
    } catch (error) {
      handleFirestoreError(error, systemToEdit ? OperationType.UPDATE : OperationType.CREATE, `systems/${systemId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (system: System) => {
    setSystemToEdit(system);
    setFormData({
      name: system.name,
      language: system.language,
      status: system.status,
      healthScore: system.healthScore,
      technicalDebt: system.technicalDebt
    });
    setIsModalOpen(true);
  };

  const handleNumericChange = (field: 'healthScore' | 'technicalDebt', value: string) => {
    let num = parseInt(value);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > 100) num = 0; // Ou 100 dependendo da preferência, mas 0 permite apagar e digitar
    
    // Se o usuário digitar algo como "150", limitamos a 100
    const finalValue = Math.min(100, Math.max(0, num));
    
    setFormData({ ...formData, [field]: finalValue });
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
        <div className="flex items-center gap-3">
          <Link 
            href="/settings?cat=inventory_status"
            className="p-2 hover:bg-white/5 rounded-sm text-slate-500 hover:text-white transition-colors border border-white/5"
            title="Configurar Status"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              setSystemToEdit(null);
              setFormData({ name: '', language: '', status: 'active', healthScore: 100, technicalDebt: 0 });
              setIsModalOpen(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Ativo
          </button>
        </div>
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
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(sys);
                          }}
                          title="Editar Ativo"
                          className="p-1.5 hover:bg-amber-500/10 rounded text-slate-500 hover:text-amber-400 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSystem(sys);
                          }}
                          title="Abrir Detalhes"
                          className="p-1.5 hover:bg-emerald-500/10 rounded text-slate-500 hover:text-emerald-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSystemToDelete(sys);
                          }}
                          title="Excluir Ativo"
                          className="p-1.5 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest">
                    {systemToEdit ? 'Editar Ativo' : 'Registrar Novo Ativo'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-tighter italic">DevOS Engine / Inventory Protocol</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateAsset} className="p-6 space-y-6">
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
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Health Score (0-100%)</label>
                    <div className="relative">
                      <input 
                        required
                        type="number" 
                        min="0"
                        max="100"
                        className="w-full bg-black border border-white/5 p-3 pr-10 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        value={formData.healthScore}
                        onChange={e => handleNumericChange('healthScore', e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-mono">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Dívida Técnica (%)</label>
                    <div className="relative">
                      <input 
                        required
                        type="number" 
                        min="0"
                        max="100"
                        className="w-full bg-black border border-white/5 p-3 pr-10 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        value={formData.technicalDebt}
                        onChange={e => handleNumericChange('technicalDebt', e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-mono">%</span>
                    </div>
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
                    <>{systemToEdit ? 'Salvar Alterações' : 'Confirmar Registro de Ativo'}</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {selectedSystem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSystem(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-2xl bg-[#080808] border border-white/10 rounded-sm shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50" />
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center">
                      <Code2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl text-white font-bold tracking-tight mb-1">{selectedSystem.name}</h2>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">{selectedSystem.language}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          selectedSystem.status === 'active' ? "text-emerald-500" : "text-red-500"
                        )}>
                          {selectedSystem.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {statusOptions.map(opt => (
                        <button 
                          key={opt}
                          onClick={() => handleUpdateStatus(selectedSystem.id, opt)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-tighter transition-all",
                            selectedSystem.status === opt 
                              ? "bg-emerald-500 text-black font-bold" 
                              : "bg-white/5 text-slate-500 hover:text-white border border-white/5"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setSelectedSystem(null)}
                      className="p-2 hover:bg-white/5 rounded-full text-slate-600 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 mb-12">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <Activity className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Health Score</span>
                    </div>
                    <div className="text-2xl font-mono text-emerald-400 font-bold">{selectedSystem.healthScore}%</div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <Shield className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Dívida Técnica</span>
                    </div>
                    <div className="text-2xl font-mono text-amber-400 font-bold">{selectedSystem.technicalDebt}%</div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Protocolo</span>
                    </div>
                    <div className="text-[11px] font-mono text-white font-bold">V-2.0.5</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" /> Log de Auditoria
                    </h4>
                    <div className="space-y-3">
                      {[1, 2].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 border border-white/5 rounded-sm text-[11px]">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-3 h-3 text-slate-700" />
                            <span className="text-slate-400">Status atualizado para <span className="text-emerald-500">Ativo</span></span>
                          </div>
                          <span className="text-slate-600 font-mono">24.05.2026</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex gap-4">
                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded-sm transition-colors border border-white/10">
                      Abrir Repositório
                    </button>
                    <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-bold uppercase tracking-widest py-3 rounded-sm transition-colors">
                      Ver no Cloud Console
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {systemToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSystemToDelete(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0C0C0E] border border-red-500/20 rounded-sm shadow-2xl overflow-hidden p-8"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Confirmar Exclusão</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  Você está prestes a remover <span className="text-white font-bold italic">"{systemToDelete.name}"</span> do inventário. Esta ação removerá o sistema de todos os dashboards.
                </p>
                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={confirmDelete}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold uppercase text-[10px] tracking-widest py-4 rounded-sm transition-colors"
                  >
                    Sim, Excluir Ativo
                  </button>
                  <button 
                    onClick={() => setSystemToDelete(null)}
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-widest py-4 rounded-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast de Desfazer (Undo) */}
      <AnimatePresence>
        {showUndoToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-[130]"
          >
            <div className="bg-[#111114] border border-emerald-500/30 px-6 py-4 rounded-sm shadow-2xl flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-white">Ativo removido com sucesso.</span>
              </div>
              <button 
                onClick={handleUndoDelete}
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold uppercase text-[10px] tracking-widest transition-colors bg-emerald-500/10 px-3 py-2 rounded-sm"
              >
                <Undo2 className="w-3 h-3" /> Desfazer
              </button>
              <button 
                onClick={() => setShowUndoToast(false)}
                className="text-slate-600 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
