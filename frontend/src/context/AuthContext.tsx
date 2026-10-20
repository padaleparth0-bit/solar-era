import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  UserProfile, 
  LoginPayload, 
  RegisterPayload, 
  loginUser, 
  registerUser, 
  fetchMyProfile, 
  updateMyProfile as updateProfileApi, 
  logoutUser as logoutApi,
  getAuthToken 
} from '../services/api';
import { setStoredCitizenId, fetchStoredProfile } from '../utils/citizenStorage';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => void;
  updateProfile: (payload: Partial<UserProfile>) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Sync citizen storage whenever user logs in or profile changes
  const syncCitizenWithUser = async (profileUser: UserProfile) => {
    if (profileUser.citizenId) {
      setStoredCitizenId(profileUser.citizenId);
      try {
        const citizenData = await fetchStoredProfile();
        // Fire custom event to notify all components (CarbonFootprintTracker, Certificates, etc.)
        window.dispatchEvent(new CustomEvent('solar_citizen_profile_updated', { detail: citizenData }));
      } catch (e) {
        console.warn('Could not sync citizen profile for user:', e);
      }
    }
  };

  // Initialize and check existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await fetchMyProfile();
        setUser(profile);
        setToken(storedToken);
        await syncCitizenWithUser(profile);
      } catch (err) {
        console.warn('Session expired or invalid, logging out:', err);
        logoutApi();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (payload: LoginPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await loginUser(payload);
      setUser(res.user);
      setToken(res.token);
      await syncCitizenWithUser(res.user);
      closeAuthModal();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await registerUser(payload);
      setUser(res.user);
      setToken(res.token);
      await syncCitizenWithUser(res.user);
      closeAuthModal();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutApi();
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (payload: Partial<UserProfile>): Promise<UserProfile> => {
    const updated = await updateProfileApi(payload);
    setUser(updated);
    await syncCitizenWithUser(updated);
    return updated;
  };

  const refreshProfile = async () => {
    try {
      const profile = await fetchMyProfile();
      setUser(profile);
      await syncCitizenWithUser(profile);
    } catch (e) {
      console.warn('Failed refreshing user profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
