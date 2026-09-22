"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "customer" | "admin";
  ecoImpactKg: number;
  phone?: string;
  phoneVerified?: boolean;
  dob?: string;
  address?: string;
  postcode?: string;
  createdAt?: any;
}

export interface RegisterExtraData {
  displayName: string;
  dob: string;
  address: string;
  postcode: string;
  phone: string;
  phoneVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    extraData: RegisterExtraData
  ) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync user profile in Firestore
  const syncUserProfile = async (firebaseUser: User, customName?: string) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: customName || firebaseUser.displayName || "Thành viên Nét",
          photoURL: firebaseUser.photoURL || null,
          role: "customer",
          ecoImpactKg: 0,
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newProfile, { merge: true });
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.warn("Could not sync Firestore profile (check Firestore rules):", error);
      setUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: customName || firebaseUser.displayName || "Thành viên Nét",
        photoURL: firebaseUser.photoURL,
        role: "customer",
        ecoImpactKg: 0,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await syncUserProfile(result.user);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    extraData: RegisterExtraData
  ) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      if (extraData.displayName) {
        await updateProfile(result.user, { displayName: extraData.displayName });
      }
      const newProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: extraData.displayName,
        photoURL: result.user.photoURL || null,
        dob: extraData.dob,
        address: extraData.address,
        postcode: extraData.postcode,
        phone: extraData.phone,
        phoneVerified: extraData.phoneVerified,
        role: "customer",
        ecoImpactKg: 0,
        createdAt: serverTimestamp(),
      };
      try {
        const userDocRef = doc(db, "users", result.user.uid);
        await setDoc(userDocRef, newProfile, { merge: true });
      } catch (err) {
        console.warn("Could not write user profile to Firestore:", err);
      }
      setUserProfile(newProfile);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, data, { merge: true });
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    } catch (err) {
      console.warn("Could not update Firestore profile:", err);
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
