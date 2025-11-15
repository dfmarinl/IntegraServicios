import { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI debe ser usado dentro de un UIProvider');
  }
  return context;
};

export const UIProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });

    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const showSuccess = (message) => {
    showNotification(message, 'success');
  };

  const showError = (message) => {
    showNotification(message, 'error');
  };

  const showWarning = (message) => {
    showNotification(message, 'warning');
  };

  const showInfo = (message) => {
    showNotification(message, 'info');
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const value = {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeNotification,
    sidebarOpen,
    toggleSidebar,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
