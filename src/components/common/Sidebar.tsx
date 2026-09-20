import React, { useState, useEffect } from 'react';
import { AppRoute, User } from '../../types';
import { dbService } from '../../services/dataService';
import {
  LayoutDashboard,
  FileText,
  Scale,
  CheckSquare,
  ShoppingBag,
  Boxes,
  Truck,
  Users,
  History,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  currentUser,
  isOpen,
  onClose,
}) => {
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      const quotes = dbService.getQuotes().filter((q) => q.status === 'pending_approval');
      const reqsAppr = dbService.getRequests().filter((r) => r.status === 'pending_approval');
      setPendingApprovals(quotes.length + reqsAppr.length);

      const stock = dbService.getStock().filter((s) => s.currentStock <= s.minStock);
      setLowStockCount(stock.length);

      const activeQuotes = dbService.getQuotes().filter((q) => q.status === 'in_progress');
      setPendingQuotesCount(activeQuotes.length);

      const openReqs = dbService.getRequests().filter((r) => r.status === 'pending_quote');
      setPendingRequestsCount(openReqs.length);
    };

    updateStats();
    return dbService.subscribe(updateStats);
  }, []);

  const menuItems = [
    {
      id: 'dashboard' as AppRoute,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'requests' as AppRoute,
      label: 'Solicitações',
      icon: FileText,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'quotes' as AppRoute,
      label: 'Cotações & Mapa',
      icon: Scale,
      badge: pendingQuotesCount > 0 ? pendingQuotesCount : null,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'approvals' as AppRoute,
      label: 'Alçadas & Aprovações',
      icon: CheckSquare,
      badge: pendingApprovals > 0 ? pendingApprovals : null,
      badgeColor: 'bg-amber-100 text-amber-700 animate-pulse',
    },
    {
      id: 'orders' as AppRoute,
      label: 'Pedidos de Compra',
      icon: ShoppingBag,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'stock' as AppRoute,
      label: 'Almoxarifado & Estoque',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-red-100 text-red-700 font-bold',
    },
    {
      id: 'suppliers' as AppRoute,
      label: 'Fornecedores',
      icon: Truck,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'users' as AppRoute,
      label: 'Gestão de Usuários',
      icon: Users,
      badge: null,
      badgeColor: '',
      adminOnly: true,
    },
    {
      id: 'audit' as AppRoute,
      label: 'Trilha de Auditoria',
      icon: History,
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              C365
            </div>
            <span className="font-bold text-slate-900">Menu Principal</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Módulos de Compras
          </div>

          {menuItems.map((item) => {
            if (item.adminOnly && currentUser.role !== 'admin') {
              return null;
            }

            const Icon = item.icon;
            const isActive = currentRoute === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== null && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Low Stock Warning Card on Bottom of Sidebar */}
        {lowStockCount > 0 && (
          <div className="p-3 mx-3 mb-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">
                  {lowStockCount} {lowStockCount === 1 ? 'item abaixo' : 'itens abaixo'} do mínimo!
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Almoxarifado precisa de reposição de estoque.
                </p>
                <button
                  onClick={() => {
                    onNavigate('stock');
                    onClose();
                  }}
                  className="mt-2 text-xs font-semibold text-amber-900 hover:underline inline-flex items-center gap-1"
                >
                  Ver Estoque Crítico →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer User Info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
          <div className="truncate">
            <span className="font-semibold text-slate-700 block truncate">{currentUser.displayName}</span>
            <span className="text-[10px] text-slate-400">{currentUser.department}</span>
          </div>
          <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
            PWA OK
          </span>
        </div>
      </aside>
    </>
  );
};
