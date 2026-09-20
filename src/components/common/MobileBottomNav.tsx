import React, { useEffect, useState } from 'react';
import { AppRoute, User } from '../../types';
import { dbService } from '../../services/dataService';
import {
  LayoutDashboard,
  FileText,
  Scale,
  CheckSquare,
  Boxes,
  Plus,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenNewRequest: () => void;
  currentUser: User;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenNewRequest,
  currentUser,
}) => {
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      const quotes = dbService.getQuotes().filter((q) => q.status === 'pending_approval');
      const reqs = dbService.getRequests().filter((r) => r.status === 'pending_approval');
      setPendingApprovals(quotes.length + reqs.length);

      const stock = dbService.getStock().filter((s) => s.currentStock <= s.minStock);
      setLowStockCount(stock.length);
    };

    updateStats();
    return dbService.subscribe(updateStats);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden px-2 py-1 shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {/* Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition ${
            currentRoute === 'dashboard' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Início</span>
        </button>

        {/* Requests */}
        <button
          onClick={() => onNavigate('requests')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition ${
            currentRoute === 'requests' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Pedidos</span>
        </button>

        {/* Floating Quick Action: Nova Solicitação */}
        <button
          id="btn-mobile-new-request"
          onClick={onOpenNewRequest}
          className="flex flex-col items-center justify-center -mt-5"
          title="Criar Nova Solicitação"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300 active:scale-95 transition">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-indigo-700 mt-0.5">Novo</span>
        </button>

        {/* Quotes or Approvals based on role */}
        {currentUser.role === 'approver' || currentUser.role === 'admin' ? (
          <button
            onClick={() => onNavigate('approvals')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 relative transition ${
              currentRoute === 'approvals' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Alçadas</span>
            {pendingApprovals > 0 && (
              <span className="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white animate-bounce">
                {pendingApprovals}
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={() => onNavigate('quotes')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition ${
              currentRoute === 'quotes' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <Scale className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Cotações</span>
          </button>
        )}

        {/* Stock / Almoxarifado */}
        <button
          onClick={() => onNavigate('stock')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 relative transition ${
            currentRoute === 'stock' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <Boxes className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Estoque</span>
          {lowStockCount > 0 && (
            <span className="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
              {lowStockCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
