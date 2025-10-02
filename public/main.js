// Variables globales
let products = [];
let categories = [];
let tags = [];
let editingProductIndex = null;
let editingCategoryIndex = null;
let editingTagIndex = null;
let selectedTags = [];
let editSelectedTags = [];

// Inicializar categorías y etiquetas por defecto
function initializeDefaults() {
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

  const storedTags = JSON.parse(localStorage.getItem("tags") || "[]");
  tags = storedTags;
}

// Guardar categorías
function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
  updateCategorySelects();
  renderCategories();
}

// Guardar etiquetas
function saveTags() {
  localStorage.setItem("tags", JSON.stringify(tags));
  renderTags();
}

// Renderizar categorías
function renderCategories() {
  const grid = document.getElementById("categoriesGrid");
  grid.innerHTML = "";

  if (categories.length === 0) {
    grid.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay categorías creadas.</p>';
    return;
  }

  categories.forEach((category, index) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
            <div class="item-name">${category}</div>
            <div class="item-actions">
              <button onclick="editCategory(${index})" class="btn btn-edit btn-small">Editar</button>
              <button onclick="deleteCategory(${index})" class="btn btn-danger btn-small">Eliminar</button>
            </div>
          `;
    grid.appendChild(card);
  });
}

// Renderizar etiquetas
function renderTags() {
  const grid = document.getElementById("tagsGrid");
  grid.innerHTML = "";

  if (tags.length === 0) {
    grid.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay etiquetas creadas.</p>';
    return;
  }

  tags.forEach((tag, index) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
            <div class="item-name">${tag}</div>
            <div class="item-actions">
              <button onclick="editTag(${index})" class="btn btn-edit btn-small">Editar</button>
              <button onclick="deleteTag(${index})" class="btn btn-danger btn-small">Eliminar</button>
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

// Agregar etiqueta
document.getElementById("tagForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const tagName = document.getElementById("tagName").value.trim();

  if (tagName === "") {
    alert("Por favor ingresa un nombre de etiqueta");
    return;
  }

  if (tags.includes(tagName)) {
    alert("Esta etiqueta ya existe");
    return;
  }

  tags.push(tagName);
  saveTags();
  document.getElementById("tagName").value = "";
  alert("Etiqueta agregada exitosamente");
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

// Editar etiqueta
function editTag(index) {
  editingTagIndex = index;
  document.getElementById("editTagName").value = tags[index];
  document.getElementById("editTagForm").style.display = "block";
}

function saveTagEdit() {
  const newName = document.getElementById("editTagName").value.trim();

  if (newName === "") {
    alert("El nombre de la etiqueta no puede estar vacío");
    return;
  }

  if (tags.includes(newName) && tags[editingTagIndex] !== newName) {
    alert("Ya existe una etiqueta con este nombre");
    return;
  }

  const oldName = tags[editingTagIndex];
  tags[editingTagIndex] = newName;

  products.forEach((product) => {
    if (product.tags && product.tags.includes(oldName)) {
      const tagIndex = product.tags.indexOf(oldName);
      product.tags[tagIndex] = newName;
    }
  });

  saveProducts();
  saveTags();
  cancelTagEdit();
  alert("Etiqueta actualizada exitosamente");
}

function cancelTagEdit() {
  editingTagIndex = null;
  document.getElementById("editTagForm").style.display = "none";
  document.getElementById("editTagName").value = "";
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

// Eliminar etiqueta
function deleteTag(index) {
  const tagName = tags[index];
  const productsWithTag = products.filter(
    (p) => p.tags && p.tags.includes(tagName)
  );

  if (productsWithTag.length > 0) {
    if (
      !confirm(
        `Hay ${productsWithTag.length} producto(s) con esta etiqueta. ¿Deseas eliminarla de todos modos?`
      )
    ) {
      return;
    }

    products.forEach((product) => {
      if (product.tags && product.tags.includes(tagName)) {
        product.tags = product.tags.filter((t) => t !== tagName);
      }
    });

    saveProducts();
  }

  tags.splice(index, 1);
  saveTags();
  alert("Etiqueta eliminada exitosamente");
}

// Sistema de etiquetas para productos
function setupTagInput(inputId, containerId, suggestionsId, selectedTagsArray) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(containerId);
  const suggestions = document.getElementById(suggestionsId);

  input.addEventListener("input", function (e) {
    const value = e.target.value.toLowerCase().trim();

    if (value === "") {
      suggestions.style.display = "none";
      return;
    }

    const filtered = tags.filter(
      (tag) =>
        tag.toLowerCase().includes(value) && !selectedTagsArray.includes(tag)
    );

    if (filtered.length === 0) {
      suggestions.style.display = "none";
      return;
    }

    suggestions.innerHTML = filtered
      .map(
        (tag) =>
          `<div class="tag-suggestion" onclick="addTagToProduct('${tag}', '${inputId}', '${containerId}', '${suggestionsId}', ${
            selectedTagsArray === selectedTags
              ? "selectedTags"
              : "editSelectedTags"
          })">${tag}</div>`
      )
      .join("");
    suggestions.style.display = "block";
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value && tags.includes(value) && !selectedTagsArray.includes(value)) {
        addTagToProduct(
          value,
          inputId,
          containerId,
          suggestionsId,
          selectedTagsArray === selectedTags
            ? "selectedTags"
            : "editSelectedTags"
        );
      }
    }
  });

  document.addEventListener("click", function (e) {
    if (!container.contains(e.target) && !suggestions.contains(e.target)) {
      suggestions.style.display = "none";
    }
  });

  renderSelectedTags(
    containerId,
    inputId,
    selectedTagsArray === selectedTags ? "selectedTags" : "editSelectedTags"
  );
}

