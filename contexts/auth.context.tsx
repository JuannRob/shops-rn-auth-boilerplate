import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { removeItemFor, storeData } from 'services/storage.service';
import { signInService, signUpService, signOutService, AuthResult } from '../services/auth.service';

interface AuthContextProps {
  currentUser: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

interface ProviderProps {
  children: React.ReactNode;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);
export const useAuth = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }

  return authContext;
};

const auth = getAuth();
export const Provider = (props: ProviderProps) => {
  const [userState, setUserState] = useState({
    currentUser: null as User | null,
    isLoading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      if (currentUser !== null) {
        storeData('userCredential', JSON.stringify(currentUser));
        setUserState((prevState) => ({
          ...prevState,
          currentUser: currentUser as User,
          isLoading: false,
        }));
      } else {
        removeItemFor('userCredential');
        setUserState((prevState) => ({
          ...prevState,
          currentUser: null,
          isLoading: false,
        }));
      }
    });

    return unsubscribe;
  }, [userState.currentUser]);

  return (
    <AuthContext.Provider
      value={{
        ...userState,
        signIn: signInService,
        signUp: signUpService,
        signOut: signOutService,
      }}>
      {!userState.isLoading && props.children}
    </AuthContext.Provider>
  );
};