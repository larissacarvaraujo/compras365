import React from 'react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="banner-offline"
      className="bg-amber-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 shadow-md z-50 transition-all"
    >
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>
        <strong>Modo Offline Ativo</strong> — Você está sem conexão com a internet. O Almoxarifado está operando com cache local sincronizável.
      </span>
    </div>
  );
};
