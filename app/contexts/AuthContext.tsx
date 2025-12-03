// app/contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    isCommittee: boolean;
    isApproved: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAdmin: false,
    isCommittee: false,
    isApproved: false,
    loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCommittee, setIsCommittee] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);
                try {
                    // Check if user is an admin
                    const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
                    setIsAdmin(adminDoc.exists());

                    // Check if user is a committee member
                    const committeeDoc = await getDoc(doc(db, "executiveCommittee", currentUser.uid));
                    setIsCommittee(committeeDoc.exists());

                    // Check if user is approved (in users collection)
                    const approvedDoc = await getDoc(doc(db, "users", currentUser.uid));
                    setIsApproved(approvedDoc.exists());
                } catch (error) {
                    console.error("Error verifying user roles:", error);
                    setIsAdmin(false);
                    setIsCommittee(false);
                    setIsApproved(false);
                }
            } else {
                setUser(null);
                setIsAdmin(false);
                setIsCommittee(false);
                setIsApproved(false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAdmin, isCommittee, isApproved, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);