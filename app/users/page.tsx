"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { User, Mail, Phone, Award, LogOut, Loader2, MapPin, BookOpen } from "lucide-react";

interface UserProfile {
    fullName: string;
    email: string;
    studentId: string;
    faculty: string;
    whatsapp: string;
    position: string;
    collection: string; // to know if they are exec or regular
}

export default function Profile() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                // 1. Try finding in 'users'
                let userDoc = await getDoc(doc(db, "users", user.uid));
                let data = userDoc.data();
                let sourceCollection = "users";

                // 2. If not found, try 'executiveCommittee'
                if (!userDoc.exists()) {
                    userDoc = await getDoc(doc(db, "executiveCommittee", user.uid));
                    data = userDoc.data();
                    sourceCollection = "executiveCommittee";
                }

                // 3. If still not found (maybe they are an admin logging into profile?)
                if (!userDoc.exists()) {
                    // Handle edge case or redirect to admin
                    alert("Profile not found. If you are an Admin, please use the Admin Dashboard.");
                    router.push("/");
                    return;
                }

                if (data) {
                    setProfile({
                        fullName: data.fullName,
                        email: data.email,
                        studentId: data.studentId,
                        faculty: data.faculty,
                        whatsapp: data.whatsapp,
                        position: data.position || "Member",
                        collection: sourceCollection
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-600" size={40} /></div>;
    }

    if (!profile) return null;

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div className="bg-blue-900 h-32 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 bg-white rounded-full p-1 flex items-center justify-center shadow-lg">
                                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                    <User size={40} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-16 pb-8 px-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{profile.fullName}</h1>
                                <p className="text-gray-500 font-medium">{profile.studentId}</p>
                            </div>
                            <span className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${profile.collection === 'executiveCommittee'
                                ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                {profile.position}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-md">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Contact Information</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600">
                                <Mail className="text-blue-600" size={20} />
                                <span>{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <Phone className="text-green-600" size={20} />
                                <span>{profile.whatsapp}</span>
                            </div>
                        </div>
                    </div>

                    {/* Academic Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-md">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Academic Details</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600">
                                <BookOpen className="text-purple-600" size={20} />
                                <span>Faculty: {profile.faculty}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <MapPin className="text-red-600" size={20} />
                                <span>University Student</span>
                            </div>
                        </div>
                    </div>

                    {/* Role Description */}
                    <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-md flex items-start gap-4">
                        <Award className="text-yellow-500 shrink-0" size={32} />
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Club Status</h2>
                            <p className="text-gray-600 mt-1">
                                You are currently a verified <strong>{profile.position}</strong>.
                                {profile.collection === 'executiveCommittee'
                                    ? " Thank you for leading our club to new heights!"
                                    : " Thank you for being a valued member of our community."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition"
                    >
                        <LogOut size={20} /> Sign Out
                    </button>
                </div>
            </div>
        </main>
    );
}