import { useState, useEffect } from 'react';

export function useResizableSidebar() {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pdf_sidebar_open');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pdf_sidebar_width');
      return saved !== null ? parseInt(saved, 10) : 480;
    } catch {
      return 480;
    }
  });

  // Reactive listener to update state in real-time across different layout contexts
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('pdf_sidebar_open');
        setIsOpen(saved !== null ? JSON.parse(saved) : false);
      } catch {}
    };
    window.addEventListener('pdf-sidebar-state-change', handleSync);
    return () => window.removeEventListener('pdf-sidebar-state-change', handleSync);
  }, []);

  const triggerUpdate = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    try {
      localStorage.setItem('pdf_sidebar_open', JSON.stringify(nextOpen));
      window.dispatchEvent(new Event('pdf-sidebar-state-change'));
    } catch (e) {
      console.warn('LocalStorage save warning', e);
    }
  };

  const toggleSidebar = () => {
    triggerUpdate(!isOpen);
  };

  const openSidebar = () => {
    triggerUpdate(true);
  };

  const closeSidebar = () => {
    triggerUpdate(false);
  };

  useEffect(() => {
    try {
      localStorage.setItem('pdf_sidebar_width', JSON.stringify(sidebarWidth));
    } catch (e) {
      console.warn('Failed to save width', e);
    }
  }, [sidebarWidth]);

  return {
    isOpen,
    setIsOpen: triggerUpdate,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    sidebarWidth,
    setSidebarWidth,
  };
}
