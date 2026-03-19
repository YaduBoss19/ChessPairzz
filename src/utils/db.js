export const DB_NAME = 'ChessPairzzLocalDB';
export const DB_VERSION = 1;

/**
 * Initializes and returns the IndexedDB instance.
 * Automatically handles version upgrades and table creation.
 */
export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject(event.target.error);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create a general key-value store table for the application
            if (!db.objectStoreNames.contains('app_state')) {
                db.createObjectStore('app_state', { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
    });
};

/**
 * Saves arbitrary data to the database under a specific key.
 */
export const saveToDB = async (key, data) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['app_state'], 'readwrite');
            const store = transaction.objectStore('app_state');
            const request = store.put({ key, data });
            
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (e) {
        console.error("Database save error:", e);
        return false;
    }
};

/**
 * Retrieves data from the database by specifically fetching a key.
 */
export const loadFromDB = async (key, defaultValue = null) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['app_state'], 'readonly');
            const store = transaction.objectStore('app_state');
            const request = store.get(key);
            
            request.onsuccess = () => {
                resolve(request.result ? request.result.data : defaultValue);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (e) {
        console.error("Database load error:", e);
        return defaultValue;
    }
};

/**
 * Clears the entire database (used for resets).
 */
export const clearDB = async () => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['app_state'], 'readwrite');
            const store = transaction.objectStore('app_state');
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (e) {
        console.error("Database clear error:", e);
        return false;
    }
};
