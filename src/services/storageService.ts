// src/services/storageService.ts
import { ReceiptData, CompanySettings, DocumentType, Transaction, SavedClient, SavedProduct } from '../types';
import { supabase } from './supabase';

// --- CLIENTES SALVOS ---

export const getSavedClients = async (userId: string): Promise<SavedClient[]> => {
  if (!userId || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('saved_clients')
      .select('name, contact, nuit, location, user_id')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(c => ({
      name: c.name,
      contact: c.contact || '',
      nuit: c.nuit || '',
      location: c.location || '',
      userId: c.user_id,
    }));
  } catch (e) {
    console.error('Error fetching clients:', e);
    return [];
  }
};

export const addClient = async (client: SavedClient): Promise<void> => {
  if (!supabase) throw new Error('Supabase não configurado');
  try {
    const { error } = await supabase.from('saved_clients').insert({
      user_id: client.userId,
      name: client.name,
      contact: client.contact,
      nuit: client.nuit,
      location: client.location,
    });
    if (error) throw error;
  } catch (e) {
    console.error('Error adding client:', e);
    throw new Error('Erro ao adicionar cliente');
  }
};

export const updateClient = async (_id: number, _updates: Partial<SavedClient>): Promise<void> => {
  console.warn('updateClient: Supabase saved_clients uses composite key. Implement with user_id + name.');
};

export const deleteClient = async (_id: number): Promise<void> => {
  console.warn('deleteClient: Supabase saved_clients uses composite key. Implement with user_id + name.');
};

// --- PRODUTOS SALVOS (auto-learned) ---

export const getSavedProducts = async (userId: string): Promise<SavedProduct[]> => {
  if (!userId || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('saved_products')
      .select('description, unit_price, user_id')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(p => ({
      description: p.description,
      unitPrice: p.unit_price || 0,
      userId: p.user_id,
    }));
  } catch (e) {
    console.error('Error fetching saved products:', e);
    return [];
  }
};

// --- PRODUCT CATALOG ---

export const getProducts = async (_userId: string): Promise<import('../types').Product[]> => {
  return [];
};

