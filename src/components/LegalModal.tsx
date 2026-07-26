
import React, { useState } from 'react';

interface Props {
  initialTab?: 'PRIVACY' | 'SECURITY' | 'TERMS';
  onClose: () => void;
}

export const LegalModal: React.FC<Props> = ({ initialTab = 'PRIVACY', onClose }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-950 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <i className="fa-solid fa-scale-balanced text-blue-600"></i> Centro Legal Biz-Flow
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition">
            <i className="fa-solid fa-times text-slate-500"></i>
          </button>
        </div>

        {/* Layout */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar */}
          <div className="w-1/3 md:w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-2 overflow-y-auto">
             <button 
                onClick={() => setActiveTab('PRIVACY')}
                className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'PRIVACY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
             >
                Política de Privacidade
             </button>
             <button 
                onClick={() => setActiveTab('SECURITY')}
                className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'SECURITY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
             >
                Segurança de Dados
             </button>
             <button 
                onClick={() => setActiveTab('TERMS')}
                className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'TERMS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
             >
                Termos de Uso
             </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 leading-relaxed text-sm scrollbar-thin">
            
            {activeTab === 'PRIVACY' && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">1. Política de Privacidade – Biz-Flow</h3>
                <p>O Biz-flow, desenvolvido por <strong>Elias Chanisso</strong>, valoriza a sua privacidade e protege os seus dados pessoais. Esta política explica como recolhemos, utilizamos e protegemos as suas informações.</p>

                <h4 className="font-bold text-slate-900 dark:text-white mt-4">Armazenamento de dados (Local vs. Nuvem)</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Uso Offline:</strong> Dados armazenados exclusivamente no seu dispositivo. O desenvolvedor não tem qualquer acesso.</li>
                  <li><strong>Uso Web/Nuvem:</strong> Dados transmitidos e armazenados de forma segura nos nossos servidores para sincronização entre dispositivos. Requer e-mail para criação de conta.</li>
                </ul>

                <h4 className="font-bold text-slate-900 dark:text-white mt-4">Permissões do dispositivo</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Câmara:</strong> Exclusivamente para leitura de códigos (escanear).</li>
                  <li><strong>GPS:</strong> Para funcionalidades de rastreamento e registo geográfico.</li>
                  <li><strong>Notificações:</strong> Para alertas e atualizações importantes.</li>
                </ul>

                <h4 className="font-bold text-slate-900 dark:text-white mt-4">Uso e partilha de informações</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Informações usadas apenas para prestação do serviço, autenticação e sincronização.</li>
                  <li>Não vendemos, alugamos ou partilhamos dados com terceiros para marketing ou publicidade.</li>
                </ul>

                <h4 className="font-bold text-slate-900 dark:text-white mt-4">Direito ao esquecimento</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Pode solicitar a eliminação completa da sua conta e dados através da opção "Eliminar Conta" nas definições ou por e-mail.</li>
                  <li>Após confirmação, todos os dados sincronizados são permanentemente apagados.</li>
                </ul>

                <h4 className="font-bold text-slate-900 dark:text-white mt-4">Legislação aplicável</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Regida pelas leis da República de Moçambique.</li>
                </ul>

                <h4 className="font-bold text-slate-900 dark:text-white mt-4">Contacto</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>WhatsApp: +258 840 636 794</li>
                  <li>Email: bizflow.cloud83@gmail.com</li>
                </ul>
              </div>
            )}

            {activeTab === 'SECURITY' && (
              <div className="space-y-6 animate-fadeIn">
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">2. Política de Segurança / Proteção de Dados – Biz-Flow</h3>
                 <p>Biz-Flow adota medidas técnicas e organizacionais para proteger seus dados e garantir confiabilidade da plataforma:</p>

                 <h4 className="font-bold text-slate-900 dark:text-white mt-4">Medidas de segurança</h4>
                 <ul className="list-disc pl-5 space-y-1">
                   <li>Criptografia de ponta a ponta (SSL/TLS) nas transmissões de dados.</li>
                   <li>Senhas armazenadas com hashing seguro.</li>
                   <li>Backup diário em servidores seguros na nuvem.</li>
                   <li>Monitoramento contínuo para detectar atividades suspeitas.</li>
                 </ul>

                 <h4 className="font-bold text-slate-900 dark:text-white mt-4">Responsabilidade do usuário</h4>
                 <ul className="list-disc pl-5 space-y-1">
                   <li>Mantenha sua senha segura e confidencial.</li>
                   <li>Informe imediatamente caso perceba acesso não autorizado à sua conta.</li>
                   <li>Evite compartilhar informações sensíveis fora da plataforma.</li>
                 </ul>

                 <h4 className="font-bold text-slate-900 dark:text-white mt-4">Conformidade</h4>
                 <ul className="list-disc pl-5 space-y-1">
                   <li>Adequado às normas internacionais de proteção de dados.</li>
                   <li>Podemos atualizar a política para atender legislações locais, como GDPR (UE) ou LGPD (Brasil).</li>
                 </ul>
              </div>
            )}

            {activeTab === 'TERMS' && (
              <div className="space-y-6 animate-fadeIn">
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">3. Termos de Serviço – Biz-Flow</h3>
                 <p>Ao utilizar o Biz-flow (biz-flow.cloud), desenvolvido por <strong>Elias Chanisso</strong>, o utilizador concorda com os seguintes termos:</p>

                 <h4 className="font-bold text-slate-900 dark:text-white mt-4">Uso do serviço e responsabilidades</h4>
                 <ul className="list-disc pl-5 space-y-1">
                   <li>O Biz-flow é uma ferramenta de gestão e fluxo de trabalho.</li>
                   <li>O utilizador é responsável pela exatidão e legalidade dos dados inseridos.</li>
                   <li>É proibido usar a plataforma para fins ilegais ou fraudulentos.</li>
                 </ul>

                 <h4 className="font-bold text-slate-900 dark:text-white mt-4">Contas e segurança</h4>
                 <ul className="list-disc pl-5 space-y-1">
                   <li>Necessário e-mail válido para funcionalidades de nuvem.</li>
                   <li>Utilizador responsável pela confidencialidade das credenciais.</li>
                 </ul>

                 <h4 className="font-bold text-slate-900 dark:text-white mt-4">Propriedade intelectual</h4>
                 <ul className="list-disc pl-5 space-y-1">
                   <li>Código, design e interface são propriedade exclusiva de Elias Chanisso.</li>
                   <li>Proibido copiar, modificar ou fazer engenharia reversa sem autorização.</li>
                 </ul>

                 <h4 className="font-bold text-slate-900 dark:text-white mt-4">Limitação de responsabilidade</h4>
                 <ul className="list-disc pl-5 space-y-1">
                   <li>Serviço fornecido "tal como está". Não garantimos disponibilidade ininterrupta.</li>
                   <li>Não nos responsabilizamos por perdas financeiras ou danos indiretos.</li>
                 </ul>

                 <h4 className="font-bold text-slate-900 dark:text-white mt-4">Modificações e legislação</h4>
                 <ul className="list-disc pl-5 space-y-1">
                   <li>Termos podem ser alterados mediante notificação. Uso contínuo implica aceitação.</li>
                   <li>Regidos pela legislação de Moçambique. Conflitos resolvidos nos tribunais competentes.</li>
                 </ul>
              </div>
            )}

          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-right">
           <button onClick={onClose} className="bg-slate-900 dark:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition">
             Fechar
           </button>
        </div>
      </div>
    </div>
  );
};
