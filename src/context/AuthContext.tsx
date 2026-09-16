import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthState, LoginFormData, RegisterFormData } from '@/types';
import { mockUsers, getUserById } from '@/data/mockData';

interface AuthContextType extends AuthState {
  login: (data: LoginFormData) => Promise<boolean>;
  register: (data: RegisterFormData) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for saved auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('audicloudi_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('audicloudi_user');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (data: LoginFormData): Promise<boolean> => {
    // Mock login - in real app, this would call an API
    const user = mockUsers.find(
      u => u.email === data.email && data.password === 'password' // Mock password check
    );

    if (user) {
      localStorage.setItem('audicloudi_user', JSON.stringify(user));
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    }
    return false;
  };

  const register = async (data: RegisterFormData): Promise<boolean> => {
    // Mock registration
    const newUser: User = {
      id: String(mockUsers.length + 1),
      email: data.email,
      username: data.username,
      displayName: data.username,
      bio: '',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
      bannerUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followersCount: 0,
      followingCount: 0,
      tracksCount: 0,
    };

    mockUsers.push(newUser);
    localStorage.setItem('audicloudi_user', JSON.stringify(newUser));
    setState({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
    });
    return true;
  };

  const logout = () => {
    localStorage.removeItem('audicloudi_user');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = (updatedUser: User) => {
    const index = mockUsers.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      mockUsers[index] = updatedUser;
      localStorage.setItem('audicloudi_user', JSON.stringify(updatedUser));
      setState(prev => ({ ...prev, user: updatedUser }));
    }
  };

  const followUser = (userId: string) => {
    if (state.user) {
      const targetUser = getUserById(userId);
      if (targetUser) {
        targetUser.followersCount++;
        const updatedUser = { ...state.user, followingCount: state.user.followingCount + 1 };
        updateUser(updatedUser);
      }
    }
  };

  const unfollowUser = (userId: string) => {
    if (state.user) {
      const targetUser = getUserById(userId);
      if (targetUser) {
        targetUser.followersCount--;
        const updatedUser = { ...state.user, followingCount: state.user.followingCount - 1 };
        updateUser(updatedUser);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUser,
        followUser,
        unfollowUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
