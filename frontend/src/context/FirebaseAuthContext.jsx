// frontend/src/context/FirebaseAuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { 
  auth, 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser,
  resendVerificationEmail,
  loginWithGoogle,
  onAuthStateChange,
  resetPassword
} from '../config/firebase';
import toast from 'react-hot-toast';
import api from '../services/api';

export const FirebaseAuthContext = createContext(null);

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Sync with backend
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('firebaseToken', token);
          
          // Get or create user in backend
          const response = await api.post('/auth/firebase-login', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            emailVerified: firebaseUser.emailVerified
          });
          
          if (response.data?.success) {
            setDbUser(response.data.data);
            localStorage.setItem('user', JSON.stringify(response.data.data));
          }
        } catch (error) {
          console.error('Backend sync error:', error);
        }
      } else {
        setDbUser(null);
        localStorage.removeItem('firebaseToken');
        localStorage.removeItem('user');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email, password, name) => {
    try {
      const result = await registerWithEmail(email, password, name);
      if (result.success) {
        toast.success(result.message);
        // Send token to backend
        const token = await result.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return { success: true, user: result.user };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const result = await loginWithEmail(email, password);
      if (result.success) {
        toast.success('Welcome back!');
        const token = await result.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return { success: true, user: result.user };
      } else {
        if (result.requiresVerification) {
          toast.error(result.error);
        } else {
          toast.error(result.error);
        }
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogleProvider = async () => {
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        toast.success('Google login successful!');
        const token = await result.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return { success: true, user: result.user };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('user');
      setDbUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resendVerification = async () => {
    try {
      const result = await resendVerificationEmail();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
      return result;
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const result = await resetPassword(email);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
      return result;
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    dbUser,
    loading,
    register,
    login,
    logout,
    loginWithGoogle: loginWithGoogleProvider,
    resendVerification,
    forgotPassword,
    isEmailVerified: user?.emailVerified || false,
    isAuthenticated: !!user
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};