// src/services/storageService.ts
import { ReceiptData, CompanySettings, DocumentType, Transaction, SavedClient, SavedProduct } from '../types';
import { supabase } from './supabase';

// Simple in-memory cache with TTL to avoid redundant refetches.
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const TTL = 30_000;

const cacheGet = <T>(key: string): T | undefined => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
};

const cacheSet = (key: string, data: unknown) => {
  cache.set(key, { data, expiresAt: Date.now() + TTL });
};

const cacheDel = (prefix: string) => {
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
};

// Clears all in-memory cached data. Must be called on sign-out so no private
// data from a previous session leaks into the next account on the same browser.
export const clearPrivateCache = () => {
  cache.clear();
};

// --- CLIENTES SALVOS ---

export const getSavedClients = async (userId: string): Promise<SavedClient[]> => {
  if (!userId || !supabase) return [];
  const cacheKey = `clients:${userId}`;
  const cached = cacheGet<SavedClient[]>(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase
      .from('saved_clients')
      .select('id, name, contact, nuit, location, user_id')
      .eq('user_id', userId);
    if (error) throw error;
    const result = (data || []).map(c => ({
      id: c.id as string,
      name: c.name,
      contact: c.contact || '',
      nuit: c.nuit || '',
      location: c.location || '',
      userId: c.user_id,
    }));
    cacheSet(cacheKey, result);
    return result;
  } catch (e) {
    console.error('Error fetching clients:', e);
    return [];
  }
};

export const getSavedClientByName = async (userId: string, name: string): Promise<SavedClient | null> => {
  if (!userId || !name || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('saved_clients')
      .select('id, name, contact, nuit, location, user_id')
      .eq('user_id', userId)
      .eq('name', name)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return null;
    const c = data[0]!;
    return { id: c.id as string, name: c.name, contact: c.contact ?? '', nuit: c.nuit ?? '', location: c.location ?? '', userId: c.user_id };
  } catch (e) {
    console.error('Error fetching client by name:', e);
    return null;
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
    cacheDel(`clients:${client.userId}`);
  } catch (e) {
    console.error('Error adding client:', e);
    throw new Error('Erro ao adicionar cliente');
  }
};

export const updateClient = async (id: string, updates: Partial<SavedClient>): Promise<void> => {
  if (!id || !supabase) return;
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.contact !== undefined) payload.contact = updates.contact;
  if (updates.nuit !== undefined) payload.nuit = updates.nuit;
  if (updates.location !== undefined) payload.location = updates.location;
  const { error } = await supabase
    .from('saved_clients')
    .update(payload)
    .eq('id', id);
  if (error) throw error;
  if (updates.userId) cacheDel(`clients:${updates.userId}`);
};

export const deleteClient = async (id: string, userId?: string): Promise<void> => {
  if (!id || !supabase) return;
  const { error } = await supabase
    .from('saved_clients')
    .delete()
    .eq('id', id);
  if (error) throw error;
  if (userId) cacheDel(`clients:${userId}`);
};

// --- PRODUTOS SALVOS (auto-learned) ---

export const getSavedProducts = async (userId: string): Promise<SavedProduct[]> => {
  if (!userId || !supabase) return [];
  const cacheKey = `products:${userId}`;
  const cached = cacheGet<SavedProduct[]>(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase
      .from('saved_products')
      .select('id, description, unit_price, category, user_id')
      .eq('user_id', userId);
    if (error) throw error;
    const result = (data || []).map(p => ({
      id: p.id as string,
      description: p.description,
      unitPrice: p.unit_price || 0,
      category: (p.category as string) || '',
      userId: p.user_id,
    }));
    cacheSet(cacheKey, result);
    return result;
  } catch (e) {
    console.error('Error fetching saved products:', e);
    return [];
  }
};

// --- PRODUCT CATALOG (shared saved_products table) ---

const mapSavedProductToProduct = (p: Record<string, unknown>): import('../types').Product => ({
  id: p.id as string,
  name: p.description as string,
  price: (p.unit_price as number) || 0,
  category: (p.category as string) || '',
  userId: p.user_id as string,
  createdAt: p.created_at ? new Date(p.created_at as string).getTime() : Date.now(),
  updatedAt: p.updated_at ? new Date(p.updated_at as string).getTime() : Date.now(),
});

export const getProducts = async (userId: string): Promise<import('../types').Product[]> => {
  if (!userId || !supabase) return [];
  const cacheKey = `products:${userId}`;
  const cached = cacheGet<import('../types').Product[]>(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase
      .from('saved_products')
      .select('id, description, unit_price, category, user_id, created_at, updated_at')
      .eq('user_id', userId)
      .order('description', { ascending: true });
    if (error) throw error;
    const result = (data || []).map(mapSavedProductToProduct);
    cacheSet(cacheKey, result);
    return result;
  } catch (e) {
    console.error('Error fetching product catalog:', e);
    return [];
  }
};

