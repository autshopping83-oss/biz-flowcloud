
import React, { useState } from 'react';
import { Logo } from './Logo';

interface Props {
  onStart: () => void;
  onLogin: () => void;
  onOpenLegal: (tab: 'PRIVACY' | 'SECURITY' | 'TERMS') => void;
}

export const LandingPage: React.FC<Props> = ({ onStart, onLogin, onOpenLegal }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-white overflow-x-hidden selection:bg-blue-500 selection:text-white">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <Logo className="w-8 h-8 md:w-10 md:h-10" />
            <span className="font-black text-xl md:text-2xl tracking-tighter">Biz-Flow<span className="text-blue-600">.cloud</span></span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
            <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 transition-colors">Funcionalidades</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-blue-600 transition-colors">Preços</button>
            
            <button onClick={onLogin} className="hover:text-blue-600 transition-colors">Entrar</button>
            <button onClick={onStart} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl active:scale-95">
              Começar Grátis
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-2xl">
            <i className={`fa-solid ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-20 bg-white dark:bg-slate-950 z-40 p-6 flex flex-col gap-6 md:hidden animate-fadeIn">
           <button onClick={() => scrollToSection('features')} className="text-xl font-bold py-2 border-b border-slate-100 dark:border-slate-800 text-left">Funcionalidades</button>
           <button onClick={() => scrollToSection('pricing')} className="text-xl font-bold py-2 border-b border-slate-100 dark:border-slate-800 text-left">Preços</button>
           
            <button onClick={onLogin} className="text-xl font-bold py-2 border-b border-slate-100 dark:border-slate-800 text-left text-slate-600 dark:text-slate-300">Entrar na Conta</button>
           <button onClick={onStart} className="bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg">Criar Conta Grátis</button>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 animate-slideDown">
            Simples • Rápido • Profissional
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight animate-slideUp">
            Gerencie seu negócio <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">sem complicação.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-slideUp" style={{ animationDelay: '0.1s' }}>
            Crie faturas, recibos e orçamentos ilimitados. Controle suas finanças e clientes em um único lugar, acessível de qualquer dispositivo.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <button onClick={onStart} className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all">
              Começar Agora
            </button>
            <button onClick={onLogin} className="w-full md:w-auto bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              Acessar Conta
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
             <Logo className="w-6 h-6 grayscale opacity-50" />
             <span className="font-bold text-slate-400">Biz-Flow &copy; {new Date().getFullYear()}</span>
           </div>
           <div className="flex gap-6 text-sm font-medium text-slate-500">
             <button onClick={() => onOpenLegal('PRIVACY')} className="hover:text-blue-600">Privacidade</button>
             <button onClick={() => onOpenLegal('TERMS')} className="hover:text-blue-600">Termos</button>
           </div>
        </div>
      </footer>
    </div>
  );
};
