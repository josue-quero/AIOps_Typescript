import { useContext } from 'react';
import { AuthContext } from 'context/auth-context';

export const useAuthContext = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error('useAuthContext needs to be inside AuthContextProvider');
  }
  
  return authContext;
};