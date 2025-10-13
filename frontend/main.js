// Frontend/main.js
// Versión adaptada para trabajar con Backend (SQLite) y tu index.html
// Asegúrate de reiniciar node server.js después de reemplazar este archivo.

let products = [];         // productos traídos del servidor
let categories = [];       // arreglo de {id, nombre}
let tags = [];             // arreglo de {id, nombre}
let selectedTags = [];     // nombres seleccionadas en formulario nuevo
let editSelectedTags = []; // nombres seleccionadas en formulario editar
let editingProductIndex = null; // índice en products[] para editar (no usa id)

// ---------------------- UTIL ----------------------
function log(...args) { console.log('[main.js]', ...args); }
function showError(msg) { console.error('[main.js]', msg); alert(msg); }

// ---------------------- CARGA INICIAL ----------------------
window.addEventListener('load', async () => {
  // Si estamos en login.html, el form de login puede existir (index carga main.js también, es tolerante).
  const loginForm = document.getElementById('loginForm');
  if (loginForm) bindLoginForm(loginForm);

  // Si estamos en index/dashboard
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    // inicializar UI y cargar datos
    try {
      await loadCategories();
      await loadTags();
      await loadProducts();
      updateCategorySelects(); // llena selects
      renderCategories();
      renderTags();
      renderProducts();
      // setup inputs de etiquetas (si existen)
      setupTagInput('productTagInput','productTagsContainer','tagSuggestions', selectedTags);
      setupTagInput('editTagInput','editTagsContainer','editTagSuggestions', editSelectedTags);

      // Enlazar forms
      const formCat = document.getElementById('categoryForm');
      if (formCat) formCat.addEventListener('submit', async (e)=>{ e.preventDefault(); await handleAddCategory(); });

      const formTag = document.getElementById('tagForm');
      if (formTag) formTag.addEventListener('submit', async (e)=>{ e.preventDefault(); await handleAddTag(); });

      const productForm = document.getElementById('productForm');
      if (productForm) productForm.addEventListener('submit', async (e)=>{ e.preventDefault(); await handleAddProduct(); });

      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          window.searchTerm = e.target.value.trim().toLowerCase();
          renderProducts();
        });
      }
    } catch (err) {
      showError('Error inicializando la aplicación. Revisa la consola.');
      console.error(err);
    }
  }
});

// ---------------------- LOGIN ----------------------
function bindLoginForm(form) {
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = '/index.html';
      } else {
        alert(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      showError('No se pudo conectar al servidor para iniciar sesión.');
    }
  });
}

// ---------------------- CATEGORÍAS ----------------------
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Error cargando categorías');
    categories = await res.json(); // [{id, nombre}, ...]
    updateCategorySelects();
    renderCategories();
  } catch (err) {
    showError('No se pudieron cargar categorías.');
    console.error(err);
  }
}

async function handleAddCategory() {
  const nombre = document.getElementById('categoryName').value.trim();
  if (!nombre) return alert('Por favor ingresa un nombre de categoría');
  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ nombre })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear categoría');
    document.getElementById('categoryName').value = '';
    await loadCategories();
    alert('Categoría agregada exitosamente');
  } catch (err) {
    showError(err.message || 'Error al agregar categoría');
  }
}

function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!categories || categories.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#666;">No hay categorías</p>';
    return;
  }
  categories.forEach((c, index) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-name">${escapeHtml(c.nombre)}</div>
      <div class="item-actions">
        <button class="btn btn-edit btn-small" data-idx="${index}" data-action="edit-cat">Editar</button>
        <button class="btn btn-danger btn-small" data-idx="${index}" data-action="del-cat">Eliminar</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Delegación para editar/eliminar
  grid.querySelectorAll('[data-action="edit-cat"]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const idx = Number(btn.dataset.idx);
      editCategory(idx);
    });
  });
  grid.querySelectorAll('[data-action="del-cat"]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const idx = Number(btn.dataset.idx);
      deleteCategory(idx);
    });
  });
}

function updateCategorySelects() {
  const selects = [ document.getElementById('productCategory'), document.getElementById('editCategory') ];
  selects.forEach(select=>{
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Seleccionar categoría</option>';
    categories.forEach(c=>{
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nombre;
      select.appendChild(opt);
    });
    if (current) select.value = current;
  });
}

