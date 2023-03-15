import { useState, useEffect } from 'react';
import { auth } from 'firebase/order-food';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuthContext } from './useAuthContext';

export const useLogin = () => {
  const [isMounted, setIsMounted] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { dispatch } = useAuthContext();

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const userCredentials = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (!userCredentials) {
        throw new Error('Request failed');
      }
      dispatch({ type: 'LOGIN', payload: userCredentials.user });

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

  return { login, error, loading };
};