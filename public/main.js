// Variables globales
let products = [];
let categories = [];
let editingProductIndex = null;
let editingCategoryIndex = null;

// Inicializar categorías por defecto
function initializeDefaultCategories() {
  const defaultCategories = [
    "Electrónicos",
    "Ropa",
    "Hogar",
    "Deportes",
    "Libros",
    "Otros",
  ];
  const storedCategories = JSON.parse(
    localStorage.getItem("categories") || "[]"
  );

  if (storedCategories.length === 0) {
    categories = defaultCategories;
    saveCategories();
  } else {
    categories = storedCategories;
  }
}

// Guardar categorías
function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
  updateCategorySelects();
  renderCategories();
}

// Renderizar categorías
function renderCategories() {
  const grid = document.getElementById("categoriesGrid");
  grid.innerHTML = "";

  if (categories.length === 0) {
    grid.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay categorías creadas. Agrega una nueva categoría.</p>';
    return;
  }

  categories.forEach((category, index) => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.innerHTML = `
      <div class="category-name">${category}</div>
      <div class="category-actions">
        <button onclick="editCategory(${index})" class="btn btn-edit btn-small">Editar</button>
        <button onclick="deleteCategory(${index})" class="btn btn-danger btn-small">Eliminar</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Actualizar selects de categorías
function updateCategorySelects() {
  const selects = [
    document.getElementById("productCategory"),
    document.getElementById("editCategory"),
  ];

  selects.forEach((select) => {
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Seleccionar categoría</option>';

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });

    if (currentValue && categories.includes(currentValue)) {
      select.value = currentValue;
    }
  });
}

// Agregar categoría
document
  .getElementById("categoryForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const categoryName = document.getElementById("categoryName").value.trim();

    if (categoryName === "") {
      alert("Por favor ingresa un nombre de categoría");
      return;
    }

    if (categories.includes(categoryName)) {
      alert("Esta categoría ya existe");
      return;
    }

    categories.push(categoryName);
    saveCategories();
    document.getElementById("categoryName").value = "";
    alert("Categoría agregada exitosamente");
  });

// Editar categoría
function editCategory(index) {
  editingCategoryIndex = index;
  document.getElementById("editCategoryName").value = categories[index];
  document.getElementById("editCategoryForm").style.display = "block";
}

function saveCategoryEdit() {
  const newName = document.getElementById("editCategoryName").value.trim();

  if (newName === "") {
    alert("El nombre de la categoría no puede estar vacío");
    return;
  }

  if (
    categories.includes(newName) &&
    categories[editingCategoryIndex] !== newName
  ) {
    alert("Ya existe una categoría con este nombre");
    return;
  }

  const oldName = categories[editingCategoryIndex];
  categories[editingCategoryIndex] = newName;

  // Actualizar productos que usan esta categoría
  products.forEach((product) => {
    if (product.category === oldName) {
      product.category = newName;
    }
  });

  saveProducts();
  saveCategories();
  cancelCategoryEdit();
  alert("Categoría actualizada exitosamente");
}

function cancelCategoryEdit() {
  editingCategoryIndex = null;
  document.getElementById("editCategoryForm").style.display = "none";
  document.getElementById("editCategoryName").value = "";
}

// Eliminar categoría
function deleteCategory(index) {
  const categoryName = categories[index];
  const productsWithCategory = products.filter(
    (p) => p.category === categoryName
  );

  if (productsWithCategory.length > 0) {
    if (
      !confirm(
        `Hay ${productsWithCategory.length} producto(s) con esta categoría. ¿Deseas eliminarla de todos modos? Los productos se moverán a "Sin categoría".`
      )
    ) {
      return;
    }

    products.forEach((product) => {
      if (product.category === categoryName) {
        product.category = "Sin categoría";
      }
    });

    if (!categories.includes("Sin categoría")) {
      categories.push("Sin categoría");
    }

    saveProducts();
  }

  categories.splice(index, 1);
  saveCategories();
  alert("Categoría eliminada exitosamente");
}

// Funciones de productos
function loadProducts() {
  const stored = localStorage.getItem("products");
  products = stored ? JSON.parse(stored) : [];
  renderProducts();
  updateStats();
}

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
  renderProducts();
  updateStats();
}

function renderProducts() {
  const tbody = document.getElementById("productsTableBody");
  tbody.innerHTML = "";

  products.forEach((product, index) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${product.quantity}</td>
      <td>$${parseFloat(product.price).toFixed(2)}</td>
      <td>${new Date(product.dateAdded).toLocaleDateString()}</td>
      <td>
        <div class="actions">
          <button onclick="editProduct(${index})" class="btn btn-secondary btn-small">Editar</button>
          <button onclick="deleteProduct(${index})" class="btn btn-danger btn-small">Eliminar</button>
        </div>
      </td>
    `;
  });

  renderRecentProducts();
}

