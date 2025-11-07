const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const allowedOrigins = [
    'http://127.0.0.1:5500',
    'https://la-chida-desesperanza.onrender.com'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS no permitido'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index_deseperanzaa_BHR.html'));
});
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
pool.connect()
    .then(() => console.log('Conectado a PostgreSQL en Render'))
    .catch(err => console.error('Fokeis al conectar a PostgreSQL:', err));
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
            ORDER BY p.producto_id ASC
        `);

        const productos = rows.map(p => ({
            producto_id: p.id,
            nombre_es: p.nombre_es,
            nombre_en: p.nombre_en,
            desc_es: p.desc_es,
            desc_en: p.desc_en,
            precio: parseFloat(p.precio),
            img: p.img || 'img/default.jpg',
            stock: parseInt(p.stock),
            activo: p.activo,
            categoria: p.categoria.toLowerCase().replace(/ /g, '_').replace('í', 'i')
        }));

        res.json({ success: true, productos });
    } catch (error) {
        console.error('Chintrolas al traer productos:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});
app.post('/api/login-cliente', (req, res) => {
    const { email, password } = req.body;
    if (email === 'cliente@demo.com' && password === 'demo123') {
        res.json({
            success: true,
            user: { id: 2, nombre: 'Cliente Demo', email, rol: 'cliente' }
        });
    } else {
        res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
});
app.post('/api/login-admin', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@panaderia.com' && password === 'admin123') {
        res.json({
            success: true,
            user: { id: 1, nombre: 'Admin', email, rol: 'admin' }
        });
    } else {
        res.status(401).json({ success: false, message: 'Acceso denegado' });
    }
});
app.post('/api/logout', (req, res) => {
    res.json({ success: true, message: 'Sesión cerrada' });
});
app.post('/api/productos', (req, res) => {
    res.json({ success: true, message: 'Producto creado (simulado)', id: Date.now() });
});
app.put('/api/productos/:id', (req, res) => {
    res.json({ success: true, message: `Producto ${req.params.id} actualizado (simulado)` });
});
app.delete('/api/productos/:id', (req, res) => {
    const id = req.params.id;
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    res.json({ success: true, message: `Producto ${id} eliminado (simulado)` });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Panadería La Desesperanza prendida en el puerto ${PORT}`);
    console.log(`Servidor público: https://la-chida-desesperanza.onrender.com`);
});

