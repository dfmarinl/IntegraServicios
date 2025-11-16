import React, { useState, useEffect, useRef, createContext } from "react";
import { saveToken, getToken, removeToken } from "../utils/token";
import { getMeApi, loginApi } from "../api/user/auth";

export const AuthContext = createContext({
  auth: null,
  loading: true,
  login: () => null,
  logout: () => null,
  updateUser: () => null,
  isAdmin: () => false,
  isAuthenticated: false,
});

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      console.log("Token encontrado:", token);

      if (token) {
        try {
          const user = await getMeApi(token);
          console.log("Usuario obtenido:", user);
          setAuth({ token, user });
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
          removeToken();
          setAuth(null);
        }
      } else {
        setAuth(null);
      }
      setLoading(false);
    };

    if (!isInitialized.current) {
      isInitialized.current = true;
      initializeAuth();
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginApi(email, password);
      const { token, user } = response;

      saveToken(token);
      setAuth({ token, user });
      return user;
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      setAuth(null);
      throw error;
    }
  };

  const logout = () => {
    removeToken();
    setAuth(null);
  };

  const updateUser = (updatedUser) => {
    setAuth((prevAuth) => ({
      ...prevAuth,
      user: { ...prevAuth.user, ...updatedUser },
    }));
  };

  const isAdmin = () => {
    return auth?.user?.rol === "administrador";
  };

  const isAuthenticated = () => {
    return auth !== null && auth.token !== null;
  };

  const contextValue = {
    auth,
    loading,
    login,
    logout,
    updateUser,
    isAdmin,
    isAuthenticated: isAuthenticated(),
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