// Editar categoría (UI)
let editingCategoryIndex = null;
function editCategory(index) {
  editingCategoryIndex = index;
  const c = categories[index];
  if (!c) return;
  document.getElementById('editCategoryForm').style.display = 'block';
  document.getElementById('editCategoryName').value = c.nombre;
}

async function saveCategoryEdit() {
  const newName = document.getElementById('editCategoryName').value.trim();
  if (!newName) return alert('El nombre no puede estar vacío');
  try {
    // No tenemos endpoint PUT, así que insertamos nueva y (opcional) podrías eliminar la antigua si quieres.
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ nombre: newName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error actualizando categoría');
    // Simple: recargar categorías
    document.getElementById('editCategoryForm').style.display = 'none';
    document.getElementById('editCategoryName').value = '';
    await loadCategories();
    alert('Categoría actualizada (se creó una nueva entrada).');
  } catch (err) {
    showError(err.message || 'Error al guardar categoría');
  }
}

function cancelCategoryEdit() {
  editingCategoryIndex = null;
  const f = document.getElementById('editCategoryForm');
  if (f) { f.style.display = 'none'; }
  const input = document.getElementById('editCategoryName');
  if (input) input.value = '';
}

async function deleteCategory(index) {
  const cat = categories[index];
  if (!cat) return;
  if (!confirm(`Eliminar categoría "${cat.nombre}"? Esto fallará si existen productos ligados a ella.`)) return;

  try {
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar categoría');
    alert('✅ Categoría eliminada correctamente');
    await loadCategories(); // recargar lista
  } catch (err) {
    showError(err.message || 'Error al eliminar categoría');
  }
}


// ---------------------- ETIQUETAS ----------------------
async function loadTags() {
  try {
    const res = await fetch('/api/tags');
    if (!res.ok) throw new Error('Error cargando etiquetas');
    tags = await res.json(); // [{id,nombre},...]
    renderTags();
  } catch (err) {
    showError('No se pudieron cargar etiquetas');
  }
}

async function handleAddTag() {
  const nombre = document.getElementById('tagName').value.trim();
  if (!nombre) return alert('Ingrese un nombre para la etiqueta');
  try {
    const res = await fetch('/api/tags', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ nombre })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error agregando etiqueta');
    document.getElementById('tagName').value = '';
    await loadTags();
    alert('Etiqueta agregada');
  } catch (err) {
    showError(err.message || 'Error al agregar etiqueta');
  }
}

