import { useState, useEffect } from 'react';
import type { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('tms_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (user: User) => {
    localStorage.setItem('tms_user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('tms_user');
    setUser(null);
  };

  return { user, login, logout };
}
