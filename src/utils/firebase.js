import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// ⚠️ IMPORTANT: Replace these with your actual Firebase project credentials!
// You can get this by going to Firebase Console -> Project Settings -> General -> Web Apps
const firebaseConfig = {
    apiKey: "AIzaSyBFf1FAg_0pRUaNyfz9OqaUtNG4Etf3W94",
    authDomain: "chesspairzzz.firebaseapp.com",
    projectId: "chesspairzzz",
    storageBucket: "chesspairzzz.firebasestorage.app",
    messagingSenderId: "637721308937",
    appId: "1:637721308937:web:ec7c08e6c626144fe96dd8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// In a real product, 'tenantId' should be dynamically set to the currently logged in user's ID
// so different customers don't overwrite each other's tournaments.
export const tenantId = 'global_dev_instance';

/**
 * Saves arbitrary data to the Firebase Firestore database under a specific key.
 */
export const saveToDB = async (key, data) => {
    try {
        const docRef = doc(db, 'chess_tournaments', tenantId);
        // { merge: true } elegantly updates only the specific key (e.g. 'players' or 'rounds')
        // without destroying the rest of the document.
        await setDoc(docRef, { [key]: data }, { merge: true });
        return true;
    } catch (e) {
        console.error(`Firebase error saving [${key}]:`, e);
        return false;
    }
};

/**
 * Retrieves data from the Firebase Firestore database by specifically fetching a key.
 */
export const loadFromDB = async (key, defaultValue = null) => {
    try {
        const docRef = doc(db, 'chess_tournaments', tenantId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
            const documentData = snapshot.data();
            // If the key exists in our Firestore document, return it, otherwise fallback.
            return documentData[key] !== undefined ? documentData[key] : defaultValue;
        }
        return defaultValue;
    } catch (e) {
        console.error(`Firebase error loading [${key}]:`, e);
        return defaultValue;
    }
};

/**
 * Clears the entire database document for this tenant (used for resets).
 */
export const clearDB = async () => {
    try {
        const docRef = doc(db, 'chess_tournaments', tenantId);
        // Overwriting with an empty object obliterates the old data
        await setDoc(docRef, {});
        return true;
    } catch (e) {
        console.error("Firebase clear error:", e);
        return false;
    }
};
