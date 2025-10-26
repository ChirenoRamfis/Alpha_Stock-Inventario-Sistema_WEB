const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let backendProcess;
let backendStarted = false;

// Evitar dos instancias
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

function createWindow(useLocal = false) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "Frontend", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (useLocal) {
    // Cargar directamente el archivo HTML desde el paquete
    const indexPath = path.join(__dirname, "Frontend", "login.html");
    console.log("Cargando HTML local:", indexPath);
    mainWindow.loadFile(indexPath);
  } else {
    // Cargar desde el backend en localhost
    mainWindow.loadURL("http://localhost:3000/login.html").catch(() => {
      console.error("Fallo al conectar con backend, usando HTML local...");
      createWindow(true); // fallback automático
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startBackend() {
  if (backendStarted) return;
  backendStarted = true;

  const serverPath = path.join(__dirname, "Backend", "server.js");
  backendProcess = spawn("node", [serverPath], {
    cwd: __dirname,
    shell: true,
    stdio: "inherit",
  });
}

function waitForServer(url, timeout = 6000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - start > timeout) reject();
          else setTimeout(check, 250);
        });
    };
    check();
  });
}

app.whenReady().then(async () => {
  startBackend();

  try {
    await waitForServer("http://localhost:3000");
    createWindow(false); // backend disponible
  } catch {
    console.error("⚠️ Backend no respondió, cargando HTML local...");
    createWindow(true); // fallback
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (backendProcess) backendProcess.kill();
    app.quit();
  }
});
