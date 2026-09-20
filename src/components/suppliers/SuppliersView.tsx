import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dataService';
import { Supplier, User } from '../../types';
import { exportToExcel } from '../../utils/exportExcel';
import {
  Truck,
  Search,
  Plus,
  Download,
  Star,
  Phone,
  Mail,
  Building,
  CheckCircle,
  X,
} from 'lucide-react';

interface SuppliersViewProps {
  currentUser: User;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ currentUser }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Supplier form state
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Materiais Elétricos');
  const [rating, setRating] = useState(5);

  const loadData = () => {
    setSuppliers(dbService.getSuppliers());
  };

  useEffect(() => {
    loadData();
    return dbService.subscribe(loadData);
  }, []);

  const filtered = suppliers.filter((s) => {
    const sName = s.name || s.tradeName || s.corporateName || '';
    const sContact = s.contactName || s.contactPerson || '';
    const matchesSearch =
      sName.toLowerCase().includes(search.toLowerCase()) ||
      s.cnpj.includes(search) ||
      sContact.toLowerCase().includes(search.toLowerCase());

    const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleExportExcel = () => {
    const headers = ['Razão Social', 'CNPJ', 'Categoria', 'Contato', 'Telefone', 'E-mail', 'Avaliação (1-5)'];
    const rows = filtered.map((s) => [
      s.name || s.tradeName || s.corporateName || '',
      s.cnpj,
      s.category,
      s.contactName || s.contactPerson || '',
      s.phone,
      s.email,
      s.rating,
    ]);
    exportToExcel('Fornecedores_Cadastrados_Compras365', headers, rows);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cnpj.trim()) return;

    dbService.createSupplier({
      name,
      cnpj,
      contactName,
      phone,
      email,
      category,
      rating,
      address: 'São Paulo/SP',
    });

    setShowAddModal(false);
    setName('');
    setCnpj('');
    setContactName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Cadastro de Fornecedores Homologados
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Base qualificada de parceiros comerciais, categorias e avaliações de desempenho
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>

          {(currentUser.role === 'buyer' || currentUser.role === 'admin') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Fornecedor</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar fornecedor por razão social, CNPJ ou contato..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium text-slate-700"
        >
          <option value="ALL">Todas as Categorias</option>
          <option value="Papelaria & Escritório">Papelaria & Escritório</option>
          <option value="Informática & TI">Informática & TI</option>
          <option value="Materiais Elétricos">Materiais Elétricos</option>
          <option value="EPIs & Segurança">EPIs & Segurança</option>
          <option value="Serviços Industriais">Serviços Industriais</option>
        </select>
      </div>

      {/* Grid of Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sup) => (
          <div
            key={sup.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs space-y-3 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {sup.category}
                </span>
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < sup.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <h3 className="font-bold text-sm text-slate-900">{sup.name || sup.tradeName || sup.corporateName}</h3>
              <p className="text-xs text-slate-500 font-mono">CNPJ: {sup.cnpj}</p>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Contato:</span>
                  <strong>{sup.contactName || sup.contactPerson || 'Representante'}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{sup.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                <CheckCircle className="w-3.5 h-3.5" /> Homologado
              </span>
              <a
                href={`https://api.whatsapp.com/send?phone=55${sup.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px]"
              >
                Abrir WhatsApp →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Fornecedor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Razão Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Elétrica Comercial Ltda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">CNPJ</label>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contato</label>
                  <input
                    type="text"
                    placeholder="Vendedor"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Telefone/WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">E-mail Comercial</label>
                <input
                  type="email"
                  placeholder="vendas@fornecedor.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Categoria Principal</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="Materiais Elétricos">Materiais Elétricos</option>
                  <option value="Informática & TI">Informática & TI</option>
                  <option value="Papelaria & Escritório">Papelaria & Escritório</option>
                  <option value="EPIs & Segurança">EPIs & Segurança</option>
                  <option value="Serviços Industriais">Serviços Industriais</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
