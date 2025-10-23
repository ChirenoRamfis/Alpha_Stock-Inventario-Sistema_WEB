const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("api", {
  fetchBackend: async (endpoint, options = {}) => {
    const res = await fetch(`http://localhost:3000${endpoint}`, options);
    // devolver JSON directamente
    if (!res.ok) throw new Error(`Error en ${endpoint}`);
    return res.json();
  },
});