export const addProduct = async (product: Omit<import('../types').Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<import('../types').Product> => {
  const newProduct: import('../types').Product = {
    ...product,
    id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return newProduct;
};

export const updateProduct = async (_productId: string, _updates: Partial<Pick<import('../types').Product, 'name' | 'price' | 'category'>>): Promise<void> => {};

export const deleteProduct = async (_productId: string): Promise<void> => {};

// --- DOCUMENTS ---

const mapDocumentToReceipt = (row: Record<string, unknown>): ReceiptData => ({
  id: row.id as string,
  type: row.type as ReceiptData['type'],
  number: row.number as string,
  date: row.date as string,
  currency: row.currency as string,
  language: (row.language as string) || 'pt',
  clientName: row.client_name as string || '',
  clientContact: row.client_contact as string || '',
  clientLocation: row.client_location as string || '',
  clientNuit: row.client_nuit as string || '',
  companyName: row.company_name as string || '',
  companyAddress: row.company_address as string || '',
  companyNuit: row.company_nuit as string || '',
  companyContact: row.company_contact as string || '',
  companyLogo: row.company_logo as string || '',
  items: typeof row.items === 'string' ? JSON.parse(row.items as string) : (row.items as ReceiptData['items']) || [],
  subtotal: row.subtotal as number || 0,
  taxRate: row.tax_rate as number || 0,
  taxAmount: row.tax_amount as number || 0,
  discount: row.discount as number || 0,
  total: row.total as number || 0,
  stampText: row.stamp_text as string || '',
  signatureData: row.signature_data as string || '',
  documentTheme: (row.document_theme as 'color' | 'bw') || 'color',
  status: row.status as ReceiptData['status'],
  pdfUrl: row.pdf_url as string || '',
  createdAt: row.created_at ? new Date(row.created_at as string).getTime() : Date.now(),
});

const mapReceiptToDocument = (receipt: ReceiptData, userId: string) => ({
  id: receipt.id,
  user_id: userId,
  type: receipt.type,
  number: receipt.number,
  date: receipt.date,
  currency: receipt.currency,
  language: receipt.language || 'pt',
  client_name: receipt.clientName,
  client_contact: receipt.clientContact,
  client_location: receipt.clientLocation,
  client_nuit: receipt.clientNuit,
  company_name: receipt.companyName || '',
  company_address: receipt.companyAddress || '',
  company_nuit: receipt.companyNuit || '',
  company_contact: receipt.companyContact || '',
  company_logo: receipt.companyLogo || '',
  items: JSON.stringify(receipt.items),
  subtotal: receipt.subtotal,
  tax_rate: receipt.taxRate,
  tax_amount: receipt.taxAmount,
  discount: receipt.discount,
  total: receipt.total,
  stamp_text: receipt.stampText || '',
  signature_data: receipt.signatureData || '',
  document_theme: receipt.documentTheme || 'color',
  status: receipt.status || 'DRAFT',
  pdf_url: receipt.pdfUrl || '',
  created_at: new Date(receipt.createdAt).toISOString(),
});

export const saveReceipt = async (receipt: ReceiptData, userId: string): Promise<ReceiptData[]> => {
  if (!userId || !supabase) return [];
  try {
    const docData = mapReceiptToDocument(receipt, userId);
    const { error } = await supabase.from('documents').upsert(docData, { onConflict: 'id' });
    if (error) throw error;

    if (receipt.type === 'INVOICE_RECEIPT') {
      const transaction: Omit<Transaction, 'timestamp'> & { timestamp: number } = {
        id: `txn-${receipt.id}`,
        userId,
        type: 'INCOME',
        amount: receipt.total,
        description: `Venda ${receipt.number}`,
        category: 'Sales',
        date: receipt.date,
        timestamp: Date.now(),
        receiptId: receipt.id,
      };
      const { error: txnError } = await supabase.from('transactions').upsert({
        id: transaction.id,
        user_id: userId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date,
        receipt_id: transaction.receiptId,
      }, { onConflict: 'id' });
      if (txnError) console.warn('Transaction sync error:', txnError.message);
    }

    await learnClient(receipt, userId);
    await learnProducts(receipt, userId);

    return await getHistory(userId);
  } catch (e) {
    console.error('Save receipt error:', e);
    return [];
  }
};

export const deleteReceipt = async (id: string, userId: string): Promise<ReceiptData[]> => {
  if (!userId || !supabase) return [];
  try {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
    return await getHistory(userId);
  } catch (e) {
    console.error('Delete receipt error:', e);
    return [];
  }
};

export const getHistory = async (userId: string): Promise<ReceiptData[]> => {
  if (!userId || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDocumentToReceipt);
  } catch (e) {
    console.error('Error fetching history:', e);
    return [];
  }
};

// --- HELPERS ---

const learnClient = async (doc: ReceiptData, userId: string) => {
  if (!doc.clientName || !userId || !supabase) return;
  try {
    const { data } = await supabase
      .from('saved_clients')
      .select('id')
      .eq('user_id', userId)
      .eq('name', doc.clientName)
      .limit(1);
    if (!data || data.length === 0) {
      await supabase.from('saved_clients').insert({
        user_id: userId,
        name: doc.clientName,
        contact: doc.clientContact,
        nuit: doc.clientNuit,
        location: doc.clientLocation,
      });
    }
  } catch (e) {
    console.warn('learnClient error:', e);
  }
};

const learnProducts = async (doc: ReceiptData, userId: string) => {
  if (!userId || !supabase) return;
  try {
    for (const item of doc.items) {
      if (!item.description) continue;
      const { data } = await supabase
        .from('saved_products')
        .select('id')
        .eq('user_id', userId)
        .eq('description', item.description)
        .limit(1);
      if (!data || data.length === 0) {
        await supabase.from('saved_products').insert({
          user_id: userId,
          description: item.description,
          unit_price: item.unitPrice,
        });
      }
    }
  } catch (e) {
    console.warn('learnProducts error:', e);
  }
};

export const generateNextReceiptNumber = (history: ReceiptData[], type: DocumentType): string => {
  const prefix = type === 'INVOICE' ? 'FAT' : type === 'INVOICE_RECEIPT' ? 'FAT-REC' : type === 'QUOTE' ? 'COT' : 'REC';
  const typeHistory = history.filter(h => (h.type || 'RECEIPT') === type);
  if (typeHistory.length === 0) return `${prefix}-0001`;
  const latest = typeHistory[0]!.number;
  const parts = latest.split('-');
  if (parts.length === 2) {
    const num = parseInt(parts[1]!, 10);
    if (!isNaN(num)) return `${prefix}-${(num + 1).toString().padStart(4, '0')}`;
  }
  return `${prefix}-${(typeHistory.length + 1).toString().padStart(4, '0')}`;
};

// --- SETTINGS (via Supabase profiles) ---

export const saveCompanySettings = async (settings: CompanySettings, userId: string) => {
  if (!userId || !supabase) return;
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      company_name: settings.name,
      address: settings.address,
      nuit: settings.nuit,
      contact: settings.contact,
      logo: settings.logo || '',
      currency: settings.currency,
      language: settings.language,
      theme: settings.theme || 'light',
      plan: settings.plan,
      custom_stamp: settings.customStamp || '',
      signature: settings.signature || '',
      user_phone: settings.userPhone || '',
      user_email: settings.userEmail || '',
      default_tax_rate: settings.defaultTaxRate || 16,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
  } catch (e) {
    console.error('Error saving settings:', e);
    throw new Error('Erro ao guardar definições');
  }
};

