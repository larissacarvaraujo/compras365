import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dataService';
import { User, AppRoute } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Bell,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  Menu,
  X,
  PlusCircle,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenNewRequest: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentRoute,
  onNavigate,
  onOpenNewRequest,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setUsers(dbService.getUsers());
      const quotes = dbService.getQuotes().filter((q) => q.status === 'pending_approval');
      const reqs = dbService.getRequests().filter((r) => r.status === 'pending_approval');
      setPendingApprovalsCount(quotes.length + reqs.length);

      const stock = dbService.getStock().filter((s) => s.currentStock <= s.minStock);
      setLowStockCount(stock.length);
    };

    updateStats();
    return dbService.subscribe(updateStats);
  }, []);

  const handleSwitchUser = (userId: string) => {
    dbService.setCurrentUser(userId);
    setShowRoleMenu(false);
  };

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Admin</span>;
      case 'buyer':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Comprador</span>;
      case 'approver':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Aprovador</span>;
      case 'stock_manager':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Almoxarife</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Solicitante</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="flex items-center justify-between px-3 md:px-6 py-2.5">
        {/* Left branding & mobile menu toggle */}
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-sidebar"
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden"
            aria-label="Abrir menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-indigo-200 group-hover:scale-105 transition">
              C<span className="text-emerald-300 text-xs font-bold">365</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900">Compras365</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">v2.0 Segura</span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Gestão de Suprimentos & Almoxarifado</p>
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Request */}
          <button
            id="btn-quick-new-request"
            onClick={onOpenNewRequest}
            className="hidden sm:inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nova Solicitação</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Pending Alerts Indicator */}
          {(currentUser.role === 'admin' || currentUser.role === 'approver') && pendingApprovalsCount > 0 && (
            <button
              id="btn-nav-pending-approvals"
              onClick={() => onNavigate('approvals')}
              className="relative p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
              title={`${pendingApprovalsCount} aprovações pendentes de alçada`}
            >
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pendingApprovalsCount}
              </span>
            </button>
          )}

          {/* User Role Switcher Dropdown (Essential for testing all roles requested by user) */}
          <div className="relative">
            <button
              id="btn-role-switcher"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
              title="Alternar perfil de usuário (Simulação RBAC)"
            >
              <div className="text-left hidden md:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">{currentUser.displayName}</span>
                  {getRoleBadge(currentUser.role)}
                </div>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  {currentUser.role === 'admin' ? 'Alçada: Ilimitada' : `Alçada: R$ ${currentUser.approvalLimit.toLocaleString('pt-BR')}`}
                </span>
              </div>
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                {currentUser.displayName.charAt(0)}
              </div>
            </button>

            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white p-2.5 shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-2 border-b border-slate-100 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Testar Perfis (RBAC)</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Troque de usuário para validar regras de segurança e alçadas de aprovação.
                    </p>
                  </div>

                  <div className="space-y-1">
                    {users.map((u) => {
                      const isCurrent = u.userId === currentUser.userId;
                      return (
                        <button
                          key={u.userId}
                          onClick={() => handleSwitchUser(u.userId)}
                          className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition text-xs ${
                            isCurrent
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{u.displayName}</span>
                              {getRoleBadge(u.role)}
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              {u.department} • {u.status === 'pending' ? '⚠️ Aguardando Aprovação' : `Alçada: R$ ${u.approvalLimit.toLocaleString('pt-BR')}`}
                            </span>
                          </div>
                          {isCurrent && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between px-1">
                    <button
                      onClick={() => {
                        dbService.resetToInitial();
                        setShowRoleMenu(false);
                      }}
                      className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restaurar dados demo</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">Compras365 v2</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
