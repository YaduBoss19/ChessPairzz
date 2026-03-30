/**
 * Offline-first state persistence using localStorage,
 * completely replacing Firebase.
 */
export const saveToDB = async (key, data) => {
    try {
        localStorage.setItem(`chesspairzzz_${key}`, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error(`Local save error [${key}]:`, e);
        return false;
    }
};

export const loadFromDB = async (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(`chesspairzzz_${key}`);
        if (item) {
            return JSON.parse(item);
        }
        return defaultValue;
    } catch (e) {
        console.error(`Local load error [${key}]:`, e);
        return defaultValue;
    }
};

export const clearDB = async () => {
    try {
        const keys = Object.keys(localStorage);
        for(let k of keys) {
            if(k.startsWith('chesspairzzz_')) {
                localStorage.removeItem(k);
            }
        }
        return true;
    } catch (e) {
        console.error("Local DB clear error:", e);
        return false;
    }
};

/**
 * Syncs the current tournament state to a Google Apps Script Web App Endpoint.
 * The script will map this into structured Excel / Google Sheet rows.
 */
export const syncToGoogleSheets = async (players, rounds, meta, standings) => {
    const SCRIPT_URL = localStorage.getItem('googleScriptUrl');
    
    if (!SCRIPT_URL) {
        alert("Please set your Google Apps Script Web App URL in the Settings first!");
        return false;
    }
    
    try {
        const payload = { players, rounds, meta, standings };
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // standard cross-origin override for simple pushing
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        // With no-cors, we can't read the exact response block, but if we get here without a Network Error, it successfully sent.
        return true;
    } catch (err) {
        console.error("Failed to sync to Google Sheets:", err);
        return false;
    }
};
