import { useState, useEffect } from 'react';
import { auth } from 'firebase/order-food';
import { signOut } from 'firebase/auth';
import { useAuthContext } from './useAuthContext';

export const useLogout = () => {
  const [isMounted, setIsMounted] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { dispatch } = useAuthContext();

  const logout = async () => {
    setError(null);
    setLoading(true);

    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });

      if (isMounted) {
        setError(null);
        setLoading(false);
      }
    } catch (err: any) {
      if (isMounted) {
        console.log(err.message);
        setError(err.message);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  return { logout, error, loading };
};