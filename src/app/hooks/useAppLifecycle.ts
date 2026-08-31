import { useEffect, useRef } from 'react';
import { getHistory, getSavedClients, getSavedProducts, getCompanySettings } from '../../services/storageService';
import { CompanySettings, ReceiptData, SavedClient, SavedProduct } from '../../types';

interface UseAppLifecycleParams {
  userId: string;
  currentView: string;
  isGuest: boolean;
  setCurrentView: (view: string) => void;
  setIsGuest: (guest: boolean) => void;
  setHistory: (history: ReceiptData[]) => void;
  setSavedClients: (clients: SavedClient[]) => void;
  setSavedProducts: (products: SavedProduct[]) => void;
  setCompanySettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  onReady?: () => void;
}

export const useAppLifecycle = ({
  userId,
  currentView,
  setCurrentView,
  setHistory,
  setSavedClients,
  setSavedProducts,
  setCompanySettings,
  onReady,
}: UseAppLifecycleParams) => {
  const loadedForRef = useRef<string | null>(null);
  const onReadyCalledRef = useRef(false);
  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'updatePassword') {
      setCurrentView('updatePassword');
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (loadedForRef.current === userId) return;
    loadedForRef.current = userId;
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const [localSettings, hist, clients, products] = await Promise.all([
        getCompanySettings(userId),
        getHistory(userId),
        getSavedClients(userId),
        getSavedProducts(userId),
      ]);

      if (localSettings) {
        setCompanySettings(prev => ({ ...prev, ...localSettings, plan: 'PRO' }));
        const theme = localSettings.theme || 'light';
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        const savedTheme = localStorage.getItem('bizflow-theme') || 'light';
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      }

      setHistory(hist);
      setSavedClients(clients);
      setSavedProducts(products);

      const view = currentViewRef.current;
      if (['loading', 'login', 'register', 'forgotPassword'].includes(view)) {
        setCurrentView('home');
      }

      if (!onReadyCalledRef.current) {
        onReadyCalledRef.current = true;
        onReady?.();
      }
    } catch (error) {
      console.error('loadData error:', error);
      const view = currentViewRef.current;
      if (['loading', 'login', 'register', 'forgotPassword'].includes(view)) {
        setCurrentView('home');
      }
    }
  };

  return { loadData };
};
