'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying');

    useEffect(() => {
        if (!token) { setStatus('error'); return; }
        verifyEmailToken();
    }, [token]);

    const verifyEmailToken = async () => {
        try {
            const q = query(collection(db, "pendingRequests"), where("emailVerificationToken", "==", token));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) { setStatus('error'); return; }

            const requestDoc = querySnapshot.docs[0];

            // Update status to 'pending' so Admin can finally see it
            await updateDoc(doc(db, "pendingRequests", requestDoc.id), {
                status: "pending",
                emailVerified: true,
                emailVerificationToken: null
            });

            setStatus('success');
        } catch (error) {
            console.error("Verification failed:", error);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'verifying' && <Loader2 className="animate-spin mx-auto text-pink-600" size={48} />}

                {status === 'success' && (
                    <>
                        <CheckCircle className="mx-auto text-green-500 mb-4" size={50} />
                        <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
                        <p className="text-gray-600 mb-6">Your application is now pending Admin approval.</p>
                        <Link href="/" className="text-pink-600 font-bold">Return Home</Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="mx-auto text-red-500 mb-4" size={50} />
                        <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
                        <Link href="/" className="text-pink-600 font-bold">Return Home</Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmail() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}