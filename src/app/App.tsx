/**
 * App - Componente principal orquestrador
 * Refatorado: views e hooks extraídos para módulos separados.
 * Fluxo: App → useAppLifecycle + useDocumentEditor → Views
 * v4: Web PWA pura - sem Supabase, sem Android, sem APIs externas
 */

import React, { useState, lazy, Suspense } from 'react';
import { ReceiptData, CompanySettings, SavedClient, SavedProduct } from '../types';
import { Logo } from '../components/Logo';
import { V } from '../_cachebuster/version';
import { useToast } from '../components/ToastContext';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import { useDocumentEditor } from '../features/documents/hooks/useDocumentEditor';
import { getTranslation, formatMoney } from '../services/translationService';
import { AppEditorView } from './views/AppEditorView';
import { SignatureModal } from '../features/documents/components/SignatureModal';
import { DocumentShareModal } from '../components/DocumentShareModal';
import { SettingsModal } from '../components/SettingsModal';

const Dashboard = lazy(() => import('../components/Dashboard').then(m => ({ default: m.Dashboard })));
const HistoryPage = lazy(() => import('../components/HistoryPage').then(m => ({ default: m.HistoryPage })));

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
    deferredPrompt?: { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> } | null;
  }
}

const PageLoader = () => (
  <div className="fixed top-0 left-0 w-full h-full bg-white dark:bg-slate-900 z-[9999] flex flex-col items-center justify-center">
    <Logo className="w-20 h-20 mb-6 animate-pulse" />
    <div className="w-10 h-10 rounded-full border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 animate-spin" />
    <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wider">Carregando...</p>
  </div>
);

const DefaultSettings: CompanySettings = {
  name: '', address: '', contact: '', nuit: '', logo: '',
  defaultTaxRate: 16, currency: 'MZN', language: 'pt',
  theme: 'light', plan: 'PRO', isAdmin: false,
};

type AppView = 'loading' | 'home' | 'history' | 'app';

