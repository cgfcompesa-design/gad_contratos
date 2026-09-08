import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { Usuario, PerfilUsuario } from '../types';

export const MASTER_EMAIL = 'cgf.compesa@gmail.com';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  usuario: Usuario | null;
  loading: boolean;
  isMaster: boolean;
  isApoio: boolean;
  isGerente: boolean;
  isAtivo: boolean;
  isPendente: boolean;
  loginComGoogle: () => Promise<void>;
  loginComGoogleRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  simularPerfil: (perfil: PerfilUsuario, email?: string) => void;
  modoSimulado: boolean;
  restaurarUsuarioReal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'compesa_sessao_ativa';
const AUTH_CACHE_KEY = 'compesa_auth_user_cache';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Restore cached session immediately on initial render to prevent login screen flicker on refresh
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    try {
      const cached = localStorage.getItem(AUTH_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Usuario;
        if (parsed.email?.toLowerCase().trim() === MASTER_EMAIL.toLowerCase().trim()) {
          parsed.perfil = 'MASTER';
          parsed.status = 'ativo';
        }
        return parsed;
      }
      const sim = localStorage.getItem(SESSION_STORAGE_KEY);
      if (sim) {
        return JSON.parse(sim) as Usuario;
      }
    } catch {
      return null;
    }
    return null;
  });

  // If we already have a cached authenticated user, we don't block the UI with loading
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(AUTH_CACHE_KEY) && !localStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return true;
    }
  });

  // Initialize simulated mode if exists
  const [modoSimulado, setModoSimulado] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return false;
    }
  });

  const [usuarioSimulado, setUsuarioSimulado] = useState<Usuario | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Process redirect result if page was reloaded after redirect login
    getRedirectResult(auth).catch((err) => {
      console.warn('Redirect login check:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      if (currentFirebaseUser) {
        setFirebaseUser(currentFirebaseUser);
        const email = (currentFirebaseUser.email || '').toLowerCase().trim();
        const isDefaultMaster = email === MASTER_EMAIL.toLowerCase().trim();

        // 1. Instantly construct user object so UI renders with zero lag
        const immediateUser: Usuario = {
          uid: currentFirebaseUser.uid,
          nome: currentFirebaseUser.displayName || (isDefaultMaster ? 'Gestor CGF / MASTER' : email.split('@')[0]),
          email: currentFirebaseUser.email || email,
          fotoUrl: currentFirebaseUser.photoURL || undefined,
          perfil: isDefaultMaster ? 'MASTER' : 'PENDENTE',
          status: isDefaultMaster ? 'ativo' : 'pendente',
          criadoEm: new Date().toISOString()
        };

        // Update state and persistent cache immediately
        setUsuario((prev) => {
          const merged: Usuario = {
            ...immediateUser,
            ...(prev && prev.uid === currentFirebaseUser.uid ? prev : {}),
            perfil: isDefaultMaster ? 'MASTER' : (prev?.perfil || immediateUser.perfil),
            status: isDefaultMaster ? 'ativo' : (prev?.status || immediateUser.status)
          };
          try {
            localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
          return merged;
        });

        setLoading(false);

        // 2. Non-blocking Firestore background synchronization
        const userRef = doc(db, 'usuarios', currentFirebaseUser.uid);

        // Ensure user is written to Firestore without blocking the UI
        setDoc(userRef, immediateUser, { merge: true }).catch((err) => {
          console.warn('Background sync usuario Firestore:', err);
        });

        // Real-time listener for profile updates by admin
        const unsubUserDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Usuario;
            const updated: Usuario = {
              ...immediateUser,
              ...data,
              perfil: isDefaultMaster ? 'MASTER' : data.perfil,
              status: isDefaultMaster ? 'ativo' : data.status
            };
            setUsuario(updated);
            try {
              localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(updated));
            } catch (e) {
              console.error(e);
            }
          }
        }, (err) => {
          console.warn('Aviso listener Firestore usuario:', err);
        });

        return () => {
          unsubUserDoc();
        };
      } else {
        // Only clear if not in simulated mode or already explicitly logged out
        const hasSim = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!hasSim) {
          const hasCache = localStorage.getItem(AUTH_CACHE_KEY);
          // If there is no cached user in storage, clear state
          if (!hasCache) {
            setFirebaseUser(null);
            setUsuario(null);
          }
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginComGoogle = async () => {
    try {
      setLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      if (res?.user) {
        const email = (res.user.email || '').toLowerCase().trim();
        const isDefaultMaster = email === MASTER_EMAIL.toLowerCase().trim();
        const immediateUser: Usuario = {
          uid: res.user.uid,
          nome: res.user.displayName || (isDefaultMaster ? 'Gestor CGF / MASTER' : email.split('@')[0]),
          email: res.user.email || email,
          fotoUrl: res.user.photoURL || undefined,
          perfil: isDefaultMaster ? 'MASTER' : 'PENDENTE',
          status: isDefaultMaster ? 'ativo' : 'pendente',
          criadoEm: new Date().toISOString()
        };
        setUsuario(immediateUser);
        setFirebaseUser(res.user);
        try {
          localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(immediateUser));
        } catch (e) {
          console.error(e);
        }
      }
    } catch (error) {
      console.error('Erro no login com Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginComGoogleRedirect = async () => {
    try {
      setLoading(true);
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error('Erro no login com Google redirect:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // 1. Immediately wipe persistent caches
      try {
        localStorage.removeItem(AUTH_CACHE_KEY);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.clear();
      } catch (e) {
        console.error('Erro ao limpar storage:', e);
      }

      // 2. Synchronously clear all state to instantly switch to login screen
      setUsuario(null);
      setFirebaseUser(null);
      setUsuarioSimulado(null);
      setModoSimulado(false);
      setLoading(false);

      // 3. Sign out of Firebase Auth
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Ensure UI is fully reset
      setUsuario(null);
      setFirebaseUser(null);
      setLoading(false);
    }
  };

  const simularPerfil = (perfil: PerfilUsuario, emailCustom?: string) => {
    const mockEmail = emailCustom || (perfil === 'MASTER' ? MASTER_EMAIL : `${perfil.toLowerCase().replace(/\s+/g, '.')}@compesa.com.br`);
    const mockNome = perfil === 'MASTER'
      ? 'Gestor CGF / MASTER'
      : perfil === 'APOIO CONTRATOS'
      ? 'Analista de Contratos (Apoio)'
      : perfil === 'GERENTE'
      ? 'Gerente Administrativo GAD'
      : 'Novo Usuário (Aguardando Aprovação)';

    const mockUser: Usuario = {
      uid: `mock-${perfil.toLowerCase()}`,
      nome: mockNome,
      email: mockEmail,
      perfil,
      status: perfil === 'PENDENTE' ? 'pendente' : 'ativo',
      criadoEm: new Date().toISOString(),
      fotoUrl: perfil === 'MASTER' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' : undefined
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mockUser));
    } catch (e) {
      console.error(e);
    }

    setUsuarioSimulado(mockUser);
    setModoSimulado(true);
  };

  const restaurarUsuarioReal = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setModoSimulado(false);
    setUsuarioSimulado(null);
  };

  const rawUsuario = modoSimulado ? usuarioSimulado : usuario;
  const isMasterUser =
    rawUsuario?.perfil === 'MASTER' ||
    (!!rawUsuario?.email && rawUsuario.email.toLowerCase().trim() === MASTER_EMAIL.toLowerCase().trim());

  // Guarantee that MASTER always has status='ativo' and perfil='MASTER'
  const activeUsuario: Usuario | null = rawUsuario
    ? (isMasterUser
        ? {
            ...rawUsuario,
            perfil: 'MASTER' as PerfilUsuario,
            status: 'ativo' as const
          }
        : rawUsuario)
    : null;

  const isMaster = isMasterUser;
  const isApoio = activeUsuario?.perfil === 'APOIO CONTRATOS';
  const isGerente = activeUsuario?.perfil === 'GERENTE';
  const isAtivo = !!activeUsuario && (activeUsuario.status === 'ativo' || isMaster);
  const isPendente = !!activeUsuario && !isMaster && (activeUsuario.status === 'pendente' || activeUsuario.perfil === 'PENDENTE');

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        usuario: activeUsuario,
        loading,
        isMaster,
        isApoio,
        isGerente,
        isAtivo,
        isPendente,
        loginComGoogle,
        loginComGoogleRedirect,
        logout,
        simularPerfil,
        modoSimulado,
        restaurarUsuarioReal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
