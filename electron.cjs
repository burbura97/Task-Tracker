const { app, BrowserWindow } = require("electron");
const path = require("path");

const isDev = !app.isPackaged; // 👈 THIS IS THE KEY

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: "#0b0f19",
        webPreferences: {
            contextIsolation: false,
            sandbox: false
        }
    });

    win.loadFile(path.join(__dirname, "dist/index.html"));

    // ✅ DevTools ONLY in dev
    if (isDev) {
        win.webContents.openDevTools({ mode: "detach" });
    }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});