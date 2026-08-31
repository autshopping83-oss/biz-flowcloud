/**
 * AppEditorView - View principal do editor de documentos
 * 
 * Extraída do App.tsx para respeitar o limite de 250 linhas.
 * Contém o header, tabs mobile, editor form e preview do documento.
 */

import React, { RefObject } from 'react';
import { ReceiptData, CompanySettings, LineItem, SavedClient, SavedProduct, DocumentType } from '../../types';
import DocumentPreview from '../../components/ReceiptPreview';
import { EditorForm } from '../../components/EditorForm';

interface AppEditorViewProps {
  formData: ReceiptData;
  companySettings: CompanySettings;
  newItem: Partial<LineItem>;
  isGuest: boolean;
  isEnhancing: boolean;
  isSharing: boolean;
  isPrinting: boolean;
  isGeneratingPdf: boolean;
  mobileTab: 'editor' | 'preview';
  savedClients: SavedClient[];
  savedProducts: SavedProduct[];
  receiptRef: RefObject<HTMLDivElement | null>;
  ghostReceiptRef: RefObject<HTMLDivElement | null>;
  thermalReceiptRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
  fMoney: (val: number) => string;
  onBack: () => void;
  onOpenSettings: () => void;
  onShareWhatsApp: () => void;
  onOpenShareModal: () => void;
  onSetMobileTab: (tab: 'editor' | 'preview') => void;
  onFormDataChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onNewItemChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onEnhanceDescription: () => void;
  onInitNew: (type: DocumentType) => void;
  onSign: () => void;
  onClearClient: () => void;
  onThemeChange: (theme: 'color' | 'bw') => void;
  userId?: string;
  onViewClientHistory?: (clientName: string) => void;
  onUpdateProducts?: (products: SavedProduct[]) => void;
}

export const AppEditorView: React.FC<AppEditorViewProps> = ({
  formData, companySettings, newItem, isGuest,
  isEnhancing, isSharing, isPrinting, isGeneratingPdf, mobileTab,
  savedClients, savedProducts, receiptRef, ghostReceiptRef, thermalReceiptRef,
  t, fMoney, onBack, onOpenSettings, onShareWhatsApp, onOpenShareModal,
  onSetMobileTab, onFormDataChange, onNewItemChange, onAddItem, onRemoveItem,
  onEnhanceDescription, onInitNew, onSign, onClearClient, onThemeChange, userId,
  onViewClientHistory,
  onUpdateProducts,
}) => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col h-screen overflow-hidden transition-colors duration-500">
      <header className="bg-white dark:bg-slate-900 h-16 flex-none shadow-sm z-30 border-b dark:border-slate-800 transition-colors">
        <div className="max-w-[1600px] mx-auto px-4 h-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white w-8 h-8 flex items-center justify-center transition-colors"
            >
              <i className={`fa-solid ${isGuest ? 'fa-home' : 'fa-arrow-left'}`}></i>
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onOpenSettings} className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-transform active:scale-90 bg-slate-50 dark:bg-slate-800">
              <i className="fa-solid fa-gear"></i>
            </button>
            <button onClick={onShareWhatsApp} disabled={isSharing} className="bg-[#25D366] text-white px-4 py-2 rounded-xl text-sm font-black shadow-xl shadow-[#25D366]/20 flex items-center gap-2 hover:bg-[#20bd5a] transition-all active:scale-95 disabled:opacity-50">
              {isSharing ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-brands fa-whatsapp text-lg"></i>}
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button onClick={onOpenShareModal} disabled={isPrinting || isGeneratingPdf} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-xl shadow-blue-600/20 flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
              {(isPrinting || isGeneratingPdf) ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-share-nodes"></i>}
              <span className="hidden lg:inline">Compartilhar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="md:hidden flex bg-white dark:bg-slate-900 border-b dark:border-slate-800 h-14 transition-colors">
        <button onClick={() => onSetMobileTab('editor')} className={`flex-1 font-black text-xs tracking-widest ${mobileTab === 'editor' ? 'text-blue-600 border-b-[3px] border-blue-600' : 'text-slate-400'}`}>1. DADOS</button>
        <button onClick={() => onSetMobileTab('preview')} className={`flex-1 font-black text-xs tracking-widest ${mobileTab === 'preview' ? 'text-blue-600 border-b-[3px] border-blue-600' : 'text-slate-400'}`}>2. PRÉVIA A4</button>
      </div>

      <div className="flex-grow flex overflow-hidden max-w-[1600px] mx-auto w-full transition-colors">
        <div className={`w-full md:w-[450px] bg-white dark:bg-slate-900 border-r dark:border-slate-800 overflow-y-auto transition-colors ${mobileTab === 'preview' ? 'hidden md:block' : 'block'}`}>
          <div className="p-6">
            <EditorForm
              formData={formData}
              onChange={onFormDataChange}
              newItem={newItem}
              onNewItemChange={onNewItemChange}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              onEnhanceDescription={onEnhanceDescription}
              isEnhancing={isEnhancing}
              t={t}
              fMoney={fMoney}
              onInitNew={onInitNew}
              onSign={onSign}
              statusOptions={['PAGO', 'EMITIDO', 'PENDENTE', 'ANULADO']}
              onClearClient={onClearClient}
              savedClients={savedClients}
              savedProducts={savedProducts}
              onThemeChange={onThemeChange}
              userId={userId}
              onViewClientHistory={onViewClientHistory}
              onUpdateProducts={onUpdateProducts}
            />
          </div>
        </div>
        <div className={`flex-grow bg-slate-200 dark:bg-slate-950 overflow-y-auto flex flex-col items-center p-4 md:p-10 transition-colors ${mobileTab === 'editor' ? 'hidden md:flex' : 'flex'}`}>
          <div className="bg-white shadow-2xl origin-top mb-10 overflow-hidden transition-shadow" style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
            <DocumentPreview data={formData} companySettings={companySettings} ref={receiptRef} captureId="receipt-preview-main" />
          </div>
        </div>
      </div>

      {/* Ghost refs for PDF/thermal generation */}
      <div className="fixed top-0 left-0 pointer-events-none opacity-0" style={{ zIndex: -100 }}>
        <div style={{ position: 'absolute', top: 0, left: '-9999px' }}>
          <DocumentPreview data={formData} companySettings={companySettings} ref={ghostReceiptRef} captureId="receipt-capture-ghost" layout="a4" />
        </div>
        <div style={{ position: 'absolute', top: 0, left: '-9999px' }}>
          <DocumentPreview data={formData} companySettings={companySettings} ref={thermalReceiptRef} captureId="receipt-thermal-ghost" layout="thermal" />
        </div>
      </div>
    </div>
  );
};
