const { app, BrowserWindow } = require("electron");
const path = require("path");

// Centralized API URL - Change this to switch between local and remote
const API_BASE_URL = "http://117.218.59.207:5001"; // For local development, use: "http://localhost:5001"

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Dev: point to Vite/React dev server
  if (!app.isPackaged) {
    mainWindow.loadURL("http://117.218.59.207:5001"); // change if using another port
  } else {
    // Prod: load built files
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

