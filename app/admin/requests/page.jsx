"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PendingRequestsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/users");
    }, [router]);

    return (
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
            <Loader2 className="animate-spin text-pink-600" size={40} />
        </div>
    );
}
