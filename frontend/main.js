// main.js (frontend) — diseñado para el index.html que pegaste

// -------------------- Variables globales --------------------
let products = [];
let categories = [];
let tags = [];
let selectedProductTags = []; // para formulario "Agregar Producto"
let editSelectedTags = []; // para formulario edición
let editingProductId = null;

// -------------------- Utilidades --------------------
function log(msg) {
  console.log("[main.js] " + msg);
}
function showError(msg) {
  // Si quieres un contenedor visible en HTML lo agregas; por ahora mostramos por consola
  console.error("[main.js] " + msg);
}
function q(sel) {
  return document.querySelector(sel);
}
function qa(sel) {
  return Array.from(document.querySelectorAll(sel));
}
function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// -------------------- switchTab (respeta tu HTML y botones) --------------------
function switchTab(tabId) {
  // Contenidos
  const contents = qa(".tab-content");
  contents.forEach((c) => c.classList.remove("active"));

  const target = document.getElementById(tabId);
  if (target) target.classList.add("active");

  // Botones: aplica clase active según orden conocido
  const tabOrder = ["dashboard", "categories", "add", "list"];
  const tabs = qa(".tabs .tab");
  tabs.forEach((btn, i) => {
    if (tabOrder[i] === tabId) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

// -------------------- CARGA / RENDER Categorías --------------------
async function loadCategories() {
  try {
    const res = await fetch("http://localhost:3000/api/categories");
    if (!res.ok) throw new Error("Error al obtener categorías");
    const data = await res.json();
    // Mapear a {id, nombre}
    categories = data.map((c) => ({ id: c.id, nombre: c.nombre }));
    renderCategoriesGrid();
    populateCategorySelects();
    renderStats(); // actualizar contadores que dependen de categorías
  } catch (err) {
    showError("Error cargando categorías: " + err.message);
  }
}

function renderCategoriesGrid() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;
  grid.innerHTML = "";
  categories.forEach((cat) => {
    const div = document.createElement("div");
    div.className = "item-card";
    div.innerHTML = `
      <div class="item-name">${escapeHtml(cat.nombre)}</div>
      <div class="item-actions">
        <button class="btn btn-small" data-id="${
          cat.id
        }" onclick="startEditCategory(${cat.id})">Editar</button>
        <button class="btn btn-secondary btn-small" data-id="${
          cat.id
        }" onclick="deleteCategory(${cat.id})">Eliminar</button>
      </div>
    `;
    grid.appendChild(div);
  });
}

function populateCategorySelects() {
  const selects = [
    document.getElementById("productCategory"),
    document.getElementById("editCategory"),
  ];
  selects.forEach((sel) => {
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccionar categoría</option>';
    categories.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nombre;
      sel.appendChild(opt);
    });
  });
}

// Formularios categoría
function bindCategoryForm() {
  const form = document.getElementById("categoryForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("categoryName");
    if (!input || !input.value.trim()) return;
    try {
      const res = await fetch("http://localhost:3000/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: input.value.trim() }),
      });
      if (!res.ok) throw new Error("Error al crear categoría");
      input.value = "";
      await loadCategories();
    } catch (err) {
      showError(err.message);
    }
  });
}

