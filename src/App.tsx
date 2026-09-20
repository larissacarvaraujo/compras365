import React, { useState, useEffect } from 'react';
import { dbService } from './services/dataService';
import { AppRoute, User } from './types';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { OfflineBanner } from './components/common/OfflineBanner';
import { RequestFormModal } from './components/requests/RequestFormModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { RequestListView } from './components/requests/RequestListView';
import { QuoteListView } from './components/quotes/QuoteListView';
import { ApprovalsView } from './components/approvals/ApprovalsView';
import { OrderListView } from './components/orders/OrderListView';
import { StockView } from './components/stock/StockView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { UsersView } from './components/users/UsersView';
import { AuditView } from './components/audit/AuditView';
import { ShieldAlert, Clock, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => dbService.getCurrentUser());
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [routeParamId, setRouteParamId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);

  // Subscribe to user and data updates
  useEffect(() => {
    const unsub = dbService.subscribe(() => {
      setCurrentUser(dbService.getCurrentUser());
    });
    return unsub;
  }, []);

  // Hash-based URL Routing (supports browser back/forward buttons)
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      const [route, queryStr] = hash.split('?');
      const validRoutes: AppRoute[] = [
        'dashboard',
        'requests',
        'quotes',
        'approvals',
        'orders',
        'stock',
        'suppliers',
        'users',
        'audit',
      ];

      if (validRoutes.includes(route as AppRoute)) {
        setCurrentRoute(route as AppRoute);
      } else {
        setCurrentRoute('dashboard');
      }

      if (queryStr) {
        const params = new URLSearchParams(queryStr);
        setRouteParamId(params.get('id'));
      } else {
        setRouteParamId(null);
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const navigateTo = (route: AppRoute, id?: string) => {
    const newHash = id ? `#${route}?id=${id}` : `#${route}`;
    window.location.hash = newHash;
    setCurrentRoute(route);
    setRouteParamId(id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start quotation directly from a request
  const handleStartQuoteFromRequest = (requestId: string) => {
    try {
      const quote = dbService.createQuoteFromRequest(requestId);
      navigateTo('quotes', quote.id);
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar cotação.');
    }
  };

  // Send quote to approval workflow
  const handleSendQuoteToApproval = (quoteId: string) => {
    try {
      dbService.submitQuoteToApproval(quoteId);
      navigateTo('approvals');
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar para aprovação.');
    }
  };

  // Security Gate for Pending / Inactive Users (Addresses Security Issue #2)
  if (currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <OfflineBanner />
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-black text-slate-900">Aprovação de Acesso Pendente</h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Olá, <strong>{currentUser.displayName}</strong>. Por diretrizes de segurança da informação, novas contas necessitam de autorização prévia de um Administrador para acessar dados corporativos de compras e almoxarifado.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 font-mono">
            Status: PENDING_AUTHORIZATION • Depto: {currentUser.department}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-[11px] text-slate-400">
              Alternar para conta de Administrador para aprovar este usuário:
            </p>
            <button
              onClick={() => dbService.setCurrentUser('user-admin-1')}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Alternar para Administrador (Larissa Carvalho)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Offline Status Alert */}
      <OfflineBanner />

      {/* Main App Navbar */}
      <Navbar
        currentUser={currentUser}
        currentRoute={currentRoute}
        onNavigate={(route) => navigateTo(route)}
        onOpenNewRequest={() => setIsNewRequestModalOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Responsive Desktop / Drawer Sidebar */}
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={(route) => navigateTo(route)}
          currentUser={currentUser}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 min-w-0 pb-24 md:pb-12">
          {currentRoute === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              onNavigate={(route) => navigateTo(route)}
              onOpenNewRequest={() => setIsNewRequestModalOpen(true)}
            />
          )}

          {currentRoute === 'requests' && (
            <RequestListView
              currentUser={currentUser}
              onOpenNewRequest={() => setIsNewRequestModalOpen(true)}
              onStartQuote={handleStartQuoteFromRequest}
              onViewQuote={(quoteId) => navigateTo('quotes', quoteId)}
              onViewOrder={(orderId) => navigateTo('orders', orderId)}
            />
          )}

          {currentRoute === 'quotes' && (
            <QuoteListView
              currentUser={currentUser}
              onSendToApproval={handleSendQuoteToApproval}
              selectedQuoteId={routeParamId}
            />
          )}

          {currentRoute === 'approvals' && (
            <ApprovalsView
              currentUser={currentUser}
              onViewQuote={(quoteId) => navigateTo('quotes', quoteId)}
              onViewOrder={(orderId) => navigateTo('orders', orderId)}
            />
          )}

          {currentRoute === 'orders' && (
            <OrderListView
              currentUser={currentUser}
              selectedOrderId={routeParamId}
            />
          )}

          {currentRoute === 'stock' && (
            <StockView
              currentUser={currentUser}
              onNavigateToRequests={() => navigateTo('requests')}
            />
          )}

          {currentRoute === 'suppliers' && (
            <SuppliersView currentUser={currentUser} />
          )}

          {currentRoute === 'users' && (
            <UsersView currentUser={currentUser} />
          )}

          {currentRoute === 'audit' && (
            <AuditView currentUser={currentUser} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Visible on screen < 768px) */}
      <MobileBottomNav
        currentRoute={currentRoute}
        onNavigate={(route) => navigateTo(route)}
        onOpenNewRequest={() => setIsNewRequestModalOpen(true)}
        currentUser={currentUser}
      />

      {/* Global New Request Modal */}
      <RequestFormModal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
        currentUser={currentUser}
        onSuccess={(newReqId) => {
          navigateTo('requests');
        }}
      />
    </div>
  );
}
