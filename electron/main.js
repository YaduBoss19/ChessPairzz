import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const electron = require('electron');

console.log('Electron object keys:', Object.keys(electron));
const { app, BrowserWindow } = electron;
console.log('App object:', app);

const path = require('path');
const { fileURLToPath } = require('url');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

if (app) {
    app.whenReady().then(() => {
        const win = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            },
            title: 'chesspairzzz'
        });

        if (isDev) {
            win.loadURL('http://localhost:5173');
        } else {
            win.loadFile(path.join(__dirname, '../dist/index.html'));
        }
    });
} else {
    console.error('CRITICAL: Electron app object is undefined!');
}