// Edit / Delete category
let editingCategoryId = null;
function startEditCategory(id) {
  editingCategoryId = id;
  const cat = categories.find((c) => c.id == id);
  if (!cat) return;
  document.getElementById("editCategoryName").value = cat.nombre;
  document.getElementById("editCategoryForm").style.display = "block";
}
async function saveCategoryEdit() {
  const input = document.getElementById("editCategoryName");
  if (!editingCategoryId || !input.value.trim()) return;
  try {
    const res = await fetch(
      `http://localhost:3000/api/categories/${editingCategoryId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: input.value.trim() }),
      }
    );
    if (!res.ok) throw new Error("Error al actualizar categoría");
    editingCategoryId = null;
    input.value = "";
    document.getElementById("editCategoryForm").style.display = "none";
    await loadCategories();
  } catch (err) {
    showError(err.message);
  }
}
function cancelCategoryEdit() {
  editingCategoryId = null;
  document.getElementById("editCategoryName").value = "";
  document.getElementById("editCategoryForm").style.display = "none";
}
async function deleteCategory(id) {
  if (!confirm("Eliminar categoría?")) return;
  try {
    const res = await fetch(`http://localhost:3000/api/categories/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar categoría");
    await loadCategories();
    await loadProducts(); // refrescar productos porque categoría pudo afectar listado
  } catch (err) {
    showError(err.message);
  }
}

// -------------------- CARGA / RENDER Etiquetas --------------------
async function loadTags() {
  try {
    const res = await fetch("http://localhost:3000/api/tags");
    if (!res.ok) throw new Error("Error al obtener etiquetas");
    const data = await res.json();
    tags = data.map((t) => ({ id: t.id, nombre: t.nombre }));
    renderTagsGrid();
    renderStats(); // actualizar contadores si aplica
  } catch (err) {
    showError("Error cargando etiquetas: " + err.message);
  }
}

function renderTagsGrid() {
  const grid = document.getElementById("tagsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  tags.forEach((tag) => {
    const div = document.createElement("div");
    div.className = "item-card";
    div.innerHTML = `
      <div class="item-name">${escapeHtml(tag.nombre)}</div>
      <div class="item-actions">
        <button class="btn btn-small" onclick="startEditTag(${
          tag.id
        })">Editar</button>
        <button class="btn btn-secondary btn-small" onclick="deleteTag(${
          tag.id
        })">Eliminar</button>
      </div>
    `;
    grid.appendChild(div);
  });
}

// Tag form
function bindTagForm() {
  const form = document.getElementById("tagForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("tagName");
    if (!input || !input.value.trim()) return;
    try {
      const res = await fetch("http://localhost:3000/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: input.value.trim() }),
      });
      if (!res.ok) throw new Error("Error al crear etiqueta");
      input.value = "";
      await loadTags();
    } catch (err) {
      showError(err.message);
    }
  });
}

let editingTagId = null;
function startEditTag(id) {
  editingTagId = id;
  const tag = tags.find((t) => t.id == id);
  if (!tag) return;
  document.getElementById("editTagName").value = tag.nombre;
  document.getElementById("editTagForm").style.display = "block";
}
async function saveTagEdit() {
  const input = document.getElementById("editTagName");
  if (!editingTagId || !input.value.trim()) return;
  try {
    const res = await fetch(`http://localhost:3000/api/tags/${editingTagId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: input.value.trim() }),
    });
    if (!res.ok) throw new Error("Error al actualizar etiqueta");
    editingTagId = null;
    input.value = "";
    document.getElementById("editTagForm").style.display = "none";
    await loadTags();
    await loadProducts(); // refrescar si etiquetas cambian
  } catch (err) {
    showError(err.message);
  }
}
function cancelTagEdit() {
  editingTagId = null;
  document.getElementById("editTagName").value = "";
  document.getElementById("editTagForm").style.display = "none";
}
async function deleteTag(id) {
  if (!confirm("Eliminar etiqueta?")) return;
  try {
    const res = await fetch(`http://localhost:3000/api/tags/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar etiqueta");
    await loadTags();
    await loadProducts();
  } catch (err) {
    showError(err.message);
  }
}

// -------------------- CARGA / RENDER Productos --------------------
async function loadProducts() {
  try {
    const res = await fetch("http://localhost:3000/api/products");
    if (!res.ok) throw new Error("Error al obtener productos");
    const data = await res.json();
    // Mapear cada producto a estructura amigable
    products = data.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      cantidad: p.cantidad,
      categoria_id: p.categoria_id,
      categoria_nombre: p.categoria || null,
      created_at: p.created_at,
      etiquetas: Array.isArray(p.etiquetas)
        ? p.etiquetas.map((t) => ({ id: t.id, nombre: t.nombre }))
        : [],
    }));
    renderProductsTable();
    renderRecentProducts();
    renderStats();
  } catch (err) {
    showError("Error cargando productos: " + err.message);
  }
}

