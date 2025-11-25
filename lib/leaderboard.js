import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function fetchLeaderboard() {
  const snap = await getDocs(collection(db, "leaderboard"));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
