import { createContext, useContext, useState, useEffect } from 'react';
import { checkAuth, login as authLogin, logout as authLogout } from '../utils/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { username: string; role: string } | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    checkAuth().then(authData => {
      if (authData) {
        setIsAuthenticated(true);
        setUser({
          username: authData.username,
          role: authData.role,
        });
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (username: string, password: string) => {
    const authData = await authLogin(username, password);
    if (authData) {
      setIsAuthenticated(true);
      setUser({
        username: authData.username,
        role: authData.role,
      });
      return true;
    }
    return false;
  };

  const logout = async () => {
    await authLogout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}