function addTagToProduct(tag, inputId, containerId, suggestionsId, arrayName) {
  const targetArray =
    arrayName === "selectedTags" ? selectedTags : editSelectedTags;

  if (!targetArray.includes(tag)) {
    targetArray.push(tag);
    renderSelectedTags(containerId, inputId, arrayName);
    document.getElementById(inputId).value = "";
    document.getElementById(suggestionsId).style.display = "none";
  }
}

function removeTagFromProduct(tag, containerId, inputId, arrayName) {
  const targetArray =
    arrayName === "selectedTags" ? selectedTags : editSelectedTags;
  const index = targetArray.indexOf(tag);
  if (index > -1) {
    targetArray.splice(index, 1);
    renderSelectedTags(containerId, inputId, arrayName);
  }
}

function renderSelectedTags(containerId, inputId, arrayName) {
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);
  const targetArray =
    arrayName === "selectedTags" ? selectedTags : editSelectedTags;

  container.innerHTML = "";

  targetArray.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.className = "selected-tag";
    tagElement.innerHTML = `
            ${tag}
            <span class="tag-remove" onclick="removeTagFromProduct('${tag}', '${containerId}', '${inputId}', '${arrayName}')">×</span>
          `;
    container.appendChild(tagElement);
  });

  container.appendChild(input);
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

  // Si no hay searchTerm, lo ponemos vacío
  const term =
    typeof searchTerm !== "undefined" ? searchTerm.toLowerCase() : "";

  // Filtrar productos
  const filteredProducts = products.filter((product) => {
    return (
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      (product.description &&
        product.description.toLowerCase().includes(term)) ||
      (product.tags &&
        product.tags.some((tag) => tag.toLowerCase().includes(term))) ||
      product.price.toString().includes(term) ||
      product.quantity.toString().includes(term)
    );
  });

  filteredProducts.forEach((product, index) => {
    const row = tbody.insertRow();
    const tagsHTML =
      product.tags && product.tags.length > 0
        ? `<div class="tags-container">${product.tags
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join("")}</div>`
        : '<span style="color: #999;">Sin etiquetas</span>';

    const descriptionHTML = product.description
      ? `<div class="product-description">${product.description}</div>`
      : '<span style="color: #999;">Sin descripción</span>';

    row.innerHTML = `
      <td><strong>${product.name}</strong></td>
      <td>${product.category}</td>
      <td>${descriptionHTML}</td>
      <td>${tagsHTML}</td>
      <td>${product.quantity}</td>
      <td>${parseFloat(product.price).toFixed(2)}</td>
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
    .map((product) => {
      const tagsHTML =
        product.tags && product.tags.length > 0
          ? `<div class="tags-container" style="margin-top: 5px;">${product.tags
              .map((tag) => `<span class="tag">${tag}</span>`)
              .join("")}</div>`
          : "";

      const descriptionHTML = product.description
        ? `<div class="product-description">${product.description}</div>`
        : "";

      return `
              <div class="recent-item">
                <div class="recent-item-content">
                  <strong>${product.name}</strong><br>
                  <small>${product.category} - ${parseFloat(
        product.price
      ).toFixed(2)}</small>
                  ${descriptionHTML}
                  ${tagsHTML}
                </div>
                <div style="white-space: nowrap;">${new Date(
                  product.dateAdded
                ).toLocaleDateString()}</div>
              </div>
            `;
    })
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
  document.getElementById("totalValue").textContent = `${totalValue.toFixed(
    2
  )}`;

  const uniqueCategories = [...new Set(products.map((p) => p.category))];
  document.getElementById("productTypes").textContent = uniqueCategories.length;
}

// Agregar producto
document.getElementById("productForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const product = {
    name: document.getElementById("productName").value,
    category: document.getElementById("productCategory").value,
    quantity: document.getElementById("productQuantity").value,
    price: document.getElementById("productPrice").value,
    description: document.getElementById("productDescription").value || "",
    tags: [...selectedTags],
    dateAdded: new Date().toISOString(),
  };

  products.push(product);
  saveProducts();
  this.reset();
  selectedTags = [];
  renderSelectedTags("productTagsContainer", "productTagInput", "selectedTags");
  alert("Producto agregado exitosamente");
});

function editProduct(index) {
  editingProductIndex = index;
  const product = products[index];

  document.getElementById("editName").value = product.name;
  document.getElementById("editCategory").value = product.category;
  document.getElementById("editQuantity").value = product.quantity;
  document.getElementById("editPrice").value = product.price;
  document.getElementById("editDescription").value = product.description || "";

  editSelectedTags = product.tags ? [...product.tags] : [];
  renderSelectedTags("editTagsContainer", "editTagInput", "editSelectedTags");

  document.getElementById("editForm").style.display = "block";
  document.getElementById("editForm").scrollIntoView({ behavior: "smooth" });
}

function saveEdit() {
  if (editingProductIndex === null) return;

  products[editingProductIndex] = {
    name: document.getElementById("editName").value,
    category: document.getElementById("editCategory").value,
    quantity: document.getElementById("editQuantity").value,
    price: document.getElementById("editPrice").value,
    description: document.getElementById("editDescription").value || "",
    tags: [...editSelectedTags],
    dateAdded: products[editingProductIndex].dateAdded,
  };

  saveProducts();
  cancelEdit();
  alert("Producto actualizado exitosamente");
}

function cancelEdit() {
  editingProductIndex = null;
  editSelectedTags = [];
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
  initializeDefaults();
  updateCategorySelects();
  renderCategories();
  renderTags();
  loadProducts();
  setupTagInput(
    "productTagInput",
    "productTagsContainer",
    "tagSuggestions",
    selectedTags
  );
  setupTagInput(
    "editTagInput",
    "editTagsContainer",
    "editTagSuggestions",
    editSelectedTags
  );

  // Configurar buscador
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", function (e) {
    searchTerm = e.target.value.trim();
    renderProducts();
  });
};
