import { db } from "@/lib/firebase";
import { 
    doc, getDoc, setDoc, updateDoc, 
    increment, collection, query, where, getDocs 
} from "firebase/firestore";

export interface StarRule {
    stars: number;
    title: string;
    description: string;
    category: "attendance" | "oc_member" | "event_starter" | "oc_organizer";
    badge: string;
}

export const STAR_RULES: StarRule[] = [
    {
        stars: 1,
        title: "Event Attendance",
        description: "Awarded to members who participate in an event when their attendance is verified.",
        category: "attendance",
        badge: "1 Star"
    },
    {
        stars: 2,
        title: "Selected OC Member",
        description: "Awarded to members selected for an Organizing Committee when that project/event is ended.",
        category: "oc_member",
        badge: "2 Stars"
    },
    {
        stars: 2,
        title: "Event Starter & Coordinator",
        description: "Awarded to the Executive Committee coordinator who launches and starts the event live.",
        category: "event_starter",
        badge: "2 Stars"
    },
    {
        stars: 3,
        title: "OC Creator & Collaborators",
        description: "Awarded to the committee member who initiated the OC call and all committee collaborators when that event is started.",
        category: "oc_organizer",
        badge: "3 Stars"
    }
];

export interface AwardStarsParams {
    transactionId: string;
    userEmail: string;
    userId?: string;
    userName?: string;
    stars: number;
    category: "attendance" | "oc_member" | "event_starter" | "oc_organizer";
    title: string;
    description?: string;
    eventId?: string;
    eventName?: string;
    ocCallId?: string;
    role?: string;
}

/**
 * Award stars idempotently. If the transactionId already exists, it will not re-award stars.
 */
export async function awardStars(params: AwardStarsParams): Promise<{ success: boolean; alreadyAwarded?: boolean }> {
    if (!params.userEmail || !params.stars) return { success: false };

    const cleanEmail = params.userEmail.toLowerCase().trim();
    const cleanId = params.transactionId.replace(/[^a-zA-Z0-9_-]/g, "_");

    try {
        const transRef = doc(db, "starTransactions", cleanId);
        const transSnap = await getDoc(transRef);
        if (transSnap.exists()) {
            return { success: true, alreadyAwarded: true };
        }

        const now = new Date();
        const year = now.getFullYear();
        const monthNum = String(now.getMonth() + 1).padStart(2, "0");
        const month = `${year}-${monthNum}`; // e.g. "2026-09"
        const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });

        // 1. Record the star transaction
        await setDoc(transRef, {
            transactionId: cleanId,
            userEmail: cleanEmail,
            userId: params.userId || "",
            userName: params.userName || cleanEmail.split("@")[0],
            stars: params.stars,
            category: params.category,
            title: params.title,
            description: params.description || "",
            eventId: params.eventId || "",
            eventName: params.eventName || "",
            ocCallId: params.ocCallId || "",
            role: params.role || "",
            month,
            monthLabel,
            year,
            createdAt: now
        });

        // 2. Update user profile totals (in 'users' or 'executiveCommittee')
        let targetDocRef = null;
        if (params.userId) {
            const userCheck = await getDoc(doc(db, "users", params.userId));
            if (userCheck.exists()) {
                targetDocRef = doc(db, "users", params.userId);
            } else {
                const execCheck = await getDoc(doc(db, "executiveCommittee", params.userId));
                if (execCheck.exists()) {
                    targetDocRef = doc(db, "executiveCommittee", params.userId);
                }
            }
        }

        if (!targetDocRef) {
            // Lookup by email
            const userQ = query(collection(db, "users"), where("email", "==", cleanEmail));
            const userSnap = await getDocs(userQ);
            if (!userSnap.empty) {
                targetDocRef = doc(db, "users", userSnap.docs[0].id);
            } else {
                const execQ = query(collection(db, "executiveCommittee"), where("email", "==", cleanEmail));
                const execSnap = await getDocs(execQ);
                if (!execSnap.empty) {
                    targetDocRef = doc(db, "executiveCommittee", execSnap.docs[0].id);
                }
            }
        }

        if (targetDocRef) {
            await updateDoc(targetDocRef, {
                totalStars: increment(params.stars),
                [`monthlyStars.${month}`]: increment(params.stars)
            });
        }

        return { success: true, alreadyAwarded: false };
    } catch (err) {
        console.error("Error awarding stars:", err);
        return { success: false };
    }
}

/**
 * 1 Star: Awarded for member attendance.
 */
export async function awardAttendeeStar(eventId: string, eventName: string, attendeeEmail: string) {
    if (!eventId || !attendeeEmail) return;
    const cleanEmail = attendeeEmail.toLowerCase().trim();
    const transactionId = `attendee_${eventId}_${cleanEmail}`;
    return awardStars({
        transactionId,
        userEmail: cleanEmail,
        stars: 1,
        category: "attendance",
        title: "Event Attendance",
        description: `Verified attendance for event "${eventName}".`,
        eventId,
        eventName
    });
}

/**
 * 2 Stars: Awarded to the Executive coordinator who starts the event.
 */
export async function awardStarterStars(
    eventId: string, 
    eventName: string, 
    starterEmail: string, 
    starterName?: string, 
    starterUid?: string
) {
    if (!eventId || !starterEmail) return;
    const cleanEmail = starterEmail.toLowerCase().trim();
    const transactionId = `starter_${eventId}_${cleanEmail}`;
    return awardStars({
        transactionId,
        userEmail: cleanEmail,
        userId: starterUid,
        userName: starterName,
        stars: 2,
        category: "event_starter",
        title: "Event Starter & Coordinator",
        description: `Successfully launched live event "${eventName}".`,
        eventId,
        eventName
    });
}

/**
 * 3 Stars: Awarded to OC Creator & Collaborators when the event is started.
 */
export async function awardOcOrganizerStars(
    eventId: string, 
    eventName: string, 
    ocCallId: string, 
    organizerEmail: string, 
    role: "Creator" | "Collaborator",
    organizerName?: string
) {
    if (!eventId || !organizerEmail) return;
    const cleanEmail = organizerEmail.toLowerCase().trim();
    const transactionId = `organizer_${eventId}_${cleanEmail}`;
    return awardStars({
        transactionId,
        userEmail: cleanEmail,
        userName: organizerName,
        stars: 3,
        category: "oc_organizer",
        title: `OC ${role}`,
        description: `Organized and coordinated OC call for "${eventName}" as ${role}.`,
        eventId,
        eventName,
        ocCallId,
        role
    });
}

/**
 * 2 Stars: Awarded to selected OC members when that event is completed/ended.
 */
export async function awardOcMemberStars(
    eventId: string, 
    eventName: string, 
    ocCallId: string, 
    memberEmail: string, 
    role: string, 
    memberName?: string
) {
    if (!eventId || !memberEmail) return;
    const cleanEmail = memberEmail.toLowerCase().trim();
    const transactionId = `ocmember_${eventId}_${cleanEmail}`;
    return awardStars({
        transactionId,
        userEmail: cleanEmail,
        userName: memberName,
        stars: 2,
        category: "oc_member",
        title: `Selected OC Member (${role})`,
        description: `Successfully delivered project "${eventName}" as selected ${role}.`,
        eventId,
        eventName,
        ocCallId,
        role
    });
}
