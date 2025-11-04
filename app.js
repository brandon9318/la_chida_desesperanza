// aaa app.js completo pa' Render con PostgreSQL -bynd
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const PostgreSQLStore = require('connect-pg-simple')(session);

const app = express();

// 👂 CORS CORRECTO pa' q no te bloquee el navegador
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 📦 JSON body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📁 archivos estáticos
app.use(express.static('public'));

// 🏠 servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 💾 POOL DE CONEXIÓN POSTGRESQL pa' Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://root:1234@localhost:5432/panaderia_desesperanza',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ✅ probar conexión
pool.connect()
    .then(() => console.log('😸 Conectado a PostgreSQL exitosamente'))
    .catch(err => console.error('Fokeis al conectar:', err));

// 🔐 SESIONES con PostgreSQL (importante pa' Render)
const sessionStore = new PostgreSQLStore({
    pool: pool,
    tableName: 'sessions'
});

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'panaderia-desesperanza-secreto',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 día
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// 🚪 MIDDLEWARE DE AUTENTICACIÓN
function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Chintrolas, necesitas iniciar sesión primero' });
    }
}

function requireAdmin(req, res, next) {
    if (req.session.user && req.session.user.rol_id === 1) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Ey, solo los administradores pueden hacer esto 😾' });
    }
}

