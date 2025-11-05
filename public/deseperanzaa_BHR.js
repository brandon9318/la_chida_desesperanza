    // aaa este es el archivo principal de la panadería (versión FINAL pa' Render) -bynd
document.addEventListener('DOMContentLoaded', function () {
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
        'checkout-success': { es: '¡Pago exitoso! Gracias por tu compra.', en: 'Payment successful! Thank you for your purchase.' },
        'checkout-empty-error': { es: 'El carrito está vacío. Añade productos antes de pagar.', en: 'Cart is empty. Please add products before checking out.' }
    };

    // ✅ RUTAS RELATIVAS (LO MÁS SEGURO Y LIMPIO)
    const API_BASE = '/api';

    async function cargarProductosDelServidor() {
        try {
            const response = await fetch(`${API_BASE}/productos`, { credentials: 'include' });
            if (!response.ok) throw new Error('Chintrolas, no pude cargar los productos 😿');
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

    // ✅ FUNCIONES DE LOGIN Y GESTIÓN (usando API_BASE)
    async function loginCliente(email, password) {
        const response = await fetch(`${API_BASE}/login-cliente`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        return await response.json();
    }

    async function loginAdmin(email, password) {
        const response = await fetch(`${API_BASE}/login-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        return await response.json();
    }

    async function logout() {
        await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
    }

    async function gestionProducto(datos, id = null, esEliminar = false) {
        let url = `${API_BASE}/productos`;
        if (id) url += `/${id}`;
        let method = esEliminar ? 'DELETE' : (id ? 'PUT' : 'POST');

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: esEliminar ? null : JSON.stringify(datos),
            credentials: 'include'
        });
        return await response.json();
    }

    // ... (el resto de tus funciones se mantienen IGUALES)

    let carrito = obtenerCarrito();
    let currentLang = localStorage.getItem('panaderiaLang') || 'es';
    let currentUser = obtenerUsuarioActual();
    let productos = [];

    // === FUNCIONES AUXILIARES (sin cambios) ===
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
        setTimeout(() => container.classList.add('d-none'), 4000);
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

    // === EVENTOS DE LOGIN ===
    const formLoginCliente = document.getElementById('formLoginCliente');
    if (formLoginCliente) {
        formLoginCliente.addEventListener('submit', async function (e) {
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
        formLoginAdmin.addEventListener('submit', async function (e) {
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
        btnLogout.addEventListener('click', async function () {
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

    // === FUNCIONES DE CARRITO Y GESTIÓN ===
    // (iguales a tu código original — no necesitan cambios)

    // === INICIALIZACIÓN ===
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


