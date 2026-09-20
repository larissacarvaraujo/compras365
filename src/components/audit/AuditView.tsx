import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dataService';
import { AuditLog, User } from '../../types';
import { exportToExcel } from '../../utils/exportExcel';
import {
  History,
  Search,
  Download,
  ShieldCheck,
  Lock,
  Filter,
} from 'lucide-react';

interface AuditViewProps {
  currentUser: User;
}

export const AuditView: React.FC<AuditViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const loadData = () => {
    setLogs(dbService.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    return dbService.subscribe(loadData);
  }, []);

  const filtered = logs.filter((log) => {
    const entityCode = log.entityCode || log.entityId || '';
    const entityType = log.entityType || log.entity || '';
    const matchesSearch =
      (log.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      entityCode.toLowerCase().includes(search.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(search.toLowerCase());

    const matchesEntity = entityFilter === 'ALL' || entityType === entityFilter;

    return matchesSearch && matchesEntity;
  });

  const handleExportExcel = () => {
    const headers = ['Data / Hora', 'Usuário', 'E-mail', 'Ação', 'Entidade', 'Código Ref', 'Detalhes da Operação'];
    const rows = filtered.map((l) => [
      new Date(l.timestamp || l.createdAt || 0).toLocaleString('pt-BR'),
      l.userName,
      l.userEmail,
      l.action,
      l.entityType || l.entity || '',
      l.entityCode || l.entityId || '',
      l.details,
    ]);
    exportToExcel('Trilha_Auditoria_Compras365', headers, rows);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">CRIAÇÃO</span>;
      case 'APPROVE':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">APROVAÇÃO</span>;
      case 'REJECT':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">REPROVAÇÃO</span>;
      case 'RECEIVE':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">ENTRADA NF</span>;
      case 'UPDATE':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">ALTERAÇÃO</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{action}</span>;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Trilha Imutável de Auditoria & Conformidade
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Registro cronológico append-only protegido por regras de segurança contra fraudes ou adulteração
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Relatório</span>
        </button>
      </div>

      {/* Security explanation ribbon */}
      <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Garantia de Imutabilidade:</strong> Documentos de log possuem regra <code>allow update, delete: if false;</code>. Nenhum usuário pode apagar ou reescrever a história.
          </span>
        </div>
        <span className="text-emerald-400 font-bold hidden md:inline text-[11px]">
          100% Auditável
        </span>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por usuário, e-mail, código de documento ou detalhe..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium text-slate-700"
        >
          <option value="ALL">Todas as Entidades</option>
          <option value="REQUEST">Solicitações</option>
          <option value="QUOTE">Cotações</option>
          <option value="ORDER">Pedidos</option>
          <option value="STOCK">Almoxarifado</option>
          <option value="USER">Usuários</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Data / Hora</th>
              <th className="p-3.5">Usuário Responsável</th>
              <th className="p-3.5 text-center">Operação</th>
              <th className="p-3.5">Documento Alvo</th>
              <th className="p-3.5">Detalhamento Auditado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Nenhum registro de auditoria localizado para esta pesquisa.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp || log.createdAt || 0).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-bold text-slate-800 block">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.userEmail}</span>
                  </td>
                  <td className="p-3.5 text-center">{getActionBadge(log.action)}</td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {log.entityCode || log.entityId}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{log.entityType}</span>
                  </td>
                  <td className="p-3.5 text-slate-700 leading-relaxed max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