const App: React.FC<{ onReady?: () => void }> = ({ onReady }) => {
  const [currentView, setCurrentView] = useState<AppView>('loading');
  const [isGuest, setIsGuest] = useState(false);
  const [history, setHistory] = useState<ReceiptData[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DefaultSettings);
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<Window['deferredPrompt']>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Version tracking - force rebuild
  console.debug('BizFlow version:', V);

  const { notify } = useToast();
  const t = (key: string) => getTranslation(companySettings.language, key);
  const fMoney = (val: number) => formatMoney(val, companySettings.currency, companySettings.language);

  useAppLifecycle({
    currentView, isGuest, setCurrentView: (v: string) => setCurrentView(v as AppView), setIsGuest,
    setHistory, setSavedClients, setSavedProducts, setCompanySettings,
    setIsOnline, setLocalDirHandle: () => {}, onReady,
  });

  const editor = useDocumentEditor({
    isGuest, history, companySettings,
    setHistory, setCurrentView: (v: string) => setCurrentView(v as AppView), notify,
  });

  const toggleTheme = () => {
    const newTheme = companySettings.theme === 'dark' ? 'light' : 'dark';
    setCompanySettings(p => ({ ...p, theme: newTheme }));
    // Apply dark class to HTML element
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save to local storage
    localStorage.setItem('bizflow-theme', newTheme);
  };

  const handleInstallApp = () => {
    if (installPrompt) { installPrompt.prompt(); installPrompt.userChoice.then(() => setInstallPrompt(null)); }
  };

  return (
    <Suspense fallback={<PageLoader />}>
      {currentView === 'loading' && <PageLoader />}
      {currentView === 'home' && (
        <Dashboard history={history} companySettings={companySettings}
          onLogout={() => { setIsGuest(false); setCurrentView('loading'); }}
          onNewDocument={editor.initNewDocument} onOpenSettings={() => setShowSettingsModal(true)}
          onLoadDocument={(doc) => { editor.setFormData(doc); setCurrentView('app'); editor.setMobileTab('preview'); }}
          onViewHistory={() => setCurrentView('history')} onToggleTheme={toggleTheme}
          t={t} userId="local" onDeleteDocument={editor.handleDeleteDocument}
          onInstallApp={handleInstallApp} showInstallButton={!!installPrompt} />
      )}
      {currentView === 'history' && (
        <HistoryPage history={history} onBack={() => setCurrentView('home')}
          onLoadDocument={(doc) => { editor.setFormData(doc); setCurrentView('app'); }}
          onDeleteDocument={editor.handleDeleteDocument} onDuplicateDocument={editor.handleDuplicateDocument}
          currency={companySettings.currency} lang={companySettings.language} />
      )}
      {(currentView === 'app' || isGuest) && (
        <AppEditorView formData={editor.formData} companySettings={companySettings} newItem={editor.newItem}
          isGuest={isGuest} isOnline={isOnline} syncing={false}
          isEnhancing={editor.isEnhancing} isSharing={editor.isSharing}
          isPrinting={editor.isPrinting} isGeneratingPdf={editor.isGeneratingPdf}
          mobileTab={editor.mobileTab} savedClients={savedClients} savedProducts={savedProducts}
          receiptRef={editor.receiptRef} ghostReceiptRef={editor.ghostReceiptRef} thermalReceiptRef={editor.thermalReceiptRef}
          t={t} fMoney={fMoney}
          onBack={() => isGuest ? setCurrentView('loading') : setCurrentView('home')}
          onOpenSettings={() => setShowSettingsModal(true)} onShareWhatsApp={editor.handleShareWhatsApp}
          onOpenShareModal={() => editor.setShowShareModal(true)} onSetMobileTab={editor.setMobileTab}
          onFormDataChange={editor.handleFormDataChange} onNewItemChange={editor.handleNewItemChange}
          onAddItem={editor.handleAddItem} onRemoveItem={editor.handleRemoveItem}
          onEnhanceDescription={editor.handleEnhanceDescription} onInitNew={editor.initNewDocument}
          onSign={() => editor.setShowSignatureModal(true)} onClearClient={editor.handleClearClient}
          onThemeChange={editor.handleThemeChange} userId="local" />
      )}
      {showSettingsModal && (
        <SettingsModal companySettings={companySettings} onClose={() => setShowSettingsModal(false)}
          onUpdate={(e) => { const { name, value } = e.target; setCompanySettings(p => ({ ...p, [name]: value })); }}
          onLogoChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onloadend = () => setCompanySettings(p => ({ ...p, logo: r.result as string })); r.readAsDataURL(f); }}
          onStampUpload={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onloadend = () => setCompanySettings(p => ({ ...p, customStamp: r.result as string })); r.readAsDataURL(f); }}
          onRequestFolderPermission={async () => { await editor.requestFolderPermission(); }}
          onSaveSettings={async () => { const { saveCompanySettings } = await import('../services/storageService'); await saveCompanySettings(companySettings, 'local'); notify('Definições guardadas!', 'success'); setShowSettingsModal(false); }}
          isSavingSettings={false} localDirHandle={editor.localDirHandle}
          onSaveSignature={editor.saveSettingsSignature} onClearSignature={editor.clearSettingsSignature} settingsSignatureCanvasRef={editor.settingsSignatureCanvasRef}
          handleSettingsSignatureStartDrawing={editor.handleSettingsSignatureStartDrawing} handleSettingsSignatureDraw={editor.handleSettingsSignatureDraw} handleSettingsSignatureStopDrawing={editor.handleSettingsSignatureStopDrawing} />
      )}
      {editor.showShareModal && (
        <DocumentShareModal formData={editor.formData} companySettings={companySettings} userId="local"
          isGeneratingPdf={editor.isGeneratingPdf} isPrinting={editor.isPrinting}
          onGeneratePDF={editor.handleGeneratePDF} onPrintThermal={editor.handlePrintThermal}
          onClose={() => editor.setShowShareModal(false)} t={t} fMoney={fMoney} />
      )}
      {editor.showSignatureModal && (
        <SignatureModal canvasRef={editor.canvasRef} onSave={editor.saveSignature}
          onClear={editor.clearSignature} onClose={() => editor.setShowSignatureModal(false)} />
      )}
    </Suspense>
  );
};

export default App;