function renderTags() {
  const grid = document.getElementById('tagsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!tags || tags.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#666;">No hay etiquetas</p>';
    return;
  }
  tags.forEach((t, idx) => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
      <div class="item-name">${escapeHtml(t.nombre)}</div>
      <div class="item-actions">
        <button class="btn btn-edit btn-small" data-idx="${idx}" data-action="edit-tag">Editar</button>
        <button class="btn btn-danger btn-small" data-idx="${idx}" data-action="del-tag">Eliminar</button>
      </div>
    `;
    grid.appendChild(div);
  });

  grid.querySelectorAll('[data-action="edit-tag"]').forEach(btn=>btn.addEventListener('click', ()=>{
    const i = Number(btn.dataset.idx);
    editTag(i);
  }));
  grid.querySelectorAll('[data-action="del-tag"]').forEach(btn=>btn.addEventListener('click', ()=>{
    const i = Number(btn.dataset.idx);
    deleteTag(i);
  }));
}

let editingTagIndex = null;
function editTag(index) {
  editingTagIndex = index;
  const t = tags[index];
  if (!t) return;
  document.getElementById('editTagForm').style.display = 'block';
  document.getElementById('editTagName').value = t.nombre;
}

async function saveTagEdit() {
  const newName = document.getElementById('editTagName').value.trim();
  if (!newName) return alert('El nombre de la etiqueta no puede estar vacío');
  // No hay endpoint PUT para tags -> crear nueva etiqueta y (opcional) eliminar la antigua
  try {
    const res = await fetch('/api/tags', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ nombre: newName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error actualizando etiqueta');
    document.getElementById('editTagForm').style.display = 'none';
    document.getElementById('editTagName').value = '';
    await loadTags();
    alert('Etiqueta reemplazada (creada nueva).');
  } catch (err) {
    showError(err.message || 'Error al guardar etiqueta');
  }
}

function cancelTagEdit() {
  editingTagIndex = null;
  const f = document.getElementById('editTagForm');
  if (f) f.style.display = 'none';
  const input = document.getElementById('editTagName');
  if (input) input.value = '';
}

async function deleteTag(index) {
  const t = tags[index];
  if (!t) return;
  if (!confirm(`Eliminar etiqueta "${t.nombre}"? Esto puede afectar productos que la usen.`)) return;

  try {
    const res = await fetch(`/api/tags/${t.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar etiqueta');
    alert('✅ Etiqueta eliminada correctamente');
    await loadTags(); // recargar lista
  } catch (err) {
    showError(err.message || 'Error al eliminar etiqueta');
  }
}


// ---------------------- TAG INPUT (sugerencias, selección) ----------------------
function setupTagInput(inputId, containerId, suggestionsId, selectedTagsArray) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(containerId);
  const suggestions = document.getElementById(suggestionsId);
  if (!input || !container || !suggestions) return;

  function renderSelected() {
    container.innerHTML = '';
    const arr = selectedTagsArray === selectedTags ? selectedTags : editSelectedTags;
    arr.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'selected-tag';
      span.innerHTML = `${escapeHtml(tag)} <span class="tag-remove" data-tag="${escapeHtml(tag)}">×</span>`;
      container.appendChild(span);
      span.querySelector('.tag-remove').addEventListener('click', () => {
        const idx = arr.indexOf(tag);
        if (idx > -1) { arr.splice(idx,1); renderSelected(); }
      });
    });
    container.appendChild(input);
  }

  input.addEventListener('input', (e)=>{
    const v = e.target.value.trim().toLowerCase();
    if (!v) { suggestions.style.display = 'none'; return; }
    const filtered = tags.filter(t => t.nombre.toLowerCase().includes(v) && !( (selectedTagsArray===selectedTags?selectedTags:editSelectedTags).includes(t.nombre) ));
    if (filtered.length === 0) { suggestions.style.display = 'none'; return; }
    suggestions.innerHTML = filtered.map(ft => `<div class="tag-suggestion" data-name="${escapeHtml(ft.nombre)}">${escapeHtml(ft.nombre)}</div>`).join('');
    suggestions.style.display = 'block';
    suggestions.querySelectorAll('.tag-suggestion').forEach(sg=>{
      sg.addEventListener('click', ()=>{
        const name = sg.dataset.name;
        const arr = selectedTagsArray === selectedTags ? selectedTags : editSelectedTags;
        if (!arr.includes(name)) { arr.push(name); renderSelected(); }
        input.value = '';
        suggestions.style.display = 'none';
      });
    });
  });

  // Enter para añadir si coincide
  input.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      const tObj = tags.find(t => t.nombre === v);
      if (tObj) {
        const arr = selectedTagsArray === selectedTags ? selectedTags : editSelectedTags;
        if (!arr.includes(tObj.nombre)) { arr.push(tObj.nombre); renderSelected(); }
        input.value = '';
        suggestions.style.display = 'none';
      } else {
        // opción: crear etiqueta remotamente
        alert('Etiqueta no encontrada. Primero créala en el módulo Etiquetas.');
      }
    }
  });

  // click fuera oculta sugerencias
  document.addEventListener('click', (e)=>{
    if (!container.contains(e.target) && !suggestions.contains(e.target)) suggestions.style.display = 'none';
  });

  renderSelected();
}


