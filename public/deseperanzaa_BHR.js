document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'https://la-chida-desesperanza.onrender.com';
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

    async function cargarProductosDelServidor() {
        try {
            const response = await fetch(`${API_URL}/api/productos`, { 
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(no pude cargar los productos');
            }
            
            const data = await response.json();
            
            if (data.success && data.productos) {
                
                return data.productos.map(p => ({
                    id: p.producto_id,
                    category: p.categoria,
                    price: parseFloat(p.precio),
                    stock: parseInt(p.stock),
                    img: p.img,
                    name: { es: p.nombre_es, en: p.nombre_en },
                    desc: { es: p.desc_es, en: p.desc_en },
                    activo: p.activo
                }));
            } else {
                console.error('Fokeis, la API no regresó productos:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Errorzote en fetch:', error);
            mostrarNotificacion('Error al cargar productos. Verifica tu conexión');
            return [];
        }
    }
    let carrito = obtenerCarrito();
    let currentLang = localStorage.getItem('panaderiaLang') || 'es';
    let currentUser = obtenerUsuarioActual();
    let productos = [];
    
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

    const btnLoginCliente = document.getElementById('btn-login-cliente');
    const btnLoginAdmin = document.getElementById('btn-login-admin');
    const loginTypeModal = document.getElementById('loginTypeModal');
    const loginClienteModal = document.getElementById('loginClienteModal');
    const loginAdminModal = document.getElementById('loginAdminModal');

    if (btnLoginCliente) {
        btnLoginCliente.addEventListener('click', function() {
            console.log('Click en botón cliente');
            const typeModalInstance = bootstrap.Modal.getInstance(loginTypeModal);
            if (typeModalInstance) typeModalInstance.hide();
            
            setTimeout(() => {
                const clienteModalInstance = new bootstrap.Modal(loginClienteModal);
                clienteModalInstance.show();
            }, 300);
        });
    }
    if (btnLoginAdmin) {
        btnLoginAdmin.addEventListener('click', function() {
            console.log('Click en botón admin');
            const typeModalInstance = bootstrap.Modal.getInstance(loginTypeModal);
            if (typeModalInstance) typeModalInstance.hide();
            
            setTimeout(() => {
                const adminModalInstance = new bootstrap.Modal(loginAdminModal);
                adminModalInstance.show();
            }, 300);
        });
    }

    const toggleClienteForm = document.getElementById('toggleClienteForm');
    const formLoginCliente = document.getElementById('formLoginCliente');
    const formRegistroCliente = document.getElementById('formRegistroCliente');
    const loginClienteTitle = document.getElementById('loginClienteTitle');
    let mostrandoLogin = true;

    if (toggleClienteForm) {
        toggleClienteForm.addEventListener('click', function() {
            mostrandoLogin = !mostrandoLogin;
            if (mostrandoLogin) {
                formLoginCliente.style.display = 'block';
                formRegistroCliente.style.display = 'none';
                loginClienteTitle.textContent = 'Iniciar Sesión - Cliente';
                toggleClienteForm.textContent = '¿No tienes cuenta? Regístrate';
            } else {
                formLoginCliente.style.display = 'none';
                formRegistroCliente.style.display = 'block';
                loginClienteTitle.textContent = 'Registro - Cliente';
                toggleClienteForm.textContent = '¿Ya tienes cuenta? Inicia sesión';
            }
            const alertCliente = document.getElementById('alert-cliente');
            if (alertCliente) alertCliente.classList.add('d-none');
        });
    }

    if (formLoginCliente) {
        formLoginCliente.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginClienteEmail').value.trim();
            const password = document.getElementById('loginClientePassword').value;
            
            if (!validarEmail(email)) {
                mostrarAlerta('alert-cliente', 'Ingresa un email válido', 'danger');
                return;
            }
            if (!password) {
                mostrarAlerta('alert-cliente', 'La contraseña es requerida', 'danger');
                return;
            }
            
            try {
                const response = await fetch(`${API_URL}/api/login-cliente`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include' 
                });
                
                const data = await response.json();
                
                if (data.success) {
                    guardarUsuarioActual(data.user);
                    actualizarUIUsuario();
                    mostrarAlerta('alert-cliente', '¡Bienvenido! Iniciando sesión...', 'success');
                    setTimeout(() => {
                        const modalInstance = bootstrap.Modal.getInstance(loginClienteModal);
                        if (modalInstance) modalInstance.hide();
                        formLoginCliente.reset();
                    }, 1500);
                } else {
                    mostrarAlerta('alert-cliente', data.message || 'Email o contraseña incorrectos', 'danger');
                }
            } catch (error) {
                console.error('Error de login:', error);
                mostrarAlerta('alert-cliente', 'Error al conectar con el servidor', 'danger');
            }
        });
    }
    if (formRegistroCliente) {
        formRegistroCliente.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombre = document.getElementById('registroClienteNombre').value.trim();
            const email = document.getElementById('registroClienteEmail').value.trim();
            const password = document.getElementById('registroClientePassword').value;
            const passwordConfirm = document.getElementById('registroClientePasswordConfirm').value;
            
            if (!nombre || nombre.length < 3) {
                mostrarAlerta('alert-cliente', 'El nombre debe tener al menos 3 caracteres', 'danger');
                return;
            }
            if (!validarEmail(email)) {
                mostrarAlerta('alert-cliente', 'Ingresa un email válido', 'danger');
                return;
            }
            if (password.length < 6) {
                mostrarAlerta('alert-cliente', 'La contraseña debe tener al menos 6 caracteres', 'danger');
                return;
            }
            if (password !== passwordConfirm) {
                mostrarAlerta('alert-cliente', 'Las contraseñas no coinciden', 'danger');
                return;
            }
            
            const usuarios = obtenerUsuarios();
            if (usuarios.find(u => u.email === email)) {
                mostrarAlerta('alert-cliente', 'Este email ya está registrado', 'danger');
                return;
            }
            
            const nuevoUsuario = { id: Date.now(), nombre, email, password, rol: 'cliente' };
            usuarios.push(nuevoUsuario);
            guardarUsuarios(usuarios);
            guardarUsuarioActual(nuevoUsuario);
            mostrarAlerta('alert-cliente', '¡Registro exitosoo! Bienvenido', 'success');
            actualizarUIUsuario();
            
            setTimeout(() => {
                const modalInstance = bootstrap.Modal.getInstance(loginClienteModal);
                if (modalInstance) modalInstance.hide();
                formRegistroCliente.reset();
                mostrandoLogin = true;
                formLoginCliente.style.display = 'block';
                formRegistroCliente.style.display = 'none';
                loginClienteTitle.textContent = 'Iniciar Sesión - Cliente';
                toggleClienteForm.textContent = '¿No tienes cuenta? Regístrate';
            }, 1500);
        });
    }
    if (formLoginAdmin) {
        formLoginAdmin.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginAdminEmail').value.trim();
            const password = document.getElementById('loginAdminPassword').value;
            
            if (!validarEmail(email)) {
                mostrarAlerta('alert-admin', 'Ingresa un email válido', 'danger');
                return;
            }
            if (!password) {
                mostrarAlerta('alert-admin', 'La contraseña es requerida', 'danger');
                return;
            }
            
            try {
                const response = await fetch(`${API_URL}/api/login-admin`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include' 
                });

                const data = await response.json();
                
                if (data.success) {
                    guardarUsuarioActual(data.user);
                    actualizarUIUsuario();
                    mostrarAlerta('alert-admin', '¡Bienvenido Administrador!', 'success');
                    setTimeout(() => {
                        const modalInstance = bootstrap.Modal.getInstance(loginAdminModal);
                        if (modalInstance) modalInstance.hide();
                        formLoginAdmin.reset();
                    }, 1500);
                } else {
                    mostrarAlerta('alert-admin', data.message || 'Credenciales incorrectas', 'danger');
                }
            } catch (error) {
                console.error('Error de login admin:', error);
                mostrarAlerta('alert-admin', 'Error al conectar con el servidor', 'danger');
            }
        });
    }
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async function() {
            if (confirm('¿Seguro que deseas cerrar sesión?')) {
                try {
                    await fetch(`${API_URL}/api/logout`, { 
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    console.error('Fokeis, no se pudo hacer logout', error);
                }
                
                guardarUsuarioActual(null);
                actualizarUIUsuario();
                vaciarCarrito();
                mostrarNotificacion('Sesión cerrada');
            }
        });
    }
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
                <td>$${producto.price.toFixed(2)}</td>
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
    window.eliminarProducto = async function(id) {
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            try {
                const response = await fetch(`${API_URL}/api/productos/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.status === 403 || response.status === 401) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Chincheros, no tienes permiso');
                }

                const data = await response.json();
                
                if (data.success) {
                    alert('Producto eliminado');
                    productos = await cargarProductosDelServidor();
                    cargarTablaProductos();
                    updateTranslations();
                } else {
                    alert(data.message || 'No se pudo eliminar');
                }
            } catch (error) {
                alert(error.message);
            }
        }
    };
    function verDetallesProducto(productId) {
        const producto = productos.find(p => p.id === parseInt(productId));
        
        if (producto) {
            document.getElementById('detailsModalTitle').textContent = producto.name[currentLang];
            document.getElementById('detailsModalDescription').textContent = producto.desc[currentLang];
            document.getElementById('detailsModalPrice').textContent = `$${producto.price.toFixed(2)} MXN`;
            document.getElementById('detailsModalStock').textContent = producto.stock;
            document.getElementById('detailsModalImage').src = producto.img;
            document.getElementById('detailsModalImage').onerror = function() { 
                this.src = 'img/default.jpg'; 
            };
            
            const modalAddBtn = document.getElementById('detailsModalAddToCartBtn');
            modalAddBtn.setAttribute('data-nombre', producto.name[currentLang]);
            modalAddBtn.setAttribute('data-precio', producto.price.toFixed(2));
            modalAddBtn.setAttribute('data-product-id', producto.id);
            modalAddBtn.textContent = translations['card-btn-add'][currentLang];
            
            const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
            detailsModal.show();
        }
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', procederAlPago);
    }
    
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
            if (productId) {
                verDetallesProducto(productId);
            }
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
        btnDiaMuertos.addEventListener('click', function() {
            mostrarSeccion(seccionDiaMuertos, seccionHalloween, btnDiaMuertos, btnHalloween);
        });

        btnHalloween.addEventListener('click', function() {
            mostrarSeccion(seccionHalloween, seccionDiaMuertos, btnHalloween, btnDiaMuertos);
        });
    }
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '#navbarNav') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    function updateTranslations() {
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
            } catch(e) { 
                console.error('fokeis', e) 
            }
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
    async function inicializar() {
        console.log('Iniciando sistema de Panadería La Desesperanza...');
        console.log('Conectando con:', API_URL);
        productos = await cargarProductosDelServidor();
        console.log(` ${productos.length} productos cargados desde PostgreSQL`);
        actualizarUIUsuario();
        actualizarVistaCarrito();
        updateTranslations();
        
        console.log('Sistema iniciado correctamente');
        console.log('Usuario actual:', currentUser ? currentUser.nombre : 'No logueado');
        console.log('Productos en carrito:', carrito.length);

        if (productos.length > 0) {
            mostrarNotificacion('Productos cargados correctamente');
        } else {
            mostrarNotificacion('No se pudieron cargar los productos');
        }
    }
    inicializar();

});