export const getCompanySettings = async (userId: string): Promise<CompanySettings | null> => {
  if (!userId || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return {
      name: data.company_name || '',
      address: data.address || '',
      nuit: data.nuit || '',
      contact: data.contact || '',
      logo: data.logo || '',
      currency: data.currency || 'MZN',
      language: data.language || 'pt',
      theme: data.theme || 'light',
      plan: data.plan || 'PRO',
      customStamp: data.custom_stamp || '',
      signature: data.signature || '',
      userPhone: data.user_phone || '',
      userEmail: data.user_email || '',
      defaultTaxRate: data.default_tax_rate || 16,
    };
  } catch (e) {
    console.error('Error fetching settings:', e);
    return null;
  }
};

// --- TRANSACTIONS ---

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  if (!userId || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(t => ({
      id: t.id,
      userId: t.user_id,
      type: t.type,
      amount: t.amount,
      description: t.description || '',
      category: t.category || '',
      date: t.date,
      timestamp: new Date(t.created_at || t.date).getTime(),
      receiptId: t.receipt_id,
    }));
  } catch (e) {
    console.error('Error fetching transactions:', e);
    return [];
  }
};

export const addTransaction = async (t: Transaction, userId: string): Promise<Transaction[]> => {
  if (!userId || !supabase) return [];
  try {
    const { error } = await supabase.from('transactions').upsert({
      id: t.id,
      user_id: userId,
      type: t.type,
      amount: t.amount,
      description: t.description,
      category: t.category,
      date: t.date,
      receipt_id: t.receiptId,
    }, { onConflict: 'id' });
    if (error) throw error;
    return await getTransactions(userId);
  } catch (e) {
    console.error('Error adding transaction:', e);
    return [];
  }
};

export const deleteTransaction = async (id: string, userId: string): Promise<Transaction[]> => {
  if (!userId || !supabase) return [];
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    return await getTransactions(userId);
  } catch (e) {
    console.error('Error deleting transaction:', e);
    return [];
  }
};
