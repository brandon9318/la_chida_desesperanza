// aaa app.js de la panadería desesperanza — todo en uno y listo pa' correr -bynd
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();

// 👂 cors pa' q el front no se enoje
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}));

// 📦 parsear JSON
app.use(express.json());

// 📁 servir archivos estáticos (HTML, CSS, JS)
app.use(express.static('public'));

// 🏠 servir index.html en la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index_deseperanzaa_BHR.html'));
});

// 💾 conexión directa a MySQL (sin archivo config)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'panaderia_desesperanza',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ✅ API: productos
app.get('/api/productos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos WHERE activo = 1');
        res.json({ success: true, productos: rows });
    } catch (error) {
        console.error('Fokeis al traer productos:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// 🔐 login cliente (simulado)
app.post('/api/login-cliente', (req, res) => {
    const { email, password } = req.body;
    if (email === 'cliente@demo.com' && password === 'demo123') {
        res.json({ success: true, user: { id: 2, nombre: 'Cliente Demo', email, rol: 'cliente' } });
    } else {
        res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
});

// 🔐 login admin (simulado)
app.post('/api/login-admin', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@panaderia.com' && password === 'admin123') {
        res.json({ success: true, user: { id: 1, nombre: 'Admin', email, rol: 'admin' } });
    } else {
        res.status(401).json({ success: false, message: 'Acceso denegado' });
    }
});

// 🚪 logout
app.post('/api/logout', (req, res) => {
    res.json({ success: true, message: 'Sesión cerrada' });
});

// ❌ DELETE producto (simulado)
app.delete('/api/productos/:id', (req, res) => {
    const id = req.params.id;
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    res.json({ success: true, message: `Producto ${id} eliminado (simulado)` });
});

// ✏️ PUT producto (simulado)
app.put('/api/productos/:id', (req, res) => {
    res.json({ success: true, message: `Producto ${req.params.id} actualizado (simulado)` });
});

// ➕ POST producto (simulado)
app.post('/api/productos', (req, res) => {
    res.json({ success: true, message: 'Producto creado (simulado)' });
});

// 🚀 correr en puerto 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`😸 Panadería La Desesperanza prendida en http://localhost:${PORT}`);
});