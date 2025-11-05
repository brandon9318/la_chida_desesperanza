// aaa este es el archivo principal de la panadería (versión para Render + PostgreSQL) -bynd
document.addEventListener('DOMContentLoaded', function() {
    // chintrolas diccionario de traducciones -bynd
    const translations = {
        'nav-home': { es: 'Inicio', en: 'Home' },
        'nav-products': { es: 'Productos', en: 'Products' },
        'nav-manage': { es: 'Gestión', en: 'Management' },
        'cart-badge': { es: 'productos en el carrito', en: 'products in cart' },
        'header-title': { es: 'Panadería La Desesperanza', en: 'La Desesperanza Bakery' },
        'header-lead': { es: 'Delicias de temporada para Día de Muertos y Halloween', en: 'Seasonal Delicacies for Day of the Dead and Halloween' },
        'section-title-products': { es: 'Nuestros Productos de Temporada', en: 'Our Seasonal Products' },
        'btn-day-dead': { es: 'Día de Muertos (10 Productos)', en: 'Day of the Dead (10 Products)' },
        'btn-halloween': { es: 'Halloween (10 Productos)', en: 'Halloween (10 Products)' },
        'card-btn-details': { es: 'Ver Detalles', en: 'View Details' },
        'card-btn-add': { es: 'Añadir al Carrito', en: 'Add to Cart' },
        'footer-text': { es: '© 2024 Panadería La Desesperanza. Todos los derechos reservados.', en: '© 2024 La Desesperanza Bakery. All rights reserved.' },
        'cart-title': { es: 'Tu Carrito de Compras', en: 'Your Shopping Cart' },
        'cart-empty': { es: 'Tu carrito está vacío.', en: 'Your cart is empty.' },
        'btn-continue-shopping': { es: 'Seguir Comprando', en: 'Continue Shopping' },
        'btn-empty-cart': { es: 'Vaciar Carrito', en: 'Empty Cart' },
        'btn-checkout': { es: 'Proceder al Pago', en: 'Proceed to Checkout' },
        'checkout-success': { es: '¡Pago exitoso! Gracias por tu compra.', en: 'Payment successful! Thank you for your purchase.'},
        'checkout-empty-error': { es: 'El carrito está vacío. Añade productos antes de pagar.', en: 'Cart is empty. Please add products before checking out.'}
    };

    // fokeis esta función ahora usa rutas RELATIVAS (sin localhost) -bynd
    async function cargarProductosDelServidor() {
        try {
            // ✅ CAMBIO CLAVE: quitamos 'http://localhost:3000' → solo '/api/...' -bynd
            const response = await fetch('https://la-chida-desesperanza.onrender.com/api/productos', { credentials: 'include' });
            if (!response.ok) {
                throw new Error('Chintrolas, no pude cargar los productos 😿');
            }
            const data = await response.json();
            if (data.success && data.productos) {
                return data.productos.map(p => ({
                    id: p.producto_id || p.id,
                    category: p.categoria || p.category,
                    price: parseFloat(p.precio || p.price),
                    stock: parseInt(p.stock),
                    img: p.img || p.imagen_url || 'img/default.jpg',
                    name: { 
                        es: p.nombre_es || p.name?.es || p.name,
                        en: p.nombre_en || p.name?.en || p.name 
                    },
                    desc: { 
                        es: p.desc_es || p.descripcion_es || p.desc?.es || '',
                        en: p.desc_en || p.descripcion_en || p.desc?.en || '' 
                    },
                    activo: p.activo !== undefined ? p.activo : true
                }));
            } else {
                console.error('Fokeis, la API no regresó productos:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Errorzote en fetch:', error);
            return [];
        }
    }

    // ... (el resto de tus funciones: carrito, login, gestión, etc. se mantienen IGUALES)

    // ey variables globales -bynd
    let carrito = obtenerCarrito();
    let currentLang = localStorage.getItem('panaderiaLang') || 'es';
    let currentUser = obtenerUsuarioActual();
    let productos = [];

    // --- FUNCIONES DE AUTENTICACIÓN Y CARRITO (sin cambios) ---
    function obtenerUsuarioActual() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    function guardarUsuarioActual(user) {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
        currentUser = user;
    }

    function obtenerUsuarios() {
        const users = localStorage.getItem('usuariosPanaderia');
        if (!users) {
            const defaultUsers = [
                { id: 1, nombre: 'Admin', email: 'admin@panaderia.com', password: 'admin123', rol: 'admin' },
                { id: 2, nombre: 'Cliente Demo', email: 'cliente@demo.com', password: 'demo123', rol: 'cliente' }
            ];
            localStorage.setItem('usuariosPanaderia', JSON.stringify(defaultUsers));
            return defaultUsers;
        }
        return JSON.parse(users);
    }

    function guardarUsuarios(users) {
        localStorage.setItem('usuariosPanaderia', JSON.stringify(users));
    }

    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function mostrarAlerta(containerId, mensaje, tipo = 'danger') {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.className = `alert alert-${tipo}`;
        container.textContent = mensaje;
        container.classList.remove('d-none');
        setTimeout(() => {
            container.classList.add('d-none');
        }, 4000);
    }

    // ✅ IMPORTANTE: todas las llamadas a fetch usan rutas RELATIVAS
    async function loginCliente(email, password) {
        const response = await fetch('/api/login-cliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        return await response.json();
    }

    async function loginAdmin(email, password) {
        const response = await fetch('/api/login-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        return await response.json();
    }

    async function logout() {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    }

    async function gestionProducto(datos, id = null, esEliminar = false) {
        let url = '/api/productos';
        let method = 'POST';
        if (id) url += `/${id}`;
        if (esEliminar) method = 'DELETE';
        else if (id) method = 'PUT';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: esEliminar ? null : JSON.stringify(datos),
            credentials: 'include'
        });
        return await response.json();
    }

    // --- EL RESTO DE TUS FUNCIONES (event listeners, carrito, UI, etc.) SE QUEDAN IGUAL ---
    // (No hay necesidad de modificarlas porque ya no usan localhost)

    // ==================================================================
    // ✅ EVENTOS DE LOGIN (actualizados pa' usar las funciones de arriba)
    // ==================================================================
    const formLoginCliente = document.getElementById('formLoginCliente');
    if (formLoginCliente) {
        formLoginCliente.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginClienteEmail').value.trim();
            const password = document.getElementById('loginClientePassword').value;
            if (!validarEmail(email) || !password) {
                mostrarAlerta('alert-cliente', 'Email o contraseña inválidos', 'danger');
                return;
            }
            try {
                const data = await loginCliente(email, password);
                if (data.success) {
                    guardarUsuarioActual(data.user);
                    actualizarUIUsuario();
                    mostrarAlerta('alert-cliente', '¡Bienvenido! Iniciando sesión...', 'success');
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('loginClienteModal'));
                        if (modal) modal.hide();
                        formLoginCliente.reset();
                    }, 1500);
                } else {
                    mostrarAlerta('alert-cliente', data.message || 'Credenciales incorrectas', 'danger');
                }
            } catch (error) {
                mostrarAlerta('alert-cliente', 'Error al conectar con el servidor 😿', 'danger');
            }
        });
    }

    const formLoginAdmin = document.getElementById('formLoginAdmin');
    if (formLoginAdmin) {
        formLoginAdmin.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginAdminEmail').value.trim();
            const password = document.getElementById('loginAdminPassword').value;
            if (!validarEmail(email) || !password) {
                mostrarAlerta('alert-admin', 'Email o contraseña inválidos', 'danger');
                return;
            }
            try {
                const data = await loginAdmin(email, password);
                if (data.success) {
                    guardarUsuarioActual(data.user);
                    actualizarUIUsuario();
                    mostrarAlerta('alert-admin', '¡Bienvenido Administrador!', 'success');
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('loginAdminModal'));
                        if (modal) modal.hide();
                        formLoginAdmin.reset();
                    }, 1500);
                } else {
                    mostrarAlerta('alert-admin', data.message || 'Credenciales incorrectas', 'danger');
                }
            } catch (error) {
                mostrarAlerta('alert-admin', 'Error al conectar con el servidor 😿', 'danger');
            }
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async function() {
            if (confirm('¿Seguro que deseas cerrar sesión?')) {
                try {
                    await logout();
                } catch (error) {
                    console.error('Fokeis, no se pudo hacer logout', error);
                }
                guardarUsuarioActual(null);
                actualizarUIUsuario();
                vaciarCarrito();
            }
        });
    }

    // --- FUNCIONES DE CARRITO Y GESTIÓN (sin cambios en lógica, solo en fetch) ---
    // (Ya usan las funciones gestoras actualizadas arriba)

    function actualizarUIUsuario() {
        const navLoginItem = document.getElementById('nav-login-item');
        const navUserInfo = document.getElementById('nav-user-info');
        const navGestion = document.getElementById('nav-gestion');
        const seccionGestion = document.getElementById('gestion');
        const userName = document.getElementById('user-name');
        const userRole = document.getElementById('user-role');

        if (currentUser) {
            navLoginItem.style.display = 'none';
            navUserInfo.style.display = 'block';
            userName.textContent = currentUser.nombre;
            if (currentUser.rol === 'admin') {
                userRole.textContent = 'Admin';
                userRole.className = 'badge bg-warning ms-1';
                navGestion.style.display = 'block';
                if (seccionGestion) seccionGestion.style.display = 'block';
                cargarTablaProductos();
            } else {
                userRole.textContent = 'Cliente';
                userRole.className = 'badge bg-success ms-1';
                navGestion.style.display = 'none';
                if (seccionGestion) seccionGestion.style.display = 'none';
            }
        } else {
            navLoginItem.style.display = 'block';
            navUserInfo.style.display = 'none';
            navGestion.style.display = 'none';
            if (seccionGestion) seccionGestion.style.display = 'none';
        }
    }

    // --- Funciones de carrito (sin cambios) ---
    function obtenerCarrito() {
        const carritoGuardado = localStorage.getItem('carritoPanaderia');
        return carritoGuardado ? JSON.parse(carritoGuardado) : [];
    }

    function guardarCarrito() {
        localStorage.setItem('carritoPanaderia', JSON.stringify(carrito));
    }

    function agregarAlCarrito(nombre, precio, productId) {
        if (!currentUser) {
            alert('Debes iniciar sesión para agregar productos al carrito');
            return;
        }
        const itemExistente = carrito.find(item => item.nombre === nombre);
        if (itemExistente) {
            itemExistente.cantidad += 1;
        } else {
            carrito.push({ id: productId, nombre: nombre, precio: parseFloat(precio), cantidad: 1 });
        }
        guardarCarrito();
        actualizarVistaCarrito();
        mostrarNotificacion(`${nombre} añadido al carrito!`);
    }

    function actualizarVistaCarrito() {
        const cartCount = document.getElementById('cart-count');
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const cartTotalSpan = document.getElementById('cartTotal');
        let totalItems = 0;
        let totalPrecio = 0;
        if (cartItemsContainer) cartItemsContainer.innerHTML = '';
        if (carrito.length === 0) {
            if (cartItemsContainer) {
                cartItemsContainer.innerHTML = `<p class="text-center text-muted" data-i18n="cart-empty">${translations['cart-empty'][currentLang]}</p>`;
            }
        } else {
            carrito.forEach((item, index) => {
                totalItems += item.cantidad;
                totalPrecio += item.precio * item.cantidad;
                if (cartItemsContainer) {
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2', 'cart-item', 'p-2', 'border-bottom');
                    itemElement.innerHTML = `
                        <div>
                            <span class="fw-bold">${item.nombre}</span>
                            <small class="text-muted d-block">$${item.precio.toFixed(2)} x ${item.cantidad}</small>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="fw-bold me-3">$${(item.precio * item.cantidad).toFixed(2)}</span>
                            <button class="btn btn-sm btn-outline-danger remove-item-btn" data-index="${index}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    cartItemsContainer.appendChild(itemElement);
                }
            });
            if (cartItemsContainer) {
                cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        removerDelCarrito(parseInt(this.getAttribute('data-index')));
                    });
                });
            }
        }
        if (cartCount) cartCount.textContent = totalItems;
        if (cartTotalSpan) cartTotalSpan.textContent = totalPrecio.toFixed(2);
    }

    function removerDelCarrito(index) {
        if (index >= 0 && index < carrito.length) {
            const item = carrito[index];
            if (item.cantidad > 1) {
                item.cantidad -= 1;
            } else {
                carrito.splice(index, 1);
            }
            guardarCarrito();
            actualizarVistaCarrito();
        }
    }

    function vaciarCarrito() {
        carrito = [];
        guardarCarrito();
        actualizarVistaCarrito();
    }

    function procederAlPago() {
        if (!currentUser) {
            alert('Debes iniciar sesión para proceder al pago');
            return;
        }
        if (carrito.length === 0) {
            alert(translations['checkout-empty-error'][currentLang]);
            return;
        }
        const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
        if (confirm(`Total a pagar: $${total.toFixed(2)} MXN\n¿Confirmar compra?`)) {
            alert(translations['checkout-success'][currentLang]);
            vaciarCarrito();
            const cartModalEl = document.getElementById('cartModal');
            const cartModalInstance = bootstrap.Modal.getInstance(cartModalEl);
            if (cartModalInstance) {
                cartModalInstance.hide();
            }
        }
    }

    function mostrarNotificacion(mensaje) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
        notification.style.zIndex = '9999';
        notification.innerHTML = `<i class="fas fa-check-circle"></i> ${mensaje}`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    // --- FUNCIONES DE GESTIÓN (usando la función gestionProducto) ---
    function cargarTablaProductos() {
        const tbody = document.getElementById('tablaProductosBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        productos.forEach(producto => {
            const row = document.createElement('tr');
            const categoryName = producto.category === 'dia_muertos' ? 'Día de Muertos' : 'Halloween';
            row.innerHTML = `
                <td>${producto.id}</td>
                <td>${producto.name.es}</td>
                <td>${categoryName}</td>
                <td>${producto.price.toFixed(2)}</td>
                <td>${producto.stock}</td>
                <td>
                    <button class="btn btn-sm btn-info me-1 btn-ver" data-id="${producto.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-warning me-1 btn-editar" data-id="${producto.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger btn-eliminar" data-id="${producto.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
        tbody.querySelectorAll('.btn-ver').forEach(btn => {
            btn.addEventListener('click', () => verProducto(btn.dataset.id));
        });
        tbody.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => editarProducto(btn.dataset.id));
        });
        tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', () => eliminarProducto(btn.dataset.id));
        });
    }

    window.verProducto = function(id) {
        const producto = productos.find(p => p.id === parseInt(id));
        if (producto) {
            alert(`ID: ${producto.id}\nNombre: ${producto.name.es}\nCategoría: ${producto.category}\nPrecio: ${producto.price}\nStock: ${producto.stock}`);
        }
    };

    window.editarProducto = function(id) {
        window.abrirModalProducto(id);
    };

    window.eliminarProducto = async function(id) {
        if (confirm('¿Estás seguro de eliminar este producto? 😿')) {
            try {
                const data = await gestionProducto(null, id, true);
                if (data.success) {
                    alert('Producto eliminado');
                    productos = await cargarProductosDelServidor();
                    cargarTablaProductos();
                    updateTranslations();
                } else {
                    alert(data.message || 'No se pudo eliminar 😾');
                }
            } catch (error) {
                alert('Chincheros, no tienes permiso. Cierra sesión y entra como admin 😾');
            }
        }
    };

    window.abrirModalProducto = function(id = null) {
        const productoModalEl = document.getElementById('productoModal');
        if (!productoModalEl) return;
        const modal = bootstrap.Modal.getOrCreateInstance(productoModalEl);
        const modalTitle = document.getElementById('productoModalLabel');
        const form = document.getElementById('productoForm');
        const alertProducto = document.getElementById('alert-producto');
        if (alertProducto) alertProducto.classList.add('d-none');
        if (id) {
            modalTitle.textContent = 'Editar Producto';
            const producto = productos.find(p => p.id === parseInt(id));
            if (producto) {
                document.getElementById('productoId').value = producto.id;
                document.getElementById('productoNombre').value = producto.name.es;
                document.getElementById('productoCategoria').value = producto.category;
                document.getElementById('productoDescripcion').value = producto.desc.es;
                document.getElementById('productoPrecio').value = producto.price;
                document.getElementById('productoStock').value = producto.stock;
                document.getElementById('productoImagen').value = producto.img;
                document.getElementById('productoActivo').checked = producto.activo;
            }
        } else {
            modalTitle.textContent = 'Añadir Nuevo Producto';
            form.reset();
            document.getElementById('productoId').value = '';
        }
        modal.show();
    };

    const productoForm = document.getElementById('productoForm');
    if (productoForm) {
        productoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const nombre_es = document.getElementById('productoNombre').value.trim();
            const categoria = document.getElementById('productoCategoria').value;
            const precio = parseFloat(document.getElementById('productoPrecio').value);
            const stock = parseInt(document.getElementById('productoStock').value);
            const productoId = document.getElementById('productoId').value;
            if (!nombre_es || !categoria || isNaN(precio) || precio <= 0 || isNaN(stock) || stock < 0) {
                mostrarAlerta('alert-producto', 'Faltan datos o son incorrectos (Nombre, Categoría, Precio, Stock)', 'danger');
                return;
            }
            const datosProducto = {
                nombre_es: nombre_es,
                nombre_en: nombre_es,
                desc_es: document.getElementById('productoDescripcion').value.trim(),
                desc_en: document.getElementById('productoDescripcion').value.trim(),
                categoria: categoria,
                precio: precio,
                stock: stock,
                img: document.getElementById('productoImagen').value.trim() || 'img/default.jpg',
                activo: document.getElementById('productoActivo').checked,
            };
            try {
                const data = await gestionProducto(datosProducto, productoId || null);
                if (data.success) {
                    mostrarAlerta('alert-producto', data.message, 'success');
                    productos = await cargarProductosDelServidor();
                    cargarTablaProductos();
                    updateTranslations();
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('productoModal'));
                        if (modal) modal.hide();
                    }, 1500);
                } else {
                    mostrarAlerta('alert-producto', data.message || 'Error al guardar 😿', 'danger');
                }
            } catch (error) {
                mostrarAlerta('alert-producto', 'Chincheros, no tienes permiso. Cierra sesión y entra como admin 😾', 'danger');
            }
        });
    }

    // --- TRADUCCIONES Y EVENTOS (sin cambios) ---
    function updateTranslations() {
        // ... (tu lógica de traducción sigue igual)
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[key] && translations[key][currentLang]) {
                element.textContent = translations[key][currentLang];
            }
        });
        document.querySelectorAll('[data-product-id][data-i18n-key]').forEach(element => {
            try {
                const id = parseInt(element.getAttribute('data-product-id'), 10);
                const key = element.getAttribute('data-i18n-key');
                const producto = productos.find(p => p.id === id);
                if (producto && producto[key] && producto[key][currentLang]) {
                    element.textContent = producto[key][currentLang];
                }
            } catch (e) {
                console.error('Error al traducir producto', e);
            }
        });
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            try {
                const id = parseInt(btn.getAttribute('data-product-id'), 10);
                const producto = productos.find(p => p.id === id);
                if (producto) {
                    btn.setAttribute('data-nombre', producto.name[currentLang]);
                }
                if (translations['card-btn-add'] && translations['card-btn-add'][currentLang]) {
                    btn.textContent = translations['card-btn-add'][currentLang];
                }
            } catch(e) { console.error('fokeis', e) }
        });
        document.querySelectorAll('.btn-details').forEach(btn => {
            if (translations['card-btn-details'] && translations['card-btn-details'][currentLang]) {
                btn.textContent = translations['card-btn-details'][currentLang];
            }
        });
        const btnContinue = document.querySelector('[data-i18n="btn-continue-shopping"]');
        if(btnContinue) btnContinue.textContent = translations['btn-continue-shopping'][currentLang];
        const btnEmpty = document.querySelector('[data-i18n="btn-empty-cart"]');
        if(btnEmpty) btnEmpty.textContent = translations['btn-empty-cart'][currentLang];
        const btnCheckout = document.querySelector('[data-i18n="btn-checkout"]');
        if(btnCheckout) btnCheckout.textContent = translations['btn-checkout'][currentLang];
    }

    function verDetallesProducto(productId) {
        const producto = productos.find(p => p.id === parseInt(productId));
        if (producto) {
            document.getElementById('detailsModalTitle').textContent = producto.name[currentLang];
            document.getElementById('detailsModalDescription').textContent = producto.desc[currentLang];
            document.getElementById('detailsModalPrice').textContent = `${producto.price.toFixed(2)} MXN`;
            document.getElementById('detailsModalStock').textContent = producto.stock;
            document.getElementById('detailsModalImage').src = producto.img;
            document.getElementById('detailsModalImage').onerror = function() { this.src = 'img/default.jpg'; };
            const modalAddBtn = document.getElementById('detailsModalAddToCartBtn');
            modalAddBtn.setAttribute('data-nombre', producto.name[currentLang]);
            modalAddBtn.setAttribute('data-precio', producto.price.toFixed(2));
            modalAddBtn.setAttribute('data-product-id', producto.id);
            modalAddBtn.textContent = translations['card-btn-add'][currentLang];
            const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
            detailsModal.show();
        }
    }

    // Event listeners generales
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', procederAlPago);

    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('¿Vaciar el carrito?')) {
                vaciarCarrito();
            }
        });
    }

    document.body.addEventListener('click', function(event) {
        const detailsButton = event.target.closest('.btn-details');
        if (detailsButton) {
            const productId = detailsButton.getAttribute('data-product-id');
            if (productId) verDetallesProducto(productId);
        }
        const addButton = event.target.closest('.add-to-cart-btn');
        if (addButton) {
            const nombre = addButton.getAttribute('data-nombre');
            const precio = addButton.getAttribute('data-precio');
            const productId = addButton.getAttribute('data-product-id');
            if (nombre && precio) {
                agregarAlCarrito(nombre, precio, productId);
                const detailsModalEl = document.getElementById('detailsModal');
                const detailsModalInstance = bootstrap.Modal.getInstance(detailsModalEl);
                if (detailsModalInstance && detailsModalInstance._isShown) {
                    detailsModalInstance.hide();
                }
            }
        }
    });

    document.querySelectorAll('.dropdown-menu a.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.getAttribute('data-lang');
            if (lang) {
                currentLang = lang;
                localStorage.setItem('panaderiaLang', lang);
                updateTranslations();
                actualizarVistaCarrito();
            }
        });
    });

    const btnDiaMuertos = document.getElementById('btnDiaMuertos');
    const btnHalloween = document.getElementById('btnHalloween');
    const seccionDiaMuertos = document.getElementById('productosDiaMuertos');
    const seccionHalloween = document.getElementById('productosHalloween');

    function mostrarSeccion(seccionMostrar, seccionOcultar, btnActivo, btnInactivo) {
        if (seccionMostrar && seccionOcultar && btnActivo && btnInactivo) {
            seccionMostrar.classList.remove('d-none');
            seccionOcultar.classList.add('d-none');
            btnActivo.classList.add('active');
            btnInactivo.classList.remove('active');
        }
    }

    if (btnDiaMuertos && btnHalloween && seccionDiaMuertos && seccionHalloween) {
        btnDiaMuertos.addEventListener('click', () => mostrarSeccion(seccionDiaMuertos, seccionHalloween, btnDiaMuertos, btnHalloween));
        btnHalloween.addEventListener('click', () => mostrarSeccion(seccionHalloween, seccionDiaMuertos, btnHalloween, btnDiaMuertos));
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '#navbarNav') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // --- INICIALIZACIÓN FINAL ---
    async function inicializar() {
        console.log('🍞 Iniciando sistema...');
        productos = await cargarProductosDelServidor();
        console.log(`📦 ${productos.length} productos cargados desde la API`);
        actualizarUIUsuario();
        actualizarVistaCarrito();
        updateTranslations();
        console.log('🍞 Sistema de Panadería La Desesperanza iniciado correctamente');
        console.log('👤 Usuario actual:', currentUser ? currentUser.nombre : 'No logueado');
        console.log('🛒 Productos en carrito:', carrito.length);
    }

    inicializar();
});