function renderProductsTable() {
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  products.forEach((p) => {
    const tr = document.createElement("tr");
    const tagsText = p.etiquetas.map((t) => escapeHtml(t.nombre)).join(", ");
    tr.innerHTML = `
      <td>${escapeHtml(p.nombre)}</td>
      <td>${escapeHtml(p.categoria_nombre || "")}</td>
      <td>${escapeHtml(p.descripcion || "")}</td>
      <td>${tagsText}</td>
      <td>${p.cantidad}</td>
      <td>$${Number(p.precio).toFixed(2)}</td>
      <td>${p.created_at ? p.created_at.split(" ")[0] : ""}</td>
      <td>
        <button class="btn btn-small" onclick="openEditForm(${
          p.id
        })">Editar</button>
        <button class="btn btn-secondary btn-small" onclick="deleteProduct(${
          p.id
        })">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderRecentProducts() {
  const list = document.getElementById("recentProductsList");
  if (!list) return;
  list.innerHTML = "";
  const recent = products.slice(0, 5);
  if (recent.length === 0) {
    list.innerHTML = "<div>No hay productos recientes</div>";
    return;
  }
  recent.forEach((p) => {
    const div = document.createElement("div");
    div.className = "recent-item";
    div.innerHTML = `<strong>${escapeHtml(p.nombre)}</strong> — ${escapeHtml(
      p.categoria_nombre || ""
    )} — $${Number(p.precio).toFixed(2)}`;
    list.appendChild(div);
  });
}

async function deleteProduct(id) {
  if (!confirm("Eliminar producto?")) return;
  try {
    const res = await fetch(`http://localhost:3000/api/products/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar producto");
    await loadProducts();
  } catch (err) {
    showError(err.message);
  }
}

// -------------------- Form: Agregar Producto --------------------
function bindProductForm() {
  const form = document.getElementById("productForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("productName").value.trim();
    const categoria_id =
      parseInt(document.getElementById("productCategory").value) || null;
    const cantidad =
      parseInt(document.getElementById("productQuantity").value) || 1;
    const precio =
      parseFloat(document.getElementById("productPrice").value) || 0;
    const descripcion = document
      .getElementById("productDescription")
      .value.trim();

    if (!nombre || !categoria_id) {
      alert("Nombre y categoría son requeridos");
      return;
    }

    try {
      const payload = {
        nombre,
        descripcion,
        precio,
        cantidad,
        categoria_id,
        etiquetas: selectedProductTags.map((t) => t.id), // array de ids
      };
      const res = await fetch("http://localhost:3000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al crear producto");
      // reset form
      form.reset();
      selectedProductTags = [];
      renderSelectedTagsUI(); // limpiar chips
      await loadProducts();
      switchTab("list"); // Ir a lista
    } catch (err) {
      showError(err.message);
    }
  });
}

// -------------------- Edit product (abrir formulario) --------------------
function openEditForm(productId) {
  const p = products.find((x) => x.id == productId);
  if (!p) return;
  editingProductId = p.id;
  document.getElementById("editForm").style.display = "block";
  document.getElementById("editName").value = p.nombre;
  document.getElementById("editCategory").value = p.categoria_id || "";
  document.getElementById("editQuantity").value = p.cantidad;
  document.getElementById("editPrice").value = p.precio;
  document.getElementById("editDescription").value = p.descripcion || "";
  // set tags
  editSelectedTags = p.etiquetas.map((t) => ({ id: t.id, nombre: t.nombre }));
  renderEditSelectedTagsUI();
  switchTab("list");
}

