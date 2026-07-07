import React, { createContext, useContext, ReactNode } from 'react';
import { useGetCurrentUser, useSignOut } from '@workspace/api-client-react';

interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  emailVerified?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useGetCurrentUser();
  const { mutate: signOutMutate } = useSignOut();

  const user = (data?.user as AuthUser | null | undefined) ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signOut: () => signOutMutate({}),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
