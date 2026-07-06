// ============================================================
// frontend/src/config/firebase.js
// ============================================================
// Description: Firebase configuration - Real Config Applied!
// ============================================================

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser as firebaseDeleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// ============================================================
// ✅ FIREBASE CONFIG - Your Real Config
// ============================================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCbYGkeTuBEr2pmsO7oMXDF_CThGRb6S2E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "isp-ticketing-system.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "isp-ticketing-system",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "isp-ticketing-system.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "604981350919",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:604981350919:web:9d98eab05fac81028610a2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-08J9HR4VE8"
};

// ============================================================
// ✅ INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const googleProvider = new GoogleAuthProvider();

// ============================================================
// ✅ AUTH FUNCTIONS
// ============================================================

// 1. Register with Email Verification
export const registerWithEmail = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: name });
    await sendEmailVerification(user);
    
    return { 
      success: true, 
      user: user,
      message: 'Verification email sent! Please check your inbox.'
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// 2. Login with Email
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (!user.emailVerified) {
      await sendEmailVerification(user);
      return { 
        success: false, 
        error: 'Please verify your email first. A new verification link has been sent.',
        requiresVerification: true
      };
    }
    
    return { 
      success: true, 
      user: user 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// 3. Google Login
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { 
      success: true, 
      user: result.user 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// 4. Resend Verification Email
export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    if (user.emailVerified) {
      return { success: false, error: 'Email already verified' };
    }
    await sendEmailVerification(user);
    return { 
      success: true, 
      message: 'Verification email sent successfully!' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// 5. Check if email is verified
export const checkEmailVerified = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    await user.reload();
    return { 
      success: true, 
      isVerified: user.emailVerified 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// 6. Forgot Password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { 
      success: true, 
      message: 'Password reset email sent!' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// 7. Logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// 8. Delete Firebase Account
export const deleteFirebaseAccount = async (email, password) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    
    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);
    
    await firebaseDeleteUser(user);
    return { 
      success: true, 
      message: 'Account deleted successfully' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// 9. Get Current User
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// 10. Auth State Observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// 11. Get ID Token (for backend API)
export const getIdToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    const token = await user.getIdToken();
    return { success: true, token };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

export { auth, googleProvider, analytics };