'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  Zap, 
  Clock, 
  Shield, 
  DollarSign, 
  BrainCircuit,
  TrendingDown,
  Activity,
  ArrowUpRight,
  Download,
  Check,
  Rocket,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';

const efficiencyData = [
  { name: 'Jan', lead: 12, cycle: 5 },
  { name: 'Fev', lead: 10, cycle: 4 },
  { name: 'Mar', lead: 15, cycle: 6 },
  { name: 'Abr', lead: 9, cycle: 3 },
  { name: 'Mai', lead: 8, cycle: 3 },
];

const cloudCostsData = [
  { name: 'S1', cost: 1200 },
  { name: 'S2', cost: 1450 },
  { name: 'S3', cost: 1100 },
  { name: 'S4', cost: 1600 },
];


export default function DashboardPage() {
  const [isExporting, setIsExporting] = React.useState(false);
  const [systems, setSystems] = React.useState<any[]>([]);
  const [talents, setTalents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Sincronizar Sistemas
    const qSystems = query(collection(db, 'systems'));
    const unsubSystems = onSnapshot(qSystems, (snapshot) => {
      setSystems(snapshot.docs.map(doc => doc.data()));
    });

    // Sincronizar Talentos
    const qTalents = query(collection(db, 'talents'));
    const unsubTalents = onSnapshot(qTalents, (snapshot) => {
      setTalents(snapshot.docs.map(doc => doc.data()));
      setLoading(false);
    });

    // Sincronizar DORA
    const qDora = query(collection(db, 'dora_deployments'));
    const unsubDora = onSnapshot(qDora, (snapshot) => {
      setDoraData(snapshot.docs.map(doc => doc.data()));
    });

    // Sincronizar Incidentes
    const qIncidents = query(collection(db, 'incidents'));
    const unsubIncidents = onSnapshot(qIncidents, (snapshot) => {
      setIncidentData(snapshot.docs.map(doc => doc.data()));
    });

    return () => {
      unsubSystems();
      unsubTalents();
      unsubDora();
      unsubIncidents();
    };
  }, []);

  const [doraData, setDoraData] = React.useState<any[]>([]);
  const [incidentData, setIncidentData] = React.useState<any[]>([]);

  const calculateGlobalHealth = () => {
    if (systems.length === 0) return 0;
    const sum = systems.reduce((acc, sys) => acc + (sys.healthScore || 0), 0);
    return (sum / systems.length).toFixed(1);
  };

  const handleExportVMS = () => {
    setIsExporting(true);
    
    // Simulação de geração de arquivo
    setTimeout(() => {
      const headers = ['Periodo', 'Lead Time (dias)', 'Cycle Time (dias)'];
      const csvContent = [
        headers.join(','),
        ...efficiencyData.map((row: { name: string; lead: number; cycle: number }) => 
          `${row.name},${row.lead},${row.cycle}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `devos_vms_report_${new Date().getFullYear()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
    }, 800);
  };

  const healthScore = calculateGlobalHealth();

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808] shrink-0">
        <div>
          <h2 className="text-white font-medium text-lg tracking-tight">Dashboard Mission Control</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Visão Geral de Engenharia</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Engineering Health Score</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-2xl font-mono font-bold tracking-tighter italic",
                Number(healthScore) > 80 ? "text-emerald-400" : Number(healthScore) > 50 ? "text-amber-400" : "text-red-400"
              )}>
                {healthScore}%
              </span>
              <span className="text-[10px] text-slate-600 font-mono">Real-time</span>
            </div>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <button 
            onClick={handleExportVMS}
            disabled={isExporting}
            className="px-4 py-2 border border-white/10 bg-white/5 text-[10px] text-white uppercase tracking-widest hover:bg-white/10 transition-all font-bold flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {isExporting ? 'Exportado' : 'Exportar VMS'}
          </button>
        </div>
      </header>

      {/* Content Grid */}
      <div className="flex-1 p-8 grid grid-cols-12 gap-6 auto-rows-fr">
        
        {/* Metric 1: Lead Time */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-12 md:col-span-4 bg-[#0C0C0E] border border-white/5 p-6 rounded-sm flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-widest font-mono">Tempo de Entrega (Lead Time)</span>
            <div className="text-3xl font-mono text-white mt-2 font-bold tracking-tight">5.2 <span className="text-sm text-slate-500 font-normal uppercase">dias</span></div>
          </div>
          <div className="mt-4">
            <div className="flex items-end justify-between gap-1 mb-2">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                <div className="absolute left-0 top-0 h-full w-[70%] bg-emerald-500/40"></div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono uppercase text-slate-600">
              <span>Performance: 85%</span>
              <span>IDEAL: 4D</span>
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Cycle Time */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 md:col-span-4 bg-[#0C0C0E] border border-white/5 p-6 rounded-sm flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-widest font-mono">Ciclo de Dev (Cycle Time)</span>
            <div className="text-3xl font-mono text-white mt-2 font-bold tracking-tight">1.8 <span className="text-sm text-slate-500 font-normal uppercase">dias</span></div>
          </div>
          <div className="mt-4">
            <div className="flex items-end justify-between gap-1 mb-2">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                <div className="absolute left-0 top-0 h-full w-[85%] bg-cyan-500/40"></div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono uppercase text-slate-600">
              <span>SLA Met: 100%</span>
              <span>IDEAL: 2D</span>
            </div>
          </div>
        </motion.div>


        {/* Value Stream Chart */}
        <div className="col-span-12 lg:col-span-8 bg-[#0C0C0E] border border-white/5 p-6 rounded-sm flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] text-white uppercase tracking-[0.2em] font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500"></span>
              Mapeamento de Fluxo de Valor (VMS)
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase">
                <span className="w-2 h-2 bg-white/20"></span> Lead
              </div>
              <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-mono uppercase">
                <span className="w-2 h-2 bg-emerald-500/60"></span> Cycle
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficiencyData}>
                <defs>
                  <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                  fontFamily="monospace"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontFamily: 'monospace' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="lead" 
                  stroke="#475569" 
                  fill="transparent" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Area 
                  type="monotone" 
                  dataKey="cycle" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorEmerald)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t border-white/5 pt-6">
            {[
              { label: 'Gargalo de Fluxo', value: 'Aprovação Legal', info: '+14h delay', color: 'text-amber-500' },
              { label: 'Eficiência de Entrega', value: '88%', info: 'Ideal Range', color: 'text-emerald-500' },
              { label: 'Volume de Deploy', value: '42 p/ sem', info: 'High Frequency', color: 'text-slate-300' },
              { label: 'Qualidade (MTTR)', value: '45 min', info: 'Excelente', color: 'text-emerald-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="text-[9px] text-slate-500 uppercase mb-1 font-mono">{item.label}</div>
                <div className="text-xs text-white font-bold tracking-tight">{item.value}</div>
                <div className={cn("text-[9px] mt-1 font-mono", item.color)}>{item.info}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Predictability */}
        <div className="col-span-12 lg:col-span-4 bg-[#111114] border border-white/10 p-6 rounded-sm flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-1.5 bg-blue-500/10 rounded-full">
              <BrainCircuit className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-[11px] text-white uppercase tracking-[0.2em] font-bold">Insights IA DevOS</h3>
          </div>
          
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Risco de Prazo: Squad Phoenix</span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[9px] font-bold rounded uppercase">Médio</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Padrão de commits sugere atraso de 2 dias na entrega da Feature #402 baseado na complexidade histórica.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 p-4 bg-white/5 border-l-2 border-emerald-500 rounded-r-md">
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3" /> Sugestão de Alocação
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed italic">
                Ociosidade detectada em Backend Node.js no Squad Alfa. Recomenda-se migração temporária para Task #12 para equilibrar carga.
              </p>
            </div>

            <div className="mt-auto pt-8 border-t border-white/5">
              <div className="text-[10px] text-slate-500 uppercase mb-4 font-mono">Saúde de Segurança (SAST/DAST)</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#080808] p-4 rounded border border-white/5 transition-all hover:border-red-500/30">
                  <div className="text-xl font-mono text-white font-bold">0</div>
                  <div className="text-[9px] text-slate-600 font-mono uppercase mt-1">CRÍTICO</div>
                </div>
                <div className="bg-[#080808] p-4 rounded border border-white/5 transition-all hover:border-blue-500/30">
                  <div className="text-xl font-mono text-white font-bold">14</div>
                  <div className="text-[9px] text-slate-600 font-mono uppercase mt-1">LOW RISK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