function renderRecentProducts() {
  const container = document.getElementById("recentProductsList");
  const recent = products.slice(-5).reverse();

  if (recent.length === 0) {
    container.innerHTML =
      '<p style="color: #666;">No hay productos recientes</p>';
    return;
  }

  container.innerHTML = recent
    .map(
      (product) => `
    <div class="recent-item">
      <div>
        <strong>${product.name}</strong><br>
        <small>${product.category} - $${parseFloat(product.price).toFixed(
        2
      )}</small>
      </div>
      <div>${new Date(product.dateAdded).toLocaleDateString()}</div>
    </div>
  `
    )
    .join("");
}

function updateStats() {
  document.getElementById("totalProducts").textContent = products.length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentCount = products.filter(
    (p) => new Date(p.dateAdded) > weekAgo
  ).length;
  document.getElementById("recentProducts").textContent = recentCount;

  const totalValue = products.reduce(
    (sum, p) => sum + parseFloat(p.price) * parseInt(p.quantity),
    0
  );
  document.getElementById("totalValue").textContent = `$${totalValue.toFixed(
    2
  )}`;

  const uniqueCategories = [...new Set(products.map((p) => p.category))];
  document.getElementById("productTypes").textContent = uniqueCategories.length;
}

document.getElementById("productForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const product = {
    name: document.getElementById("productName").value,
    category: document.getElementById("productCategory").value,
    quantity: document.getElementById("productQuantity").value,
    price: document.getElementById("productPrice").value,
    dateAdded: new Date().toISOString(),
  };

  products.push(product);
  saveProducts();
  this.reset();
  alert("Producto agregado exitosamente");
});

function editProduct(index) {
  editingProductIndex = index;
  const product = products[index];

  document.getElementById("editName").value = product.name;
  document.getElementById("editCategory").value = product.category;
  document.getElementById("editQuantity").value = product.quantity;
  document.getElementById("editPrice").value = product.price;
  document.getElementById("editForm").style.display = "block";
}

function saveEdit() {
  if (editingProductIndex === null) return;

  products[editingProductIndex] = {
    name: document.getElementById("editName").value,
    category: document.getElementById("editCategory").value,
    quantity: document.getElementById("editQuantity").value,
    price: document.getElementById("editPrice").value,
    dateAdded: products[editingProductIndex].dateAdded,
  };

  saveProducts();
  cancelEdit();
  alert("Producto actualizado exitosamente");
}

function cancelEdit() {
  editingProductIndex = null;
  document.getElementById("editForm").style.display = "none";
}

function deleteProduct(index) {
  if (confirm("¿Estás seguro de eliminar este producto?")) {
    products.splice(index, 1);
    saveProducts();
    alert("Producto eliminado exitosamente");
  }
}

function switchTab(tabName) {
  document
    .querySelectorAll(".tab")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));

  event.target.classList.add("active");
  document.getElementById(tabName).classList.add("active");
}

// Inicializar
window.onload = function () {
  initializeDefaultCategories();
  updateCategorySelects();
  renderCategories();
  loadProducts();
};
