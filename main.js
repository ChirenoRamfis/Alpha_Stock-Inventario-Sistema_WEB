const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let backendProcess;
let backendStarted = false;

// Evitar dos instancias 🎯
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "Frontend", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // 👈 preload
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:3000/login.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startBackend() {
  if (backendStarted) return; // 👈 evitar doble backend
  backendStarted = true;

  const serverPath = path.join(__dirname, "Backend", "server.js");
  backendProcess = spawn("node", [serverPath], {
    shell: true,
    stdio: "inherit",
  });
}

function waitForServer(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - start > timeout) reject("Servidor no responde");
          else setTimeout(check, 200);
        });
    };
    check();
  });
}

app.whenReady().then(async () => {
  startBackend();

  try {
    await waitForServer("http://localhost:3000");
    createWindow();
  } catch (err) {
    console.error(err);
    createWindow(); // fallback
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (backendProcess) backendProcess.kill();
    app.quit();
  }
});
