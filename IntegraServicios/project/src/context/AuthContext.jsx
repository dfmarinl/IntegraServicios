import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginAPI } from '../api/users';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginAPI(email, password);

      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);

        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);

        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isProfesor = () => {
    return user?.role === 'profesor';
  };

  const isEstudiante = () => {
    return user?.role === 'estudiante';
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin,
    isProfesor,
    isEstudiante,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
