"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function SignUp() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: "",
        studentId: "",
        faculty: "",
        whatsapp: "",
        email: "",
        password: "",
        reason: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Save to 'pendingRequests' collection
            await setDoc(doc(db, "pendingRequests", user.uid), {
                uid: user.uid,
                fullName: formData.fullName,
                studentId: formData.studentId,
                faculty: formData.faculty,
                whatsapp: formData.whatsapp,
                email: formData.email,
                reason: formData.reason,
                status: "pending",
                submittedAt: new Date()
            });

            alert("Request sent! Please wait for Admin approval.");
            router.push("/"); // Redirect to home
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">Join the Club</h2>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <input name="fullName" placeholder="Full Name" required className="w-full p-3 border rounded-lg" onChange={handleChange} />
                    <input name="studentId" placeholder="Student ID" required className="w-full p-3 border rounded-lg" onChange={handleChange} />
                    <input name="faculty" placeholder="Faculty" required className="w-full p-3 border rounded-lg" onChange={handleChange} />
                    <input name="whatsapp" placeholder="WhatsApp Number" required className="w-full p-3 border rounded-lg" onChange={handleChange} />
                    <textarea name="reason" placeholder="Why do you want to join?" required className="w-full p-3 border rounded-lg" onChange={handleChange} />

                    <div className="border-t pt-4">
                        <input type="email" name="email" placeholder="Student Email" required className="w-full p-3 border rounded-lg" onChange={handleChange} />
                        <input type="password" name="password" placeholder="Password" required className="w-full p-3 border rounded-lg mt-4" onChange={handleChange} />
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        {loading ? "Sending Request..." : "Submit Request"}
                    </button>
                </form>
            </div>
        </div>
    );
}