export const addProduct = async (product: Omit<import('../types').Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<import('../types').Product> => {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase
    .from('saved_products')
    .insert({
      user_id: product.userId,
      description: product.name,
      unit_price: product.price,
      category: product.category || '',
    })
    .select('id, description, unit_price, category, user_id, created_at, updated_at')
    .single();
  if (error) throw error;
  cacheDel(`products:${product.userId}`);
  const mapped = mapSavedProductToProduct(data as Record<string, unknown>);
  cacheSet(`products:${product.userId}`, [mapped]);
  return mapped;
};

export const updateProduct = async (
  productId: string,
  updates: Partial<Pick<import('../types').Product, 'name' | 'price' | 'category'>>,
  userId?: string,
): Promise<void> => {
  if (!supabase || !productId) return;
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.description = updates.name;
  if (updates.price !== undefined) payload.unit_price = updates.price;
  if (updates.category !== undefined) payload.category = updates.category;
  const { error } = await supabase.from('saved_products').update(payload).eq('id', productId);
  if (error) throw error;
  if (userId) cacheDel(`products:${userId}`);
};

export const deleteProduct = async (productId: string, userId?: string): Promise<void> => {
  if (!supabase || !productId) return;
  const { error } = await supabase.from('saved_products').delete().eq('id', productId);
  if (error) throw error;
  if (userId) cacheDel(`products:${userId}`);
};

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
  items: receipt.items,
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

const DOCUMENT_LIST_COLUMNS = 'id, type, number, date, currency, language, client_name, client_contact, client_location, client_nuit, stamp_text, status, document_theme, total, subtotal, tax_rate, tax_amount, discount, created_at';

export const saveReceipt = async (receipt: ReceiptData, userId: string): Promise<ReceiptData[]> => {
  if (!userId || !supabase) return [];
  try {
    const docData = mapReceiptToDocument(receipt, userId);
    const { error } = await supabase.from('documents').upsert(docData, { onConflict: 'id' });
    if (error) throw error;

    if (receipt.type === 'INVOICE_RECEIPT') {
      let transactionId: string | undefined;
      const existing = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('receipt_id', receipt.id)
        .maybeSingle();
      if (!existing.error && existing.data) transactionId = existing.data.id as string;
      const transaction: Omit<Transaction, 'timestamp'> & { timestamp: number } = {
        id: transactionId || crypto.randomUUID(),
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

    await learnClientAndProducts(receipt, userId);

    cacheDel(`history:${userId}`);
    cacheDel(`transactions:${userId}`);
    cacheDel(`clients:${userId}`);
    cacheDel(`products:${userId}`);

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
    cacheDel(`history:${userId}`);
    cacheDel(`transactions:${userId}`);
    return await getHistory(userId);
  } catch (e) {
    console.error('Delete receipt error:', e);
    return [];
  }
};

export const getHistory = async (userId: string, limit = 200): Promise<ReceiptData[]> => {
  if (!userId || !supabase) return [];
  const cacheKey = `history:${userId}`;
  const cached = cacheGet<ReceiptData[]>(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(DOCUMENT_LIST_COLUMNS)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    const result = (data || []).map(mapDocumentToReceipt);
    cacheSet(cacheKey, result);
    return result;
  } catch (e) {
    console.error('Error fetching history:', e);
    return [];
  }
};

export const getDocumentById = async (id: string): Promise<ReceiptData | null> => {
  if (!id || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return mapDocumentToReceipt(data);
  } catch (e) {
    console.error('Error fetching document:', e);
    return null;
  }
};

// --- HELPERS ---

const learnClientAndProducts = async (doc: ReceiptData, userId: string) => {
  if (!userId || !supabase) return;

  // Cliente: 1 query para verificar + 1 insert (max), em vez de select+insert
  if (doc.clientName) {
    try {
      const existing = await getSavedClientByName(userId, doc.clientName);
      if (!existing) {
        await supabase.from('saved_clients').insert({
          user_id: userId,
          name: doc.clientName,
          contact: doc.clientContact || '',
          nuit: doc.clientNuit || '',
          location: doc.clientLocation || '',
        });
      }
    } catch (e) {
      console.warn('learnClient error:', e);
    }
  }

  // Produtos: batch — 1 query para todos os descriptions + 1 insert (max)
  const descriptions = doc.items.map(i => i.description).filter(Boolean);
  if (descriptions.length === 0) return;

  const uniqueDescriptions = Array.from(new Set(descriptions));
  try {
    const { data } = await supabase
      .from('saved_products')
      .select('description')
      .eq('user_id', userId)
      .in('description', uniqueDescriptions);

    const existingSet = new Set((data || []).map(r => r.description));
    const toInsert = uniqueDescriptions
      .filter(d => !existingSet.has(d))
      .map(d => {
        const item = doc.items.find(i => i.description === d);
        return { user_id: userId, description: d, unit_price: item?.unitPrice ?? 0 };
      });

    if (toInsert.length > 0) {
      await supabase.from('saved_products').insert(toInsert);
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
      email: settings.userEmail || '',
      default_tax_rate: settings.defaultTaxRate || 16,
    }, { onConflict: 'id' });
    if (error) throw error;
    cacheDel(`settings:${userId}`);
  } catch (e) {
    console.error('Error saving settings:', e);
    throw new Error('Erro ao guardar definições');
  }
};

export const getCompanySettings = async (userId: string): Promise<CompanySettings | null> => {
  if (!userId || !supabase) return null;
  const cacheKey = `settings:${userId}`;
  const cached = cacheGet<CompanySettings>(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, company_name, address, nuit, contact, logo, currency, language, theme, plan, custom_stamp, signature, email, default_tax_rate')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    const result: CompanySettings = {
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
      userEmail: (data.email as string) || '',
      defaultTaxRate: data.default_tax_rate || 16,
    };
    cacheSet(cacheKey, result);
    return result;
  } catch (e) {
    console.error('Error fetching settings:', e);
    return null;
  }
};

// --- TRANSACTIONS ---

export const getTransactions = async (userId: string, limit = 200): Promise<Transaction[]> => {
  if (!userId || !supabase) return [];
  const cacheKey = `transactions:${userId}`;
  const cached = cacheGet<Transaction[]>(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, user_id, type, amount, description, category, date, created_at, receipt_id')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    const result = (data || []).map(t => ({
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
    cacheSet(cacheKey, result);
    return result;
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
    cacheDel(`transactions:${userId}`);
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
    cacheDel(`transactions:${userId}`);
    return await getTransactions(userId);
  } catch (e) {
    console.error('Error deleting transaction:', e);
    return [];
  }
};
