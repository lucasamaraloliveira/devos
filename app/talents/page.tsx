'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  Zap, 
  Star,
  Mail,
  UserPlus,
  BrainCircuit,
  Database,
  X,
  Loader2,
  Trash2,
  Edit2,
  Check,
  Undo2,
  AlertTriangle,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { collection, onSnapshot, query, orderBy, setDoc, doc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/components/FirebaseProvider';

interface Talent {
  id: string;
  name: string;
  role: string;
  squad: string;
  capacity: number;
  skills: string[];
  ownerId: string;
  createdAt?: any;
}

export default function TalentsPage() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [talentToEdit, setTalentToEdit] = useState<Talent | null>(null);
  const [talentToDelete, setTalentToDelete] = useState<Talent | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [lastDeletedTalent, setLastDeletedTalent] = useState<Talent | null>(null);
  
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    squad: '',
    capacity: 1.0,
    skills: '' // String separada por vírgula para o input
  });

  const [squadOptions, setSquadOptions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [skillOptions, setSkillOptions] = useState<string[]>([]);

  useEffect(() => {
    const unsubSquads = onSnapshot(doc(db, 'app_settings', 'squads'), (docSnap) => {
      if (docSnap.exists()) setSquadOptions(docSnap.data().values || []);
    });
    const unsubRoles = onSnapshot(doc(db, 'app_settings', 'roles'), (docSnap) => {
      if (docSnap.exists()) setRoleOptions(docSnap.data().values || []);
    });
    const unsubSkills = onSnapshot(doc(db, 'app_settings', 'skills'), (docSnap) => {
      if (docSnap.exists()) setSkillOptions(docSnap.data().values || []);
    });
    return () => { unsubSquads(); unsubRoles(); unsubSkills(); };
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'talents'), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Talent[];
      setTalents(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'talents');
    });

    return () => unsubscribe();
  }, []);

  const handleCreateOrUpdateTalent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Faça login para gerenciar talentos.');
    
    setIsSubmitting(true);
    const talentId = talentToEdit ? talentToEdit.id : crypto.randomUUID();
    const skillsArray = formData.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
    
    try {
      const talentData = {
        name: formData.name,
        role: formData.role,
        squad: formData.squad,
        capacity: formData.capacity,
        skills: skillsArray,
        ownerId: user.uid,
      };

      if (talentToEdit) {
        await updateDoc(doc(db, 'talents', talentId), talentData);
      } else {
        await setDoc(doc(db, 'talents', talentId), {
          ...talentData,
          createdAt: serverTimestamp()
        });
      }
      
      setIsModalOpen(false);
      setTalentToEdit(null);
      setFormData({ name: '', role: '', squad: 'Platform', capacity: 1.0, skills: '' });
    } catch (error) {
      handleFirestoreError(error, talentToEdit ? OperationType.UPDATE : OperationType.CREATE, `talents/${talentId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (talent: Talent) => {
    setTalentToEdit(talent);
    setFormData({
      name: talent.name,
      role: talent.role,
      squad: talent.squad,
      capacity: talent.capacity,
      skills: talent.skills.join(', ')
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!talentToDelete) return;
    try {
      setLastDeletedTalent(talentToDelete);
      await deleteDoc(doc(db, 'talents', talentToDelete.id));
      setTalentToDelete(null);
      setShowUndoToast(true);
      setTimeout(() => setShowUndoToast(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `talents/${talentToDelete.id}`);
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedTalent) return;
    try {
      const { id, ...data } = lastDeletedTalent;
      await setDoc(doc(db, 'talents', id), data);
      setShowUndoToast(false);
      setLastDeletedTalent(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `talents/${lastDeletedTalent.id}`);
    }
  };

  // Cálculo dinâmico para o Radar Chart baseado nas skills dos talentos
  const getRadarData = () => {
    const skillCounts: Record<string, number> = {};
    talents.forEach((t: Talent) => {
      t.skills.forEach((skill: string) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    return Object.entries(skillCounts)
      .map(([subject, count]) => ({
        subject,
        A: count * 20, // Multiplicador para escala do radar
        fullMark: Math.max(...Object.values(skillCounts)) * 20 + 20
      }))
      .slice(0, 6); // Limitar a 6 para manter o visual limpo
  };

  const radarData = talents.length > 0 ? getRadarData() : [
    { subject: 'Sem Dados', A: 0, fullMark: 100 },
    { subject: 'Sem Dados', A: 0, fullMark: 100 },
    { subject: 'Sem Dados', A: 0, fullMark: 100 },
    { subject: 'Sem Dados', A: 0, fullMark: 100 },
    { subject: 'Sem Dados', A: 0, fullMark: 100 },
    { subject: 'Sem Dados', A: 0, fullMark: 100 },
  ];
  return (
    <div className="flex flex-col min-h-full">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">Gestão de Talentos</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Skills, Capacity e Performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/settings?cat=squads"
            className="p-2 hover:bg-white/5 rounded-sm text-slate-500 hover:text-white transition-colors border border-white/5"
            title="Configurar Squads/Cargos"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button 
            onClick={() => {
              setTalentToEdit(null);
              setFormData({ name: '', role: '', squad: '', capacity: 1.0, skills: '' });
              setIsModalOpen(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Talento
          </button>
        </div>
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
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
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
                  { label: 'Total de Talentos', value: talents.length, sub: 'Active' },
                  { label: 'Disponibilidade Agregada', value: `${(talents.reduce((acc: number, t: Talent) => acc + (1 - t.capacity), 0) / (talents.length || 1) * 100).toFixed(1)}%`, sub: 'Limited' },
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
                  {talents.some((t: Talent) => t.skills.includes('Go')) 
                    ? `Especialistas em Go detectados no time para sessões de mentoria este sprint.`
                    : `Cadastre talentos com expertises variadas para habilitar mentoria entre squads.`}
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
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Carregando Talentos...</span>
              </div>
            ) : talents.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Users className="w-8 h-8 text-slate-800" />
                <span className="text-xs text-slate-600 font-mono uppercase tracking-widest text-center">
                  Nenhum talento registrado.<br/>Clique em "Adicionar Talento" para começar.
                </span>
              </div>
            ) : talents.map((member: Talent) => (
              <div key={member.id} className="p-4 flex items-center gap-6 hover:bg-white/[0.01] transition-colors group">
                <div className="w-10 h-10 bg-black border border-white/5 rounded flex items-center justify-center font-mono font-bold text-slate-500 text-sm">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-white tracking-tight">{member.name}</span>
                      <span className="text-[9px] text-slate-600 font-mono uppercase border border-white/5 px-1.5 py-0.5 rounded-sm">{member.role}</span>
                   </div>
                   <div className="flex gap-2 mt-1.5 flex-wrap">
                      {member.skills.map((s: string) => (
                        <span key={s} className="text-[9px] text-slate-500 uppercase font-mono px-1.5 bg-black/40 border border-white/5 rounded-sm">{s}</span>
                      ))}
                   </div>
                </div>
                <div className="text-right px-6 border-l border-white/5 shrink-0">
                   <div className="text-[9px] text-slate-600 uppercase font-mono mb-1 text-right">Squad</div>
                   <div className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{member.squad}</div>
                </div>
                <div className="min-w-[150px] px-6 border-l border-white/5">
                  <div className="text-[9px] text-slate-600 uppercase font-mono mb-1 text-right">Ocupação: {member.capacity * 100}%</div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-500", member.capacity > 0.8 ? "bg-amber-500/40" : "bg-emerald-500/40")} style={{ width: `${member.capacity * 100}%` }} />
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => openEditModal(member)}
                    className="p-1.5 hover:bg-white/10 rounded-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500 hover:text-amber-400" />
                  </button>
                  <button 
                    onClick={() => setTalentToDelete(member)}
                    className="p-1.5 hover:bg-white/10 rounded-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Talent Modal */}
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
                    {talentToEdit ? 'Editar Talento' : 'Adicionar Novo Talento'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-tighter italic">DevOS Engine / Human Resources Protocol</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateTalent} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Lucas Silva"
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-800"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Cargo / Função</label>
                    <select 
                      required
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {roleOptions.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Squad</label>
                    <select 
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                      value={formData.squad}
                      onChange={e => setFormData({...formData, squad: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {squadOptions.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Ocupação (0.0 - 1.0)</label>
                    <input 
                      required
                      type="number" 
                      step="0.1"
                      min="0"
                      max="1"
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={formData.capacity}
                      onChange={e => setFormData({...formData, capacity: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Skills (separadas por vírgula)</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Node.js, Go, Kubernetes, React"
                      className="w-full bg-black border border-white/5 p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-800"
                      value={formData.skills}
                      onChange={e => setFormData({...formData, skills: e.target.value})}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skillOptions.map(skill => (
                        <button key={skill} type="button" onClick={() => setFormData({...formData, skills: formData.skills ? `${formData.skills}, ${skill}` : skill})} className="text-[9px] bg-white/5 px-2 py-1 rounded text-slate-400 hover:text-white transition-colors uppercase font-mono">
                          + {skill}
                        </button>
                      ))}
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
                    <>{talentToEdit ? 'Salvar Alterações' : 'Confirmar Registro de Talento'}</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {talentToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTalentToDelete(null)}
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
                <h3 className="text-white font-bold text-lg mb-2">Remover Talento</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  Deseja realmente remover <span className="text-white font-bold italic">"{talentToDelete.name}"</span> do quadro de talentos? Esta ação não pode ser desfeita (exceto via desfazer).
                </p>
                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={confirmDelete}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold uppercase text-[10px] tracking-widest py-4 rounded-sm transition-colors"
                  >
                    Sim, Remover Talento
                  </button>
                  <button 
                    onClick={() => setTalentToDelete(null)}
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

      {/* Undo Toast */}
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
                <span className="text-xs text-white">Talento removido.</span>
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
