/**
 * useDocumentEditor - Hook para gerenciar o estado do editor de documentos
 * 
 * Gerencia: formData, newItem, mobileTab, modais, histórico, totais.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ReceiptData, CompanySettings, DocumentType, LineItem } from '../../../types';
import { generateNextReceiptNumber, saveReceipt, deleteReceipt } from '../../../services/storageService';
import { useSignatureCanvas } from '../../../app/hooks/useSignatureCanvas';
import { useDocumentActions } from '../../../app/hooks/useDocumentActions';

const InitialReceipt: ReceiptData = {
  id: '', type: 'RECEIPT', number: '', date: new Date().toISOString().split('T')[0] ?? '',
  currency: 'MZN', language: 'pt', clientName: '', clientContact: '', clientLocation: '', clientNuit: '',
  items: [], subtotal: 0, taxRate: 0, taxAmount: 0, discount: 0, total: 0,
  stampText: 'PAGO', signatureData: '', documentTheme: 'color', createdAt: Date.now(),
};

interface UseDocumentEditorProps {
  isGuest: boolean;
  history: ReceiptData[];
  companySettings: CompanySettings;
  setHistory: (h: ReceiptData[]) => void;
  setCurrentView: (v: string) => void;
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function useDocumentEditor({
  isGuest, history, companySettings,
  setHistory, setCurrentView, notify,
}: UseDocumentEditorProps) {
  const [formData, setFormData] = useState<ReceiptData>(InitialReceipt);
  const [newItem, setNewItem] = useState<Partial<LineItem>>({ description: '', quantity: 1, unitPrice: 0 });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);
  const ghostReceiptRef = useRef<HTMLDivElement>(null);
  const thermalReceiptRef = useRef<HTMLDivElement>(null);

  const signatureCanvas = useSignatureCanvas(showSignatureModal);

  // Recalculate totals when items, taxRate, or discount change
  useEffect(() => {
    const subtotal = formData.items.reduce((acc, item) => acc + (item.total || 0), 0);
    const taxAmount = subtotal * ((formData.taxRate || 0) / 100);
    const total = subtotal + taxAmount - (formData.discount || 0);
    
    if (formData.subtotal !== subtotal || formData.taxAmount !== taxAmount || formData.total !== total) {
      setFormData(prev => ({ ...prev, subtotal, taxAmount, total }));
    }
  }, [formData.items, formData.taxRate, formData.discount]);

  const { isGeneratingPdf, isSharing, isPrinting, localDirHandle, requestFolderPermission, handleGeneratePDF, handleShareWhatsApp, handlePrintThermal } = useDocumentActions({
    formData,
    receiptRef,
    ghostReceiptRef,
    thermalReceiptRef,
    notify,
    handleSave: async (silent = false) => {
      if (!formData.clientName || formData.items.length === 0) return;
      const newHistory = await saveReceipt(formData, 'local');
      setHistory(newHistory);
      if (!silent) notify('Dados guardados.', 'success');
    },
  });

  const initNewDocument = useCallback((type: DocumentType) => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    setFormData({
      ...InitialReceipt,
      id: crypto.randomUUID(),
      type,
      number: generateNextReceiptNumber(history, type),
      date: today,
      taxRate: type === 'INVOICE' ? companySettings.defaultTaxRate || 0 : 0,
      currency: companySettings.currency,
      language: companySettings.language,
      companyName: companySettings.name,
      companyAddress: companySettings.address,
      companyContact: companySettings.contact,
      companyNuit: companySettings.nuit,
      companyLogo: companySettings.logo,
    });
    setMobileTab('editor');
    setCurrentView('app');
  }, [history, companySettings, setCurrentView]);

  const handleDuplicateDocument = useCallback((doc: ReceiptData) => {
    const newDoc = { ...doc };
    setFormData({
      ...newDoc,
      id: crypto.randomUUID(),
      number: generateNextReceiptNumber(history, doc.type),
      date: new Date().toISOString().split('T')[0],
    });
    setCurrentView('app');
    notify('Documento duplicado com novo número e data.', 'info');
  }, [history, setCurrentView, notify]);

  const handleFormDataChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  }, []);

  const handleNewItemChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(p => ({ ...p, [name]: value }));
  }, []);

  const handleAddItem = useCallback(() => {
    if (!newItem.description) return;
    const q = Number(newItem.quantity) || 1;
    const p = Number(newItem.unitPrice) || 0;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), description: newItem.description!, quantity: q, unitPrice: p, total: q * p }],
    }));
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
  }, [newItem]);

  const handleRemoveItem = useCallback((id: string) => {
    setFormData(p => ({ ...p, items: p.items.filter(i => i.id !== id) }));
  }, []);

  const handleEnhanceDescription = useCallback(() => {
    notify('Funcionalidade de IA não disponível.', 'info');
  }, [notify]);

  const handleClearClient = useCallback(() => {
    setFormData(p => ({ ...p, clientName: '', clientContact: '', clientLocation: '', clientNuit: '' }));
  }, []);

  const handleThemeChange = useCallback((theme: 'color' | 'bw') => {
    setFormData(p => ({ ...p, documentTheme: theme }));
  }, []);

  const saveSignature = useCallback(() => {
    const canvas = signatureCanvas.canvasRef.current;
    if (!canvas) return;
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      notify('A assinatura está vazia.', 'info');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    setFormData(p => ({ ...p, signatureData: dataUrl }));
    setShowSignatureModal(false);
    notify('Assinatura guardada!', 'success');
  }, [signatureCanvas.canvasRef, notify]);

  const clearSignature = useCallback(() => {
    signatureCanvas.clearCanvas(signatureCanvas.canvasRef.current);
  }, [signatureCanvas]);

  const handleDeleteDocument = useCallback(async (id: string) => {
    const updated = await deleteReceipt(id, 'local');
    setHistory(updated);
  }, [setHistory]);

  // Settings signature handlers
  const saveSettingsSignature = useCallback(() => {
    const canvas = signatureCanvas.settingsSignatureCanvasRef.current;
    if (!canvas) return;
    const dataUrl = signatureCanvas.getCanvasDataUrl(canvas);
    if (dataUrl) {
      setFormData(p => ({ ...p, signatureData: dataUrl }));
      notify('Assinatura padrão guardada!', 'success');
    }
  }, [signatureCanvas, notify]);

  const clearSettingsSignature = useCallback(() => {
    signatureCanvas.clearCanvas(signatureCanvas.settingsSignatureCanvasRef.current);
  }, [signatureCanvas]);

  return {
    formData, setFormData, newItem, isEnhancing, mobileTab,
    showSignatureModal, showShareModal,
    receiptRef, ghostReceiptRef, thermalReceiptRef, 
    canvasRef: signatureCanvas.canvasRef,
    settingsSignatureCanvasRef: signatureCanvas.settingsSignatureCanvasRef,
    isGeneratingPdf, isSharing, isPrinting, localDirHandle,
    requestFolderPermission, handleGeneratePDF, handleShareWhatsApp, handlePrintThermal,
    setMobileTab, setShowSignatureModal, setShowShareModal,
    initNewDocument, handleDuplicateDocument,
    handleFormDataChange, handleNewItemChange, handleAddItem, handleRemoveItem,
    handleEnhanceDescription, handleClearClient, handleThemeChange,
    saveSignature, clearSignature, handleDeleteDocument,
    saveSettingsSignature, clearSettingsSignature,
    handleSettingsSignatureStartDrawing: signatureCanvas.handleSettingsSignatureStartDrawing,
    handleSettingsSignatureDraw: signatureCanvas.handleSettingsSignatureDraw,
    handleSettingsSignatureStopDrawing: signatureCanvas.handleSettingsSignatureStopDrawing,
  };
}
