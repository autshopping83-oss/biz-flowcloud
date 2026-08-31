// src/components/DocumentShareModal.tsx
import { useState } from 'react';
import { ReceiptData, CompanySettings } from '../types';
import { DocumentShareModalView } from './DocumentShareModalView';

interface DocumentShareModalProps {
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
  onGetPdfBlob?: () => Promise<{ blob: Blob; fileName: string } | null>;
}

export const DocumentShareModal: React.FC<DocumentShareModalProps> = ({
  formData, companySettings, userId, isGeneratingPdf, isPrinting,
  onGeneratePDF, onPrintThermal, onClose, t, fMoney, onGetPdfBlob,
}) => {
  const [recipientName, setRecipientName] = useState(formData.clientName || '');
  const [recipientPhone, setRecipientPhone] = useState(formData.clientWhatsApp || formData.clientContact || '');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendWhatsApp = (telefone: string) => {
    const cleanPhone = telefone.replace(/\D/g, '');
    const resumo = formData.items.slice(0, 3).map(i => `${i.description} — ${i.quantity}x ${fMoney(i.unitPrice)}`).join('\n');
    const texto =
      `Olá ${recipientName}! 👋\n\n` +
      `Segue o documento *${formData.number}* do Biz-flow.\n\n` +
      `📄 ${formData.type === 'INVOICE' ? 'Fatura' : formData.type === 'INVOICE_RECEIPT' ? 'Fatura-Recibo' : formData.type === 'QUOTE' ? 'Orçamento' : 'Recibo'} #${formData.number}\n` +
      `👤 Cliente: ${recipientName}\n` +
      `📅 Data: ${formData.date}\n` +
      `${resumo ? `📦 Itens:\n${resumo}\n` : ''}` +
      `💵 Total: ${fMoney(formData.total)} ${formData.currency}\n\n` +
      `Acesse: https://biz-flow.cloud`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(texto)}`, '_blank');
    setSendResult({ success: true, message: `WhatsApp aberto para ${recipientName}!` });
  };

  const gerarPdfFallback = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const doc = formData;
      const tipo = { INVOICE: 'FACTURA', RECEIPT: 'RECIBO', INVOICE_RECEIPT: 'FACTURA-RECIBO', QUOTE: 'ORÇAMENTO' }[doc.type] || doc.type;
      let y = 20;
      pdf.setFontSize(18);
      pdf.text(doc.companyName || 'Biz-flow', 105, y, { align: 'center' }); y += 10;
      pdf.setFontSize(14);
      pdf.text(tipo + ' #' + doc.number, 105, y, { align: 'center' }); y += 8;
      pdf.setFontSize(10);
      pdf.text('Data: ' + doc.date, 20, y); y += 8;
      if (doc.clientName) { pdf.text('Cliente: ' + doc.clientName, 20, y); y += 6; }
      y += 4;
      pdf.setFontSize(8);
      doc.items.forEach(item => {
        const line = `${item.description}  |  ${item.quantity}x  |  ${fMoney(item.unitPrice)}  |  ${fMoney(item.total)}`;
        if (y > 275) { pdf.addPage(); y = 20; }
        pdf.text(line, 20, y); y += 6;
      });
      y += 4; pdf.setFontSize(12);
      pdf.text('Subtotal: ' + fMoney(doc.subtotal), 190, y, { align: 'right' }); y += 7;
      if (doc.taxRate > 0) { pdf.text('IVA (' + doc.taxRate + '%): ' + fMoney(doc.taxAmount), 190, y, { align: 'right' }); y += 7; }
      if (doc.discount > 0) { pdf.text('Desconto: -' + fMoney(doc.discount), 190, y, { align: 'right' }); y += 7; }
      pdf.setFontSize(16);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Total: ' + fMoney(doc.total), 190, y + 4, { align: 'right' });
      const blob = pdf.output('blob');
      const fileName = (doc.number || 'documento').replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
      return { blob, fileName };
    } catch { return null; }
  };

  const handleSend = async (method: 'whatsapp') => {
    if (!recipientPhone || !recipientName) return;
    setIsSending(true);
    setSendResult(null);
    try {
      handleSendWhatsApp(recipientPhone);
    } catch {
      setSendResult({ success: false, message: 'Erro ao abrir o WhatsApp. Tente novamente.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async () => {
    if (onGetPdfBlob) {
      const pdfData = await onGetPdfBlob();
      if (pdfData) {
        const url = URL.createObjectURL(pdfData.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfData.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSendResult({ success: true, message: `PDF "${pdfData.fileName}" descarregado!` });
        return;
      }
    }
    await onGeneratePDF();
    onClose();
  };

  const handlePrint = async () => { await onPrintThermal(); onClose(); };

  const viewProps = {
    formData, companySettings, userId, isGeneratingPdf, isPrinting,
    onGeneratePDF, onPrintThermal, onClose, t, fMoney,
    recipientName, setRecipientName,
    recipientPhone, setRecipientPhone,
    isSending, sendResult,
    handleSend, handleDownload, handlePrint,
  };

  return <DocumentShareModalView {...viewProps} />;
};
