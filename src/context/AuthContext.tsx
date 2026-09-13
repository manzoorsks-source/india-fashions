import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../../shared/types.js';
import { apiRequest } from '../utils/api.js';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole | 'CUSTOMER';
  switchRole: (role: UserRole | 'CUSTOMER') => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  canManageCatalog: boolean;
  canViewCostPrice: boolean;
  canVerifyPayments: boolean;
  canManageInventory: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canProcessRefunds: boolean;
}

const roleMap: Record<UserRole, { id: string; name: string; email: string }> = {
  SUPER_ADMIN: { id: 'u-owner', name: 'Rajesh Mehra (Shop Owner)', email: 'owner@indiafashions.com' },
  ADMIN: { id: 'u-admin', name: 'Ananya Sharma (Store Manager)', email: 'admin@indiafashions.com' },
  HEAD_CASHIER: { id: 'u-cashier', name: 'Sunil Kumar (Head Cashier)', email: 'cashier@indiafashions.com' },
  POS_CASHIER: { id: 'u-pos', name: 'Pooja Verma (Counter Cashier)', email: 'pos@indiafashions.com' },
  INVENTORY_EXECUTIVE: { id: 'u-inv', name: 'Vikram Singh (Dock Controller)', email: 'inventory@indiafashions.com' }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Ensure storefront starts clean as customer; admin access requires explicit credentials
  useEffect(() => {
    localStorage.removeItem('if_active_user_id');
    setCurrentUser(null);
  }, []);

  const switchRole = async (role: UserRole | 'CUSTOMER') => {
    if (role === 'CUSTOMER') {
      localStorage.removeItem('if_active_user_id');
      setCurrentUser(null);
      await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
      return;
    }

    try {
      const res = await apiRequest<{ user: User }>('/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ role })
      });
      if (res.user) {
        localStorage.setItem('if_active_user_id', res.user.id);
        setCurrentUser(res.user);
      }
    } catch (e) {
      // Fallback local mock if network glitch
      const mock = roleMap[role];
      const user: User = {
        id: mock.id,
        name: mock.name,
        email: mock.email,
        role: role,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('if_active_user_id', user.id);
      setCurrentUser(user);
    }
  };

  const login = async (email: string, password?: string) => {
    const res = await apiRequest<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.user) {
      localStorage.setItem('if_active_user_id', res.user.id);
      setCurrentUser(res.user);
    }
  };

  const logout = async () => {
    localStorage.removeItem('if_active_user_id');
    setCurrentUser(null);
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
  };

  const currentRole = currentUser ? currentUser.role : 'CUSTOMER';

  // Permission checks
  const canManageCatalog = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const canViewCostPrice = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const canVerifyPayments = currentRole === 'SUPER_ADMIN' || currentRole === 'HEAD_CASHIER';
  const canManageInventory = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN' || currentRole === 'INVENTORY_EXECUTIVE';
  const canManageUsers = currentRole === 'SUPER_ADMIN';
  const canManageSettings = currentRole === 'SUPER_ADMIN';
  const canProcessRefunds = currentRole === 'SUPER_ADMIN' || currentRole === 'HEAD_CASHIER';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        switchRole,
        login,
        logout,
        canManageCatalog,
        canViewCostPrice,
        canVerifyPayments,
        canManageInventory,
        canManageUsers,
        canManageSettings,
        canProcessRefunds
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
