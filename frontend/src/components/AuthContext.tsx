import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthProviders {
  globusEnabled: boolean;
  devLoginEnabled: boolean;
  missingGlobusConfig: string[];
}

interface AuthContextType {
  user: User | null;
  authProviders: AuthProviders;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authProviders: {
    globusEnabled: false,
    devLoginEnabled: false,
    missingGlobusConfig: []
  },
  loading: true,
  refreshUser: async () => {},
  setUser: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authProviders, setAuthProviders] = useState<AuthProviders>({
    globusEnabled: false,
    devLoginEnabled: false,
    missingGlobusConfig: []
  });
  const [loading, setLoading] = useState(true);

  const loadAuth = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [userResponse, providersResponse] = await Promise.all([
        fetch('/api/me', { credentials: 'include' }),
        fetch('/auth/providers', { credentials: 'include' })
      ]);

      const userData = userResponse.ok ? await userResponse.json() : null;
      const providersData = providersResponse.ok ? await providersResponse.json() : null;

      setUser(userData?.user ?? null);
      setAuthProviders(providersData ?? {
        globusEnabled: false,
        devLoginEnabled: false,
        missingGlobusConfig: []
      });
    } catch {
      setUser(null);
      setAuthProviders({
        globusEnabled: false,
        devLoginEnabled: false,
        missingGlobusConfig: []
      });
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const refreshUser = async () => loadAuth(false);

  useEffect(() => {
    void loadAuth(false);

    const refreshInBackground = () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      void loadAuth(true);
    };

    const intervalId = window.setInterval(refreshInBackground, 60000);
    window.addEventListener('focus', refreshInBackground);
    document.addEventListener('visibilitychange', refreshInBackground);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshInBackground);
      document.removeEventListener('visibilitychange', refreshInBackground);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, authProviders, loading, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
