import React, { createContext, useReducer, useEffect } from 'react';
import { auth } from 'firebase/order-food';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  authIsReady: boolean;
  dispatch: React.Dispatch<AuthAction>;
}

type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'AUTH_IS_READY'; payload: User | null };

const authReducer = (state: AuthState, action: AuthAction) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    case 'AUTH_IS_READY':
      return { ...state, user: action.payload, authIsReady: true };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  authIsReady: false,
  dispatch: () => null,
};

interface AuthContextProps {
  children: React.ReactNode;
}

const AuthContext = createContext(initialState);

const AuthContextProvider = ({ children }: AuthContextProps) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch({ type: 'AUTH_IS_READY', payload: user! });
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContextProvider, AuthContext };