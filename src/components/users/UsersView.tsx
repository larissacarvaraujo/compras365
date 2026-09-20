import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dataService';
import { User, UserRole, UserStatus } from '../../types';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  DollarSign,
  Building,
} from 'lucide-react';

interface UsersViewProps {
  currentUser: User;
}

export const UsersView: React.FC<UsersViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('collaborator');
  const [newStatus, setNewStatus] = useState<UserStatus>('active');
  const [newLimit, setNewLimit] = useState<number>(0);
  const [newDept, setNewDept] = useState('');

  const loadData = () => {
    setUsers(dbService.getUsers());
  };

  useEffect(() => {
    loadData();
    return dbService.subscribe(loadData);
  }, []);

  if (currentUser.role !== 'admin') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Acesso Restrito ao Administrador</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Apenas administradores de segurança podem gerenciar perfis, aprovar novos usuários e alterar alçadas de aprovação.
        </p>
      </div>
    );
  }

  const handleStartEdit = (u: User) => {
    setEditingUser(u);
    setNewRole(u.role);
    setNewStatus(u.status);
    setNewLimit(u.approvalLimit);
    setNewDept(u.department);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    dbService.updateUser(editingUser.userId, {
      role: newRole,
      status: newStatus,
      approvalLimit: Number(newLimit) || 0,
      department: newDept,
    });

    setEditingUser(null);
  };

  const handleQuickApprove = (u: User) => {
    dbService.updateUser(u.userId, {
      status: 'active',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Gestão de Usuários & Controle de Acesso (RBAC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Aprovação de contas recém-cadastradas, definição estrita de papéis e alçadas de aprovação
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Políticas de Segurança Auditadas</span>
        </div>
      </div>

      {/* Explanatory Security Fix Banner */}
      <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl shadow-xs space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-emerald-400 uppercase tracking-wider">
          <Lock className="w-4 h-4" />
          <span>Mitigação de Segurança Ativa</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          <strong>Correção contra auto-elevação de privilégios:</strong> As regras de segurança no Firestore barram tentativas do próprio usuário alterar seu campo <code>role</code> ou <code>approvalLimit</code>. Novos usuários entram com status <code>pending</code> e precisam de aprovação explícita de um administrador para operar.
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Usuário / E-mail</th>
              <th className="p-3.5">Departamento</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-center">Perfil (Role)</th>
              <th className="p-3.5 text-right">Alçada de Aprovação</th>
              <th className="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.userId} className="hover:bg-slate-50/70 transition">
                <td className="p-3.5">
                  <span className="font-bold text-slate-900 block">{u.displayName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                </td>
                <td className="p-3.5 text-slate-700 font-medium">{u.department}</td>
                <td className="p-3.5 text-center">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      u.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : u.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {u.status === 'active' ? 'Ativo' : u.status === 'pending' ? 'Pendente' : 'Inativo'}
                  </span>
                </td>
                <td className="p-3.5 text-center">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 uppercase">
                    {u.role}
                  </span>
                </td>
                <td className="p-3.5 text-right font-black text-slate-900">
                  {u.role === 'admin'
                    ? 'Ilimitada'
                    : `R$ ${u.approvalLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </td>
                <td className="p-3.5 text-right space-x-1">
                  {u.status === 'pending' && (
                    <button
                      onClick={() => handleQuickApprove(u)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition mr-1"
                      title="Aprovar usuário no sistema"
                    >
                      Aprovar
                    </button>
                  )}
                  <button
                    onClick={() => handleStartEdit(u)}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                    title="Editar perfil e alçada"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Editar Permissões de Usuário</h3>
                <span className="text-xs text-slate-500">{editingUser.displayName} ({editingUser.email})</span>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status da Conta</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="active">Ativo (Acesso Liberado)</option>
                  <option value="pending">Pendente (Aguardando Aprovação)</option>
                  <option value="inactive">Inativo / Bloqueado</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Papel no Sistema (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="collaborator">Colaborador / Solicitante</option>
                  <option value="buyer">Comprador (Quotation / Mapa de Preços)</option>
                  <option value="approver">Aprovador (Alçada Financeira)</option>
                  <option value="stock_manager">Almoxarife (Entrada NF & Estoque)</option>
                  <option value="admin">Administrador Geral</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Departamento</label>
                <input
                  type="text"
                  required
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Limite Máximo de Alçada de Compra (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={newLimit}
                  onChange={(e) => setNewLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Compras acima deste montante não poderão ser autorizadas por este usuário.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