function renderProducts() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const term = (typeof window.searchTerm !== 'undefined' && window.searchTerm) ? window.searchTerm.toLowerCase() : '';

  const filtered = products.filter(product => {
    if (!product.name) return false;
    return (
      product.name.toLowerCase().includes(term) ||
      (product.category && product.category.toLowerCase().includes(term)) ||
      (product.description && product.description.toLowerCase().includes(term)) ||
      (product.tags && product.tags.some(t => t.toLowerCase().includes(term))) ||
      String(product.price).includes(term) ||
      String(product.quantity || '').includes(term)
    );
  });

  filtered.forEach((product, index) => {
    const tr = tbody.insertRow();
    const tagsHTML = product.tags && product.tags.length>0 ? `<div class="tags-container">${product.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : '<span style="color:#999">Sin etiquetas</span>';
    const descHTML = product.description ? `<div class="product-description">${escapeHtml(product.description)}</div>` : '<span style="color:#999">Sin descripción</span>';
    tr.innerHTML = `
      <td><strong>${escapeHtml(product.name)}</strong></td>
      <td>${escapeHtml(product.category || '')}</td>
      <td>${descHTML}</td>
      <td>${tagsHTML}</td>
      <td>${product.quantity || ''}</td>
      <td>${parseFloat(product.price||0).toFixed(2)}</td>
      <td>${product.dateAdded ? new Date(product.dateAdded).toLocaleDateString() : ''}</td>
      <td>
        <div class="actions">
          <button class="btn btn-secondary btn-small" data-idx="${index}" data-action="edit">Editar</button>
          <button class="btn btn-danger btn-small" data-idx="${index}" data-action="delete">Eliminar</button>
        </div>
      </td>
    `;
    // bind actions
    tr.querySelector('[data-action="edit"]').addEventListener('click', ()=> editProduct(index));
    tr.querySelector('[data-action="delete"]').addEventListener('click', ()=> deleteProduct(index));
  });
}

function renderRecentProducts() {
  const container = document.getElementById('recentProductsList');
  if (!container) return;
  const recent = products.slice(-5).reverse();
  if (recent.length === 0) { container.innerHTML = '<p style="color:#666">No hay productos recientes</p>'; return; }
  container.innerHTML = recent.map(p=>{
    const tagsHTML = p.tags && p.tags.length>0 ? `<div class="tags-container" style="margin-top:5px;">${p.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : '';
    const desc = p.description ? `<div class="product-description">${escapeHtml(p.description)}</div>` : '';
    return `
      <div class="recent-item">
        <div class="recent-item-content">
          <strong>${escapeHtml(p.name)}</strong><br>
          <small>${escapeHtml(p.category || '')} - ${parseFloat(p.price||0).toFixed(2)}</small>
          ${desc}
          ${tagsHTML}
        </div>
        <div style="white-space:nowrap;">${p.dateAdded ? new Date(p.dateAdded).toLocaleDateString() : ''}</div>
      </div>
    `;
  }).join('');
}

// ---------------------- AGREGAR PRODUCTO ----------------------
async function handleAddProduct() {
  const nombre = document.getElementById('productName').value.trim();
  const categoria_id = document.getElementById('productCategory').value;
  const precio = parseFloat(document.getElementById('productPrice').value);
  const cantidad = parseInt(document.getElementById('productQuantity').value) || 1;

  if (!nombre || !categoria_id || !precio) return alert('Datos incompletos');

  // map selectedTags (names) to ids
  const tag_ids = selectedTags.map(name => {
    const t = tags.find(x => x.nombre === name);
    return t ? t.id : null;
  }).filter(x => x !== null);

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        nombre,
        descripcion: document.getElementById('productDescription').value || '',
        precio,
        categoria_id,
        cantidad,           // <-- columna cantidad
        etiquetas: tag_ids
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error agregando producto');

    // limpiar formulario
    document.getElementById('productForm').reset();
    selectedTags = [];
    renderSelectedTags('productTagsContainer','productTagInput','selectedTags');

    // recargar productos y actualizar stats
    await loadProducts();
    alert('Producto agregado exitosamente');
  } catch (err) {
    showError(err.message || 'Error al guardar producto');
  }
}

// ---------------------- CARGAR PRODUCTOS ----------------------
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Error cargando productos');
    const data = await res.json();

    // mapear productos con cantidad y tags
    products = data.map(p => ({
      id: p.id,
      name: p.nombre,
      description: p.descripcion,
      price: parseFloat(p.precio || 0),
      cantidad: parseInt(p.cantidad || 1), // <-- cantidad
      category: p.categoria || '',
      category_id: p.categoria_id,
      dateAdded: p.created_at,
      tags: Array.isArray(p.etiquetas) ? p.etiquetas.map(t => t.nombre) : []
    }));

    renderProducts();
    renderRecentProducts();
    updateStats();
  } catch (err) {
    showError('No se pudieron cargar los productos');
    console.error(err);
  }
}

