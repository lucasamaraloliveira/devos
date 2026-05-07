'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Database, 
  ShieldCheck, 
  Users, 
  Wallet,
  Check,
  X,
  Loader2,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { collection, onSnapshot, updateDoc, setDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/components/FirebaseProvider';

import { useSearchParams } from 'next/navigation';

const categories = [
  { id: 'inventory_status', name: 'Status de Ativo', icon: Database, color: 'text-blue-500' },
  { id: 'scan_types', name: 'Tipos de Scan', icon: ShieldCheck, color: 'text-emerald-500' },
  { id: 'scan_results', name: 'Resultados de Scan', icon: ShieldCheck, color: 'text-amber-500' },
  { id: 'squads', name: 'Squads', icon: Users, color: 'text-purple-500' },
  { id: 'skills', name: 'Skills / Competências', icon: Users, color: 'text-pink-500' },
  { id: 'roles', name: 'Cargos / Funções', icon: Users, color: 'text-indigo-500' },
  { id: 'providers', name: 'Cloud Providers', icon: Wallet, color: 'text-cyan-500' },
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat');
  
  const initialCategory = categories.find(c => c.id === catParam) || categories[0];
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [allConfigs, setAllConfigs] = useState<Record<string, string[]>>({});
  const [newOption, setNewOption] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const [usageCounts, setUsageCounts] = useState<Record<string, Record<string, number>>>({});
  
  const { user } = useAuth();

  useEffect(() => {
    // Sincronizar todas as configurações para os indicadores laterais
    const unsubConfigs = onSnapshot(collection(db, 'app_settings'), (snapshot) => {
      const data: Record<string, string[]> = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data().values || [];
      });
      setAllConfigs(data);
      setLoading(false);
    });

    // Sincronizar contagens de uso real do sistema
    const unsubInventory = onSnapshot(collection(db, 'systems'), (snap) => {
      const counts: Record<string, number> = {};
      snap.docs.forEach(doc => {
        const status = doc.data().status;
        counts[status] = (counts[status] || 0) + 1;
      });
      setUsageCounts(prev => ({ ...prev, inventory_status: counts }));
    });

    const unsubTalents = onSnapshot(collection(db, 'talents'), (snap) => {
      const squadCounts: Record<string, number> = {};
      const roleCounts: Record<string, number> = {};
      const skillCounts: Record<string, number> = {};
      
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.squad) squadCounts[data.squad] = (squadCounts[data.squad] || 0) + 1;
        if (data.role) roleCounts[data.role] = (roleCounts[data.role] || 0) + 1;
        if (data.skills) {
          const skillsList = typeof data.skills === 'string' 
            ? data.skills.split(',') 
            : Array.isArray(data.skills) 
              ? data.skills 
              : [];
          
          skillsList.forEach((s: any) => {
            const skill = String(s).trim();
            if (skill) skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        }
      });
      setUsageCounts(prev => ({ ...prev, squads: squadCounts, roles: roleCounts, skills: skillCounts }));
    });

    const unsubGovernance = onSnapshot(collection(db, 'governance_logs'), (snap) => {
      const scanCounts: Record<string, number> = {};
      const resultCounts: Record<string, number> = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        scanCounts[data.scan] = (scanCounts[data.scan] || 0) + 1;
        resultCounts[data.result] = (resultCounts[data.result] || 0) + 1;
      });
      setUsageCounts(prev => ({ ...prev, scan_types: scanCounts, scan_results: resultCounts }));
    });

    const unsubFinOps = onSnapshot(collection(db, 'finops_costs'), (snap) => {
      const providerCounts: Record<string, number> = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        providerCounts[data.provider] = (providerCounts[data.provider] || 0) + 1;
      });
      setUsageCounts(prev => ({ ...prev, providers: providerCounts }));
    });

    return () => {
      unsubConfigs();
      unsubInventory();
      unsubTalents();
      unsubGovernance();
      unsubFinOps();
    };
  }, []);

  const currentOptions = allConfigs[activeCategory.id] || [];

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOption.trim() || !user) return;
    
    setSaving(true);
    const docRef = doc(db, 'app_settings', activeCategory.id);
    const updatedOptions = [...currentOptions, newOption.trim()];
    
    try {
      await setDoc(docRef, { values: updatedOptions }, { merge: true });
      setNewOption('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `settings/${activeCategory.id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditOption = async (index: number) => {
    if (!editValue.trim() || !user) return;
    
    setSaving(true);
    const docRef = doc(db, 'app_settings', activeCategory.id);
    const updatedOptions = [...currentOptions];
    updatedOptions[index] = editValue.trim();
    
    try {
      await updateDoc(docRef, { values: updatedOptions });
      setEditingIndex(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `settings/${activeCategory.id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOption = async (optionToDelete: string) => {
    if (!confirm(`Excluir "${optionToDelete}"?`)) return;
    
    setSaving(true);
    const docRef = doc(db, 'app_settings', activeCategory.id);
    const updatedOptions = currentOptions.filter(o => o !== optionToDelete);
    
    try {
      await updateDoc(docRef, { values: updatedOptions });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `settings/${activeCategory.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">Configurações do Sistema</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Gerenciamento de Atributos Globais</p>
        </div>
      </header>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-1 space-y-1">
          {categories.map(cat => {
            const count = allConfigs[cat.id]?.length || 0;
            const isActive = activeCategory.id === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat);
                  setEditingIndex(null);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-sm text-[11px] font-bold uppercase tracking-widest transition-all group",
                  isActive 
                    ? "bg-white/5 text-white border border-white/10" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center gap-3">
                  <cat.icon className={cn("w-4 h-4", isActive ? cat.color : "text-slate-600 group-hover:text-slate-400")} />
                  {cat.name}
                </div>
                {count > 0 && (
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded-full border",
                    isActive ? "border-emerald-500/50 text-emerald-500" : "border-white/5 text-slate-700"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Editor */}
        <div className="lg:col-span-3 bg-[#0C0C0E] border border-white/5 rounded-sm p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded flex items-center justify-center bg-black border border-white/5")}>
                <activeCategory.icon className={cn("w-5 h-5", activeCategory.color)} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-widest">{activeCategory.name}</h3>
                <p className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter">Editando lista global</p>
              </div>
            </div>
            {saving && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
          </div>

          <form onSubmit={handleAddOption} className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder={`Novo(a) ${activeCategory.name}...`}
                className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                value={newOption}
                onChange={e => setNewOption(e.target.value)}
                disabled={loading}
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !newOption.trim() || saving}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-900 text-black px-6 font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-14 bg-white/[0.02] animate-pulse rounded-sm" />
              ))
            ) : currentOptions.length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-white/5 rounded-sm flex flex-col items-center gap-4">
                <AlertCircle className="w-8 h-8 text-slate-800" />
                <p className="text-[10px] text-slate-600 uppercase font-mono tracking-widest">Nenhum registro encontrado nesta categoria</p>
              </div>
            ) : currentOptions.map((opt, index) => (
              <motion.div 
                layout
                key={opt + index}
                className={cn(
                  "flex items-center justify-between p-4 bg-black/40 border transition-all group",
                  editingIndex === index ? "border-emerald-500/50" : "border-white/5 hover:border-white/10"
                )}
              >
                {editingIndex === index ? (
                  <div className="flex items-center gap-2 w-full">
                    <input 
                      autoFocus
                      type="text"
                      className="flex-1 bg-black text-xs text-white p-1 focus:outline-none"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEditOption(index)}
                    />
                    <button onClick={() => handleEditOption(index)} className="text-emerald-500 p-1 hover:bg-emerald-500/10 rounded"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingIndex(null)} className="text-slate-500 p-1 hover:bg-white/5 rounded"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-200 font-bold uppercase tracking-tight">{opt}</span>
                      {usageCounts[activeCategory.id]?.[opt] !== undefined && (
                        <span className="text-[9px] text-slate-600 font-mono uppercase mt-0.5">
                          {usageCounts[activeCategory.id][opt]} {usageCounts[activeCategory.id][opt] === 1 ? 'registro vinculado' : 'registros vinculados'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => {
                          setEditingIndex(index);
                          setEditValue(opt);
                        }}
                        className="p-1.5 hover:bg-amber-500/10 rounded text-slate-500 hover:text-amber-500 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteOption(opt)}
                        className="p-1.5 hover:bg-red-500/10 rounded text-slate-500/50 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
