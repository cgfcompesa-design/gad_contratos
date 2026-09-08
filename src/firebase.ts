import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyDA--SkTQq52431mLnwBAD7U2nnW0LQrj8",
  authDomain: "gadcontratos.firebaseapp.com",
  projectId: "gadcontratos",
  storageBucket: "gadcontratos.firebasestorage.app",
  messagingSenderId: "341465265899",
  appId: "1:341465265899:web:ccee0092fe18f525e530ae",
  measurementId: "G-NQNJMMFZYH"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db = getFirestore(app);
export default app;
