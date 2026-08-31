// src/features/products/ProductsPage.tsx
import { useState, useEffect } from 'react';
import { Product } from '../../types';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../services/storageService';

interface Props {
  userId: string;
  onBack: () => void;
}

export const ProductsPage = ({ userId, onBack }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: 0, category: '' });

  const loadProducts = async () => {
    if (!userId) return;
    const data = await getProducts(userId);
    setProducts(data);
  };

  useEffect(() => { loadProducts(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editId !== null) {
      await updateProduct(editId, { name: form.name, price: form.price }, userId);
    } else {
      await addProduct({ name: form.name, price: form.price, userId, category: form.category });
    }
    setShowForm(false);
    setEditId(null);
    setForm({ name: '', price: 0, category: '' });
    await loadProducts();
  };

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, price: p.price, category: p.category || '' });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    await deleteProduct(id, userId);
    await loadProducts();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-2">&larr; Voltar</button>
            <h1 className="text-2xl font-bold dark:text-white">Produtos</h1>
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', price: 0, category: '' }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-bold">
            + Novo Produto
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-4 dark:text-white">{editId ? 'Editar' : 'Novo'} Produto</h3>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nome do produto" className="w-full bg-slate-50 dark:bg-slate-700 border rounded-lg p-3 text-sm dark:text-white outline-none focus:border-blue-500" />
                <input type="number" value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                  placeholder="Preço" className="w-full bg-slate-50 dark:bg-slate-700 border rounded-lg p-3 text-sm dark:text-white outline-none focus:border-blue-500" />
                <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  placeholder="Categoria (opcional)" className="w-full bg-slate-50 dark:bg-slate-700 border rounded-lg p-3 text-sm dark:text-white outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium dark:text-white">Cancelar</button>
                <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Salvar</button>
              </div>
            </div>
          </div>
        )}

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar produto..." className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm mb-4 outline-none focus:border-blue-500 dark:text-white" />

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <i className="fa-solid fa-box text-5xl mb-4"></i>
            <p>Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {filtered.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div>
                  <p className="font-medium text-sm dark:text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.price.toLocaleString()} MT {p.category ? `· ${p.category}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(p)}
                    className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition">
                    <i className="fa-solid fa-pen mr-1"></i>Editar
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition">
                    <i className="fa-solid fa-trash mr-1"></i>Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
