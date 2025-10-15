// main.js (para Electron con backend en /backend)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'Frontend', 'icon.png'), // si no tienes ícono, puedes quitar esta línea
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Cargar la interfaz web
  mainWindow.loadFile(path.join(__dirname, 'Frontend', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Iniciar backend automáticamente
function startBackend() {
  const serverPath = path.join(__dirname, 'backend', 'server.js'); // 👈 Aquí el cambio
  backendProcess = spawn('node', [serverPath], {
    shell: true,
    stdio: 'inherit',
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) backendProcess.kill();
    app.quit();
  }
});
