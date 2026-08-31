// src/features/clients/ClientsPage.tsx
import { useState } from 'react';
import { SavedClient } from '../../types';

interface Props {
  userId: string;
  savedClients: SavedClient[];
  onBack: () => void;
  onUpdateClients: (clients: SavedClient[]) => void;
  onViewHistory: (clientName: string) => void;
}

const initialForm = { name: '', contact: '', nuit: '', location: '' };

export const ClientsPage = ({ userId, savedClients, onBack, onUpdateClients, onViewHistory }: Props) => {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);

  const filtered = savedClients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => { setForm(initialForm); setEditIdx(null); setShowForm(false); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const { addClient, updateClient, getSavedClients } = await import('../../services/storageService');

    if (editIdx !== null) {
      const clientId = savedClients[editIdx]?.id;
      if (clientId) await updateClient(clientId, { ...form, userId });
    } else {
      await addClient({ ...form, userId });
    }
    const updated = await getSavedClients(userId);
    onUpdateClients(updated);
    resetForm();
  };

  const handleEdit = (c: SavedClient, idx: number) => {
    setForm({ name: c.name, contact: c.contact, nuit: c.nuit, location: c.location });
    setEditIdx(idx);
    setShowForm(true);
  };

  const handleDelete = async (id: string | undefined, userId: string) => {
    if (!id) return;
    if (!confirm('Excluir este cliente?')) return;
    const { deleteClient, getSavedClients } = await import('../../services/storageService');
    await deleteClient(id, userId);
    const updated = await getSavedClients(userId);
    onUpdateClients(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-2">&larr; Voltar</button>
            <h1 className="text-2xl font-bold dark:text-white">Clientes</h1>
          </div>
          <button onClick={() => { setShowForm(true); setEditIdx(null); setForm(initialForm); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-bold">
            + Novo Cliente
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={resetForm}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-4 dark:text-white">{editIdx !== null ? 'Editar' : 'Novo'} Cliente</h3>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nome do Cliente / Empresa" className="w-full bg-slate-50 dark:bg-slate-700 border rounded-lg p-3 text-sm dark:text-white outline-none focus:border-blue-500" />
                <input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))}
                  placeholder="Email / Telefone" className="w-full bg-slate-50 dark:bg-slate-700 border rounded-lg p-3 text-sm dark:text-white outline-none focus:border-blue-500" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.nuit} onChange={e => setForm(p => ({ ...p, nuit: e.target.value }))}
                    placeholder="NUIT" className="w-full bg-slate-50 dark:bg-slate-700 border rounded-lg p-3 text-sm dark:text-white outline-none focus:border-blue-500" />
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="Endereço" className="w-full bg-slate-50 dark:bg-slate-700 border rounded-lg p-3 text-sm dark:text-white outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={resetForm} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium dark:text-white">Cancelar</button>
                <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Salvar</button>
              </div>
            </div>
          </div>
        )}

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cliente..." className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm mb-4 outline-none focus:border-blue-500 dark:text-white" />

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <i className="fa-solid fa-users text-5xl mb-4"></i>
            <p>Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {filtered.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-slate-400 truncate">{c.contact} {c.nuit ? `· NUIT: ${c.nuit}` : ''}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => onViewHistory(c.name)}
                    className="px-3 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition">
                    <i className="fa-solid fa-clock-rotate-left mr-1"></i>Histórico
                  </button>
                  <button onClick={() => handleEdit(c, i)}
                    className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition">
                    <i className="fa-solid fa-pen mr-1"></i>Editar
                  </button>
                  <button onClick={() => handleDelete(c.id, userId)}
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
