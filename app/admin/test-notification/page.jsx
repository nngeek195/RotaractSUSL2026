"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function TestNotification() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleTest = async (provider) => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/notify-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: "Test User",
                    email: "test@example.com",
                    contact: "0771234567",
                    faculty: "Testing Faculty",
                    department: "Debug Dept",
                    provider
                })
            });

            const data = await res.json();
            if (res.ok) {
                setResult({ success: true, message: data.message });
            } else {
                setResult({ success: false, message: data.details || data.error || "Unknown error" });
            }
        } catch (error) {
            setResult({ success: false, message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-200 mt-10">
            <h1 className="text-xl font-bold text-gray-800 mb-4">Test Notifications</h1>
            <p className="text-sm text-gray-600 mb-6">
                Send a test message to verify your configuration. Ensure you have saved your settings in the Admin Panel first.
            </p>

            <div className="grid grid-cols-1 gap-3">
                <button
                    onClick={() => handleTest('telegram')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    Test Telegram
                </button>
                <button
                    onClick={() => handleTest('waha')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    Test WAHA (WhatsApp)
                </button>
            </div>

            {result && (
                <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {result.success ? <CheckCircle size={20} className="mt-0.5" /> : <XCircle size={20} className="mt-0.5" />}
                    <div>
                        <p className="font-bold">{result.success ? "Success" : "Failed"}</p>
                        <p className="text-sm">{result.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
