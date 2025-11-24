'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
// Changed from alias '@/' to relative path to ensure resolution
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

// We separate the logic into a component to wrap it in Suspense
// (Required by Next.js for useSearchParams)
function VerifyContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error

    const executiveRoles = [
        "President", "Vice-President", "Secretary", "Assistant Secretary",
        "Editor", "Assistant Treasurer", "Sgt. at Arms", "Club Service",
        "Community Service", "International Service", "Professional Development",
        "Finance", "Membership Development", "Public Relations", "Sports and Recreational Activities"
    ];

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }
        verifyUser();
    }, [token]);

    const verifyUser = async () => {
        try {
            // 1. Find the pending request with this token
            // Note: This works because we set the Security Rules to allow public read on pendingRequests
            const q = query(collection(db, "pendingRequests"), where("verificationToken", "==", token));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error("Token not found or already used");
                setStatus('error');
                return;
            }

            const requestDoc = querySnapshot.docs[0];
            const requestData = requestDoc.data();
            const userId = requestDoc.id;

            // 2. Determine target collection based on the role assigned by Admin
            const role = requestData.futureRole || "Member";
            const targetCollection = executiveRoles.includes(role) ? "executiveCommittee" : "users";

            // 3. Prepare Final User Data
            // We remove the temporary token and role fields
            const { verificationToken, futureRole, status: oldStatus, ...userData } = requestData;

            const finalData = {
                ...userData,
                uid: userId,
                position: role,
                joinedAt: new Date(),
                status: 'active'
            };

            // 4. Create the Permanent User Document
            await setDoc(doc(db, targetCollection, userId), finalData);

            // 5. Delete the Pending Request
            await deleteDoc(doc(db, "pendingRequests", userId));

            setStatus('success');

        } catch (error) {
            console.error("Verification failed:", error);
            setStatus('error');
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
            {status === 'verifying' && (
                <div className="flex flex-col items-center py-8">
                    <Loader2 className="animate-spin text-pink-600 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-gray-800">Verifying Identity...</h2>
                    <p className="text-gray-500 mt-2">Connecting to Rotaract database securely.</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center py-4">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <CheckCircle className="text-green-500" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Membership Activated!</h2>
                    <p className="text-gray-500 mb-8">
                        Welcome to the family. Your account is now fully active and ready to use.
                    </p>

                    <Link href="/login" className="bg-pink-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-pink-700 transition w-full block shadow-lg shadow-pink-200">
                        Login to Portal
                    </Link>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center py-4">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                        <XCircle className="text-red-500" size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Link Expired or Invalid</h2>
                    <p className="text-gray-500 mb-8">
                        This verification link has already been used or does not exist. Please contact the admin.
                    </p>

                    <Link href="/" className="text-pink-600 font-semibold hover:underline">
                        Return to Home
                    </Link>
                </div>
            )}
        </div>
    );
}

// Main Page Component
export default function VerifyMembership() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-poppins">
            <Suspense fallback={<div>Loading...</div>}>
                <VerifyContent />
            </Suspense>
        </div>
    );
}