// ---------------------- ACTUALIZAR ESTADÍSTICAS ----------------------
function updateStats() {
  try {
    document.getElementById('totalProducts').textContent = products.length;

    // productos recientes (últimos 7 días)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentCount = products.filter(p => new Date(p.dateAdded) > weekAgo).length;
    document.getElementById('recentProducts').textContent = recentCount;

    // valor total inventario = suma de precio * cantidad
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.cantidad), 0);
    document.getElementById('totalValue').textContent = totalValue.toFixed(2);

    // tipos de productos
    const uniqueCategories = [...new Set(products.map(p => p.category))].filter(x => x);
    document.getElementById('productTypes').textContent = uniqueCategories.length;
  } catch (err) {
    console.error('Error actualizando estadísticas:', err);
  }
}



function editProduct(index) {
  editingProductIndex = index;
  const p = products[index];
  if (!p) return;
  // show edit form
  const form = document.getElementById('editForm');
  if (!form) return;
  form.style.display = 'block';
  document.getElementById('editName').value = p.name;
  document.getElementById('editCategory').value = p.category_id || '';
  document.getElementById('editQuantity').value = p.quantity || '';
  document.getElementById('editPrice').value = p.price || '';
  document.getElementById('editDescription').value = p.description || '';
  editSelectedTags = p.tags ? [...p.tags] : [];
  renderSelectedTags('editTagsContainer','editTagInput','editSelectedTags');
  form.scrollIntoView({behavior:'smooth'});
}

async function saveEdit() {
  if (editingProductIndex === null) return;
  // NOTE: backend currently doesn't have PUT /api/products/:id — implement server-side update for persistence.
  // Here we update locally and reload list from server (but without server update, change won't persist).
  const id = products[editingProductIndex].id;
  const updated = {
    nombre: document.getElementById('editName').value,
    categoria_id: document.getElementById('editCategory').value,
    descripcion: document.getElementById('editDescription').value || '',
    precio: document.getElementById('editPrice').value,
    // etiquetas -> need ids; not updating tags server-side without endpoint
  };

  // TODO: call PUT /api/products/:id when implemented server-side
  alert('Edición local completada. Para persistir los cambios implementa PUT /api/products/:id en Backend.');
  // update local copy for UI
  products[editingProductIndex].name = updated.nombre;
  products[editingProductIndex].description = updated.descripcion;
  products[editingProductIndex].price = updated.precio;
  products[editingProductIndex].category = categories.find(c=>c.id==updated.categoria_id)?.nombre || '';
  renderProducts();
  cancelEdit();
}

function cancelEdit() {
  editingProductIndex = null;
  editSelectedTags = [];
  const f = document.getElementById('editForm');
  if (f) f.style.display = 'none';
}

// ---------------------- ELIMINAR PRODUCTO (ahora conectado al backend) ----------------------
async function deleteProduct(index) {
  const p = products[index];
  if (!p) return;

  if (!confirm(`¿Seguro que deseas eliminar el producto "${p.name}"? Esta acción no se puede deshacer.`)) return;

  try {
    const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al eliminar producto.');

    alert('✅ Producto eliminado correctamente.');
    await loadProducts(); // Recargar lista actualizada
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    alert('❌ No se pudo eliminar el producto. Revisa la consola.');
  }
}

// ---------------------- RENDER SELECTED TAGS (utility used by setupTagInput) ----------------------
function renderSelectedTags(containerId, inputId, arrayName) {
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);
  if (!container || !input) return;
  const targetArray = arrayName === 'selectedTags' ? selectedTags : editSelectedTags;
  container.innerHTML = '';
  targetArray.forEach(tag => {
    const el = document.createElement('span');
    el.className = 'selected-tag';
    el.innerHTML = `${escapeHtml(tag)} <span class="tag-remove" data-tag="${escapeHtml(tag)}">×</span>`;
    container.appendChild(el);
    el.querySelector('.tag-remove').addEventListener('click', ()=>{
      const idx = targetArray.indexOf(tag);
      if (idx > -1) { targetArray.splice(idx,1); renderSelectedTags(containerId,inputId,arrayName); }
    });
  });
  container.appendChild(input);
}

// ---------------------- HELPERS ----------------------
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]);
}

// ---------------------- SWITCH TAB (tu index.html usa esta función) ----------------------
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  // encontrar botón que llamó — en inline onclick, event is global; fallback: find button by text
  try {
    if (window.event && window.event.target) window.event.target.classList.add('active');
  } catch(e){}
  const content = document.getElementById(tabName);
  if (content) content.classList.add('active');
}
window.switchTab = switchTab; // exponer globalmente (para onclick inline)

