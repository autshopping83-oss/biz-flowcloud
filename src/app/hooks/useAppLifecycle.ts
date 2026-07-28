import { useEffect, useRef } from 'react';
import { getDirectoryHandle, getHistory, getSavedClients, getSavedProducts, getCompanySettings } from '../../services/storageService';
import { fullSync } from '../../services/syncService';
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
  setIsOnline: (online: boolean) => void;
  setLocalDirHandle: (handle: FileSystemDirectoryHandle | null) => void;
  onReady?: () => void;
}

export const useAppLifecycle = ({
  userId,
  currentView,
  isGuest,
  setCurrentView,
  setIsGuest,
  setHistory,
  setSavedClients,
  setSavedProducts,
  setCompanySettings,
  setIsOnline,
  setLocalDirHandle,
  onReady,
}: UseAppLifecycleParams) => {
  const loadedForRef = useRef<string | null>(null);
  const onReadyCalledRef = useRef(false);
  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;

  // Setup side effects once (listeners, etc.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'updatePassword') {
      setCurrentView('updatePassword');
    }

    getDirectoryHandle().then(handle => {
      if (handle) setLocalDirHandle(handle);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load data when userId changes (first load and after login)
  useEffect(() => {
    if (!userId) return;
    if (loadedForRef.current === userId) return;
    loadedForRef.current = userId;
    loadLocalData();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLocalData = async () => {
    try {
      setIsGuest(false);
      
      // Load settings from local storage
      const localSettings = await getCompanySettings(userId);
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

      // Sync cloud → local (pull) / local → cloud (push)
      if (userId !== 'local' && navigator.onLine) {
        try {
          await fullSync(userId);
        } catch {
          // Sync falhou — dados locais continuam disponíveis
        }
      }

      // Reload from IndexedDB (inclui dados acabados de sincronizar)
      const hist = await getHistory(userId);
      setHistory(hist);
      setSavedClients(await getSavedClients(userId));
      setSavedProducts(await getSavedProducts(userId));

      const view = currentViewRef.current;
      if (['loading', 'login', 'register', 'forgotPassword'].includes(view)) {
        setCurrentView('home');
      }

      if (!onReadyCalledRef.current) {
        onReadyCalledRef.current = true;
        onReady?.();
      }
    } catch (error) {
      console.error('loadLocalData error:', error);
      const view = currentViewRef.current;
      if (['loading', 'login', 'register', 'forgotPassword'].includes(view)) {
        setCurrentView('home');
      }
    }
  };

  return { loadLocalData };
};
