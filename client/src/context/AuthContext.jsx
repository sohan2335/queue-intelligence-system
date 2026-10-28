import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { login as apiLogin, fetchMe, getStoredToken, setStoredToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!getStoredToken());

  // Restore an existing session on page load.
  useEffect(() => {
    if (!getStoredToken()) return;
    fetchMe()
      .then(r => setUser(r.user))
      .catch(() => setStoredToken(null))
      .finally(() => setChecking(false));
  }, []);

  // The API client fires this when the token expires.
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('qis:logout', onLogout);
    return () => window.removeEventListener('qis:logout', onLogout);
  }, []);

  const login = useCallback(async credentials => {
    const { token, user } = await apiLogin(credentials);
    setStoredToken(token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, checking, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
