// src/services/syncService.ts
import { supabase } from './supabase';
import { db } from './db';
import type { ReceiptData, SavedClient, SavedProduct, Transaction } from '../types';

export interface SyncResult {
  documents: number;
  clients: number;
  products: number;
  transactions: number;
  errors: string[];
}

/** Push local data → Supabase */
export const pushToSupabase = async (userId: string): Promise<SyncResult> => {
  const result: SyncResult = { documents: 0, clients: 0, products: 0, transactions: 0, errors: [] };
  if (!supabase || !userId || userId === 'local') return result;

  const push = async (label: string, fn: () => Promise<number>) => {
    try { await fn(); } catch (e: any) { result.errors.push(`${label}: ${e.message}`); }
  };

  await push('documents', async () => {
    const docs = await db.receipts.where('userId').equals(userId).toArray();
    if (!docs.length) return 0;
    const mapped = docs.map(d => ({
      id: d.id, user_id: userId, type: d.type, number: d.number, date: d.date,
      currency: d.currency, client_name: d.clientName, client_contact: d.clientContact,
      client_location: d.clientLocation, client_nuit: d.clientNuit,
      items: JSON.stringify(d.items), subtotal: d.subtotal, tax_rate: d.taxRate,
      tax_amount: d.taxAmount, discount: d.discount, total: d.total,
      stamp_text: d.stampText, signature_data: d.signatureData,
      document_theme: d.documentTheme, status: d.status, pdf_url: d.pdfUrl,
      synced: true, created_at: new Date(d.createdAt).toISOString(),
    }));
    const { error } = await supabase!.from('documents').upsert(mapped, { onConflict: 'id' });
    if (error) throw error;
    result.documents = mapped.length;
    return mapped.length;
  });

  await push('clients', async () => {
    const clients = await db.clients.where('userId').equals(userId).toArray();
    if (!clients.length) return 0;
    const { error } = await supabase!.from('saved_clients').upsert(
      clients.map(c => ({ user_id: userId, name: c.name, contact: c.contact, nuit: c.nuit, location: c.location })),
      { onConflict: 'user_id,name' }
    );
    if (error) throw error;
    result.clients = clients.length;
    return clients.length;
  });

  await push('products', async () => {
    const products = await db.products.where('userId').equals(userId).toArray();
    if (!products.length) return 0;
    const { error } = await supabase!.from('saved_products').upsert(
      products.map(p => ({ user_id: userId, description: p.description, unit_price: p.unitPrice })),
      { onConflict: 'user_id,description' }
    );
    if (error) throw error;
    result.products = products.length;
    return products.length;
  });

  await push('transactions', async () => {
    const txns = await db.transactions.where('userId').equals(userId).toArray();
    if (!txns.length) return 0;
    const { error } = await supabase!.from('transactions').upsert(
      txns.map(t => ({ user_id: userId, type: t.type, amount: t.amount, description: t.description, category: t.category, date: t.date, receipt_id: t.receiptId, id: t.id })),
      { onConflict: 'id' }
    );
    if (error) throw error;
    result.transactions = txns.length;
    return txns.length;
  });

  return result;
};

/** Pull Supabase → local IndexedDB (executar no login) */
export const pullFromSupabase = async (userId: string): Promise<SyncResult> => {
  const result: SyncResult = { documents: 0, clients: 0, products: 0, transactions: 0, errors: [] };
  if (!supabase || !userId || userId === 'local') return result;

  const pull = async (label: string, fn: () => Promise<number>) => {
    try { await fn(); } catch (e: any) { result.errors.push(`${label}: ${e.message}`); }
  };

  await pull('documents', async () => {
    const { data, error } = await supabase!.from('documents').select('*').eq('user_id', userId);
    if (error) throw error;
    if (!data?.length) return 0;
    const receipts: ReceiptData[] = data.map((r: any) => ({
      id: r.id, userId, type: r.type, number: r.number, date: r.date,
      currency: r.currency, clientName: r.client_name, clientContact: r.client_contact,
      clientLocation: r.client_location, clientNuit: r.client_nuit,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
      subtotal: r.subtotal, taxRate: r.tax_rate, taxAmount: r.tax_amount,
      discount: r.discount, total: r.total, stampText: r.stamp_text,
      signatureData: r.signature_data, documentTheme: r.document_theme,
      status: r.status, pdfUrl: r.pdf_url, createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    }));
    await db.receipts.bulkPut(receipts);
    result.documents = receipts.length;
    return receipts.length;
  });

  await pull('clients', async () => {
    const { data, error } = await supabase!.from('saved_clients').select('*').eq('user_id', userId);
    if (error) throw error;
    if (!data?.length) return 0;
    const clients: SavedClient[] = data.map((c: any) => ({
      name: c.name, contact: c.contact || '', nuit: c.nuit || '', location: c.location || '', userId,
    }));
    await db.clients.bulkPut(clients);
    result.clients = clients.length;
    return clients.length;
  });

  await pull('products', async () => {
    const { data, error } = await supabase!.from('saved_products').select('*').eq('user_id', userId);
    if (error) throw error;
    if (!data?.length) return 0;
    const products: SavedProduct[] = data.map((p: any) => ({
      description: p.description, unitPrice: p.unit_price || 0, userId,
    }));
    await db.products.bulkPut(products);
    result.products = products.length;
    return products.length;
  });

  await pull('transactions', async () => {
    const { data, error } = await supabase!.from('transactions').select('*').eq('user_id', userId);
    if (error) throw error;
    if (!data?.length) return 0;
    const txns: Transaction[] = data.map((t: any) => ({
      id: t.id, userId, type: t.type, amount: t.amount,
      description: t.description || '', category: t.category || '',
      date: t.date, timestamp: Date.now(), receiptId: t.receipt_id,
    }));
    await db.transactions.bulkPut(txns);
    result.transactions = txns.length;
    return txns.length;
  });

  return result;
};

/** Sync completo: push local → remoto, depois pull remoto → local */
export const fullSync = async (userId: string): Promise<{ push: SyncResult; pull: SyncResult }> => {
  const push = await pushToSupabase(userId);
  const pull = await pullFromSupabase(userId);
  return { push, pull };
};

export const syncSingleDocument = async (doc: {
  id: string; userId: string; type: string; number: string; date: string;
  currency: string; clientName: string; clientContact: string;
  clientLocation: string; clientNuit: string; items: unknown[];
  subtotal: number; taxRate: number; taxAmount: number; discount: number; total: number;
  stampText?: string; signatureData?: string; documentTheme?: string;
  status?: string; createdAt: number;
}) => {
  if (!supabase || !doc.userId || doc.userId === 'local') return;
  try {
    await supabase.from('documents').upsert({
      id: doc.id, user_id: doc.userId, type: doc.type, number: doc.number,
      date: doc.date, currency: doc.currency, client_name: doc.clientName,
      client_contact: doc.clientContact, client_location: doc.clientLocation,
      client_nuit: doc.clientNuit, items: JSON.stringify(doc.items),
      subtotal: doc.subtotal, tax_rate: doc.taxRate, tax_amount: doc.taxAmount,
      discount: doc.discount, total: doc.total, stamp_text: doc.stampText,
      signature_data: doc.signatureData, document_theme: doc.documentTheme,
      status: doc.status, synced: true,
      created_at: new Date(doc.createdAt).toISOString(),
    }, { onConflict: 'id' });
  } catch {
    // Silencioso — sync não deve bloquear o salvamento local
  }
};