// ✅ API: productos activos (adaptado a tu estructura de BD)
app.get('/api/productos', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                p.producto_id AS id,
                p.nombre_es,
                p.nombre_en,
                p.descripcion_es AS desc_es,
                p.descripcion_en AS desc_en,
                p.precio,
                p.imagen_url AS img,
                p.stock,
                p.activo,
                c.nombre AS categoria
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.categoria_id
            WHERE p.activo = true
            ORDER BY p.producto_id DESC
        `);
        
        const productos = rows.map(p => ({
            id: p.id,
            name: { es: p.nombre_es, en: p.nombre_en },
            desc: { es: p.desc_es, en: p.desc_en },
            category: p.categoria.toLowerCase().replace(' ', '_'),
            price: parseFloat(p.precio),
            stock: parseInt(p.stock),
            img: p.img || 'img/default.jpg',
            activo: p.activo
        }));
        
        res.json({ success: true, productos });
    } catch (error) {
        console.error('Chintrolas al traer productos:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// 🔐 Login cliente (con tu estructura de usuarios y roles)
app.post('/api/login-cliente', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // ey primero checamos en la BD real -bynd
        const { rows } = await pool.query(`
            SELECT u.usuario_id, u.nombre, u.email, u.rol_id, r.nombre_rol AS rol
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.rol_id
            WHERE u.email = $1 AND u.contrasena_hash = crypt($2, u.contrasena_hash)
            AND r.nombre_rol = 'Cliente'
        `, [email, password]);
        
        if (rows.length > 0) {
            req.session.user = rows[0];
            res.json({
                success: true,
                user: {
                    id: rows[0].usuario_id,
                    nombre: rows[0].nombre,
                    email: rows[0].email,
                    rol: rows[0].rol.toLowerCase()
                }
            });
        } else {
            // aaa si no existe en BD, probamos con el demo temporal -bynd
            if (email === 'cliente@demo.com' && password === 'demo123') {
                const demoUser = {
                    usuario_id: 2,
                    nombre: 'Cliente Demo',
                    email: 'cliente@demo.com',
                    rol_id: 3,
                    rol: 'cliente'
                };
                req.session.user = demoUser;
                res.json({
                    success: true,
                    user: {
                        id: demoUser.usuario_id,
                        nombre: demoUser.nombre,
                        email: demoUser.email,
                        rol: demoUser.rol
                    }
                });
            } else {
                res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }
        }
    } catch (error) {
        console.error('Fokeis en login cliente:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// 🔐 Login admin
app.post('/api/login-admin', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const { rows } = await pool.query(`
            SELECT u.usuario_id, u.nombre, u.email, u.rol_id, r.nombre_rol AS rol
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.rol_id
            WHERE u.email = $1 AND u.contrasena_hash = crypt($2, u.contrasena_hash)
            AND r.nombre_rol = 'Administrador'
        `, [email, password]);
        
        if (rows.length > 0) {
            req.session.user = rows[0];
            res.json({
                success: true,
                user: {
                    id: rows[0].usuario_id,
                    nombre: rows[0].nombre,
                    email: rows[0].email,
                    rol: rows[0].rol.toLowerCase()
                }
            });
        } else {
            // aaa demo admin temporal -bynd
            if (email === 'admin@panaderia.com' && password === 'admin123') {
                const demoAdmin = {
                    usuario_id: 1,
                    nombre: 'Admin',
                    email: 'admin@panaderia.com',
                    rol_id: 1,
                    rol: 'administrador'
                };
                req.session.user = demoAdmin;
                res.json({
                    success: true,
                    user: {
                        id: demoAdmin.usuario_id,
                        nombre: demoAdmin.nombre,
                        email: demoAdmin.email,
                        rol: demoAdmin.rol
                    }
                });
            } else {
                res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }
        }
    } catch (error) {
        console.error('Fokeis en login admin:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// 🚪 Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Chintrolas al cerrar sesión:', err);
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Sesión cerrada' });
    });
});

// ➕ Crear producto (SOLO ADMIN)
app.post('/api/productos', requireAdmin, async (req, res) => {
    const { nombre_es, nombre_en, desc_es, desc_en, categoria, precio, stock, img, activo } = req.body;
    
    // ey mapear nombre de categoría a ID (Día de Muertos -> 1, Halloween -> 2, etc.)
    let categoriaId;
    switch(categoria.toLowerCase()) {
        case 'dia_muertos': 
        case 'día_de_muertos': 
            categoriaId = 1; break;
        case 'halloween': 
            categoriaId = 2; break;
        case 'tradicional': 
            categoriaId = 3; break;
        default: 
            categoriaId = 3;
    }
    
    try {
        const result = await pool.query(`
            INSERT INTO productos (
                nombre_es, nombre_en, descripcion_es, descripcion_en, 
                precio, imagen_url, stock, activo, categoria_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING producto_id
        `, [
            nombre_es || 'Nuevo producto',
            nombre_en || 'New product',
            desc_es || 'Descripción',
            desc_en || 'Description',
            parseFloat(precio) || 0.0,
            img || 'img/default.jpg',
            parseInt(stock) || 0,
            activo !== undefined ? activo : true,
            categoriaId
        ]);
        
        res.json({ success: true, message: 'Producto creado exitosamente', id: result.rows[0].producto_id });
    } catch (error) {
        console.error('Fokeis al crear producto:', error);
        res.status(500).json({ success: false, message: 'Error al crear producto' });
    }
});

// ✏️ Actualizar producto (SOLO ADMIN)
app.put('/api/productos/:id', requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre_es, nombre_en, desc_es, desc_en, categoria, precio, stock, img, activo } = req.body;
    
    let categoriaId;
    switch(categoria.toLowerCase()) {
        case 'dia_muertos': 
        case 'día_de_muertos': 
            categoriaId = 1; break;
        case 'halloween': 
            categoriaId = 2; break;
        case 'tradicional': 
            categoriaId = 3; break;
        default: 
            categoriaId = 3;
    }
    
    try {
        await pool.query(`
            UPDATE productos
            SET nombre_es = $1, nombre_en = $2, descripcion_es = $3, descripcion_en = $4,
                precio = $5, imagen_url = $6, stock = $7, activo = $8, categoria_id = $9
            WHERE producto_id = $10
        `, [
            nombre_es,
            nombre_en,
            desc_es,
            desc_en,
            parseFloat(precio),
            img,
            parseInt(stock),
            activo,
            categoriaId,
            id
        ]);
        
        res.json({ success: true, message: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Chintrolas al actualizar producto:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar producto' });
    }
});

// ❌ Eliminar producto (SOLO ADMIN) - soft delete
app.delete('/api/productos/:id', requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
        await pool.query('UPDATE productos SET activo = false WHERE producto_id = $1', [id]);
        res.json({ success: true, message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Ey al eliminar producto:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    }
});

// 🚀 ENCIENDE EL SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🍞 Panadería La Desesperanza prendida en http://localhost:${PORT}`);
    console.log(`PostgreSQL: ${process.env.DATABASE_URL ? '✅ Render (production)' : '✅ Local'}`);
    console.log(`Frontend esperado en: ${process.env.FRONTEND_URL || 'http://127.0.0.1:5500'}`);
});
