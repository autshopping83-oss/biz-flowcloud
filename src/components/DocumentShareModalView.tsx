import React from 'react';
import { ReceiptData, CompanySettings } from '../types';

interface DocumentShareModalViewProps {
  formData: ReceiptData;
  companySettings: CompanySettings;
  userId?: string;
  isGeneratingPdf: boolean;
  isPrinting: boolean;
  onGeneratePDF: () => Promise<void>;
  onPrintThermal: () => Promise<void>;
  onClose: () => void;
  t: (key: string) => string;
  fMoney: (val: number) => string;
  recipientName: string;
  setRecipientName: (v: string) => void;
  recipientPhone: string;
  setRecipientPhone: (v: string) => void;
  isSending: boolean;
  sendResult: { success: boolean; message: string } | null;
  handleSend: (method: 'whatsapp') => void;
  handleDownload: () => void;
  handlePrint: () => void;
}

const documentTypeLabel = (type: string) =>
  type === 'INVOICE' ? 'Fatura' : type === 'INVOICE_RECEIPT' ? 'Fatura-Recibo' : type === 'QUOTE' ? 'Orçamento' : 'Recibo';

export const DocumentShareModalView: React.FC<DocumentShareModalViewProps> = ({
  formData, isGeneratingPdf, isPrinting, onClose, fMoney,
  recipientName, setRecipientName, recipientPhone, setRecipientPhone,
  isSending, sendResult, handleSend, handleDownload, handlePrint,
}) => {
  const renderOption = (icon: string, iconBg: string, iconColor: string, title: string, desc: string, onClick: () => void) => (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group">
      <div className={`w-12 h-12 rounded-xl ${iconBg} dark:bg-emerald-900/30 flex items-center justify-center ${iconColor} dark:text-emerald-400 group-hover:scale-110 transition-transform`}>
        <i className={`${icon} text-xl`}></i>
      </div>
      <div className="flex-1 text-left">
        <p className="font-bold dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
      <i className="fa-solid fa-chevron-right text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors"></i>
    </button>
  );

  const handleWhatsApp = () => {
    handleSend('whatsapp');
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold dark:text-white">Compartilhar Documento</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {documentTypeLabel(formData.type)} <span className="font-mono font-bold">#{formData.number}</span>
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Fechar">
              <i className="fa-solid fa-times text-slate-500"></i>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <i className="fa-solid fa-file-invoice"></i>
              </div>
              <div>
                <p className="text-sm font-bold dark:text-white">{formData.clientName || 'Cliente'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formData.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-blue-600 dark:text-blue-400">{fMoney(formData.total)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{formData.currency}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Escolha como deseja enviar</p>

          {renderOption('fa-brands fa-whatsapp', 'bg-emerald-100', 'text-emerald-600', 'Enviar por WhatsApp', 'Envia a mensagem com resumo do documento', handleWhatsApp)}

          <button onClick={handleDownload} disabled={isGeneratingPdf}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group disabled:opacity-50">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-file-pdf text-xl"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold dark:text-white">Baixar PDF</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gera e salva o documento em formato PDF A4</p>
            </div>
            {isGeneratingPdf ? <i className="fa-solid fa-spinner animate-spin text-purple-500"></i> : <i className="fa-solid fa-chevron-right text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors"></i>}
          </button>

          <button onClick={handlePrint} disabled={isPrinting}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group disabled:opacity-50">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-receipt text-xl"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold dark:text-white">Imprimir Talão Térmico</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Imprime em bobina 58/80mm via Bluetooth</p>
            </div>
            {isPrinting ? <i className="fa-solid fa-spinner animate-spin text-slate-500"></i> : <i className="fa-solid fa-chevron-right text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors"></i>}
          </button>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800">
          <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
};
