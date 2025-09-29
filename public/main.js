let products = [
            /*{ id: 1, name: 'Laptop HP Pavilion', category: 'Electrónicos', quantity: 15, price: 899.99, dateAdded: '2024-09-10' },
            { id: 2, name: 'Mouse Logitech', category: 'Electrónicos', quantity: 50, price: 29.99, dateAdded: '2024-09-12' },
            { id: 3, name: 'Teclado Mecánico', category: 'Electrónicos', quantity: 25, price: 89.99, dateAdded: '2024-09-14' },
            { id: 4, name: 'Silla Ergonómica', category: 'Hogar', quantity: 8, price: 199.99, dateAdded: '2024-09-11' }*/
        ];

        let editingProductId = null;

        function switchTab(tabName) {
            // Ocultar todos los contenidos
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Quitar clase active de todos los tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Mostrar contenido seleccionado
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
            
            if (tabName === 'list') {
                renderProductsTable();
            }
        }

        function updateStats() {
            const totalProducts = products.reduce((sum, product) => sum + product.quantity, 0);
            const totalValue = products.reduce((sum, product) => sum + (product.quantity * product.price), 0);
            const productTypes = products.length;
            
            // Productos de la última semana
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const recentProducts = products.filter(product => 
                new Date(product.dateAdded) >= oneWeekAgo
            ).reduce((sum, product) => sum + product.quantity, 0);

            document.getElementById('totalProducts').textContent = totalProducts;
            document.getElementById('recentProducts').textContent = recentProducts;
            document.getElementById('totalValue').textContent = '$' + totalValue.toLocaleString('es-ES', {minimumFractionDigits: 2});
            document.getElementById('productTypes').textContent = productTypes;
        }

        function renderRecentProducts() {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const recentProducts = products.filter(product => 
                new Date(product.dateAdded) >= oneWeekAgo
            ).sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

            const container = document.getElementById('recentProductsList');
            
            if (recentProducts.length === 0) {
                container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No hay productos agregados recientemente</p>';
                return;
            }

            container.innerHTML = recentProducts.map(product => `
                <div class="recent-item">
                    <div>
                        <strong>${product.name}</strong>
                        <br>
                        <small style="color: #666;">${product.category} - Cantidad: ${product.quantity}</small>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; color: #667eea;">$${product.price.toFixed(2)}</div>
                        <small style="color: #666;">${formatDate(product.dateAdded)}</small>
                    </div>
                </div>
            `).join('');
        }

        function renderProductsTable() {
            const tbody = document.getElementById('productsTableBody');
            tbody.innerHTML = products.map(product => `
                <tr>
                    <td><strong>${product.name}</strong></td>
                    <td><span style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${product.category}</span></td>
                    <td>${product.quantity}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>${formatDate(product.dateAdded)}</td>
                    <td class="actions">
                        <button onclick="editProduct(${product.id})" class="btn btn-secondary" style="padding: 6px 12px; font-size: 14px;">✏️ Editar</button>
                        <button onclick="deleteProduct(${product.id})" class="btn btn-danger" style="padding: 6px 12px; font-size: 14px;">🗑️ Eliminar</button>
                    </td>
                </tr>
            `).join('');
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        function addProduct(event) {
            event.preventDefault();
            
            const name = document.getElementById('productName').value;
            const category = document.getElementById('productCategory').value;
            const quantity = parseInt(document.getElementById('productQuantity').value);
            const price = parseFloat(document.getElementById('productPrice').value);
            
            if (!name || !category || !quantity || !price) {
                alert('Por favor complete todos los campos');
                return;
            }

            const newProduct = {
                id: Date.now(),
                name,
                category,
                quantity,
                price,
                dateAdded: new Date().toISOString().split('T')[0]
            };

            products.push(newProduct);
            
            // Limpiar formulario
            document.getElementById('productForm').reset();
            
            // Actualizar estadísticas y listas
            updateStats();
            renderRecentProducts();
            
            alert('Producto agregado exitosamente!');
        }

        function editProduct(id) {
            const product = products.find(p => p.id === id);
            if (!product) return;

            editingProductId = id;
            
            document.getElementById('editName').value = product.name;
            document.getElementById('editCategory').value = product.category;
            document.getElementById('editQuantity').value = product.quantity;
            document.getElementById('editPrice').value = product.price;
            
            document.getElementById('editForm').style.display = 'block';
            document.getElementById('editForm').scrollIntoView({ behavior: 'smooth' });
        }

        function saveEdit() {
            if (!editingProductId) return;
            
            const productIndex = products.findIndex(p => p.id === editingProductId);
            if (productIndex === -1) return;

            const name = document.getElementById('editName').value;
            const category = document.getElementById('editCategory').value;
            const quantity = parseInt(document.getElementById('editQuantity').value);
            const price = parseFloat(document.getElementById('editPrice').value);

            if (!name || !category || !quantity || !price) {
                alert('Por favor complete todos los campos');
                return;
            }

            products[productIndex] = {
                ...products[productIndex],
                name,
                category,
                quantity,
                price
            };

            cancelEdit();
            renderProductsTable();
            updateStats();
            renderRecentProducts();
            
            alert('Producto actualizado exitosamente!');
        }

        function cancelEdit() {
            editingProductId = null;
            document.getElementById('editForm').style.display = 'none';
        }

        function deleteProduct(id) {
            if (confirm('¿Está seguro de que desea eliminar este producto?')) {
                products = products.filter(p => p.id !== id);
                renderProductsTable();
                updateStats();
                renderRecentProducts();
                alert('Producto eliminado exitosamente!');
            }
        }

        // Event Listeners
        document.getElementById('productForm').addEventListener('submit', addProduct);

        // Inicializar la aplicación
        document.addEventListener('DOMContentLoaded', function() {
            updateStats();
            renderRecentProducts();
            renderProductsTable();
        });