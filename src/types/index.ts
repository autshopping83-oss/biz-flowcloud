export type DocumentType = 'RECEIPT' | 'INVOICE' | 'QUOTE' | 'INVOICE_RECEIPT';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptData {
  id: string;
  type: DocumentType; 
  number: string;
  date: string;
  dueDate?: string; 
  
  // Localization
  currency: string;
  language: string;

  // Client Info
  clientName: string;
  clientContact: string;
  clientWhatsApp?: string;
  clientLocation: string;
  clientNuit: string;
  
  // Company/Issuer Info
  companyName?: string;
  companyAddress?: string;
  companyNuit?: string;
  companyContact?: string;
  companyLogo?: string;
  
  // Items
  items: LineItem[];
  
  // Financials
  subtotal: number;
  taxRate: number; 
  taxAmount: number;
  discount: number; 
  total: number;
  paymentMethod?: string;
  
  // Visuals
  stampText?: string;
  signatureData?: string; 
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  documentTheme?: 'color' | 'bw';
  
  // Meta
  createdAt: number;
  pdfUrl?: string;
}

export type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface CompanySettings {
  name: string;
  address: string;
  nuit: string;
  contact: string;
  logo?: string;
  defaultTaxRate?: number;
  currency: string;
  language: string;
  theme?: 'light' | 'dark';
  plan: SubscriptionPlan;
  isAdmin?: boolean;
  customStamp?: string;
  signature?: string;
  userEmail?: string;
}

export interface Comment {
  id: string;
  userName: string;
  userLogo?: string;
  content: string;
  timestamp: number;
  location?: string;
  likes: number;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  userId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  timestamp: number;
  receiptId?: string;
}

export interface SavedClient {
  id?: string;
  name: string;
  contact: string;
  nuit: string;
  location: string;
  userId?: string;
}

export interface SavedProduct {
  id?: string;
  description: string;
  unitPrice: number;
  category?: string;
  userId?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}
