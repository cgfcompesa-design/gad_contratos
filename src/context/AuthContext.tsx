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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage if exists
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
      setLoading(true);
      if (currentFirebaseUser) {
        setFirebaseUser(currentFirebaseUser);
        const email = (currentFirebaseUser.email || '').toLowerCase().trim();
        const isDefaultMaster = email === MASTER_EMAIL.toLowerCase().trim();

        const userRef = doc(db, 'usuarios', currentFirebaseUser.uid);

        // Listen for real-time changes to user profile (e.g. when MASTER approves them)
        const unsubUserDoc = onSnapshot(userRef, async (docSnap) => {
          try {
            if (docSnap.exists()) {
              const data = docSnap.data() as Usuario;
              // Always ensure MASTER email maintains MASTER status
              if (isDefaultMaster) {
                const masterUser: Usuario = {
                  ...data,
                  uid: currentFirebaseUser.uid,
                  nome: data.nome || currentFirebaseUser.displayName || 'Gestor CGF / MASTER',
                  email: currentFirebaseUser.email || MASTER_EMAIL,
                  perfil: 'MASTER',
                  status: 'ativo'
                };
                if (data.perfil !== 'MASTER' || data.status !== 'ativo') {
                  try {
                    await setDoc(userRef, masterUser, { merge: true });
                  } catch (writeErr) {
                    console.warn('Não foi possível persistir status MASTER no Firestore:', writeErr);
                  }
                }
                setUsuario(masterUser);
              } else {
                setUsuario(data);
              }
            } else {
              // First time login
              const novoUsuario: Usuario = {
                uid: currentFirebaseUser.uid,
                nome: currentFirebaseUser.displayName || email.split('@')[0],
                email: currentFirebaseUser.email || '',
                fotoUrl: currentFirebaseUser.photoURL || undefined,
                perfil: isDefaultMaster ? 'MASTER' : 'PENDENTE',
                status: isDefaultMaster ? 'ativo' : 'pendente',
                criadoEm: new Date().toISOString()
              };

              try {
                await setDoc(userRef, novoUsuario);
              } catch (writeErr) {
                console.warn('Não foi possível gravar novo usuário no Firestore:', writeErr);
              }
              setUsuario(novoUsuario);
            }
          } catch (snapshotErr) {
            console.error('Erro ao processar snapshot de usuário:', snapshotErr);
            // Fallback safe state
            setUsuario({
              uid: currentFirebaseUser.uid,
              nome: currentFirebaseUser.displayName || email.split('@')[0],
              email: currentFirebaseUser.email || '',
              fotoUrl: currentFirebaseUser.photoURL || undefined,
              perfil: isDefaultMaster ? 'MASTER' : 'PENDENTE',
              status: isDefaultMaster ? 'ativo' : 'pendente',
              criadoEm: new Date().toISOString()
            });
          } finally {
            setLoading(false);
          }
        }, (err) => {
          console.error('Erro ao escutar usuario no Firestore:', err);
          // Fallback if offline, rules blocked, or database not created yet
          const fallbackUser: Usuario = {
            uid: currentFirebaseUser.uid,
            nome: currentFirebaseUser.displayName || email.split('@')[0],
            email: currentFirebaseUser.email || '',
            fotoUrl: currentFirebaseUser.photoURL || undefined,
            perfil: isDefaultMaster ? 'MASTER' : 'PENDENTE',
            status: isDefaultMaster ? 'ativo' : 'pendente',
            criadoEm: new Date().toISOString()
          };
          setUsuario(fallbackUser);
          setLoading(false);
        });

        return () => {
          unsubUserDoc();
        };
      } else {
        setFirebaseUser(null);
        setUsuario(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginComGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
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
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
      setModoSimulado(false);
      setUsuarioSimulado(null);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Erro no logout:', error);
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
