import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';

import { AuthUser, login, refreshAccessToken, setRefreshHandler } from '@/api/client';

const TOKEN_KEY = 'honeydew.accessToken';
const REFRESH_TOKEN_KEY = 'honeydew.refreshToken';
const USER_KEY = 'honeydew.user';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void restoreSession();
    setRefreshHandler(refreshSession);
    return () => setRefreshHandler(null);
  }, []);

  async function restoreSession() {
    const [storedToken, storedRefreshToken, storedUser] = await Promise.all([AsyncStorage.getItem(TOKEN_KEY), AsyncStorage.getItem(REFRESH_TOKEN_KEY), AsyncStorage.getItem(USER_KEY)]);
    if (storedToken && storedRefreshToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser) as AuthUser);
    }
    setIsLoading(false);
  }

  async function signIn(email: string, password: string) {
    const response = await login(email.trim(), password);
    await AsyncStorage.multiSet([[TOKEN_KEY, response.accessToken], [REFRESH_TOKEN_KEY, response.refreshToken], [USER_KEY, JSON.stringify(response.user)]]);
    setToken(response.accessToken);
    setUser(response.user);
  }

  async function signOut() {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  }

  async function refreshSession() {
    const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) return null;
    try {
      const response = await refreshAccessToken(storedRefreshToken);
      await AsyncStorage.multiSet([[TOKEN_KEY, response.accessToken], [REFRESH_TOKEN_KEY, response.refreshToken], [USER_KEY, JSON.stringify(response.user)]]);
      setToken(response.accessToken);
      setUser(response.user);
      return response.accessToken;
    } catch {
      await signOut();
      return null;
    }
  }

  return <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