async function saveEdit() {
  if (!editingProductId) return;
  const nombre = document.getElementById("editName").value.trim();
  const categoria_id =
    parseInt(document.getElementById("editCategory").value) || null;
  const cantidad = parseInt(document.getElementById("editQuantity").value) || 1;
  const precio = parseFloat(document.getElementById("editPrice").value) || 0;
  const descripcion = document.getElementById("editDescription").value.trim();

  if (!nombre || !categoria_id) {
    alert("Nombre y categoría son requeridos");
    return;
  }

  try {
    const payload = {
      nombre,
      descripcion,
      precio,
      cantidad,
      categoria_id,
      etiquetas: editSelectedTags.map((t) => t.id),
    };
    const res = await fetch(
      `http://localhost:3000/api/products/${editingProductId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) throw new Error("Error al actualizar producto");
    // reset
    editingProductId = null;
    document.getElementById("editForm").style.display = "none";
    await loadProducts();
  } catch (err) {
    showError(err.message);
  }
}

function cancelEdit() {
  editingProductId = null;
  document.getElementById("editForm").style.display = "none";
}

// -------------------- Tag selection UI (Agregar Producto) --------------------
function bindProductTagInput() {
  const input = document.getElementById("productTagInput");
  const suggestions = document.getElementById("tagSuggestions");
  const container = document.getElementById("productTagsContainer");
  if (!input || !suggestions || !container) return;

  input.addEventListener("input", () => {
    const qText = input.value.trim().toLowerCase();
    if (!qText) {
      suggestions.style.display = "none";
      suggestions.innerHTML = "";
      return;
    }
    const matched = tags.filter((t) => t.nombre.toLowerCase().includes(qText));
    suggestions.innerHTML = "";
    matched.forEach((t) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = t.nombre;
      div.onclick = () => {
        // add tag to selected if not exists
        if (!selectedProductTags.some((x) => x.id === t.id)) {
          selectedProductTags.push({ id: t.id, nombre: t.nombre });
          renderSelectedTagsUI();
        }
        input.value = "";
        suggestions.style.display = "none";
      };
      suggestions.appendChild(div);
    });
    suggestions.style.display = matched.length ? "block" : "none";
  });

  // cuando presiona Enter, si hay texto creamos nueva etiqueta automáticamente
  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      // si la etiqueta ya existe, seleccionarla
      const existing = tags.find(
        (t) => t.nombre.toLowerCase() === text.toLowerCase()
      );
      if (existing) {
        if (!selectedProductTags.some((x) => x.id === existing.id)) {
          selectedProductTags.push({
            id: existing.id,
            nombre: existing.nombre,
          });
          renderSelectedTagsUI();
        }
        input.value = "";
        return;
      }
      // crear etiqueta nueva en server
      try {
        const res = await fetch("http://localhost:3000/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: text }),
        });
        if (!res.ok) throw new Error("Error creando etiqueta");
        const resp = await res.json();
        // recargar tags y seleccionar la nueva
        await loadTags();
        const newTag = tags.find(
          (t) => t.nombre.toLowerCase() === text.toLowerCase()
        );
        if (newTag)
          selectedProductTags.push({ id: newTag.id, nombre: newTag.nombre });
        renderSelectedTagsUI();
        input.value = "";
      } catch (err) {
        showError(err.message);
      }
    }
  });
}

function renderSelectedTagsUI() {
  const container = document.getElementById("productTagsContainer");
  if (!container) return;
  // Limpiar pero mantener el input
  const input = document.getElementById("productTagInput");
  container.innerHTML = "";
  selectedProductTags.forEach((t) => {
    const span = document.createElement("span");
    span.className = "tag-chip";
    span.textContent = t.nombre;
    const btn = document.createElement("button");
    btn.className = "tag-remove";
    btn.textContent = "x";
    btn.onclick = () => {
      selectedProductTags = selectedProductTags.filter((x) => x.id !== t.id);
      renderSelectedTagsUI();
    };
    span.appendChild(btn);
    container.appendChild(span);
  });
  // re-add input
  if (input) container.appendChild(input);
}

// -------------------- Tag selection UI (Editar Producto) --------------------
function bindEditTagInput() {
  const input = document.getElementById("editTagInput");
  const suggestions = document.getElementById("editTagSuggestions");
  const container = document.getElementById("editTagsContainer");
  if (!input || !suggestions || !container) return;

  input.addEventListener("input", () => {
    const qText = input.value.trim().toLowerCase();
    if (!qText) {
      suggestions.style.display = "none";
      suggestions.innerHTML = "";
      return;
    }
    const matched = tags.filter((t) => t.nombre.toLowerCase().includes(qText));
    suggestions.innerHTML = "";
    matched.forEach((t) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = t.nombre;
      div.onclick = () => {
        if (!editSelectedTags.some((x) => x.id === t.id)) {
          editSelectedTags.push({ id: t.id, nombre: t.nombre });
          renderEditSelectedTagsUI();
        }
        input.value = "";
        suggestions.style.display = "none";
      };
      suggestions.appendChild(div);
    });
    suggestions.style.display = matched.length ? "block" : "none";
  });

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const existing = tags.find(
        (t) => t.nombre.toLowerCase() === text.toLowerCase()
      );
      if (existing) {
        if (!editSelectedTags.some((x) => x.id === existing.id)) {
          editSelectedTags.push({ id: existing.id, nombre: existing.nombre });
          renderEditSelectedTagsUI();
        }
        input.value = "";
        return;
      }
      // crear nueva etiqueta y seleccionar
      try {
        const res = await fetch("http://localhost:3000/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: text }),
        });
        if (!res.ok) throw new Error("Error creando etiqueta");
        await loadTags();
        const newTag = tags.find(
          (t) => t.nombre.toLowerCase() === text.toLowerCase()
        );
        if (newTag)
          editSelectedTags.push({ id: newTag.id, nombre: newTag.nombre });
        renderEditSelectedTagsUI();
        input.value = "";
      } catch (err) {
        showError(err.message);
      }
    }
  });
}

function renderEditSelectedTagsUI() {
  const container = document.getElementById("editTagsContainer");
  if (!container) return;
  const input = document.getElementById("editTagInput");
  container.innerHTML = "";
  editSelectedTags.forEach((t) => {
    const span = document.createElement("span");
    span.className = "tag-chip";
    span.textContent = t.nombre;
    const btn = document.createElement("button");
    btn.className = "tag-remove";
    btn.textContent = "x";
    btn.onclick = () => {
      editSelectedTags = editSelectedTags.filter((x) => x.id !== t.id);
      renderEditSelectedTagsUI();
    };
    span.appendChild(btn);
    container.appendChild(span);
  });
  if (input) container.appendChild(input);
}

// -------------------- Stats (simple) --------------------
function renderStats() {
  const totalProductsEl = document.getElementById("totalProducts");
  const recentProductsEl = document.getElementById("recentProducts");
  const totalValueEl = document.getElementById("totalValue");
  const productTypesEl = document.getElementById("productTypes");
  if (totalProductsEl) totalProductsEl.textContent = products.length;
  if (recentProductsEl)
    recentProductsEl.textContent = products.slice(0, 7).length;
  const totalValue = products.reduce(
    (acc, p) => acc + (Number(p.precio) || 0) * (Number(p.cantidad) || 0),
    0
  );
  if (totalValueEl) totalValueEl.textContent = `$${totalValue.toFixed(2)}`;
  if (productTypesEl) productTypesEl.textContent = categories.length;
}

// -------------------- BINDS + Inicialización --------------------
async function initializeApp() {
  // Bind forms and inputs
  bindCategoryForm();
  bindTagForm();
  bindProductForm();
  bindProductTagInput();
  bindEditTagInput();

  // Cargar datos iniciales
  await loadCategories();
  await loadTags();
  await loadProducts();

  // Setup initial UI state
  switchTab("dashboard");
  renderSelectedTagsUI();
  renderEditSelectedTagsUI();

  log("Aplicación inicializada correctamente");
}

// Exponer funciones necesarias en window (para los onclick inline del HTML)
window.switchTab = switchTab;
window.startEditCategory = startEditCategory;
window.saveCategoryEdit = saveCategoryEdit;
window.cancelCategoryEdit = cancelCategoryEdit;
window.deleteCategory = deleteCategory;

window.startEditTag = startEditTag;
window.saveTagEdit = saveTagEdit;
window.cancelTagEdit = cancelTagEdit;
window.deleteTag = deleteTag;

window.openEditForm = openEditForm;
window.saveEdit = saveEdit;
window.cancelEdit = cancelEdit;
window.deleteProduct = deleteProduct;

// Inicializar cuando se cargue la página
window.addEventListener("load", () => {
  initializeApp().catch((err) => {
    showError("Error inicializando la app: " + err.message);
  });
});
