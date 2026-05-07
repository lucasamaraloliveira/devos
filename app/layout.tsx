import type {Metadata} from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'DevOS - Sistema Nervoso da Engenharia',
  description: 'Plataforma de Software Development Management (SDMS) de alta performance.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body suppressHydrationWarning className="bg-[#050505] text-slate-300 antialiased font-sans">
        <FirebaseProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <main className="flex-1 overflow-y-auto bg-[#050505]">
                {children}
              </main>
              {/* Status Bar */}
              <div className="h-8 bg-[#050505] border-t border-white/5 px-8 flex items-center justify-between text-[9px] uppercase tracking-widest text-slate-600 shrink-0">
                <div className="flex gap-6">
                  <span>Node: v20.12.0</span>
                  <span>Região: US-EAST-1 (Healthy)</span>
                  <span>Última Sincronização: Agora</span>
                </div>
                <div className="font-mono">DevOS Engine v1.0.42-STABLE</div>
              </div>
            </div>
          </div>
        </FirebaseProvider>
      </body>
    </html>
  );
}
