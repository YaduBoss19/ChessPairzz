import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, serverTimestamp } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDun84JapM9q3lE_5kzkxzl8tRKridmDwU",
  authDomain: "chesspairzzz-350d6.firebaseapp.com",
  databaseURL: "https://chesspairzzz-350d6-default-rtdb.firebaseio.com",
  projectId: "chesspairzzz-350d6",
  storageBucket: "chesspairzzz-350d6.firebasestorage.app",
  messagingSenderId: "206677561900",
  appId: "1:206677561900:web:ec833cc82e5c104501b789"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export const publishToCloud = async (slug, data) => {
    try {
        const tournamentRef = ref(db, 'tournaments/' + slug);
        await set(tournamentRef, {
            ...data,
            lastUpdated: serverTimestamp()
        });
        return true;
    } catch (e) {
        console.error("Cloud Error", e);
        return false;
    }
};
