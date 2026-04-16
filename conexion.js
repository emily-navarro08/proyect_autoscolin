const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const app = express();
const bcrypt = require('bcrypt');
const fs = require('fs');

// ===== CONFIGURACIÓN GENERAL =====
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== CONFIGURACIÓN DE BASE DE DATOS =====
// Determinar la ruta correcta al certificado
const certPath = path.join(__dirname, 'certs', 'isrgrootx1.pem');

// Verificar si el certificado existe
let sslConfig = {};
try {
    if (fs.existsSync(certPath)) {
        console.log('✅ Certificado encontrado en:', certPath);
        sslConfig = {
            ca: fs.readFileSync(certPath),
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2'
        };
    } else {
        console.warn('⚠️ Certificado no encontrado en:', certPath);
        // Listar archivos en el directorio para debug
        try {
            const files = fs.readdirSync(path.join(__dirname, 'certs'));
            console.log('Archivos en carpeta certs:', files);
        } catch (e) {
            console.log('No se pudo leer carpeta certs');
        }
        sslConfig = { rejectUnauthorized: false };
    }
} catch (error) {
    console.error('❌ Error al cargar certificado:', error.message);
    sslConfig = { rejectUnauthorized: false };
}

const dbConfig = {
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    user: '2kMd2TkhjVzTXcf.root',
    password: 'PtWpFOTh6nBlTkf2',
    database: 'sistema_autoscolin',
    port: 4000,
    multipleStatements: true,
    ssl: sslConfig,
    // Configuración adicional para estabilidad
    connectTimeout: 30000,
    acquireTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Función para probar la conexión al iniciar
async function testDBConnection() {
    let connection;
    try {
        console.log('🔄 Probando conexión a TiDB...');
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute('SELECT 1+1 as test');
        console.log('✅ Conexión exitosa a TiDB');
        await connection.end();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a TiDB:');
        console.error('   Código:', error.code);
        console.error('   Mensaje:', error.message);
        if (connection) await connection.end();
        return false;
    }
}

// Probar conexión al iniciar
testDBConnection()

// ===== CRUD-CATALOGOS =====
// Obtener todos los roles
app.get('/api/roles', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT ID_ROL, NOMBRE, DESCRIPCION FROM ROLES;');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al cargar roles:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener un rol por ID
app.get('/api/roles/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM ROLES WHERE ID_ROL = ?',
            [req.params.id]
        );
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener rol:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear nuevo rol
app.post('/api/roles', async (req, res) => {
    try {
        const { NOMBRE, DESCRIPCION } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO ROLES (NOMBRE, DESCRIPCION) VALUES (?, ?)',
            [NOMBRE, DESCRIPCION]
        );
        await connection.end();
        res.json({ id: result.insertId, message: 'Rol creado exitosamente' });
    } catch (err) {
        console.error('Error al crear rol:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Modificar rol
app.put('/api/roles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { NOMBRE, DESCRIPCION } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE ROLES SET NOMBRE = ?, DESCRIPCION = ? WHERE ID_ROL = ?',
            [NOMBRE, DESCRIPCION, id]
        );
        await connection.end();
        res.json({ message: 'Rol actualizado exitosamente' });
    } catch (err) {
        console.error('Error al modificar rol:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener todos los bancos
app.get('/api/bancos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT ID_BANCO, NOMBRE, ESTADO FROM CAT_BANCOS;');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al cargar bancos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener un banco por ID
app.get('/api/bancos/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM CAT_BANCOS WHERE ID_BANCO = ?',
            [req.params.id]
        );
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Banco no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener banco:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear nuevo banco
app.post('/api/bancos', async (req, res) => {
    try {
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO CAT_BANCOS (NOMBRE, ESTADO) VALUES (?, ?)',
            [NOMBRE, ESTADO || 'ACTIVO']
        );
        await connection.end();
        res.json({ id: result.insertId, message: 'Banco creado exitosamente' });
    } catch (err) {
        console.error('Error al crear banco:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Modificar banco
app.put('/api/bancos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE CAT_BANCOS SET NOMBRE = ?, ESTADO = ? WHERE ID_BANCO = ?',
            [NOMBRE, ESTADO, id]
        );
        await connection.end();
        res.json({ message: 'Banco actualizado exitosamente' });
    } catch (err) {
        console.error('Error al modificar banco:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener todos los estados civiles
app.get('/api/estados-civil', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT ID_ESTADO_CIVIL, NOMBRE, ESTADO FROM CAT_ESTADOS_CIVIL;');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al cargar estados civiles:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener un estado civil por ID
app.get('/api/estados-civil/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM CAT_ESTADOS_CIVIL WHERE ID_ESTADO_CIVIL = ?',
            [req.params.id]
        );
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Estado civil no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener estado civil:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear nuevo estado civil
app.post('/api/estados-civil', async (req, res) => {
    try {
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO CAT_ESTADOS_CIVIL (NOMBRE, ESTADO) VALUES (?, ?)',
            [NOMBRE, ESTADO || 'ACTIVO']
        );
        await connection.end();
        res.json({ id: result.insertId, message: 'Estado civil creado exitosamente' });
    } catch (err) {
        console.error('Error al crear estado civil:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Modificar estado civil
app.put('/api/estados-civil/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE CAT_ESTADOS_CIVIL SET NOMBRE = ?, ESTADO = ? WHERE ID_ESTADO_CIVIL = ?',
            [NOMBRE, ESTADO, id]
        );
        await connection.end();
        res.json({ message: 'Estado civil actualizado exitosamente' });
    } catch (err) {
        console.error('Error al modificar estado civil:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener todas las marcas
app.get('/api/marcas', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT ID_MARCA, NOMBRE, ESTADO FROM CAT_MARCAS;');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al cargar marcas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener una marca por ID
app.get('/api/marcas/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM CAT_MARCAS WHERE ID_MARCA = ?',
            [req.params.id]
        );
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Marca no encontrada' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener marca:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear nueva marca
app.post('/api/marcas', async (req, res) => {
    try {
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO CAT_MARCAS (NOMBRE, ESTADO) VALUES (?, ?)',
            [NOMBRE, ESTADO || 'ACTIVO']
        );
        await connection.end();
        res.json({ id: result.insertId, message: 'Marca creada exitosamente' });
    } catch (err) {
        console.error('Error al crear marca:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Modificar marca
app.put('/api/marcas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE CAT_MARCAS SET NOMBRE = ?, ESTADO = ? WHERE ID_MARCA = ?',
            [NOMBRE, ESTADO, id]
        );
        await connection.end();
        res.json({ message: 'Marca actualizada exitosamente' });
    } catch (err) {
        console.error('Error al modificar marca:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener todos los colores
app.get('/api/colores', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT ID_COLOR, NOMBRE, ESTADO FROM CAT_COLORES;');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al cargar colores:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener un color por ID
app.get('/api/colores/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM CAT_COLORES WHERE ID_COLOR = ?',
            [req.params.id]
        );
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Color no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener color:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear nuevo color
app.post('/api/colores', async (req, res) => {
    try {
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO CAT_COLORES (NOMBRE, ESTADO) VALUES (?, ?)',
            [NOMBRE, ESTADO || 'ACTIVO']
        );
        await connection.end();
        res.json({ id: result.insertId, message: 'Color creado exitosamente' });
    } catch (err) {
        console.error('Error al crear color:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Modificar color
app.put('/api/colores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE CAT_COLORES SET NOMBRE = ?, ESTADO = ? WHERE ID_COLOR = ?',
            [NOMBRE, ESTADO, id]
        );
        await connection.end();
        res.json({ message: 'Color actualizado exitosamente' });
    } catch (err) {
        console.error('Error al modificar color:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener todos los combustibles
app.get('/api/combustibles', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT ID_COMBUSTIBLE, NOMBRE, ESTADO FROM CAT_COMBUSTIBLES;');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al cargar combustibles:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener un combustible por ID
app.get('/api/combustibles/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM CAT_COMBUSTIBLES WHERE ID_COMBUSTIBLE = ?',
            [req.params.id]
        );
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Combustible no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener combustible:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear nuevo combustible
app.post('/api/combustibles', async (req, res) => {
    try {
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO CAT_COMBUSTIBLES (NOMBRE, ESTADO) VALUES (?, ?)',
            [NOMBRE, ESTADO || 'ACTIVO']
        );
        await connection.end();
        res.json({ id: result.insertId, message: 'Combustible creado exitosamente' });
    } catch (err) {
        console.error('Error al crear combustible:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Modificar combustible
app.put('/api/combustibles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE CAT_COMBUSTIBLES SET NOMBRE = ?, ESTADO = ? WHERE ID_COMBUSTIBLE = ?',
            [NOMBRE, ESTADO, id]
        );
        await connection.end();
        res.json({ message: 'Combustible actualizado exitosamente' });
    } catch (err) {
        console.error('Error al modificar combustible:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener todas las transmisiones
app.get('/api/transmisiones', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT ID_TRANSMISION, NOMBRE, ESTADO FROM CAT_TRANSMISIONES;');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al cargar transmisiones:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener una transmisión por ID
app.get('/api/transmisiones/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM CAT_TRANSMISIONES WHERE ID_TRANSMISION = ?',
            [req.params.id]
        );
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Transmisión no encontrada' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener transmisión:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear nueva transmisión
app.post('/api/transmisiones', async (req, res) => {
    try {
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO CAT_TRANSMISIONES (NOMBRE, ESTADO) VALUES (?, ?)',
            [NOMBRE, ESTADO || 'ACTIVO']
        );
        await connection.end();
        res.json({ id: result.insertId, message: 'Transmisión creada exitosamente' });
    } catch (err) {
        console.error('Error al crear transmisión:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Modificar transmisión
app.put('/api/transmisiones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { NOMBRE, ESTADO } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE CAT_TRANSMISIONES SET NOMBRE = ?, ESTADO = ? WHERE ID_TRANSMISION = ?',
            [NOMBRE, ESTADO, id]
        );
        await connection.end();
        res.json({ message: 'Transmisión actualizada exitosamente' });
    } catch (err) {
        console.error('Error al modificar transmisión:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta de login actualizada
app.post('/api/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // 1. PRIMERO obtener el usuario por email (sin comparar contraseña)
        const [rows] = await connection.execute(
            `
            SELECT 
                p.ID_PERSONA,
                p.NOMBRE_COMPLETO,
                p.EMAIL,
                u.USERNAME,
                u.PASSWORD_HASH,  -- Necesitamos el hash para comparar
                r.NOMBRE AS rol,
                u.ESTADO as estado_usuario,
                u.INTENTOS_FALLIDOS,
                u.FECHA_BLOQUEO
            FROM PERSONAS p
            INNER JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            INNER JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
            WHERE p.EMAIL = ? 
            AND u.ESTADO = 'ACTIVO'
            AND pr.ESTADO = 'ACTIVO'
            LIMIT 1
            `,
            [correo]  // Solo buscamos por email, no por contraseña
        );

        if (rows.length === 0) {
            await connection.end();
            return res.status(401).json({ 
                error: 'Credenciales incorrectas o usuario inactivo' 
            });
        }

        const usuario = rows[0];
        
        // 2. VERIFICAR la contraseña con bcrypt.compare
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.PASSWORD_HASH);
        
        if (!contrasenaValida) {
            // Incrementar intentos fallidos
            await connection.execute(
                `UPDATE USUARIOS 
                 SET INTENTOS_FALLIDOS = INTENTOS_FALLIDOS + 1 
                 WHERE ID_PERSONA = ?`,
                [usuario.ID_PERSONA]
            );
            
            await connection.end();
            return res.status(401).json({ 
                error: 'Credenciales incorrectas' 
            });
        }

        // 3. Verificar si el usuario está bloqueado
        if (usuario.FECHA_BLOQUEO && new Date(usuario.FECHA_BLOQUEO) > new Date()) {
            await connection.end();
            return res.status(403).json({ 
                error: 'Usuario bloqueado temporalmente' 
            });
        }

        // 4. Actualizar último acceso y resetear intentos fallidos
        await connection.execute(
            `UPDATE USUARIOS 
             SET ULTIMO_ACCESO = NOW(), 
                 INTENTOS_FALLIDOS = 0,
                 FECHA_BLOQUEO = NULL 
             WHERE ID_PERSONA = ?`,
            [usuario.ID_PERSONA]
        );

        await connection.end();

        // 5. Enviar respuesta exitosa (sin incluir el hash)
        res.json({ 
            id_persona: usuario.ID_PERSONA,
            nombre: usuario.NOMBRE_COMPLETO, 
            rol: usuario.rol,
            email: usuario.EMAIL,
            username: usuario.USERNAME
        });
        
        console.log(`✅ Usuario logueado: ${usuario.NOMBRE_COMPLETO} - ${usuario.rol}`);
        
    } catch (err) {
        console.error('❌ Error de servidor:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Función opcional para actualizar último acceso
async function actualizarUltimoAcceso(idPersona) {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `UPDATE USUARIOS 
             SET ULTIMO_ACCESO = NOW(), INTENTOS_FALLIDOS = 0 
             WHERE ID_PERSONA = ?`,
            [idPersona]
        );
        await connection.end();
    } catch (err) {
        console.error('Error al actualizar último acceso:', err);
    }
}

// ===== APIs PARA PROVEEDORES (Personas con rol de proveedor) ===== //
// Obtener todos los proveedores
app.get('/api/proveedores', async (req, res) => {
    try {
        const { nombre, identificacion, estado } = req.query;
        let query = `
            SELECT p.*, ec.NOMBRE as estado_civil_nombre 
            FROM PERSONAS p
            LEFT JOIN CAT_ESTADOS_CIVIL ec ON p.ID_ESTADO_CIVIL = ec.ID_ESTADO_CIVIL
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            WHERE pr.ID_ROL = 4 AND pr.ESTADO = 'ACTIVO'
        `;
        
        const params = [];
        
        if (nombre) {
            query += ' AND p.NOMBRE_COMPLETO LIKE ?';
            params.push(`%${nombre}%`);
        }
        
        if (identificacion) {
            query += ' AND p.IDENTIFICACION LIKE ?';
            params.push(`%${identificacion}%`);
        }
        
        if (estado) {
            query += ' AND p.ESTADO = ?';
            params.push(estado);
        }
        
        query += ' ORDER BY p.NOMBRE_COMPLETO';
        
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(query, params);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener proveedores:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener un proveedor por ID
app.get('/api/proveedores/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT p.*, ec.NOMBRE as estado_civil_nombre 
             FROM PERSONAS p
             LEFT JOIN CAT_ESTADOS_CIVIL ec ON p.ID_ESTADO_CIVIL = ec.ID_ESTADO_CIVIL
             WHERE p.ID_PERSONA = ?`,
            [req.params.id]
        );
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener proveedor:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear un nuevo proveedor
app.post('/api/proveedores', async (req, res) => {
    try {
        const {
            TIPO_DOCUMENTO,
            IDENTIFICACION,
            NOMBRE_COMPLETO,
            NACIONALIDAD,
            ID_ESTADO_CIVIL,
            OCUPACION,
            DIRECCION,
            TELEFONO_PRINCIPAL,
            TELEFONO_SECUNDARIO,
            EMAIL,
            OBSERVACION,
            ESTADO
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Insertar persona
        const [personaResult] = await connection.execute(
            `INSERT INTO PERSONAS (
                TIPO_DOCUMENTO, IDENTIFICACION, NOMBRE_COMPLETO, NACIONALIDAD,
                ID_ESTADO_CIVIL, OCUPACION, DIRECCION, TELEFONO_PRINCIPAL,
                TELEFONO_SECUNDARIO, EMAIL, OBSERVACION, ESTADO
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                TIPO_DOCUMENTO, IDENTIFICACION, NOMBRE_COMPLETO, NACIONALIDAD,
                ID_ESTADO_CIVIL || null, OCUPACION || 'Proveedor', DIRECCION || null,
                TELEFONO_PRINCIPAL || null, TELEFONO_SECUNDARIO || null,
                EMAIL || null, OBSERVACION || null, ESTADO || 'ACTIVO'
            ]
        );
        
        const idPersona = personaResult.insertId;
        
        // Asignar rol de proveedor (asumimos que ID_ROL = 4 es "Proveedor")
        await connection.execute(
            'INSERT INTO PERSONAS_ROLES (ID_PERSONA, ID_ROL, ESTADO) VALUES (?, 4, "ACTIVO")',
            [idPersona]
        );
        
        await connection.end();
        
        res.json({ 
            id: idPersona, 
            message: 'Proveedor creado exitosamente' 
        });

        console.log('Datos recibidos:', req.body);
        console.log('JSON de datos:', JSON.stringify(req.body));
    } catch (err) {
        console.error('Error al crear proveedor:', err);
        
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'La identificación ya está registrada' });
        }
        
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Actualizar un proveedor
app.put('/api/proveedores/:id', async (req, res) => {
    try {
        const {
            TIPO_DOCUMENTO,
            IDENTIFICACION,
            NOMBRE_COMPLETO,
            NACIONALIDAD,
            ID_ESTADO_CIVIL,
            OCUPACION,
            DIRECCION,
            TELEFONO_PRINCIPAL,
            TELEFONO_SECUNDARIO,
            EMAIL,
            OBSERVACION,
            ESTADO
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            `UPDATE PERSONAS SET
                TIPO_DOCUMENTO = ?,
                IDENTIFICACION = ?,
                NOMBRE_COMPLETO = ?,
                NACIONALIDAD = ?,
                ID_ESTADO_CIVIL = ?,
                OCUPACION = ?,
                DIRECCION = ?,
                TELEFONO_PRINCIPAL = ?,
                TELEFONO_SECUNDARIO = ?,
                EMAIL = ?,
                OBSERVACION = ?,
                ESTADO = ?
            WHERE ID_PERSONA = ?`,
            [
                TIPO_DOCUMENTO, IDENTIFICACION, NOMBRE_COMPLETO, NACIONALIDAD,
                ID_ESTADO_CIVIL || null, OCUPACION || 'Proveedor', DIRECCION || null,
                TELEFONO_PRINCIPAL || null, TELEFONO_SECUNDARIO || null,
                EMAIL || null, OBSERVACION || null, ESTADO || 'ACTIVO',
                req.params.id
            ]
        );
        
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        
        res.json({ message: 'Proveedor actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar proveedor:', err);
        
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'La identificación ya está registrada' });
        }
        
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Eliminar/desactivar un proveedor
app.delete('/api/proveedores/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Desactivar persona
        await connection.execute(
            'UPDATE PERSONAS SET ESTADO = "INACTIVO" WHERE ID_PERSONA = ?',
            [req.params.id]
        );
        
        // Desactivar rol de proveedor
        await connection.execute(
            'UPDATE PERSONAS_ROLES SET ESTADO = "INACTIVO" WHERE ID_PERSONA = ? AND ID_ROL = 4',
            [req.params.id]
        );
        
        await connection.end();
        
        res.json({ message: 'Proveedor desactivado exitosamente' });
    } catch (err) {
        console.error('Error al desactivar proveedor:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// APIs PARA VEHÍCULOS
// GET /api/vehiculos/:id/detalle-colaborador
app.get('/api/vehiculos/:id/detalle-colaborador', async (req, res) => {
    console.log(`✅ EJECUTANDO /api/vehiculos/${req.params.id}/detalle-colaborador`);
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;
        
        // Obtener datos del vehículo
        const [vehiculos] = await connection.execute(`
            SELECT 
                v.*,
                m.NOMBRE as marca_nombre,
                c.NOMBRE as color_nombre,
                comb.NOMBRE as combustible_nombre,
                t.NOMBRE as transmision_nombre,
                p.NOMBRE_COMPLETO as proveedor_nombre,
                p.IDENTIFICACION as proveedor_identificacion,
                p.TELEFONO_PRINCIPAL as proveedor_telefono,
                p.EMAIL as proveedor_email
            FROM VEHICULOS v
            LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
            LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
            LEFT JOIN CAT_COMBUSTIBLES comb ON v.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
            LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
            LEFT JOIN PERSONAS p ON v.ID_PROVEEDOR = p.ID_PERSONA
            WHERE v.ID_VEHICULO = ?
        `, [id]);
        
        if (vehiculos.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        
        const vehiculo = vehiculos[0];
        
        // Obtener costos
        const [costos] = await connection.execute(`
            SELECT 
                *,
                MONTO_TRASPASO
            FROM COSTOS_VEHICULO 
            WHERE ID_VEHICULO = ?
        `, [id]);
        
        // Obtener extras
        const [extras] = await connection.execute(`
            SELECT * FROM EXTRAS_VEHICULO 
            WHERE ID_VEHICULO = ?
        `, [id]);
        
        await connection.end();
        
        res.json({
            vehiculo: vehiculo,
            costos: costos[0] || null,
            extras: extras || []
        });
        
    } catch (error) {
        console.error('Error en detalle-colaborador:', error);
        res.status(500).json({ error: 'Error al cargar detalles del vehículo' });
    }
});

// Obtener vehículos por proveedor
app.get('/api/vehiculos/proveedor/:idProveedor', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [rows] = await connection.execute(
            `SELECT 
                v.*,
                m.NOMBRE as marca_nombre,
                c.NOMBRE as color_nombre
            FROM VEHICULOS v
            LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
            LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
            WHERE v.ID_PROVEEDOR = ?
            ORDER BY v.ESTADO, v.FECHA_INGRESO DESC`,
            [req.params.idProveedor]
        );
        
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener vehículos por proveedor:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Buscar vehículos vendidos por cliente
app.get('/api/vehiculos/vendidos/cliente/:idCliente', async (req, res) => {
    try {
        const idCliente = req.params.idCliente;
        const connection = await mysql.createConnection(dbConfig);
        
        const [vehiculos] = await connection.execute(
            `SELECT v.*, 
                    m.NOMBRE as marca_nombre,
                    c.NOMBRE as color_nombre,
                    cb.NOMBRE as combustible_nombre,
                    t.NOMBRE as transmision_nombre,
                    ve.ID_VENTA,           -- ESTO ES CRITICO
                    ve.FECHA_VENTA,
                    ve.CODIGO_VENTA,
                    ve.TOTAL as TOTAL_VENTA,
                    ve.OBSERVACIONES_VENTA
             FROM VENTAS ve
             INNER JOIN VEHICULOS v ON ve.ID_VEHICULO = v.ID_VEHICULO
             LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
             LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
             LEFT JOIN CAT_COMBUSTIBLES cb ON v.ID_COMBUSTIBLE = cb.ID_COMBUSTIBLE
             LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
             WHERE (ve.ID_CLIENTE_FACTURACION = ? OR ve.ID_CLIENTE_INSCRIPCION = ?)
             AND v.ESTADO = 'VENDIDO'
             ORDER BY ve.FECHA_VENTA DESC`,
            [idCliente, idCliente]
        );
        
        await connection.end();
        res.json(vehiculos);
        
    } catch (err) {
        console.error('Error al obtener vehículos vendidos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener todos los vehículos con información relacionada
app.get('/api/historial-vehiculos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        let query = `
            SELECT 
                v.*,
                m.NOMBRE as marca_nombre,
                c.NOMBRE as color_nombre,
                comb.NOMBRE as combustible_nombre,
                t.NOMBRE as transmision_nombre,
                p.NOMBRE_COMPLETO as proveedor_nombre,
                cv.PRECIO_COSTO as PRECIO_COMPRA_CRC,
                cv.TOTAL_INVERSION as INVERSION_CRC,
                cv.SALDO as SALDO_CRC,
                cv.FECHA_CANCELACION,
                ROUND(cv.PRECIO_COSTO / COALESCE(cv.TIPO_CAMBIO_COMPRA, 515), 2) as PRECIO_COMPRA_USD,
                ROUND(cv.TOTAL_INVERSION / COALESCE(cv.TIPO_CAMBIO_COMPRA, 515), 2) as INVERSION_USD,
                ROUND(cv.SALDO / COALESCE(cv.TIPO_CAMBIO_COMPRA, 515), 2) as SALDO_USD
            FROM VEHICULOS v
            LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
            LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
            LEFT JOIN CAT_COMBUSTIBLES comb ON v.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
            LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
            LEFT JOIN PERSONAS p ON v.ID_PROVEEDOR = p.ID_PERSONA
            LEFT JOIN COSTOS_VEHICULO cv ON v.ID_VEHICULO = cv.ID_VEHICULO
            LEFT JOIN VENTAS venta_origen ON venta_origen.ID_VENTA = v.ID_VENTA_ORIGEN
            WHERE (
                v.ES_INTERCAMBIO = FALSE OR
                (
                    v.ES_INTERCAMBIO = TRUE
                    AND venta_origen.ESTADO_PAGO = 'YA FUE FACTURADA'
                )
            )
            ORDER BY 
                CASE 
                    WHEN v.ESTADO = 'COMPRADO' THEN 1
                    WHEN v.ESTADO = 'VENDIDO' THEN 2
                    WHEN v.ESTADO = 'DEVUELTO' THEN 3
                    ELSE 4
                END,
                v.FECHA_INGRESO DESC
        `;
        const params = [];
        
        if (req.query.placa) {
            query += ' AND v.PLACA LIKE ?';
            params.push(`%${req.query.placa}%`);
        }
        
        if (req.query.marca) {
            query += ' AND v.ID_MARCA = ?';
            params.push(req.query.marca);
        }
        
        if (req.query.modelo) {
            query += ' AND v.MODELO LIKE ?';
            params.push(`%${req.query.modelo}%`);
        }
        
        if (req.query.estado) {
            query += ' AND v.ESTADO = ?';
            params.push(req.query.estado);
        }
                
        const [vehiculos] = await connection.execute(query, params);
        await connection.end();
        
        res.json(vehiculos);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener vehículos' });
    }
});

// Obtener los vehículos COMPRADOS con información relacionada
app.get('/api/vehiculos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        let query = `
            SELECT 
                v.*,
                m.NOMBRE as marca_nombre,
                c.NOMBRE as color_nombre,
                comb.NOMBRE as combustible_nombre,
                t.NOMBRE as transmision_nombre,
                p.NOMBRE_COMPLETO as proveedor_nombre,
                cv.PRECIO_COSTO as PRECIO_COMPRA_CRC,
                cv.TOTAL_INVERSION as INVERSION_CRC,
                cv.SALDO as SALDO_CRC,
                cv.FECHA_CANCELACION,
                ROUND(cv.PRECIO_COSTO / COALESCE(cv.TIPO_CAMBIO_COMPRA, 515), 2) as PRECIO_COMPRA_USD,
                ROUND(cv.TOTAL_INVERSION / COALESCE(cv.TIPO_CAMBIO_COMPRA, 515), 2) as INVERSION_USD,
                ROUND(cv.SALDO / COALESCE(cv.TIPO_CAMBIO_COMPRA, 515), 2) as SALDO_USD
            FROM VEHICULOS v
            LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
            LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
            LEFT JOIN CAT_COMBUSTIBLES comb ON v.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
            LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
            LEFT JOIN PERSONAS p ON v.ID_PROVEEDOR = p.ID_PERSONA
            LEFT JOIN COSTOS_VEHICULO cv ON v.ID_VEHICULO = cv.ID_VEHICULO
            LEFT JOIN VENTAS venta ON v.ID_VEHICULO = venta.ID_VEHICULO
            WHERE (
                (v.ES_INTERCAMBIO = FALSE AND v.ESTADO = 'COMPRADO')
                OR
                (v.ES_INTERCAMBIO = TRUE AND v.ESTADO = 'COMPRADO'
                AND v.ID_VENTA_ORIGEN IS NOT NULL
                AND (
                    SELECT v2.ESTADO_PAGO FROM VENTAS v2
                    WHERE v2.ID_VENTA = v.ID_VENTA_ORIGEN
                ) = 'YA FUE FACTURADA')
            )
        `;
        const params = [];
        
        if (req.query.placa) {
            query += ' AND v.PLACA LIKE ?';
            params.push(`%${req.query.placa}%`);
        }
        
        if (req.query.marca) {
            query += ' AND v.ID_MARCA = ?';
            params.push(req.query.marca);
        }
        
        if (req.query.modelo) {
            query += ' AND v.MODELO LIKE ?';
            params.push(`%${req.query.modelo}%`);
        }
        
        if (req.query.estado) {
            query += ' AND v.ESTADO = ?';
            params.push(req.query.estado);
        }
        
        query += ' ORDER BY v.FECHA_INGRESO DESC';
        
        const [vehiculos] = await connection.execute(query, params);
        await connection.end();
        
        res.json(vehiculos);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener vehículos' });
    }
});

// ESPECÍFICO PARA BÚSQUEDA CON COSTOS
app.get('/api/vehiculos/buscar-con-costos', async (req, res) => {
    try {
        const { placa } = req.query;
        console.log('🔍 Búsqueda de vehículo con placa:', placa);
        
        if (!placa || placa.length < 2) {
            return res.json([]);
        }

        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a DB');
        
        const query = `
            SELECT 
                v.ID_VEHICULO,
                v.PLACA,
                v.CHASIS,
                v.MOTOR,
                v.ID_MARCA,
                v.MODELO,
                v.ID_COLOR,
                v.ID_COMBUSTIBLE,
                v.ID_TRANSMISION,
                v.ESTILO,
                v.TRACCION,
                v.CARROCERIA,
                v.C_C,
                v.CILINDROS,
                v.KILOMETRAJE_ACTUAL,
                v.KILOMETRAJE_ANTERIOR,
                v.PV,
                v.OBSERVACIONES,
                v.ESTADO,
                m.NOMBRE as marca_nombre,
                col.NOMBRE as color_nombre,
                comb.NOMBRE as combustible_nombre,
                trans.NOMBRE as transmision_nombre,
                cv.PRECIO_PUBLICO as monto_venta,
                cv.MONTO_TRASPASO as monto_traspaso,
                cv.PRECIO_COMPRA,
                cv.PRECIO_COSTO,
                cv.PRIMA,
                cv.COMISION,
                cv.TOTAL_INVERSION,
                cv.PRIMA_FINANCIAMIENTO,
                cv.CUOTA_FINANCIAMIENTO,
                cv.SALDO,
                cv.MONEDA,
                cv.TIPO_CAMBIO_COMPRA
            FROM VEHICULOS v
            LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
            LEFT JOIN CAT_COLORES col ON v.ID_COLOR = col.ID_COLOR
            LEFT JOIN CAT_COMBUSTIBLES comb ON v.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
            LEFT JOIN CAT_TRANSMISIONES trans ON v.ID_TRANSMISION = trans.ID_TRANSMISION
            LEFT JOIN COSTOS_VEHICULO cv ON v.ID_VEHICULO = cv.ID_VEHICULO
            WHERE v.PLACA LIKE ? 
            AND v.ESTADO = 'COMPRADO'
            ORDER BY v.FECHA_INGRESO DESC, cv.FECHA_CALCULO DESC
            LIMIT 10
        `;
        
        console.log('📝 Ejecutando query con placa:', `%${placa}%`);
        const [rows] = await connection.execute(query, [`%${placa}%`]);
        console.log(`📊 Resultados encontrados: ${rows.length}`);
        
        await connection.end();
        
        // Evitar duplicados
        const vehiculosMap = new Map();
        rows.forEach(row => {
            if (!vehiculosMap.has(row.ID_VEHICULO)) {
                vehiculosMap.set(row.ID_VEHICULO, row);
            }
        });
        
        const vehiculosUnicos = Array.from(vehiculosMap.values());
        console.log(`✅ Enviando ${vehiculosUnicos.length} vehículos únicos`);
        
        res.json(vehiculosUnicos);
        
    } catch (error) {
        console.error('❌ ERROR DETALLADO:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({ 
            error: 'Error al buscar vehículo', 
            detalles: error.message,
            sqlError: error.sqlMessage 
        });
    }
});

// APIs PARA VEHÍCULOS
// GET /api/vehiculos/lista-colaborador
app.get('/api/vehiculos/lista-colaborador', async (req, res) => {
    console.log('✅ EJECUTANDO /api/vehiculos/lista-colaborador');
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const query = `
            SELECT 
                v.ID_VEHICULO,
                v.PLACA,
                v.ESTILO,
                v.TRACCION,
                v.MODELO,
                v.KILOMETRAJE_ACTUAL,
                v.KILOMETRAJE_ANTERIOR,
                v.ESTADO,
                v.OBSERVACIONES,
                v.CHASIS,
                v.MOTOR,
                v.PV,
                v.C_C,
                v.CILINDROS,
                v.CARROCERIA,
                v.FECHA_INGRESO,
                
                -- Datos de catálogos
                m.ID_MARCA,
                m.NOMBRE as marca_nombre,
                c.ID_COLOR,
                c.NOMBRE as color_nombre,
                comb.ID_COMBUSTIBLE,
                comb.NOMBRE as combustible_nombre,
                t.ID_TRANSMISION,
                t.NOMBRE as transmision_nombre,
                
                -- Datos del proveedor
                p.ID_PERSONA as ID_PROVEEDOR,
                p.NOMBRE_COMPLETO as proveedor_nombre,
                
                -- DATOS DE COSTOS (con el nombre CORRECTO de la columna)
                cv.PRECIO_PUBLICO,           -- Precio Público
                cv.PRECIO_DESCUENTO,          -- Precio con Descuento
                cv.MONTO_TRASPASO,             -- Monto Traspaso 
                
                -- Otros costos por si los necesitas
                cv.PRECIO_COMPRA,
                cv.PRIMA,
                cv.COMISION,
                cv.TOTAL_INVERSION,
                cv.SALDO,
                cv.TIPO_CAMBIO_COMPRA
                
            FROM VEHICULOS v
            LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
            LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
            LEFT JOIN CAT_COMBUSTIBLES comb ON v.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
            LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
            LEFT JOIN PERSONAS p ON v.ID_PROVEEDOR = p.ID_PERSONA
            LEFT JOIN COSTOS_VEHICULO cv ON v.ID_VEHICULO = cv.ID_VEHICULO
            WHERE (
                    (v.ES_INTERCAMBIO = FALSE AND v.ESTADO = 'COMPRADO')
                    OR
                    (v.ES_INTERCAMBIO = TRUE AND v.ESTADO = 'COMPRADO'
                    AND v.ID_VENTA_ORIGEN IS NOT NULL
                    AND (
                        SELECT vt.ESTADO_PAGO FROM VENTAS vt 
                        WHERE vt.ID_VENTA = v.ID_VENTA_ORIGEN
                    ) = 'YA FUE FACTURADA')
                )
        `;
        
        const [vehiculos] = await connection.execute(query);
        await connection.end();
        
        console.log(`📊 Enviando ${vehiculos.length} vehículos`);
        res.json(vehiculos);
    } catch (error) {
        console.error('Error en /api/vehiculos/lista-colaborador:', error);
        res.status(500).json({ error: 'Error al obtener vehículos' });
    }
});

// Obtener un vehículo por ID
app.get('/api/vehiculos/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [vehiculos] = await connection.execute(
            `SELECT 
                v.*,
                p.NOMBRE_COMPLETO as proveedor_nombre,
                p.IDENTIFICACION as proveedor_identificacion,
                m.NOMBRE as marca_nombre,
                c.NOMBRE as color_nombre,
                comb.NOMBRE as combustible_nombre,
                t.NOMBRE as transmision_nombre
            FROM VEHICULOS v
            LEFT JOIN PERSONAS p ON v.ID_PROVEEDOR = p.ID_PERSONA
            LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
            LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
            LEFT JOIN CAT_COMBUSTIBLES comb ON v.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
            LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
            WHERE v.ID_VEHICULO = ?`,
            [req.params.id]
        );
        
        await connection.end();
        
        if (vehiculos.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        
        res.json(vehiculos[0]);
    } catch (err) {
        console.error('Error al obtener vehículo:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear un nuevo vehículo
app.post('/api/vehiculos', async (req, res) => {
    try {
        const {
            ID_PROVEEDOR, CHASIS, MOTOR, PLACA, ID_MARCA, MODELO, ID_COLOR,
            ID_COMBUSTIBLE, ID_TRANSMISION, ESTILO, TRACCION, CARROCERIA,
            C_C, CILINDROS, KILOMETRAJE_ACTUAL, KILOMETRAJE_ANTERIOR,
            FECHA_INGRESO, PV, ESTADO, OBSERVACIONES,
            ES_INTERCAMBIO, ID_CLIENTE_ORIGEN, MONTO_INTERCAMBIO, FECHA_RECEPCION
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            `INSERT INTO VEHICULOS (
                ID_PROVEEDOR, CHASIS, MOTOR, PLACA, ID_MARCA, MODELO,
                ID_COLOR, ID_COMBUSTIBLE, ID_TRANSMISION, ESTILO,
                TRACCION, CARROCERIA, C_C, CILINDROS,
                KILOMETRAJE_ACTUAL, KILOMETRAJE_ANTERIOR, FECHA_INGRESO,
                PV, ESTADO, OBSERVACIONES,
                ES_INTERCAMBIO, ID_CLIENTE_ORIGEN, MONTO_INTERCAMBIO, FECHA_RECEPCION
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ID_PROVEEDOR, CHASIS, MOTOR || null, PLACA || null, ID_MARCA, MODELO,
                ID_COLOR || null, ID_COMBUSTIBLE || null, ID_TRANSMISION || null,
                ESTILO || null, TRACCION || null, CARROCERIA || null,
                C_C || null, CILINDROS || null,
                KILOMETRAJE_ACTUAL || 0, KILOMETRAJE_ANTERIOR || 0,
                FECHA_INGRESO || new Date().toISOString().split('T')[0],
                PV || null, ESTADO || 'COMPRADO', OBSERVACIONES || null,
                ES_INTERCAMBIO || false, ID_CLIENTE_ORIGEN || null,
                MONTO_INTERCAMBIO || 0, FECHA_RECEPCION || null
            ]
        );
        
        await connection.end();
        
        res.json({ 
            id: result.insertId, 
            message: 'Vehículo creado exitosamente' 
        });
    } catch (err) {
        console.error('Error al crear vehículo:', err);
        
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.sqlMessage.includes('CHASIS')) {
                return res.status(400).json({ error: 'El chasis ya está registrado' });
            } else if (err.sqlMessage.includes('PLACA')) {
                return res.status(400).json({ error: 'La placa ya está registrada' });
            } else if (err.sqlMessage.includes('MOTOR')) {
                return res.status(400).json({ error: 'El número de motor ya está registrado' });
            }
        }
        
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Actualizar un vehículo
app.put('/api/vehiculos/:id', async (req, res) => {
    try {
        const {
            ID_PROVEEDOR, CHASIS, MOTOR, PLACA, ID_MARCA, MODELO, ID_COLOR,
            ID_COMBUSTIBLE, ID_TRANSMISION, ESTILO, TRACCION, CARROCERIA,
            C_C, CILINDROS, KILOMETRAJE_ACTUAL, KILOMETRAJE_ANTERIOR,
            FECHA_INGRESO, PV, ESTADO, OBSERVACIONES,
            ES_INTERCAMBIO, ID_CLIENTE_ORIGEN, MONTO_INTERCAMBIO, FECHA_RECEPCION
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            `UPDATE VEHICULOS SET
                ID_PROVEEDOR = ?, CHASIS = ?, MOTOR = ?, PLACA = ?, ID_MARCA = ?, MODELO = ?,
                ID_COLOR = ?, ID_COMBUSTIBLE = ?, ID_TRANSMISION = ?, ESTILO = ?, TRACCION = ?, 
                CARROCERIA = ?, C_C = ?, CILINDROS = ?, 
                KILOMETRAJE_ACTUAL = ?, KILOMETRAJE_ANTERIOR = ?, 
                FECHA_INGRESO = ?, PV = ?, ESTADO = ?, OBSERVACIONES = ?,
                ES_INTERCAMBIO = ?, ID_CLIENTE_ORIGEN = ?, MONTO_INTERCAMBIO = ?, FECHA_RECEPCION = ?
            WHERE ID_VEHICULO = ?`,
            [
                ID_PROVEEDOR, CHASIS, MOTOR || null, PLACA || null, ID_MARCA, MODELO,
                ID_COLOR || null, ID_COMBUSTIBLE || null, ID_TRANSMISION || null,
                ESTILO || null, TRACCION || null, CARROCERIA || null,
                C_C || null, CILINDROS || null,
                KILOMETRAJE_ACTUAL || 0, KILOMETRAJE_ANTERIOR || 0,
                FECHA_INGRESO || null,
                PV || null, ESTADO || 'COMPRADO', OBSERVACIONES || null,
                ES_INTERCAMBIO || false, ID_CLIENTE_ORIGEN || null,
                MONTO_INTERCAMBIO || 0, FECHA_RECEPCION || null,
                req.params.id
            ]
        );
        
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        
        res.json({ message: 'Vehículo actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar vehículo:', err);
        
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.sqlMessage.includes('CHASIS')) {
                return res.status(400).json({ error: 'El chasis ya está registrado' });
            } else if (err.sqlMessage.includes('PLACA')) {
                return res.status(400).json({ error: 'La placa ya está registrada' });
            } else if (err.sqlMessage.includes('MOTOR')) {
                return res.status(400).json({ error: 'El número de motor ya está registrado' });
            }
        }
        
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// PUT específico para colaborador (actualiza vehiculo + costos)
app.put('/api/vehiculos/:id/colaborador', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();

        const {
            PLACA, ID_MARCA, MODELO, ESTILO, TRACCION,
            ID_COLOR, ID_TRANSMISION, ID_COMBUSTIBLE,
            MOTOR, CHASIS, CILINDROS, CARROCERIA, C_C, PV,
            KILOMETRAJE_ANTERIOR, KILOMETRAJE_ACTUAL, OBSERVACIONES,
            // Campos de costos
            PRECIO_PUBLICO, PRECIO_TRANSPASO, PRECIO_DESCUENTO,
            PRIMA_FINANCIAMIENTO, CUOTA_FINANCIAMIENTO
        } = req.body;

        // 1. Actualizar datos del vehículo
        await connection.execute(
            `UPDATE VEHICULOS SET
                PLACA = ?, ID_MARCA = ?, MODELO = ?, ESTILO = ?, TRACCION = ?,
                ID_COLOR = ?, ID_TRANSMISION = ?, ID_COMBUSTIBLE = ?,
                MOTOR = ?, CHASIS = ?, CILINDROS = ?, CARROCERIA = ?,
                C_C = ?, PV = ?,
                KILOMETRAJE_ANTERIOR = ?, KILOMETRAJE_ACTUAL = ?,
                OBSERVACIONES = ?
            WHERE ID_VEHICULO = ?`,
            [
                PLACA || null, ID_MARCA, MODELO,
                ESTILO || null, TRACCION || null,
                ID_COLOR || null, ID_TRANSMISION || null, ID_COMBUSTIBLE || null,
                MOTOR || null, CHASIS, CILINDROS || null, CARROCERIA || null,
                C_C || null, PV || null,
                KILOMETRAJE_ANTERIOR || 0, KILOMETRAJE_ACTUAL || 0,
                OBSERVACIONES || null,
                req.params.id
            ]
        );

        // 2. Actualizar solo los campos de costos que el colaborador puede editar
        const [existeCosto] = await connection.execute(
            'SELECT ID_COSTO FROM COSTOS_VEHICULO WHERE ID_VEHICULO = ?',
            [req.params.id]
        );

        if (existeCosto.length > 0) {
            await connection.execute(
                `UPDATE COSTOS_VEHICULO SET
                    PRECIO_PUBLICO = ?,
                    PRECIO_TRANSPASO = ?,
                    PRECIO_DESCUENTO = ?,
                    PRIMA_FINANCIAMIENTO = ?,
                    CUOTA_FINANCIAMIENTO = ?
                WHERE ID_VEHICULO = ?`,
                [
                    PRECIO_PUBLICO || 0,
                    PRECIO_TRANSPASO || 0,
                    PRECIO_DESCUENTO || 0,
                    PRIMA_FINANCIAMIENTO || 0,
                    CUOTA_FINANCIAMIENTO || 0,
                    req.params.id
                ]
            );
        } else {
            await connection.execute(
                `INSERT INTO COSTOS_VEHICULO
                    (ID_VEHICULO, PRECIO_PUBLICO, PRECIO_TRANSPASO,
                     PRECIO_DESCUENTO, PRIMA_FINANCIAMIENTO, CUOTA_FINANCIAMIENTO)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    req.params.id,
                    PRECIO_PUBLICO || 0,
                    PRECIO_TRANSPASO || 0,
                    PRECIO_DESCUENTO || 0,
                    PRIMA_FINANCIAMIENTO || 0,
                    CUOTA_FINANCIAMIENTO || 0
                ]
            );
        }

        await connection.commit();
        await connection.end();
        res.json({ message: 'Vehículo actualizado exitosamente' });

    } catch (err) {
        await connection.rollback();
        await connection.end();
        console.error('Error al actualizar vehículo (colaborador):', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Placa o chasis ya registrado' });
        }
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Eliminar un vehículo
app.delete('/api/vehiculos/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();
        // Verificar si el vehículo tiene ventas asociadas
        const [ventas] = await connection.execute(
            'SELECT ID_VENTA FROM VENTAS WHERE ID_VEHICULO = ?',
            [req.params.id]
        );
        
        if (ventas.length > 0) {
            await connection.rollback();
            await connection.end();
            return res.status(400).json({ 
                error: 'No se puede eliminar el vehículo porque tiene ventas asociadas' 
            });
        }
        // Eliminar extras
        await connection.execute(
            'DELETE FROM EXTRAS_VEHICULO WHERE ID_VEHICULO = ?',
            [req.params.id]
        );
        // Eliminar costos
        await connection.execute(
            'DELETE FROM COSTOS_VEHICULO WHERE ID_VEHICULO = ?',
            [req.params.id]
        );
        // Eliminar vehículo
        await connection.execute(
            'DELETE FROM VEHICULOS WHERE ID_VEHICULO = ?',
            [req.params.id]
        );
        await connection.commit();
        await connection.end();

        res.json({ message: 'Vehículo eliminado exitosamente' });
        
    } catch (error) {
        await connection.rollback();
        await connection.end();
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al eliminar vehículo' });
    }
});

// ===== APIs PARA ESTADÍSTICAS E INVENTARIO ===== //
// Obtener estadísticas de vehículos por estado
app.get('/api/estadisticas/vehiculos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Total por estado
        const [estados] = await connection.execute(
            `SELECT 
                ESTADO,
                COUNT(*) as cantidad
            FROM VEHICULOS
            GROUP BY ESTADO`
        );
        
        // Total por proveedor
        const [porProveedor] = await connection.execute(
            `SELECT 
                p.NOMBRE_COMPLETO as proveedor,
                COUNT(v.ID_VEHICULO) as total,
                SUM(CASE WHEN v.ESTADO = 'COMPRADO' THEN 1 ELSE 0 END) as comprados,
                SUM(CASE WHEN v.ESTADO = 'VENDIDO' THEN 1 ELSE 0 END) as vendidos,
                SUM(CASE WHEN v.ESTADO = 'DEVUELTO' THEN 1 ELSE 0 END) as devueltos
            FROM VEHICULOS v
            LEFT JOIN PERSONAS p ON v.ID_PROVEEDOR = p.ID_PERSONA
            GROUP BY v.ID_PROVEEDOR, p.NOMBRE_COMPLETO
            ORDER BY total DESC`
        );
        
        // Totales generales
        const [totales] = await connection.execute(
            `SELECT 
                COUNT(*) as total_vehiculos,
                SUM(CASE WHEN ESTADO = 'COMPRADO' THEN 1 ELSE 0 END) as total_comprados,
                SUM(CASE WHEN ESTADO = 'VENDIDO' THEN 1 ELSE 0 END) as total_vendidos,
                SUM(CASE WHEN ESTADO = 'DEVUELTO' THEN 1 ELSE 0 END) as total_devueltos
            FROM VEHICULOS`
        );
        
        await connection.end();
        
        res.json({
            por_estado: estados,
            por_proveedor: porProveedor,
            totales: totales[0]
        });
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ===== ENDPOINTS DE ESTADÍSTICAS DE VENTAS =====

// HELPER INTERNO: construir WHERE con fechas opcionales
function dateRange(alias, startVal, endVal) {
  const parts = [];
  const params = [];
  if (startVal) { parts.push(`DATE(${alias}) >= ?`); params.push(startVal); }
  if (endVal)   { parts.push(`DATE(${alias}) <= ?`); params.push(endVal); }
  return { sql: parts.join(' AND '), params };
}

// 1. KPIs RÁPIDOS
app.get('/api/estadisticas/ventas-kpis', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, estado } = req.query;
    const connection = await mysql.createConnection(dbConfig);

    let whereClause = '1=1';
    const params = [];
    if (fecha_inicio) { whereClause += ' AND DATE(v.FECHA_VENTA) >= ?'; params.push(fecha_inicio); }
    if (fecha_fin)    { whereClause += ' AND DATE(v.FECHA_VENTA) <= ?'; params.push(fecha_fin); }
    if (estado)       { whereClause += ' AND v.ESTADO_PAGO = ?';         params.push(estado); }

    // Conteos generales
    const [general] = await connection.execute(`
      SELECT
        COUNT(DISTINCT v.ID_VENTA) AS total_ventas,
        COALESCE(SUM(v.TOTAL), 0)  AS total_crc,
        COALESCE(AVG(v.TOTAL), 0)  AS promedio,
        SUM(CASE WHEN f.ID_FINANCIAMIENTOS IS NULL THEN 1 ELSE 0 END) AS contado,
        SUM(CASE WHEN f.ID_FINANCIAMIENTOS IS NOT NULL THEN 1 ELSE 0 END) AS credito
      FROM VENTAS v
      LEFT JOIN FINANCIAMIENTOS f ON v.ID_VENTA = f.ID_VENTA
      WHERE ${whereClause}
    `, params);

    // Por estado
    const [porEstado] = await connection.execute(`
      SELECT ESTADO_PAGO AS estado, COUNT(*) AS cantidad
      FROM VENTAS v
      WHERE ${whereClause}
      GROUP BY ESTADO_PAGO
    `, params);

    // Inventario actual
    const [inventario] = await connection.execute(
      `SELECT COUNT(*) AS total FROM VEHICULOS WHERE ESTADO = 'COMPRADO'`
    );

    await connection.end();
    res.json({
      ...general[0],
      inventario: inventario[0].total,
      por_estado: porEstado
    });
  } catch (err) {
    console.error('Error KPIs ventas:', err);
    res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
  }
});

// 2. VENTAS POR MES
app.get('/api/estadisticas/ventas-mensual', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const connection = await mysql.createConnection(dbConfig);

    let whereClause = '1=1';
    const params = [];
    if (fecha_inicio) { whereClause += ' AND DATE(FECHA_VENTA) >= ?'; params.push(fecha_inicio); }
    if (fecha_fin)    { whereClause += ' AND DATE(FECHA_VENTA) <= ?'; params.push(fecha_fin); }

    const [rows] = await connection.execute(`
      SELECT
        DATE_FORMAT(FECHA_VENTA, '%Y-%m') AS mes,
        COUNT(*)                          AS cantidad,
        COALESCE(SUM(TOTAL), 0)           AS total_crc,
        COALESCE(AVG(TOTAL), 0)           AS promedio_crc
      FROM VENTAS
      WHERE ${whereClause}
      GROUP BY DATE_FORMAT(FECHA_VENTA, '%Y-%m')
      ORDER BY mes ASC
    `, params);

    await connection.end();
    res.json(rows);
  } catch (err) {
    console.error('Error ventas mensuales:', err);
    res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
  }
});

// 3. VENTAS TOTALES (tabla detalle)
app.get('/api/estadisticas/ventas-total', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, estado } = req.query;
    const connection = await mysql.createConnection(dbConfig);

    let whereClause = '1=1';
    const params = [];
    if (fecha_inicio) { whereClause += ' AND DATE(v.FECHA_VENTA) >= ?'; params.push(fecha_inicio); }
    if (fecha_fin)    { whereClause += ' AND DATE(v.FECHA_VENTA) <= ?'; params.push(fecha_fin); }
    if (estado)       { whereClause += ' AND v.ESTADO_PAGO = ?';         params.push(estado); }

    const [rows] = await connection.execute(`
      SELECT
        v.ID_VENTA,
        v.CODIGO_VENTA,
        v.FECHA_VENTA,
        v.ESTADO_PAGO,
        v.TOTAL,
        -- Tipo de venta
        CASE WHEN f.ID_FINANCIAMIENTOS IS NOT NULL THEN 'CREDITO' ELSE 'CONTADO' END AS tipo,
        -- Vehículo
        veh.PLACA,
        veh.MODELO,
        veh.ESTILO,
        m.NOMBRE AS marca_nombre,
        -- Cliente facturación
        cf.NOMBRE_COMPLETO AS cliente_nombre,
        cf.IDENTIFICACION  AS cliente_cedula,
        -- Vendedor
        vend.NOMBRE_COMPLETO AS vendedor_nombre,
        -- Precio venta (desde costos)
        cv.PRECIO_PUBLICO AS precio_venta
      FROM VENTAS v
      INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
      LEFT JOIN CAT_MARCAS m ON veh.ID_MARCA = m.ID_MARCA
      LEFT JOIN COSTOS_VEHICULO cv ON veh.ID_VEHICULO = cv.ID_VEHICULO
      INNER JOIN PERSONAS cf ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
      INNER JOIN PERSONAS vend ON v.ID_VENDEDOR = vend.ID_PERSONA
      LEFT JOIN FINANCIAMIENTOS f ON v.ID_VENTA = f.ID_VENTA
      WHERE ${whereClause}
      ORDER BY v.FECHA_VENTA DESC
    `, params);

    await connection.end();
    res.json(rows);
  } catch (err) {
    console.error('Error ventas total:', err);
    res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
  }
});

// 4. VENTAS POR CLIENTE
app.get('/api/estadisticas/ventas-por-cliente', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, nombre } = req.query;
    const connection = await mysql.createConnection(dbConfig);

    let whereClause = '1=1';
    const params = [];
    if (fecha_inicio) { whereClause += ' AND DATE(v.FECHA_VENTA) >= ?'; params.push(fecha_inicio); }
    if (fecha_fin)    { whereClause += ' AND DATE(v.FECHA_VENTA) <= ?'; params.push(fecha_fin); }
    if (nombre)       { whereClause += ' AND (cf.NOMBRE_COMPLETO LIKE ? OR cf.IDENTIFICACION LIKE ?)'; params.push(`%${nombre}%`, `%${nombre}%`); }

    const [rows] = await connection.execute(`
      SELECT
        cf.ID_PERSONA          AS id_cliente,
        cf.NOMBRE_COMPLETO     AS cliente_nombre,
        cf.IDENTIFICACION,
        cf.TELEFONO_PRINCIPAL,
        cf.EMAIL,
        COUNT(DISTINCT v.ID_VENTA)  AS num_compras,
        COALESCE(SUM(v.TOTAL), 0)   AS total_crc,
        COALESCE(AVG(v.TOTAL), 0)   AS promedio_crc,
        MAX(v.FECHA_VENTA)           AS ultima_compra,
        MIN(v.FECHA_VENTA)           AS primera_compra
      FROM VENTAS v
      INNER JOIN PERSONAS cf ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
      WHERE ${whereClause}
      GROUP BY cf.ID_PERSONA, cf.NOMBRE_COMPLETO, cf.IDENTIFICACION, cf.TELEFONO_PRINCIPAL, cf.EMAIL
      ORDER BY num_compras DESC, total_crc DESC
    `, params);

    await connection.end();
    res.json({ clientes: rows });
  } catch (err) {
    console.error('Error ventas por cliente:', err);
    res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
  }
});

// 5. VENTAS POR PRODUCTO (VEHÍCULO)
app.get('/api/estadisticas/ventas-por-producto', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, id_marca, tipo_venta } = req.query;
    const connection = await mysql.createConnection(dbConfig);

    let whereClause = '1=1';
    const params = [];
    if (fecha_inicio) { whereClause += ' AND DATE(v.FECHA_VENTA) >= ?'; params.push(fecha_inicio); }
    if (fecha_fin)    { whereClause += ' AND DATE(v.FECHA_VENTA) <= ?'; params.push(fecha_fin); }
    if (id_marca)     { whereClause += ' AND veh.ID_MARCA = ?';           params.push(id_marca); }
    if (tipo_venta === 'CONTADO')  whereClause += ' AND f.ID_FINANCIAMIENTOS IS NULL';
    if (tipo_venta === 'CREDITO')  whereClause += ' AND f.ID_FINANCIAMIENTOS IS NOT NULL';

    const [rows] = await connection.execute(`
      SELECT
        veh.ID_VEHICULO,
        veh.PLACA,
        veh.MODELO,
        veh.ESTILO,
        veh.CHASIS,
        m.NOMBRE   AS marca_nombre,
        col.NOMBRE AS color_nombre,
        comb.NOMBRE AS combustible_nombre,
        tr.NOMBRE  AS transmision_nombre,
        -- Precios
        COALESCE(cv.PRECIO_PUBLICO, v.TOTAL, 0)   AS precio_venta,
        COALESCE(cv.TOTAL_INVERSION, 0)            AS costo_total,
        COALESCE(cv.PRECIO_PUBLICO - cv.TOTAL_INVERSION, 0) AS ganancia,
        -- Tipo
        CASE WHEN f.ID_FINANCIAMIENTOS IS NOT NULL THEN 'CREDITO' ELSE 'CONTADO' END AS tipo,
        -- Fecha y venta
        v.FECHA_VENTA,
        v.CODIGO_VENTA,
        v.ESTADO_PAGO,
        v.TOTAL
      FROM VENTAS v
      INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
      LEFT JOIN CAT_MARCAS m ON veh.ID_MARCA = m.ID_MARCA
      LEFT JOIN CAT_COLORES col ON veh.ID_COLOR = col.ID_COLOR
      LEFT JOIN CAT_COMBUSTIBLES comb ON veh.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
      LEFT JOIN CAT_TRANSMISIONES tr ON veh.ID_TRANSMISION = tr.ID_TRANSMISION
      LEFT JOIN COSTOS_VEHICULO cv ON veh.ID_VEHICULO = cv.ID_VEHICULO
      LEFT JOIN FINANCIAMIENTOS f ON v.ID_VENTA = f.ID_VENTA
      WHERE ${whereClause}
      ORDER BY v.FECHA_VENTA DESC
    `, params);

    await connection.end();
    res.json({ vehiculos: rows });
  } catch (err) {
    console.error('Error ventas por producto:', err);
    res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
  }
});

// 6. VENTAS POR AGENTE
app.get('/api/estadisticas/ventas-por-agente', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, id_vendedor } = req.query;
    const connection = await mysql.createConnection(dbConfig);

    let whereClause = '1=1';
    const params = [];
    if (fecha_inicio) { whereClause += ' AND DATE(v.FECHA_VENTA) >= ?'; params.push(fecha_inicio); }
    if (fecha_fin)    { whereClause += ' AND DATE(v.FECHA_VENTA) <= ?'; params.push(fecha_fin); }
    if (id_vendedor)  { whereClause += ' AND v.ID_VENDEDOR = ?';         params.push(id_vendedor); }

    // Agregado por agente
    const [agentes] = await connection.execute(`
      SELECT
        vend.ID_PERSONA     AS id_vendedor,
        vend.NOMBRE_COMPLETO AS vendedor_nombre,
        vend.IDENTIFICACION,
        COUNT(DISTINCT v.ID_VENTA)  AS num_ventas,
        COALESCE(SUM(v.TOTAL), 0)   AS total_crc,
        COALESCE(AVG(v.TOTAL), 0)   AS promedio_crc,
        SUM(CASE WHEN f.ID_FINANCIAMIENTOS IS NULL THEN 1 ELSE 0 END) AS contado,
        SUM(CASE WHEN f.ID_FINANCIAMIENTOS IS NOT NULL THEN 1 ELSE 0 END) AS credito,
        COALESCE(SUM(cv.COMISION), 0) AS total_comision,
        MAX(v.FECHA_VENTA)  AS ultima_venta
      FROM VENTAS v
      INNER JOIN PERSONAS vend ON v.ID_VENDEDOR = vend.ID_PERSONA
      LEFT JOIN FINANCIAMIENTOS f ON v.ID_VENTA = f.ID_VENTA
      LEFT JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
      LEFT JOIN COSTOS_VEHICULO cv ON veh.ID_VEHICULO = cv.ID_VEHICULO
      WHERE ${whereClause}
      GROUP BY vend.ID_PERSONA, vend.NOMBRE_COMPLETO, vend.IDENTIFICACION
      ORDER BY num_ventas DESC
    `, params);

    // Por mes para cada agente (top 5 para el gráfico de líneas)
    const top5ids = agentes.slice(0,5).map(a => a.id_vendedor);
    const mensualMap = {};

    if (top5ids.length) {
      for (const id of top5ids) {
        const mesParams = [...params, id];
        const mesWhere = whereClause + ' AND v.ID_VENDEDOR = ?';
        const [meses] = await connection.execute(`
          SELECT DATE_FORMAT(FECHA_VENTA, '%Y-%m') AS mes, COUNT(*) AS cantidad
          FROM VENTAS v
          WHERE ${mesWhere}
          GROUP BY DATE_FORMAT(FECHA_VENTA, '%Y-%m')
          ORDER BY mes ASC
        `, mesParams);
        mensualMap[id] = meses;
      }
    }

    // Adjuntar datos mensuales
    const result = agentes.map(a => ({
      ...a,
      por_mes: mensualMap[a.id_vendedor] || []
    }));

    await connection.end();
    res.json({ agentes: result });
  } catch (err) {
    console.error('Error ventas por agente:', err);
    res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
  }
});

// 7. VENTAS: AGENTE × CLIENTE
app.get('/api/estadisticas/ventas-agente-cliente', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, id_vendedor, cliente } = req.query;
    const connection = await mysql.createConnection(dbConfig);

    let whereClause = '1=1';
    const params = [];
    if (fecha_inicio) { whereClause += ' AND DATE(v.FECHA_VENTA) >= ?'; params.push(fecha_inicio); }
    if (fecha_fin)    { whereClause += ' AND DATE(v.FECHA_VENTA) <= ?'; params.push(fecha_fin); }
    if (id_vendedor)  { whereClause += ' AND v.ID_VENDEDOR = ?';         params.push(id_vendedor); }
    if (cliente)      { whereClause += ' AND (cf.NOMBRE_COMPLETO LIKE ? OR cf.IDENTIFICACION LIKE ?)'; params.push(`%${cliente}%`, `%${cliente}%`); }

    const [rows] = await connection.execute(`
      SELECT
        vend.ID_PERSONA          AS id_vendedor,
        vend.NOMBRE_COMPLETO     AS vendedor_nombre,
        cf.ID_PERSONA            AS id_cliente,
        cf.NOMBRE_COMPLETO       AS cliente_nombre,
        cf.IDENTIFICACION        AS cliente_cedula,
        cf.TELEFONO_PRINCIPAL    AS telefono,
        COUNT(DISTINCT v.ID_VENTA)  AS num_compras,
        COALESCE(SUM(v.TOTAL), 0)   AS total_crc,
        MAX(v.FECHA_VENTA)           AS ultima_venta,
        MAX(v.ESTADO_PAGO)           AS ultimo_estado
      FROM VENTAS v
      INNER JOIN PERSONAS vend ON v.ID_VENDEDOR = vend.ID_PERSONA
      INNER JOIN PERSONAS cf   ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
      WHERE ${whereClause}
      GROUP BY vend.ID_PERSONA, vend.NOMBRE_COMPLETO,
               cf.ID_PERSONA, cf.NOMBRE_COMPLETO, cf.IDENTIFICACION, cf.TELEFONO_PRINCIPAL
      ORDER BY vend.NOMBRE_COMPLETO, num_compras DESC, total_crc DESC
    `, params);

    await connection.end();
    res.json({ rows });
  } catch (err) {
    console.error('Error agente×cliente:', err);
    res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
  }
});

// 8. VENTAS: AGENTE × PRODUCTO
app.get('/api/estadisticas/ventas-agente-producto', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, id_vendedor, id_marca } = req.query;
    const connection = await mysql.createConnection(dbConfig);

    let whereClause = '1=1';
    const params = [];
    if (fecha_inicio) { whereClause += ' AND DATE(v.FECHA_VENTA) >= ?'; params.push(fecha_inicio); }
    if (fecha_fin)    { whereClause += ' AND DATE(v.FECHA_VENTA) <= ?'; params.push(fecha_fin); }
    if (id_vendedor)  { whereClause += ' AND v.ID_VENDEDOR = ?';         params.push(id_vendedor); }
    if (id_marca)     { whereClause += ' AND veh.ID_MARCA = ?';           params.push(id_marca); }

    const [rows] = await connection.execute(`
      SELECT
        vend.ID_PERSONA          AS id_vendedor,
        vend.NOMBRE_COMPLETO     AS vendedor_nombre,
        veh.ID_VEHICULO,
        veh.PLACA,
        veh.MODELO,
        veh.ESTILO,
        m.NOMBRE  AS marca_nombre,
        cf.NOMBRE_COMPLETO AS cliente_nombre,
        cf.IDENTIFICACION  AS cliente_cedula,
        COALESCE(cv.PRECIO_PUBLICO, v.TOTAL, 0)  AS precio_venta,
        COALESCE(cv.PRECIO_PUBLICO - cv.TOTAL_INVERSION, 0) AS ganancia,
        CASE WHEN f.ID_FINANCIAMIENTOS IS NOT NULL THEN 'CREDITO' ELSE 'CONTADO' END AS tipo,
        v.FECHA_VENTA,
        v.CODIGO_VENTA,
        v.ESTADO_PAGO,
        v.TOTAL
      FROM VENTAS v
      INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
      INNER JOIN PERSONAS vend ON v.ID_VENDEDOR = vend.ID_PERSONA
      INNER JOIN PERSONAS cf   ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
      LEFT JOIN CAT_MARCAS m ON veh.ID_MARCA = m.ID_MARCA
      LEFT JOIN COSTOS_VEHICULO cv ON veh.ID_VEHICULO = cv.ID_VEHICULO
      LEFT JOIN FINANCIAMIENTOS f ON v.ID_VENTA = f.ID_VENTA
      WHERE ${whereClause}
      ORDER BY vend.NOMBRE_COMPLETO, v.FECHA_VENTA DESC
    `, params);

    await connection.end();
    res.json({ rows });
  } catch (err) {
    console.error('Error agente×producto:', err);
    res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
  }
});

// 9. VENTAS COMPLETO: AGENTE × CLIENTE × PRODUCTO
app.get('/api/estadisticas/ventas-completo', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, id_vendedor, cliente, id_marca } = req.query;
    const connection = await mysql.createConnection(dbConfig);

    let whereClause = '1=1';
    const params = [];
    if (fecha_inicio) { whereClause += ' AND DATE(v.FECHA_VENTA) >= ?'; params.push(fecha_inicio); }
    if (fecha_fin)    { whereClause += ' AND DATE(v.FECHA_VENTA) <= ?'; params.push(fecha_fin); }
    if (id_vendedor)  { whereClause += ' AND v.ID_VENDEDOR = ?';         params.push(id_vendedor); }
    if (id_marca)     { whereClause += ' AND veh.ID_MARCA = ?';           params.push(id_marca); }
    if (cliente)      { whereClause += ' AND (cf.NOMBRE_COMPLETO LIKE ? OR cf.IDENTIFICACION LIKE ?)'; params.push(`%${cliente}%`, `%${cliente}%`); }

    const [rows] = await connection.execute(`
      SELECT
        v.ID_VENTA,
        v.CODIGO_VENTA,
        v.FECHA_VENTA,
        v.ESTADO_PAGO,
        v.TOTAL,
        -- Agente
        vend.ID_PERSONA      AS id_vendedor,
        vend.NOMBRE_COMPLETO AS vendedor_nombre,
        vend.IDENTIFICACION  AS vendedor_cedula,
        -- Cliente facturación
        cf.ID_PERSONA        AS id_cliente,
        cf.NOMBRE_COMPLETO   AS cliente_facturacion,
        cf.IDENTIFICACION    AS cedula_facturacion,
        -- Cliente inscripción
        ci.NOMBRE_COMPLETO   AS cliente_inscripcion,
        ci.IDENTIFICACION    AS cedula_inscripcion,
        -- Vehículo
        veh.ID_VEHICULO,
        veh.PLACA,
        veh.MODELO,
        veh.ESTILO,
        veh.CHASIS,
        m.NOMBRE   AS marca_nombre,
        col.NOMBRE AS color_nombre,
        comb.NOMBRE AS combustible_nombre,
        tr.NOMBRE  AS transmision_nombre,
        -- Costos
        COALESCE(cv.PRECIO_PUBLICO, v.TOTAL, 0)  AS precio_venta,
        COALESCE(cv.TOTAL_INVERSION, 0)            AS costo_total,
        COALESCE(cv.PRECIO_PUBLICO - cv.TOTAL_INVERSION, 0) AS ganancia,
        -- Tipo
        CASE WHEN f.ID_FINANCIAMIENTOS IS NOT NULL THEN 'CREDITO' ELSE 'CONTADO' END AS tipo,
        -- Financiamiento
        f.PLAZO_MESES,
        f.ENTIDAD_FINANCIERA,
        f.CUOTA_MENSUAL
      FROM VENTAS v
      INNER JOIN PERSONAS vend ON v.ID_VENDEDOR = vend.ID_PERSONA
      INNER JOIN PERSONAS cf   ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
      LEFT JOIN PERSONAS ci    ON v.ID_CLIENTE_INSCRIPCION = ci.ID_PERSONA
      INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
      LEFT JOIN CAT_MARCAS m ON veh.ID_MARCA = m.ID_MARCA
      LEFT JOIN CAT_COLORES col ON veh.ID_COLOR = col.ID_COLOR
      LEFT JOIN CAT_COMBUSTIBLES comb ON veh.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
      LEFT JOIN CAT_TRANSMISIONES tr ON veh.ID_TRANSMISION = tr.ID_TRANSMISION
      LEFT JOIN COSTOS_VEHICULO cv ON veh.ID_VEHICULO = cv.ID_VEHICULO
      LEFT JOIN FINANCIAMIENTOS f ON v.ID_VENTA = f.ID_VENTA
      WHERE ${whereClause}
      ORDER BY v.FECHA_VENTA DESC
    `, params);

    await connection.end();
    res.json({ rows });
  } catch (err) {
    console.error('Error ventas completo:', err);
    res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
  }
});

/* 1. PERSONAS (VENDEDORES/COLABORADORES) */
// Obtener vendedores activos
app.get('/api/vendedores-activos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT 
                p.*,
                u.USERNAME,
                u.ULTIMO_ACCESO,
                u.INTENTOS_FALLIDOS,
                u.ESTADO as estado_usuario
            FROM PERSONAS p
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            LEFT JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            WHERE pr.ID_ROL = 5 
            AND pr.ESTADO = 'ACTIVO'
            AND p.ESTADO = 'ACTIVO'
            ORDER BY p.NOMBRE_COMPLETO
        `);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener vendedores activos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

/* Obtener todos los vendedores */
app.get('/api/vendedores', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [vendedores] = await connection.execute(`
            SELECT 
                p.*,
                pr.ID_PERSONA_ROL,
                pr.ID_ROL,
                pr.FECHA_ASIGNACION as fecha_asignacion_rol,
                pr.ESTADO as estado_rol,
                r.NOMBRE as nombre_rol,
                r.DESCRIPCION as descripcion_rol,
                u.ID_USUARIO,
                u.USERNAME,
                u.ESTADO as estado_usuario,
                u.ULTIMO_ACCESO,
                u.INTENTOS_FALLIDOS
            FROM PERSONAS p
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            INNER JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
            LEFT JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            WHERE pr.ID_ROL = 5 -- ID del rol "Vendedor"
            AND pr.ESTADO = 'ACTIVO'
            ORDER BY p.NOMBRE_COMPLETO
        `);
        
        await connection.end();
        
        res.json({
            total: vendedores.length,
            vendedores: vendedores.map(v => ({
                ...v,
                tiene_usuario: !!v.ID_USUARIO
            }))
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener vendedores' });
    }
});

/* Obtener vendedor por ID */
app.get('/api/vendedores/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [vendedor] = await connection.execute(`
            SELECT 
                p.*,
                pr.ID_PERSONA_ROL,
                pr.ID_ROL,
                pr.FECHA_ASIGNACION as fecha_asignacion_rol,
                pr.ESTADO as estado_rol,
                r.NOMBRE as nombre_rol,
                r.DESCRIPCION as descripcion_rol,
                u.ID_USUARIO,
                u.USERNAME,
                u.ESTADO as estado_usuario,
                u.ULTIMO_ACCESO,
                u.INTENTOS_FALLIDOS,
                u.FECHA_BLOQUEO,
                u.FECHA_CREACION as fecha_creacion_usuario,
                ec.NOMBRE as estado_civil_nombre
            FROM PERSONAS p
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            INNER JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
            LEFT JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            LEFT JOIN CAT_ESTADOS_CIVIL ec ON p.ID_ESTADO_CIVIL = ec.ID_ESTADO_CIVIL
            WHERE p.ID_PERSONA = ?
            AND pr.ID_ROL = 5  -- Rol de Vendedor
            AND pr.ESTADO = 'ACTIVO'
        `, [id]);
        
        if (vendedor.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }
        
        // Obtener estadísticas del vendedor (CORREGIDO - usando DETALLE_PAGOS y VENTAS)
        const [estadisticas] = await connection.execute(`
            SELECT 
                COUNT(DISTINCT v.ID_VENTA) as total_ventas,
                COALESCE(SUM(CASE 
                    WHEN dp.MONEDA = 'USD' THEN dp.EFECTIVO * dp.TIPO_CAMBIO 
                    ELSE dp.EFECTIVO 
                END), 0) as total_efectivo,
                COALESCE(SUM(CASE 
                    WHEN dp.MONEDA = 'USD' THEN dp.TRANSFERENCIA * dp.TIPO_CAMBIO 
                    ELSE dp.TRANSFERENCIA 
                END), 0) as total_transferencias,
                COALESCE(SUM(CASE 
                    WHEN dp.MONEDA = 'USD' THEN dp.TARJETA * dp.TIPO_CAMBIO 
                    ELSE dp.TARJETA 
                END), 0) as total_tarjetas,
                COALESCE(SUM(f.PRIMA), 0) as total_prima_financiamientos,
                COALESCE(SUM(f.MONTO_FINANCIAR), 0) as total_financiado,
                MAX(v.FECHA_VENTA) as ultima_venta
            FROM VENTAS v
            LEFT JOIN DETALLE_PAGOS dp ON v.ID_VENTA = dp.ID_VENTA
            LEFT JOIN FINANCIAMIENTOS f ON v.ID_VENTA = f.ID_VENTA
            WHERE v.ID_VENDEDOR = ?
        `, [id]);
        
        // Obtener ventas recientes (CORREGIDO - con datos de pagos reales)
        const [ventas] = await connection.execute(`
            SELECT 
                v.ID_VENTA,
                v.CODIGO_VENTA,
                v.FECHA_VENTA,
                v.FECHA_CANCELACION,
                v.ESTADO_PAGO,
                veh.PLACA,
                veh.ID_MARCA,
                veh.MODELO,
                veh.ESTILO,
                m.NOMBRE as marca_nombre,
                cf.NOMBRE_COMPLETO as cliente_facturacion,
                ci.NOMBRE_COMPLETO as cliente_inscripcion,
                -- Totales de pagos
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN dp2.MONEDA = 'USD' THEN dp2.EFECTIVO * dp2.TIPO_CAMBIO 
                        ELSE dp2.EFECTIVO 
                    END)
                    FROM DETALLE_PAGOS dp2 
                    WHERE dp2.ID_VENTA = v.ID_VENTA
                ), 0) as total_efectivo_crc,
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN dp2.MONEDA = 'USD' THEN dp2.TRANSFERENCIA * dp2.TIPO_CAMBIO 
                        ELSE dp2.TRANSFERENCIA 
                    END)
                    FROM DETALLE_PAGOS dp2 
                    WHERE dp2.ID_VENTA = v.ID_VENTA
                ), 0) as total_transferencias_crc,
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN dp2.MONEDA = 'USD' THEN dp2.TARJETA * dp2.TIPO_CAMBIO 
                        ELSE dp2.TARJETA 
                    END)
                    FROM DETALLE_PAGOS dp2 
                    WHERE dp2.ID_VENTA = v.ID_VENTA
                ), 0) as total_tarjetas_crc,
                -- Datos de financiamiento si existe
                f.PRIMA as prima_financiamiento,
                f.MONTO_FINANCIAR,
                f.PLAZO_MESES,
                f.ENTIDAD_FINANCIERA,
                f.CUOTA_MENSUAL,
                -- Anticipos si existen
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN a.MONEDA = 'USD' THEN a.MONTO_DOLARES * a.TIPO_CAMBIO 
                        ELSE a.MONTO_COLONES 
                    END)
                    FROM ANTICIPOS a
                    INNER JOIN FINANCIAMIENTOS f2 ON a.ID_FINANCIAMIENTO = f2.ID_FINANCIAMIENTOS
                    WHERE f2.ID_VENTA = v.ID_VENTA
                ), 0) as total_anticipos
            FROM VENTAS v
            INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
            INNER JOIN CAT_MARCAS m ON veh.ID_MARCA = m.ID_MARCA
            INNER JOIN PERSONAS cf ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
            LEFT JOIN PERSONAS ci ON v.ID_CLIENTE_INSCRIPCION = ci.ID_PERSONA
            LEFT JOIN FINANCIAMIENTOS f ON v.ID_VENTA = f.ID_VENTA
            WHERE v.ID_VENDEDOR = ?
            ORDER BY v.FECHA_VENTA DESC
            LIMIT 10
        `, [id]);
        
        await connection.end();
        
        res.json({
            vendedor: vendedor[0],
            estadisticas: {
                total_ventas: estadisticas[0].total_ventas || 0,
                total_efectivo_crc: estadisticas[0].total_efectivo || 0,
                total_transferencias_crc: estadisticas[0].total_transferencias || 0,
                total_tarjetas_crc: estadisticas[0].total_tarjetas || 0,
                total_prima_financiamientos: estadisticas[0].total_prima_financiamientos || 0,
                total_financiado: estadisticas[0].total_financiado || 0,
                ultima_venta: estadisticas[0].ultima_venta
            },
            ventas_recientes: ventas
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener vendedor' });
    }
});

/* Crear nuevo vendedor */
app.post('/api/vendedores', async (req, res) => {
    const {
        tipo_documento,
        identificacion,
        nombre_completo,
        nacionalidad,
        id_estado_civil,
        ocupacion,
        direccion,
        telefono_principal,
        telefono_secundario,
        email,
        observacion,
        crear_usuario = false,
        username,
        contraseña
    } = req.body;

    try {
        // Validaciones básicas
        if (!tipo_documento || !identificacion || !nombre_completo) {
            return res.status(400).json({ 
                error: 'Los campos tipo_documento, identificacion y nombre_completo son obligatorios' 
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si la identificación ya existe
        const [existingPerson] = await connection.execute(
            'SELECT ID_PERSONA FROM PERSONAS WHERE IDENTIFICACION = ?',
            [identificacion]
        );

        if (existingPerson.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'La identificación ya está registrada' });
        }

        // Verificar si el email ya existe
        if (email) {
            const [existingEmail] = await connection.execute(
                'SELECT ID_PERSONA FROM PERSONAS WHERE EMAIL = ?',
                [email]
            );

            if (existingEmail.length > 0) {
                await connection.end();
                return res.status(400).json({ error: 'El email ya está registrado' });
            }
        }

        // Iniciar transacción
        await connection.beginTransaction();

        try {
            // 1. Crear persona
            const [personaResult] = await connection.execute(
                `INSERT INTO PERSONAS (
                    TIPO_DOCUMENTO, IDENTIFICACION, NOMBRE_COMPLETO, NACIONALIDAD,
                    ID_ESTADO_CIVIL, OCUPACION, DIRECCION, TELEFONO_PRINCIPAL,
                    TELEFONO_SECUNDARIO, EMAIL, OBSERVACION, ESTADO
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')`,
                [
                    tipo_documento, identificacion, nombre_completo, nacionalidad,
                    id_estado_civil || null, ocupacion || 'Vendedor', direccion,
                    telefono_principal, telefono_secundario, email, observacion
                ]
            );

            const idPersona = personaResult.insertId;

            // 2. Asignar rol de vendedor
            await connection.execute(
                `INSERT INTO PERSONAS_ROLES (ID_PERSONA, ID_ROL, ESTADO) 
                 VALUES (?, 5, 'ACTIVO')`, // 5 = ID del rol "Vendedor"
                [idPersona]
            );

            let usuarioCreado = false;
            let credenciales = null;

            // 3. Crear usuario si se solicita
            if (crear_usuario) {
                if (!username) {
                    throw new Error('El username es requerido para crear usuario');
                }

                // Verificar si username ya existe
                const [existingUser] = await connection.execute(
                    'SELECT ID_USUARIO FROM USUARIOS WHERE USERNAME = ?',
                    [username]
                );

                if (existingUser.length > 0) {
                    throw new Error('El username ya está en uso');
                }

                // Generar contraseña
                const contrasenaFinal = contraseña || generarContrasenaTemporal();
                
                // Validar fortaleza de contraseña si se proporciona
                if (contraseña) {
                    const validacion = validarFortalezaContrasena(contraseña);
                    if (!validacion.esValida) {
                        throw new Error(`La contraseña no cumple con los requisitos: ${validacion.requisitos.join(', ')}`);
                    }
                }

                const contrasenaEncriptada = await bcrypt.hash(contrasenaFinal, 12);

                await connection.execute(
                    `INSERT INTO USUARIOS (
                        ID_PERSONA, USERNAME, PASSWORD_HASH, ESTADO
                    ) VALUES (?, ?, ?, 'ACTIVO')`,
                    [idPersona, username, contrasenaEncriptada]
                );

                usuarioCreado = true;
                credenciales = {
                    username: username,
                    contraseña: contraseña ? '*** (proporcionada por el usuario)' : contrasenaFinal
                };

                // Enviar credenciales por email si no se proporcionó contraseña
                if (!contraseña && email) {
                    await enviarCredencialesUsuario(email, nombre_completo, contrasenaFinal, username);
                }
            }

            // 4. Registrar en auditoría
            await connection.execute(
                `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
                 VALUES (?, 'CREACION_VENDEDOR', ?)`,
                [req.user?.id || 1, `Se creó el vendedor ${nombre_completo} (${identificacion})`]
            );

            await connection.commit();
            await connection.end();

            res.status(201).json({
                id_persona: idPersona,
                mensaje: 'Vendedor creado exitosamente',
                usuario_creado: usuarioCreado,
                ...(credenciales && { credenciales: credenciales }),
                ...(usuarioCreado && !contraseña && email && { 
                    credenciales_enviadas: true 
                })
            });

        } catch (error) {
            await connection.rollback();
            await connection.end();
            throw error;
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Error al crear vendedor', 
            detalles: error.message 
        });
    }
});

/* Actualizar vendedor */
app.put('/api/vendedores/:id', async (req, res) => {
    const { id } = req.params;
    const {
        tipo_documento,
        identificacion,
        nombre_completo,
        nacionalidad,
        id_estado_civil,
        ocupacion,
        direccion,
        telefono_principal,
        telefono_secundario,
        email,
        observacion,
        estado
    } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar que el vendedor existe
        const [existingVendedor] = await connection.execute(
            `SELECT p.* FROM PERSONAS p
             INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
             WHERE p.ID_PERSONA = ? AND pr.ID_ROL = 5`,
            [id]
        );

        if (existingVendedor.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }

        // Verificar si la nueva identificación ya existe (si se cambia)
        if (identificacion && identificacion !== existingVendedor[0].IDENTIFICACION) {
            const [existingIdentificacion] = await connection.execute(
                'SELECT ID_PERSONA FROM PERSONAS WHERE IDENTIFICACION = ? AND ID_PERSONA != ?',
                [identificacion, id]
            );

            if (existingIdentificacion.length > 0) {
                await connection.end();
                return res.status(400).json({ error: 'La identificación ya está registrada' });
            }
        }

        // Verificar si el nuevo email ya existe (si se cambia)
        if (email && email !== existingVendedor[0].EMAIL) {
            const [existingEmail] = await connection.execute(
                'SELECT ID_PERSONA FROM PERSONAS WHERE EMAIL = ? AND ID_PERSONA != ?',
                [email, id]
            );

            if (existingEmail.length > 0) {
                await connection.end();
                return res.status(400).json({ error: 'El email ya está registrado' });
            }
        }

        // Actualizar persona
        const [result] = await connection.execute(
            `UPDATE PERSONAS SET
                TIPO_DOCUMENTO = COALESCE(?, TIPO_DOCUMENTO),
                IDENTIFICACION = COALESCE(?, IDENTIFICACION),
                NOMBRE_COMPLETO = COALESCE(?, NOMBRE_COMPLETO),
                NACIONALIDAD = COALESCE(?, NACIONALIDAD),
                ID_ESTADO_CIVIL = COALESCE(?, ID_ESTADO_CIVIL),
                OCUPACION = COALESCE(?, OCUPACION),
                DIRECCION = COALESCE(?, DIRECCION),
                TELEFONO_PRINCIPAL = COALESCE(?, TELEFONO_PRINCIPAL),
                TELEFONO_SECUNDARIO = COALESCE(?, TELEFONO_SECUNDARIO),
                EMAIL = COALESCE(?, EMAIL),
                OBSERVACION = COALESCE(?, OBSERVACION),
                ESTADO = COALESCE(?, ESTADO)
             WHERE ID_PERSONA = ?`,
            [
                tipo_documento, identificacion, nombre_completo, nacionalidad,
                id_estado_civil, ocupacion, direccion, telefono_principal,
                telefono_secundario, email, observacion, estado, id
            ]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }

        // Registrar en auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
             VALUES (?, 'ACTUALIZACION_VENDEDOR', ?)`,
            [req.user?.id || 1, `Se actualizó el vendedor ID: ${id}`]
        );

        await connection.end();
        
        res.json({ 
            mensaje: 'Vendedor actualizado exitosamente',
            id_persona: id
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al actualizar vendedor' });
    }
});

/* Desactivar/Activar vendedor (cambiar estado) */
app.patch('/api/vendedores/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { estado, motivo } = req.body;

    try {
        if (!estado || !['ACTIVO', 'INACTIVO'].includes(estado)) {
            return res.status(400).json({ 
                error: 'Estado no válido. Use: ACTIVO o INACTIVO' 
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar que el vendedor existe
        const [existingVendedor] = await connection.execute(
            `SELECT p.* FROM PERSONAS p
             INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
             WHERE p.ID_PERSONA = ? AND pr.ID_ROL = 5`,
            [id]
        );

        if (existingVendedor.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }

        // Actualizar estado de la persona
        await connection.execute(
            `UPDATE PERSONAS SET ESTADO = ? WHERE ID_PERSONA = ?`,
            [estado, id]
        );

        // Actualizar estado del rol
        await connection.execute(
            `UPDATE PERSONAS_ROLES SET ESTADO = ? 
             WHERE ID_PERSONA = ? AND ID_ROL = 5`,
            [estado, id]
        );

        // Si se desactiva, también desactivar usuario si existe
        if (estado === 'INACTIVO') {
            await connection.execute(
                `UPDATE USUARIOS SET ESTADO = 'INACTIVO' 
                 WHERE ID_PERSONA = ?`,
                [id]
            );
        }

        // Registrar en auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
             VALUES (?, 'CAMBIO_ESTADO_VENDEDOR', ?)`,
            [req.user?.id || 1, `Se ${estado === 'ACTIVO' ? 'activó' : 'desactivó'} el vendedor ID: ${id}. Motivo: ${motivo || 'No especificado'}`]
        );

        await connection.end();
        
        res.json({ 
            mensaje: `Vendedor ${estado === 'ACTIVO' ? 'activado' : 'desactivado'} exitosamente`,
            estado: estado
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al cambiar estado del vendedor' });
    }
});

/* Eliminar vendedor (solo si no tiene ventas asociadas) */
app.delete('/api/vendedores/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si el vendedor tiene ventas asociadas
        const [ventas] = await connection.execute(
            'SELECT COUNT(*) as count FROM VENTAS WHERE ID_VENDEDOR = ?',
            [id]
        );

        if (ventas[0].count > 0) {
            await connection.end();
            return res.status(400).json({ 
                error: 'No se puede eliminar el vendedor porque tiene ventas asociadas' 
            });
        }

        // Verificar si tiene usuario
        const [usuario] = await connection.execute(
            'SELECT ID_USUARIO FROM USUARIOS WHERE ID_PERSONA = ?',
            [id]
        );

        // Eliminar usuario si existe
        if (usuario.length > 0) {
            await connection.execute(
                'DELETE FROM USUARIOS WHERE ID_PERSONA = ?',
                [id]
            );
        }

        // Eliminar asignaciones de roles
        await connection.execute(
            'DELETE FROM PERSONAS_ROLES WHERE ID_PERSONA = ?',
            [id]
        );

        // Eliminar persona
        await connection.execute(
            'DELETE FROM PERSONAS WHERE ID_PERSONA = ?',
            [id]
        );

        // Registrar en auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
             VALUES (?, 'ELIMINACION_VENDEDOR', ?)`,
            [req.user?.id || 1, `Se eliminó el vendedor ID: ${id}`]
        );

        await connection.end();
        
        res.json({ mensaje: 'Vendedor eliminado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al eliminar vendedor' });
    }
});

/* Buscar vendedores con filtros*/
app.get('/api/vendedores/buscar/filtros', async (req, res) => {
    const {
        nombre,
        identificacion,
        estado,
        tiene_usuario,
        fecha_desde,
        fecha_hasta
    } = req.query;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        let query = `
            SELECT 
                p.*,
                pr.ID_PERSONA_ROL,
                pr.ID_ROL,
                pr.FECHA_ASIGNACION as fecha_asignacion_rol,
                pr.ESTADO as estado_rol,
                r.NOMBRE as nombre_rol,
                u.ID_USUARIO,
                u.USERNAME,
                u.ESTADO as estado_usuario,
                u.ULTIMO_ACCESO
            FROM PERSONAS p
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            INNER JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
            LEFT JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            WHERE pr.ID_ROL = 5
            AND pr.ESTADO = 'ACTIVO'
        `;

        const params = [];

        // Aplicar filtros
        if (nombre) {
            query += ' AND p.NOMBRE_COMPLETO LIKE ?';
            params.push(`%${nombre}%`);
        }

        if (identificacion) {
            query += ' AND p.IDENTIFICACION LIKE ?';
            params.push(`%${identificacion}%`);
        }

        if (estado) {
            query += ' AND p.ESTADO = ?';
            params.push(estado);
        }

        if (tiene_usuario === 'true') {
            query += ' AND u.ID_USUARIO IS NOT NULL';
        } else if (tiene_usuario === 'false') {
            query += ' AND u.ID_USUARIO IS NULL';
        }

        if (fecha_desde) {
            query += ' AND DATE(p.FECHA_REGISTRO) >= ?';
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            query += ' AND DATE(p.FECHA_REGISTRO) <= ?';
            params.push(fecha_hasta);
        }

        query += ' ORDER BY p.NOMBRE_COMPLETO';

        const [vendedores] = await connection.execute(query, params);
        
        await connection.end();
        
        res.json({
            total: vendedores.length,
            filtros_aplicados: {
                nombre,
                identificacion,
                estado,
                tiene_usuario,
                fecha_desde,
                fecha_hasta
            },
            vendedores: vendedores.map(v => ({
                ...v,
                tiene_usuario: !!v.ID_USUARIO
            }))
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al buscar vendedores' });
    }
});

/* Obtener estadísticas de vendedores */
app.get('/api/vendedores/estadisticas', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        // Estadísticas generales
        const [estadisticas] = await connection.execute(`
            SELECT 
                COUNT(*) as total_vendedores,
                SUM(CASE WHEN p.ESTADO = 'ACTIVO' THEN 1 ELSE 0 END) as vendedores_activos,
                SUM(CASE WHEN p.ESTADO = 'INACTIVO' THEN 1 ELSE 0 END) as vendedores_inactivos,
                SUM(CASE WHEN u.ID_USUARIO IS NOT NULL THEN 1 ELSE 0 END) as vendedores_con_usuario,
                AVG(CASE WHEN u.ULTIMO_ACCESO IS NOT NULL THEN 1 ELSE 0 END) * 100 as porcentaje_con_acceso
            FROM PERSONAS p
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            LEFT JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            WHERE pr.ID_ROL = 5
            AND pr.ESTADO = 'ACTIVO'
        `);
        // Top 5 vendedores por ventas
        const [topVendedores] = await connection.execute(`
            SELECT 
                p.ID_PERSONA,
                p.NOMBRE_COMPLETO,
                COUNT(v.ID_VENTA) as total_ventas,
                SUM(fp.PRIMA) as total_prima,
                SUM(fp.SALDO) as total_saldo_pendiente
            FROM PERSONAS p
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            LEFT JOIN VENTAS v ON p.ID_PERSONA = v.ID_VENDEDOR
            LEFT JOIN FORMAS_PAGO fp ON v.ID_VENTA = fp.ID_VENTA
            WHERE pr.ID_ROL = 5
            AND pr.ESTADO = 'ACTIVO'
            GROUP BY p.ID_PERSONA, p.NOMBRE_COMPLETO
            ORDER BY total_ventas DESC
            LIMIT 5
        `);

        // Ventas por mes (últimos 6 meses)
        const [ventasPorMes] = await connection.execute(`
            SELECT 
                DATE_FORMAT(v.FECHA_VENTA, '%Y-%m') as mes,
                COUNT(*) as total_ventas,
                SUM(fp.PRIMA) as total_prima
            FROM VENTAS v
            LEFT JOIN FORMAS_PAGO fp ON v.ID_VENTA = fp.ID_VENTA
            WHERE v.FECHA_VENTA >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(v.FECHA_VENTA, '%Y-%m')
            ORDER BY mes DESC
        `);

        await connection.end();
        
        res.json({
            estadisticas: estadisticas[0],
            top_vendedores: topVendedores,
            ventas_por_mes: ventasPorMes
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

/* 2. USUARIOS DE VENDEDORES */
/* Crear usuario para vendedor existente */
app.post('/api/vendedores/:id/usuarios', async (req, res) => {
    const { id } = req.params;
    const { username, contraseña, enviar_credenciales = true } = req.body;

    try {
        if (!username) {
            return res.status(400).json({ 
                error: 'El username es requerido' 
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar que el vendedor existe y es vendedor
        const [vendedor] = await connection.execute(
            `SELECT p.* FROM PERSONAS p
             INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
             WHERE p.ID_PERSONA = ? AND pr.ID_ROL = 5 AND pr.ESTADO = 'ACTIVO'`,
            [id]
        );

        if (vendedor.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }

        // Verificar si ya tiene usuario
        const [existingUser] = await connection.execute(
            'SELECT ID_USUARIO FROM USUARIOS WHERE ID_PERSONA = ?',
            [id]
        );

        if (existingUser.length > 0) {
            await connection.end();
            return res.status(400).json({ 
                error: 'El vendedor ya tiene un usuario asociado' 
            });
        }

        // Verificar si username ya existe
        const [existingUsername] = await connection.execute(
            'SELECT ID_USUARIO FROM USUARIOS WHERE USERNAME = ?',
            [username]
        );

        if (existingUsername.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'El username ya está en uso' });
        }

        // Generar contraseña
        const contrasenaFinal = contraseña || generarContrasenaTemporal();
        
        // Validar fortaleza de contraseña si se proporciona
        if (contraseña) {
            const validacion = validarFortalezaContrasena(contraseña);
            if (!validacion.esValida) {
                await connection.end();
                return res.status(400).json({ 
                    error: 'La contraseña no cumple con los requisitos de seguridad',
                    detalles: validacion.requisitos
                });
            }
        }

        const contrasenaEncriptada = await bcrypt.hash(contrasenaFinal, 12);

        // Crear usuario
        const [result] = await connection.execute(
            `INSERT INTO USUARIOS (
                ID_PERSONA, USERNAME, PASSWORD_HASH, ESTADO
            ) VALUES (?, ?, ?, 'ACTIVO')`,
            [id, username, contrasenaEncriptada]
        );

        // Enviar credenciales por email si se solicita
        let credencialesEnviadas = false;
        if (enviar_credenciales && vendedor[0].EMAIL) {
            try {
                await enviarCredencialesUsuario(
                    vendedor[0].EMAIL, 
                    vendedor[0].NOMBRE_COMPLETO, 
                    contraseña ? '*** (proporcionada por el usuario)' : contrasenaFinal, 
                    username
                );
                credencialesEnviadas = true;
            } catch (emailError) {
                console.error('Error enviando email:', emailError);
            }
        }

        // Registrar en auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
             VALUES (?, 'CREACION_USUARIO_VENDEDOR', ?)`,
            [req.user?.id || 1, `Se creó usuario para vendedor ID: ${id}. Username: ${username}`]
        );

        await connection.end();
        
        res.status(201).json({
            id_usuario: result.insertId,
            mensaje: 'Usuario creado exitosamente',
            credenciales: {
                username: username,
                contraseña: contraseña ? '*** (proporcionada por el usuario)' : contrasenaFinal
            },
            credenciales_enviadas: credencialesEnviadas
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

/* Actualizar usuario de vendedor */
app.put('/api/vendedores/:id/usuarios', async (req, res) => {
    const { id } = req.params;
    const { 
        username, 
        contraseña, 
        estado,
        resetear_intentos = false 
    } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar que el vendedor tiene usuario
        const [usuario] = await connection.execute(
            `SELECT u.* FROM USUARIOS u
             INNER JOIN PERSONAS p ON u.ID_PERSONA = p.ID_PERSONA
             INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
             WHERE u.ID_PERSONA = ? AND pr.ID_ROL = 5`,
            [id]
        );

        if (usuario.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Usuario no encontrado para este vendedor' });
        }

        // Verificar si el nuevo username ya existe (si se cambia)
        if (username && username !== usuario[0].USERNAME) {
            const [existingUsername] = await connection.execute(
                'SELECT ID_USUARIO FROM USUARIOS WHERE USERNAME = ? AND ID_PERSONA != ?',
                [username, id]
            );

            if (existingUsername.length > 0) {
                await connection.end();
                return res.status(400).json({ error: 'El username ya está en uso' });
            }
        }

        // Preparar campos a actualizar
        const updates = [];
        const params = [];

        if (username) {
            updates.push('USERNAME = ?');
            params.push(username);
        }

        if (contraseña) {
            // Validar fortaleza de contraseña
            const validacion = validarFortalezaContrasena(contraseña);
            if (!validacion.esValida) {
                await connection.end();
                return res.status(400).json({ 
                    error: 'La contraseña no cumple con los requisitos de seguridad',
                    detalles: validacion.requisitos
                });
            }

            const contrasenaEncriptada = await bcrypt.hash(contraseña, 12);
            updates.push('PASSWORD_HASH = ?');
            params.push(contrasenaEncriptada);
        }

        if (estado) {
            if (!['ACTIVO', 'INACTIVO', 'BLOQUEADO'].includes(estado)) {
                await connection.end();
                return res.status(400).json({ 
                    error: 'Estado no válido. Use: ACTIVO, INACTIVO o BLOQUEADO' 
                });
            }
            updates.push('ESTADO = ?');
            params.push(estado);
            
            // Si se desbloquea, resetear intentos fallidos
            if (estado === 'ACTIVO') {
                updates.push('INTENTOS_FALLIDOS = 0');
                updates.push('FECHA_BLOQUEO = NULL');
            }
        }

        if (resetear_intentos) {
            updates.push('INTENTOS_FALLIDOS = 0');
            updates.push('FECHA_BLOQUEO = NULL');
        }

        if (updates.length === 0) {
            await connection.end();
            return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
        }

        params.push(id);

        // Actualizar usuario
        const query = `UPDATE USUARIOS SET ${updates.join(', ')} WHERE ID_PERSONA = ?`;
        const [result] = await connection.execute(query, params);

        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Registrar en auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
             VALUES (?, 'ACTUALIZACION_USUARIO_VENDEDOR', ?)`,
            [req.user?.id || 1, `Se actualizó usuario del vendedor ID: ${id}`]
        );

        await connection.end();
        
        res.json({ 
            mensaje: 'Usuario actualizado exitosamente',
            cambios: updates
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

/* Eliminar usuario de vendedor */
app.delete('/api/vendedores/:id/usuarios', async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar que el vendedor tiene usuario
        const [usuario] = await connection.execute(
            'SELECT ID_USUARIO FROM USUARIOS WHERE ID_PERSONA = ?',
            [id]
        );

        if (usuario.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Usuario no encontrado para este vendedor' });
        }

        // Eliminar usuario
        await connection.execute(
            'DELETE FROM USUARIOS WHERE ID_PERSONA = ?',
            [id]
        );

        // Registrar en auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
             VALUES (?, 'ELIMINACION_USUARIO_VENDEDOR', ?)`,
            [req.user?.id || 1, `Se eliminó usuario del vendedor ID: ${id}`]
        );

        await connection.end();
        
        res.json({ mensaje: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

/* Registrar último acceso de vendedor */
app.post('/api/vendedores/:id/ultimo-acceso', async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Actualizar último acceso
        await connection.execute(
            `UPDATE USUARIOS SET ULTIMO_ACCESO = NOW() 
             WHERE ID_PERSONA = ?`,
            [id]
        );

        await connection.end();
        
        res.json({ mensaje: 'Último acceso actualizado' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al actualizar último acceso' });
    }
});

/* 3. ROLES Y ASIGNACIONES */
/* Obtener todos los roles disponibles */
app.get('/api/roles', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [roles] = await connection.execute(
            'SELECT * FROM ROLES ORDER BY NOMBRE'
        );
        
        await connection.end();
        
        res.json({
            total: roles.length,
            roles: roles
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener roles' });
    }
});

/* Asignar rol adicional a vendedor */
app.post('/api/vendedores/:id/roles', async (req, res) => {
    const { id } = req.params;
    const { id_rol, estado = 'ACTIVO' } = req.body;

    try {
        if (!id_rol) {
            return res.status(400).json({ 
                error: 'El ID del rol es requerido' 
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar que el rol existe
        const [rol] = await connection.execute(
            'SELECT * FROM ROLES WHERE ID_ROL = ?',
            [id_rol]
        );

        if (rol.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        // Verificar que la persona existe y es vendedor
        const [persona] = await connection.execute(
            `SELECT p.* FROM PERSONAS p
             INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
             WHERE p.ID_PERSONA = ? AND pr.ID_ROL = 5`,
            [id]
        );

        if (persona.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }

        // Verificar si ya tiene asignado este rol
        const [existingAsignacion] = await connection.execute(
            'SELECT * FROM PERSONAS_ROLES WHERE ID_PERSONA = ? AND ID_ROL = ?',
            [id, id_rol]
        );

        if (existingAsignacion.length > 0) {
            // Actualizar estado si ya existe
            await connection.execute(
                `UPDATE PERSONAS_ROLES SET ESTADO = ? 
                 WHERE ID_PERSONA = ? AND ID_ROL = ?`,
                [estado, id, id_rol]
            );

            await connection.end();
            return res.json({ 
                mensaje: 'Rol actualizado exitosamente',
                actualizado: true
            });
        }

        // Crear nueva asignación
        await connection.execute(
            `INSERT INTO PERSONAS_ROLES (ID_PERSONA, ID_ROL, ESTADO) 
             VALUES (?, ?, ?)`,
            [id, id_rol, estado]
        );

        // Registrar en auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
             VALUES (?, 'ASIGNACION_ROL', ?)`,
            [req.user?.id || 1, `Se asignó rol ${rol[0].NOMBRE} al vendedor ID: ${id}`]
        );

        await connection.end();
        
        res.status(201).json({ 
            mensaje: 'Rol asignado exitosamente',
            rol: rol[0].NOMBRE
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al asignar rol' });
    }
});

/* Remover rol de vendedor */
app.delete('/api/vendedores/:id/roles/:idRol', async (req, res) => {
    const { id, idRol } = req.params;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // No permitir eliminar el rol de vendedor principal (ID 5)
        if (parseInt(idRol) === 5) {
            await connection.end();
            return res.status(400).json({ 
                error: 'No se puede eliminar el rol principal de vendedor' 
            });
        }

        // Verificar que la asignación existe
        const [asignacion] = await connection.execute(
            'SELECT * FROM PERSONAS_ROLES WHERE ID_PERSONA = ? AND ID_ROL = ?',
            [id, idRol]
        );

        if (asignacion.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Asignación de rol no encontrada' });
        }

        // Obtener nombre del rol para auditoría
        const [rol] = await connection.execute(
            'SELECT NOMBRE FROM ROLES WHERE ID_ROL = ?',
            [idRol]
        );

        // Eliminar asignación
        await connection.execute(
            'DELETE FROM PERSONAS_ROLES WHERE ID_PERSONA = ? AND ID_ROL = ?',
            [id, idRol]
        );

        // Registrar en auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
             VALUES (?, 'ELIMINACION_ROL', ?)`,
            [req.user?.id || 1, `Se eliminó rol ${rol[0]?.NOMBRE || idRol} del vendedor ID: ${id}`]
        );

        await connection.end();
        
        res.json({ 
            mensaje: 'Rol removido exitosamente',
            rol: rol[0]?.NOMBRE || idRol
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al remover rol' });
    }
});

/* Obtener roles asignados a vendedor */
app.get('/api/vendedores/:id/roles', async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [roles] = await connection.execute(`
            SELECT 
                r.*,
                pr.ID_PERSONA_ROL,
                pr.ESTADO as estado_asignacion,
                pr.FECHA_ASIGNACION
            FROM ROLES r
            INNER JOIN PERSONAS_ROLES pr ON r.ID_ROL = pr.ID_ROL
            WHERE pr.ID_PERSONA = ?
            ORDER BY r.NOMBRE
        `, [id]);
        
        await connection.end();
        
        res.json({
            total: roles.length,
            roles: roles
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener roles del vendedor' });
    }
});

/* Obtener ventas de un vendedor */
app.get('/api/vendedores/:id/ventas', async (req, res) => {
    const { id } = req.params;
    const { 
        fecha_desde, 
        fecha_hasta, 
        estado_pago,
        limite = 50,
        pagina = 1
    } = req.query;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Query base con toda la información necesaria
        let query = `
            SELECT 
                v.ID_VENTA,
                v.CODIGO_VENTA,
                v.FECHA_VENTA,
                v.FECHA_CANCELACION,
                v.ESTADO_PAGO,
                v.OBSERVACIONES_VENTA,
                v.PV_PURDI,
                v.NOMBRE_NOTARIO,
                v.FECHA_APROBACION,
                
                -- Datos del vehículo
                veh.ID_VEHICULO,
                veh.PLACA,
                veh.ID_MARCA,
                veh.MODELO,
                veh.ESTILO,
                veh.CHASIS,
                m.NOMBRE as marca_nombre,
                
                -- Datos de clientes
                cf.ID_PERSONA as id_cliente_facturacion,
                cf.NOMBRE_COMPLETO as cliente_facturacion,
                cf.IDENTIFICACION as identificacion_facturacion,
                ci.ID_PERSONA as id_cliente_inscripcion,
                ci.NOMBRE_COMPLETO as cliente_inscripcion,
                ci.IDENTIFICACION as identificacion_inscripcion,
                
                -- Resumen de pagos
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN dp.MONEDA = 'USD' THEN dp.EFECTIVO * dp.TIPO_CAMBIO 
                        ELSE dp.EFECTIVO 
                    END)
                    FROM DETALLE_PAGOS dp 
                    WHERE dp.ID_VENTA = v.ID_VENTA
                ), 0) as total_efectivo_crc,
                
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN dp.MONEDA = 'USD' THEN dp.TRANSFERENCIA * dp.TIPO_CAMBIO 
                        ELSE dp.TRANSFERENCIA 
                    END)
                    FROM DETALLE_PAGOS dp 
                    WHERE dp.ID_VENTA = v.ID_VENTA
                ), 0) as total_transferencias_crc,
                
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN dp.MONEDA = 'USD' THEN dp.TARJETA * dp.TIPO_CAMBIO 
                        ELSE dp.TARJETA 
                    END)
                    FROM DETALLE_PAGOS dp 
                    WHERE dp.ID_VENTA = v.ID_VENTA
                ), 0) as total_tarjetas_crc,
                
                -- Datos de financiamiento
                f.ID_FINANCIAMIENTOS,
                f.PRIMA as prima_financiamiento,
                f.HONORARIOS,
                f.MONTO_FINANCIAR,
                f.TOTAL as total_financiamiento,
                f.TASA_NOMINAL,
                f.TASA_MENSUAL,
                f.INTERES_MORATORIO,
                f.INTERESXADELANTO,
                f.PRESTAMO_TOTAL,
                f.PLAZO_MESES,
                f.ENTIDAD_FINANCIERA,
                f.CUOTA_MENSUAL,
                f.FECHA_PRIMERPAGO,
                
                -- Anticipos totales
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN a.MONEDA = 'USD' THEN a.MONTO_DOLARES * a.TIPO_CAMBIO 
                        ELSE a.MONTO_COLONES 
                    END)
                    FROM ANTICIPOS a
                    INNER JOIN FINANCIAMIENTOS f2 ON a.ID_FINANCIAMIENTO = f2.ID_FINANCIAMIENTOS
                    WHERE f2.ID_VENTA = v.ID_VENTA AND a.ESTADO_ANTICIPO != 'COMPLETADO'
                ), 0) as anticipos_pendientes,
                
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN a.MONEDA = 'USD' THEN a.MONTO_DOLARES * a.TIPO_CAMBIO 
                        ELSE a.MONTO_COLONES 
                    END)
                    FROM ANTICIPOS a
                    INNER JOIN FINANCIAMIENTOS f2 ON a.ID_FINANCIAMIENTO = f2.ID_FINANCIAMIENTOS
                    WHERE f2.ID_VENTA = v.ID_VENTA
                ), 0) as total_anticipos,
                
                -- Totales
                (
                    COALESCE((
                        SELECT SUM(CASE 
                            WHEN dp.MONEDA = 'USD' THEN (dp.EFECTIVO + dp.TRANSFERENCIA + dp.TARJETA) * dp.TIPO_CAMBIO 
                            ELSE (dp.EFECTIVO + dp.TRANSFERENCIA + dp.TARJETA) 
                        END)
                        FROM DETALLE_PAGOS dp 
                        WHERE dp.ID_VENTA = v.ID_VENTA
                    ), 0)
                ) as total_pagado_crc
                
            FROM VENTAS v
            INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
            INNER JOIN CAT_MARCAS m ON veh.ID_MARCA = m.ID_MARCA
            INNER JOIN PERSONAS cf ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
            LEFT JOIN PERSONAS ci ON v.ID_CLIENTE_INSCRIPCION = ci.ID_PERSONA
            LEFT JOIN FINANCIAMIENTOS f ON v.ID_VENTA = f.ID_VENTA
            WHERE v.ID_VENDEDOR = ?
        `;

        const params = [id];
        const offset = (pagina - 1) * limite;

        // Aplicar filtros
        if (fecha_desde) {
            query += ' AND DATE(v.FECHA_VENTA) >= ?';
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            query += ' AND DATE(v.FECHA_VENTA) <= ?';
            params.push(fecha_hasta);
        }

        if (estado_pago) {
            query += ' AND v.ESTADO_PAGO = ?';
            params.push(estado_pago);
        }

        // Query para contar total de registros
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM VENTAS v 
            WHERE v.ID_VENDEDOR = ? 
            ${fecha_desde ? 'AND DATE(v.FECHA_VENTA) >= ?' : ''}
            ${fecha_hasta ? 'AND DATE(v.FECHA_VENTA) <= ?' : ''}
            ${estado_pago ? 'AND v.ESTADO_PAGO = ?' : ''}
        `;
        
        const countParams = [id];
        if (fecha_desde) countParams.push(fecha_desde);
        if (fecha_hasta) countParams.push(fecha_hasta);
        if (estado_pago) countParams.push(estado_pago);
        
        const [countResult] = await connection.execute(countQuery, countParams);
        const totalRegistros = countResult[0].total;

        // Aplicar paginación
        query += ' ORDER BY v.FECHA_VENTA DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limite), offset);

        const [ventas] = await connection.execute(query, params);
        
        await connection.end();
        
        // Formatear la respuesta
        const ventasFormateadas = ventas.map(v => ({
            ...v,
            tipo_venta: v.ID_FINANCIAMIENTOS ? 'CREDITO' : 'CONTADO',
            total_pagado_crc: parseFloat(v.total_pagado_crc) || 0,
            saldo_pendiente: v.ID_FINANCIAMIENTOS ? 
                (parseFloat(v.total_financiamiento || 0) - parseFloat(v.total_pagado_crc || 0)) : 0
        }));
        
        res.json({
            total: totalRegistros,
            pagina: parseInt(pagina),
            por_pagina: parseInt(limite),
            total_paginas: Math.ceil(totalRegistros / limite),
            ventas: ventasFormateadas
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener ventas del vendedor' });
    }
});

// ===== API ADICIONAL: OBTENER DETALLE COMPLETO DE UNA VENTA =====
app.get('/api/ventas/:id/detalle', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [ventas] = await connection.execute(`
            SELECT 
                v.*,
                -- Vendedor
                vend.NOMBRE_COMPLETO as vendedor_nombre,
                vend.IDENTIFICACION as vendedor_identificacion,
                -- Aprobador
                aprob.NOMBRE_COMPLETO as aprobador_nombre,
                -- Vehículo
                veh.*,
                m.NOMBRE as marca_nombre,
                c.NOMBRE as color_nombre,
                comb.NOMBRE as combustible_nombre,
                t.NOMBRE as transmision_nombre,
                -- Clientes
                cf.NOMBRE_COMPLETO as cliente_facturacion_nombre,
                cf.IDENTIFICACION as cliente_facturacion_identificacion,
                cf.TELEFONO_PRINCIPAL as cliente_facturacion_telefono,
                cf.EMAIL as cliente_facturacion_email,
                ci.NOMBRE_COMPLETO as cliente_inscripcion_nombre,
                ci.IDENTIFICACION as cliente_inscripcion_identificacion,
                -- Pagos
                dp.*,
                -- Financiamiento
                f.*
            FROM VENTAS v
            INNER JOIN PERSONAS vend ON v.ID_VENDEDOR = vend.ID_PERSONA
            LEFT JOIN PERSONAS aprob ON v.ID_APROBADOR = aprob.ID_PERSONA
            INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
            LEFT JOIN CAT_MARCAS m ON veh.ID_MARCA = m.ID_MARCA
            LEFT JOIN CAT_COLORES c ON veh.ID_COLOR = c.ID_COLOR
            LEFT JOIN CAT_COMBUSTIBLES comb ON veh.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
            LEFT JOIN CAT_TRANSMISIONES t ON veh.ID_TRANSMISION = t.ID_TRANSMISION
            INNER JOIN PERSONAS cf ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
            LEFT JOIN PERSONAS ci ON v.ID_CLIENTE_INSCRIPCION = ci.ID_PERSONA
            LEFT JOIN DETALLE_PAGOS dp ON v.ID_VENTA = dp.ID_VENTA
            LEFT JOIN FINANCIAMIENTOS f ON v.ID_VENTA = f.ID_VENTA
            WHERE v.ID_VENTA = ?
        `, [req.params.id]);
        
        if (ventas.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        // Obtener anticipos si existe financiamiento
        let anticipos = [];
        if (ventas[0].ID_FINANCIAMIENTOS) {
            const [anticiposResult] = await connection.execute(`
                SELECT a.*
                FROM ANTICIPOS a
                WHERE a.ID_FINANCIAMIENTO = ?
                ORDER BY a.FECHA_ANTICIPO DESC
            `, [ventas[0].ID_FINANCIAMIENTOS]);
            anticipos = anticiposResult;
        }
        
        await connection.end();
        
        res.json({
            venta: ventas[0],
            anticipos: anticipos
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener detalle de venta' });
    }
});

/* Exportar vendedores a Excel */
app.get('/api/vendedores/exportar/excel', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [vendedores] = await connection.execute(`
            SELECT 
                p.ID_PERSONA, p.IDENTIFICACION, p.NOMBRE_COMPLETO,
                p.OCUPACION, p.TELEFONO_PRINCIPAL, p.EMAIL, p.ESTADO as estado_persona,
                u.USERNAME, u.ESTADO as estado_usuario, u.ULTIMO_ACCESO, u.INTENTOS_FALLIDOS,
                COALESCE(v.total_ventas, 0) as total_ventas, COALESCE(v.total_prima, 0) as total_prima
            FROM PERSONAS p
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            LEFT JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            LEFT JOIN (
                SELECT 
                    ID_VENDEDOR,
                    COUNT(*) as total_ventas,
                    SUM(fp.PRIMA) as total_prima
                FROM VENTAS v
                LEFT JOIN FORMAS_PAGO fp ON v.ID_VENTA = fp.ID_VENTA
                GROUP BY ID_VENDEDOR
            ) v ON p.ID_PERSONA = v.ID_VENDEDOR
            WHERE pr.ID_ROL = 5
            AND pr.ESTADO = 'ACTIVO'
            ORDER BY p.NOMBRE_COMPLETO
        `);
        
        await connection.end();
        
        // Aquí iría la lógica para generar el Excel
        // Por ahora devolvemos JSON
        res.json({
            total: vendedores.length,
            vendedores: vendedores,
            formato: 'excel',
            fecha_generacion: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al exportar vendedores' });
    }
});

// APIS PARA PERSONAS
// Obtener todas las personas
app.get('/api/personas', async (req, res) => {
    try {
        const { nombre, identificacion, estado } = req.query;
        let query = `
            SELECT p.*, ec.NOMBRE as estado_civil_nombre 
            FROM PERSONAS p
            LEFT JOIN CAT_ESTADOS_CIVIL ec ON p.ID_ESTADO_CIVIL = ec.ID_ESTADO_CIVIL
            WHERE 1=1
        `;
        
        const params = [];
        
        if (nombre) {
            // MEJORADO: buscar en nombre Y identificación
            query += ' AND (p.NOMBRE_COMPLETO LIKE ? OR p.IDENTIFICACION LIKE ?)';
            params.push(`%${nombre}%`, `%${nombre}%`);
        }
        
        if (identificacion) {
            query += ' AND p.IDENTIFICACION LIKE ?';
            params.push(`%${identificacion}%`);
        }
        
        if (estado) {
            query += ' AND p.ESTADO = ?';
            params.push(estado);
        }
        
        query += ' ORDER BY p.NOMBRE_COMPLETO LIMIT 50'; // Añadido límite
        
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(query, params);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener personas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener una persona por ID
app.get('/api/personas/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT p.*, ec.NOMBRE as estado_civil_nombre 
             FROM PERSONAS p
             LEFT JOIN CAT_ESTADOS_CIVIL ec ON p.ID_ESTADO_CIVIL = ec.ID_ESTADO_CIVIL
             WHERE p.ID_PERSONA = ?`,
            [req.params.id]
        );
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener persona:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear una nueva persona
app.post('/api/personas', async (req, res) => {
    try {
        const {
            TIPO_DOCUMENTO,
            IDENTIFICACION,
            NOMBRE_COMPLETO,
            NACIONALIDAD,
            ID_ESTADO_CIVIL,
            OCUPACION,
            DIRECCION,
            TELEFONO_PRINCIPAL,
            TELEFONO_SECUNDARIO,
            EMAIL,
            OBSERVACION,
            ESTADO
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Insertar persona
        const [result] = await connection.execute(
            `INSERT INTO PERSONAS (
                TIPO_DOCUMENTO, IDENTIFICACION, NOMBRE_COMPLETO, NACIONALIDAD,
                ID_ESTADO_CIVIL, OCUPACION, DIRECCION, TELEFONO_PRINCIPAL,
                TELEFONO_SECUNDARIO, EMAIL, OBSERVACION, ESTADO
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                TIPO_DOCUMENTO, IDENTIFICACION, NOMBRE_COMPLETO, NACIONALIDAD,
                ID_ESTADO_CIVIL || null, OCUPACION || null, DIRECCION || null,
                TELEFONO_PRINCIPAL || null, TELEFONO_SECUNDARIO || null,
                EMAIL || null, OBSERVACION || null, ESTADO || 'ACTIVO'
            ]
        );
        
        await connection.end();
        
        res.json({ 
            id: result.insertId, 
            message: 'Persona creada exitosamente' 
        });
    } catch (err) {
        console.error('Error al crear persona:', err);
        
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'La identificación ya está registrada' });
        }
        
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Actualizar una persona
app.put('/api/personas/:id', async (req, res) => {
    try {
        const {
            TIPO_DOCUMENTO,
            IDENTIFICACION,
            NOMBRE_COMPLETO,
            NACIONALIDAD,
            ID_ESTADO_CIVIL,
            OCUPACION,
            DIRECCION,
            TELEFONO_PRINCIPAL,
            TELEFONO_SECUNDARIO,
            EMAIL,
            OBSERVACION,
            ESTADO
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            `UPDATE PERSONAS SET
                TIPO_DOCUMENTO = ?,
                IDENTIFICACION = ?,
                NOMBRE_COMPLETO = ?,
                NACIONALIDAD = ?,
                ID_ESTADO_CIVIL = ?,
                OCUPACION = ?,
                DIRECCION = ?,
                TELEFONO_PRINCIPAL = ?,
                TELEFONO_SECUNDARIO = ?,
                EMAIL = ?,
                OBSERVACION = ?,
                ESTADO = ?
            WHERE ID_PERSONA = ?`,
            [
                TIPO_DOCUMENTO, IDENTIFICACION, NOMBRE_COMPLETO, NACIONALIDAD,
                ID_ESTADO_CIVIL || null, OCUPACION || null, DIRECCION || null,
                TELEFONO_PRINCIPAL || null, TELEFONO_SECUNDARIO || null,
                EMAIL || null, OBSERVACION || null, ESTADO || 'ACTIVO',
                req.params.id
            ]
        );
        
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        
        res.json({ message: 'Persona actualizada exitosamente' });
    } catch (err) {
        console.error('Error al actualizar persona:', err);
        
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'La identificación ya está registrada' });
        }
        
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Desactivar una persona
app.put('/api/personas/:id/desactivar', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Desactivar persona
        const [result] = await connection.execute(
            'UPDATE PERSONAS SET ESTADO = "INACTIVO" WHERE ID_PERSONA = ?',
            [req.params.id]
        );
        
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        
        res.json({ message: 'Persona desactivada exitosamente' });
    } catch (err) {
        console.error('Error al desactivar persona:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});
// Obtener personas con roles
app.get('/api/personas-con-roles', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT 
                p.*,
                GROUP_CONCAT(r.NOMBRE SEPARATOR ', ') as roles
            FROM PERSONAS p
            LEFT JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA AND pr.ESTADO = 'ACTIVO'
            LEFT JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
            WHERE p.ESTADO = 'ACTIVO'
            GROUP BY p.ID_PERSONA
            ORDER BY p.NOMBRE_COMPLETO
        `);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener personas con roles:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener proveedores Y clientes
app.get('/api/personas-proveedor-cliente', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT DISTINCT
                p.ID_PERSONA,
                p.NOMBRE_COMPLETO,
                p.IDENTIFICACION,
                p.TELEFONO_PRINCIPAL,
                p.EMAIL,
                GROUP_CONCAT(DISTINCT r.NOMBRE ORDER BY r.NOMBRE SEPARATOR ', ') as roles,
                MAX(CASE WHEN pr.ID_ROL = 4 THEN 1 ELSE 0 END) as es_proveedor,
                MAX(CASE WHEN pr.ID_ROL IN (1,2,3) THEN 1 ELSE 0 END) as es_cliente
            FROM PERSONAS p
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            INNER JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
            WHERE pr.ESTADO = 'ACTIVO'
              AND p.ESTADO = 'ACTIVO'
              AND pr.ID_ROL IN (1, 2, 3, 4)
            GROUP BY p.ID_PERSONA, p.NOMBRE_COMPLETO, p.IDENTIFICACION,
                     p.TELEFONO_PRINCIPAL, p.EMAIL
            ORDER BY p.NOMBRE_COMPLETO
        `);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener personas proveedor/cliente:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// APIS PARA USUARIOS 
// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT 
                u.*,
                p.NOMBRE_COMPLETO,
                p.IDENTIFICACION,
                p.EMAIL,
                p.TELEFONO_PRINCIPAL
            FROM USUARIOS u
            INNER JOIN PERSONAS p ON u.ID_PERSONA = p.ID_PERSONA
            ORDER BY u.ESTADO, u.USERNAME
        `);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener un usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT 
                u.*,
                p.NOMBRE_COMPLETO,
                p.IDENTIFICACION,
                p.EMAIL,
                p.TELEFONO_PRINCIPAL,
                p.TIPO_DOCUMENTO
            FROM USUARIOS u
            INNER JOIN PERSONAS p ON u.ID_PERSONA = p.ID_PERSONA
            WHERE u.ID_USUARIO = ?`,
            [req.params.id]
        );
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener usuario:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ===== API PARA OBTENER INFORMACIÓN DEL USUARIO =====
app.get('/api/usuarios/:id/info', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [usuarios] = await connection.execute(`
            SELECT 
                u.ID_USUARIO,
                u.USERNAME,
                p.ID_PERSONA,
                p.NOMBRE_COMPLETO,
                p.IDENTIFICACION,
                p.TELEFONO_PRINCIPAL,
                p.EMAIL,
                GROUP_CONCAT(DISTINCT r.NOMBRE) as ROLES
            FROM USUARIOS u
            INNER JOIN PERSONAS p ON u.ID_PERSONA = p.ID_PERSONA
            LEFT JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA AND pr.ESTADO = 'ACTIVO'
            LEFT JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
            WHERE u.ID_USUARIO = ?
            GROUP BY u.ID_USUARIO
        `, [req.params.id]);
        
        await connection.end();
        
        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = usuarios[0];
        const roles = usuario.ROLES ? usuario.ROLES.split(',') : [];
        
        res.json({
            ...usuario,
            ROL_PRINCIPAL: roles[0] || 'USUARIO',
            ROLES: roles
        });
        
    } catch (err) {
        console.error('Error al obtener usuario:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear un nuevo usuario
app.post('/api/usuarios', async (req, res) => {
    try {
        const {
            ID_PERSONA,
            USERNAME,
            PASSWORD,
            ESTADO
        } = req.body;
        
        // Validar que la persona existe y no tiene usuario
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar que la persona existe
        const [persona] = await connection.execute(
            'SELECT * FROM PERSONAS WHERE ID_PERSONA = ? AND ESTADO = "ACTIVO"',
            [ID_PERSONA]
        );
        
        if (persona.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Persona no encontrada o inactiva' });
        }
        
        // Verificar que no tenga usuario
        const [usuarioExistente] = await connection.execute(
            'SELECT * FROM USUARIOS WHERE ID_PERSONA = ?',
            [ID_PERSONA]
        );
        
        if (usuarioExistente.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'Esta persona ya tiene un usuario' });
        }
        
        // Verificar que el username no exista
        const [usernameExistente] = await connection.execute(
            'SELECT * FROM USUARIOS WHERE USERNAME = ?',
            [USERNAME]
        );
        
        if (usernameExistente.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'El nombre de usuario ya existe' });
        }
        
        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(PASSWORD, 12);
        
        // Insertar usuario
        const [result] = await connection.execute(
            `INSERT INTO USUARIOS (
                ID_PERSONA, USERNAME, PASSWORD_HASH, ESTADO
            ) VALUES (?, ?, ?, ?)`,
            [
                ID_PERSONA,
                USERNAME,
                hashedPassword,
                ESTADO || 'ACTIVO'
            ]
        );
        
        await connection.end();
        
        res.json({ 
            id: result.insertId, 
            message: 'Usuario creado exitosamente' 
        });
    } catch (err) {
        console.error('Error al crear usuario:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Actualizar un usuario
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const {
            USERNAME,
            PASSWORD,
            ESTADO,
            INTENTOS_FALLIDOS,
            FECHA_BLOQUEO,
            ULTIMO_ACCESO
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Construir query dinámica
        let query = 'UPDATE USUARIOS SET ';
        const params = [];
        const updates = [];
        
        if (USERNAME !== undefined) {
            // Verificar que el nuevo username no exista
            if (USERNAME) {
                const [usernameExistente] = await connection.execute(
                    'SELECT * FROM USUARIOS WHERE USERNAME = ? AND ID_USUARIO != ?',
                    [USERNAME, req.params.id]
                );
                
                if (usernameExistente.length > 0) {
                    await connection.end();
                    return res.status(400).json({ error: 'El nombre de usuario ya existe' });
                }
            }
            updates.push('USERNAME = ?');
            params.push(USERNAME);
        }
        
        if (PASSWORD !== undefined && PASSWORD) {
            const hashedPassword = await bcrypt.hash(PASSWORD, 10);
            updates.push('PASSWORD_HASH = ?');
            params.push(hashedPassword);
        }
        
        if (ESTADO !== undefined) {
            updates.push('ESTADO = ?');
            params.push(ESTADO);
        }
        
        if (INTENTOS_FALLIDOS !== undefined) {
            updates.push('INTENTOS_FALLIDOS = ?');
            params.push(INTENTOS_FALLIDOS);
        }
        
        if (FECHA_BLOQUEO !== undefined) {
            updates.push('FECHA_BLOQUEO = ?');
            params.push(FECHA_BLOQUEO);
        }
        
        if (ULTIMO_ACCESO !== undefined) {
            updates.push('ULTIMO_ACCESO = ?');
            params.push(ULTIMO_ACCESO);
        }
        
        if (updates.length === 0) {
            await connection.end();
            return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
        }
        
        query += updates.join(', ');
        query += ' WHERE ID_USUARIO = ?';
        params.push(req.params.id);
        
        const [result] = await connection.execute(query, params);
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Desactivar un usuario
app.put('/api/usuarios/:id/desactivar', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            'UPDATE USUARIOS SET ESTADO = "INACTIVO" WHERE ID_USUARIO = ?',
            [req.params.id]
        );
        
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({ message: 'Usuario desactivado exitosamente' });
    } catch (err) {
        console.error('Error al desactivar usuario:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// APIS PARA PERSONAS_ROLES (COMPLETAS)
// Obtener todas las asignaciones de roles
app.get('/api/personas-roles', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT 
                pr.*,
                p.NOMBRE_COMPLETO,
                p.IDENTIFICACION,
                r.NOMBRE as nombre_rol,
                r.DESCRIPCION as descripcion_rol
            FROM PERSONAS_ROLES pr
            INNER JOIN PERSONAS p ON pr.ID_PERSONA = p.ID_PERSONA
            INNER JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
            ORDER BY pr.FECHA_ASIGNACION DESC
        `);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener asignaciones de roles:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener roles de una persona específica
app.get('/api/personas/:id/roles', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT 
                pr.*,
                r.NOMBRE as nombre_rol,
                r.DESCRIPCION as descripcion_rol
            FROM PERSONAS_ROLES pr
            INNER JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
            WHERE pr.ID_PERSONA = ?
            ORDER BY pr.ESTADO, r.NOMBRE`,
            [req.params.id]
        );
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener roles de la persona:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Asignar un rol a una persona
app.post('/api/personas-roles', async (req, res) => {
    try {
        const {
            ID_PERSONA,
            ID_ROL,
            ESTADO
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar que la persona existe
        const [persona] = await connection.execute(
            'SELECT * FROM PERSONAS WHERE ID_PERSONA = ?',
            [ID_PERSONA]
        );
        
        if (persona.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        
        // Verificar que el rol existe
        const [rol] = await connection.execute(
            'SELECT * FROM ROLES WHERE ID_ROL = ?',
            [ID_ROL]
        );
        
        if (rol.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        
        // Verificar si ya tiene este rol asignado
        const [asignacionExistente] = await connection.execute(
            'SELECT * FROM PERSONAS_ROLES WHERE ID_PERSONA = ? AND ID_ROL = ?',
            [ID_PERSONA, ID_ROL]
        );
        
        if (asignacionExistente.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'Esta persona ya tiene asignado este rol' });
        }
        
        // Insertar asignación
        const [result] = await connection.execute(
            `INSERT INTO PERSONAS_ROLES (
                ID_PERSONA, ID_ROL, ESTADO
            ) VALUES (?, ?, ?)`,
            [
                ID_PERSONA,
                ID_ROL,
                ESTADO || 'ACTIVO'
            ]
        );
        
        await connection.end();
        
        res.json({ 
            id: result.insertId, 
            message: 'Rol asignado exitosamente' 
        });
    } catch (err) {
        console.error('Error al asignar rol:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Actualizar asignación de rol
app.put('/api/personas-roles/:id', async (req, res) => {
    try {
        const { ESTADO } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            'UPDATE PERSONAS_ROLES SET ESTADO = ? WHERE ID_PERSONA_ROL = ?',
            [ESTADO || 'ACTIVO', req.params.id]
        );
        
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Asignación no encontrada' });
        }
        
        res.json({ message: 'Asignación actualizada exitosamente' });
    } catch (err) {
        console.error('Error al actualizar asignación:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Desactivar asignación de rol
app.put('/api/personas-roles/:id/desactivar', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            'UPDATE PERSONAS_ROLES SET ESTADO = "INACTIVO" WHERE ID_PERSONA_ROL = ?',
            [req.params.id]
        );
        
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Asignación no encontrada' });
        }
        
        res.json({ message: 'Rol desasignado exitosamente' });
    } catch (err) {
        console.error('Error al desactivar asignación:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// APIS PARA ESTADÍSTICAS Y REPORTES
// Obtener estadísticas generales
app.get('/api/estadisticas/generales', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Total de personas por estado
        const [personasPorEstado] = await connection.execute(`
            SELECT 
                ESTADO,
                COUNT(*) as total
            FROM PERSONAS
            GROUP BY ESTADO
        `);
        
        // Total de usuarios por estado
        const [usuariosPorEstado] = await connection.execute(`
            SELECT 
                ESTADO,
                COUNT(*) as total
            FROM USUARIOS
            GROUP BY ESTADO
        `);
        
        // Total de roles asignados
        const [rolesAsignados] = await connection.execute(`
            SELECT 
                r.NOMBRE as rol,
                COUNT(pr.ID_PERSONA_ROL) as total
            FROM ROLES r
            LEFT JOIN PERSONAS_ROLES pr ON r.ID_ROL = pr.ID_ROL AND pr.ESTADO = 'ACTIVO'
            GROUP BY r.ID_ROL, r.NOMBRE
            ORDER BY total DESC
        `);
        
        // Vendedores activos con usuario
        const [vendedoresConUsuario] = await connection.execute(`
            SELECT 
                COUNT(DISTINCT p.ID_PERSONA) as total_vendedores,
                COUNT(DISTINCT u.ID_USUARIO) as vendedores_con_usuario,
                COUNT(DISTINCT CASE WHEN u.ESTADO = 'ACTIVO' THEN u.ID_USUARIO END) as usuarios_activos
            FROM PERSONAS p
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            LEFT JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            WHERE pr.ID_ROL = 5
            AND pr.ESTADO = 'ACTIVO'
            AND p.ESTADO = 'ACTIVO'
        `);
        
        await connection.end();
        
        res.json({
            personas_por_estado: personasPorEstado,
            usuarios_por_estado: usuariosPorEstado,
            roles_asignados: rolesAsignados,
            vendedores: vendedoresConUsuario[0]
        });
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener personas sin usuario
app.get('/api/personas/sin-usuario', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT 
                p.*,
                GROUP_CONCAT(r.NOMBRE SEPARATOR ', ') as roles
            FROM PERSONAS p
            LEFT JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            LEFT JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA AND pr.ESTADO = 'ACTIVO'
            LEFT JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
            WHERE u.ID_USUARIO IS NULL
            AND p.ESTADO = 'ACTIVO'
            GROUP BY p.ID_PERSONA
            ORDER BY p.NOMBRE_COMPLETO
        `);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener personas sin usuario:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener vendedores con sus estadísticas
app.get('/api/estadisticas/vendedores', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT 
                p.ID_PERSONA,
                p.NOMBRE_COMPLETO,
                p.IDENTIFICACION,
                p.EMAIL,
                p.TELEFONO_PRINCIPAL,
                u.USERNAME,
                u.ULTIMO_ACCESO,
                u.ESTADO as estado_usuario,
                COUNT(v.ID_VENTA) as total_ventas,
                COALESCE(SUM(fp.PRIMA), 0) as total_prima,
                COALESCE(SUM(fp.SALDO), 0) as saldo_pendiente,
                MAX(v.FECHA_VENTA) as ultima_venta
            FROM PERSONAS p
            INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
            LEFT JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            LEFT JOIN VENTAS v ON p.ID_PERSONA = v.ID_VENDEDOR
            LEFT JOIN FORMAS_PAGO fp ON v.ID_VENTA = fp.ID_VENTA
            WHERE pr.ID_ROL = 5
            AND pr.ESTADO = 'ACTIVO'
            AND p.ESTADO = 'ACTIVO'
            GROUP BY p.ID_PERSONA, p.NOMBRE_COMPLETO, p.IDENTIFICACION, 
                     p.EMAIL, p.TELEFONO_PRINCIPAL, u.USERNAME, 
                     u.ULTIMO_ACCESO, u.ESTADO
            ORDER BY total_ventas DESC
        `);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener estadísticas de vendedores:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// APIS PARA BUSQUEDA AVANZADA
// Buscar personas con filtros avanzados
app.get('/api/buscar/personas', async (req, res) => {
    try {
        const {
            nombre,
            identificacion,
            telefono,
            email,
            estado,
            tiene_usuario,
            tiene_rol
        } = req.query;
        
        let query = `
            SELECT 
                p.*,
                GROUP_CONCAT(DISTINCT r.NOMBRE SEPARATOR ', ') as roles,
                CASE WHEN u.ID_USUARIO IS NOT NULL THEN 'SI' ELSE 'NO' END as tiene_usuario,
                u.USERNAME,
                u.ESTADO as estado_usuario
            FROM PERSONAS p
            LEFT JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA AND pr.ESTADO = 'ACTIVO'
            LEFT JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
            LEFT JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            WHERE 1=1
        `;
        
        const params = [];
        
        if (nombre) {
            query += ' AND p.NOMBRE_COMPLETO LIKE ?';
            params.push(`%${nombre}%`);
        }
        
        if (identificacion) {
            query += ' AND p.IDENTIFICACION LIKE ?';
            params.push(`%${identificacion}%`);
        }
        
        if (telefono) {
            query += ' AND (p.TELEFONO_PRINCIPAL LIKE ? OR p.TELEFONO_SECUNDARIO LIKE ?)';
            params.push(`%${telefono}%`, `%${telefono}%`);
        }
        
        if (email) {
            query += ' AND p.EMAIL LIKE ?';
            params.push(`%${email}%`);
        }
        
        if (estado) {
            query += ' AND p.ESTADO = ?';
            params.push(estado);
        }
        
        if (tiene_usuario === 'si') {
            query += ' AND u.ID_USUARIO IS NOT NULL';
        } else if (tiene_usuario === 'no') {
            query += ' AND u.ID_USUARIO IS NULL';
        }
        
        if (tiene_rol) {
            query += ' AND r.NOMBRE LIKE ?';
            params.push(`%${tiene_rol}%`);
        }
        
        query += ' GROUP BY p.ID_PERSONA ORDER BY p.NOMBRE_COMPLETO';
        
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(query, params);
        await connection.end();
        
        res.json({
            total: rows.length,
            personas: rows
        });
    } catch (err) {
        console.error('Error en búsqueda de personas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==== APIS PARA VALIDACIONES =======
// Verificar si identificación existe
app.get('/api/validar/identificacion/:identificacion', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT ID_PERSONA, NOMBRE_COMPLETO FROM PERSONAS WHERE IDENTIFICACION = ?',
            [req.params.identificacion]
        );
        await connection.end();
        
        res.json({
            existe: rows.length > 0,
            persona: rows.length > 0 ? rows[0] : null
        });
    } catch (err) {
        console.error('Error al validar identificación:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Verificar si username existe
app.get('/api/validar/username/:username', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT ID_USUARIO, ID_PERSONA FROM USUARIOS WHERE USERNAME = ?',
            [req.params.username]
        );
        await connection.end();
        
        res.json({
            existe: rows.length > 0,
            usuario: rows.length > 0 ? rows[0] : null
        });
    } catch (err) {
        console.error('Error al validar username:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Verificar si email existe
app.get('/api/validar/email/:email', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT ID_PERSONA, NOMBRE_COMPLETO FROM PERSONAS WHERE EMAIL = ?',
            [req.params.email]
        );
        await connection.end();
        
        res.json({
            existe: rows.length > 0,
            persona: rows.length > 0 ? rows[0] : null
        });
    } catch (err) {
        console.error('Error al validar email:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ===== APIs PARA COSTOS DE VEHÍCULOS =====
// Obtener costos de un vehículo
app.get('/api/vehiculos/:id/costos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT * FROM COSTOS_VEHICULO 
             WHERE ID_VEHICULO = ? 
             ORDER BY FECHA_CALCULO DESC`,
            [req.params.id]
        );
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener costos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear o actualizar costos de vehículo
app.post('/api/vehiculos/:id/costos', async (req, res) => {
    try {
        const {
            PRECIO_COMPRA, PRECIO_TRANSPASO, COSTO, PRIMA, COMISION,
            TOTAL_INVERSION, PRECIO_COSTO, PRECIO_PUBLICO, PRECIO_DESCUENTO,
            PRIMA_FINANCIAMIENTO, CUOTA_FINANCIAMIENTO, SALDO, MONEDA,
            TIPO_CAMBIO_COMPRA, OBSERVACION, FECHA_CANCELACION, MONTO_TRASPASO
        } = req.body;

        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si ya existen costos para este vehículo
        const [existentes] = await connection.execute(
            'SELECT ID_COSTO FROM COSTOS_VEHICULO WHERE ID_VEHICULO = ?',
            [req.params.id]
        );

        let result;
        if (existentes.length > 0) {
            // Actualizar
            [result] = await connection.execute(
                `UPDATE COSTOS_VEHICULO SET
                    PRECIO_COMPRA = ?, PRECIO_TRANSPASO = ?, COSTO = ?, PRIMA = ?,
                    COMISION = ?, TOTAL_INVERSION = ?, PRECIO_COSTO = ?,
                    PRECIO_PUBLICO = ?, PRECIO_DESCUENTO = ?,
                    PRIMA_FINANCIAMIENTO = ?, CUOTA_FINANCIAMIENTO = ?, SALDO = ?, MONTO_TRASPASO = ?,
                    MONEDA = ?, TIPO_CAMBIO_COMPRA = ?, OBSERVACION = ?, FECHA_CANCELACION = ?,
                    FECHA_CALCULO = CURDATE()
                WHERE ID_VEHICULO = ?`,
                [
                    PRECIO_COMPRA, PRECIO_TRANSPASO, COSTO, PRIMA, COMISION,
                    TOTAL_INVERSION, PRECIO_COSTO, PRECIO_PUBLICO, PRECIO_DESCUENTO,
                    PRIMA_FINANCIAMIENTO, CUOTA_FINANCIAMIENTO, SALDO, MONTO_TRASPASO || 0,
                    MONEDA, TIPO_CAMBIO_COMPRA, OBSERVACION, FECHA_CANCELACION, req.params.id
                ]
            );
        } else {
            // Insertar nuevo
            [result] = await connection.execute(
                `INSERT INTO COSTOS_VEHICULO (
                    ID_VEHICULO, PRECIO_COMPRA, PRECIO_TRANSPASO, COSTO, PRIMA,
                    COMISION, TOTAL_INVERSION, PRECIO_COSTO, PRECIO_PUBLICO,
                    PRECIO_DESCUENTO, PRIMA_FINANCIAMIENTO, CUOTA_FINANCIAMIENTO,
                    SALDO, MONTO_TRASPASO, MONEDA, TIPO_CAMBIO_COMPRA, OBSERVACION, FECHA_CALCULO, FECHA_CANCELACION
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,CURDATE())`,
                [
                    req.params.id, PRECIO_COMPRA, PRECIO_TRANSPASO, COSTO, PRIMA,
                    COMISION, TOTAL_INVERSION, PRECIO_COSTO, PRECIO_PUBLICO,
                    PRECIO_DESCUENTO, PRIMA_FINANCIAMIENTO, CUOTA_FINANCIAMIENTO,
                    SALDO, MONTO_TRASPASO || 0, MONEDA, TIPO_CAMBIO_COMPRA, OBSERVACION, FECHA_CANCELACION
                ]
            );
        }        

        await connection.end();
        res.json({ 
            success: true, 
            message: 'Costos guardados exitosamente',
            id: result.insertId || existentes[0]?.ID_COSTO
        });
    } catch (err) {
        console.error('Error detallado al guardar costos:', err.message, err.sqlMessage);
        res.status(500).json({ 
            error: 'Error en el servidor',
            detalles: err.sqlMessage || err.message
        });
    }
});

// 1. Obtener información completa de la venta (DETALLE_PAGOS y FINANCIAMIENTOS)
app.get('/api/ventas/completa/:idVenta', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Obtener información de la venta
        const [venta] = await connection.execute(
            `SELECT v.*,
                    ve.CHASIS, ve.PLACA, ve.MOTOR,
                    m.NOMBRE as marca_nombre,
                    col.NOMBRE as color_nombre
             FROM VENTAS v
             INNER JOIN VEHICULOS ve ON v.ID_VEHICULO = ve.ID_VEHICULO
             LEFT JOIN CAT_MARCAS m ON ve.ID_MARCA = m.ID_MARCA
             LEFT JOIN CAT_COLORES col ON ve.ID_COLOR = col.ID_COLOR
             WHERE v.ID_VENTA = ?`,
            [req.params.idVenta]
        );
        
        // Obtener detalles de pago
        const [detallesPago] = await connection.execute(
            `SELECT dp.*, cb.NOMBRE as NOMBRE_BANCO
             FROM DETALLE_PAGOS dp
             LEFT JOIN CAT_BANCOS cb ON dp.ID_BANCO = cb.ID_BANCO
             WHERE dp.ID_VENTA = ?`,
            [req.params.idVenta]
        );
        
        // Obtener financiamiento
        const [financiamiento] = await connection.execute(
            `SELECT * FROM FINANCIAMIENTOS 
             WHERE ID_VENTA = ?`,
            [req.params.idVenta]
        );
        
        // Obtener anticipos
        let anticipos = [];
        if (financiamiento.length > 0) {
            const [anticiposData] = await connection.execute(
                `SELECT a.* 
                 FROM ANTICIPOS a
                 WHERE a.ID_FINANCIAMIENTO = ?`,
                [financiamiento[0].ID_FINANCIAMIENTOS]
            );
            anticipos = anticiposData;
        }
        
        await connection.end();
        
        res.json({
            venta: venta[0] || null,
            detallesPago: detallesPago,
            financiamiento: financiamiento[0] || null,
            anticipos: anticipos
        });
        
    } catch (err) {
        console.error('Error al obtener información completa de la venta:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// 2. Obtener información de pago por venta (simplificado)
app.get('/api/pagos/venta/:idVenta', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [pagos] = await connection.execute(
            `SELECT 
                dp.EFECTIVO,
                dp.TRANSFERENCIA,
                dp.NUM_TRANSFERENCIA,
                dp.NOM_DEPOSITANTE,
                dp.TARJETA,
                dp.NUMERO_TARJETA,
                dp.TIPO_TARJETA,
                dp.FORMA_PAGO,
                dp.FECHA_PAGO,
                cb.NOMBRE as BANCO_NOMBRE
             FROM DETALLE_PAGOS dp
             LEFT JOIN CAT_BANCOS cb ON dp.ID_BANCO = cb.ID_BANCO
             WHERE dp.ID_VENTA = ?`,
            [req.params.idVenta]
        );
        
        await connection.end();
        res.json(pagos);
        
    } catch (err) {
        console.error('Error al obtener pagos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// 3. Obtener financiamiento por venta
app.get('/api/financiamiento/venta/:idVenta', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [financiamiento] = await connection.execute(
            `SELECT * FROM FINANCIAMIENTOS 
             WHERE ID_VENTA = ?`,
            [req.params.idVenta]
        );
        
        let anticipos = [];
        if (financiamiento.length > 0) {
            const [anticiposData] = await connection.execute(
                `SELECT * FROM ANTICIPOS 
                 WHERE ID_FINANCIAMIENTO = ? 
                 ORDER BY FECHA_ANTICIPO DESC`,
                [financiamiento[0].ID_FINANCIAMIENTOS]
            );
            anticipos = anticiposData;
        }
        
        await connection.end();
        
        res.json({
            financiamiento: financiamiento[0] || null,
            anticipos: anticipos
        });
        
    } catch (err) {
        console.error('Error al obtener financiamiento:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ===== APIs PARA EXTRAS DE VEHÍCULOS =====
// Obtener todos los extras de un vehículo
app.get('/api/vehiculos/:id/extras', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT * FROM EXTRAS_VEHICULO 
             WHERE ID_VEHICULO = ? 
             ORDER BY FECHA DESC`,
            [req.params.id]
        );
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener extras:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear un nuevo extra
app.post('/api/vehiculos/:id/extras', async (req, res) => {
    try {
        const {
            ARREGLO, EXTRAS_DETALLE, OBSERVACIONES, PRECIO, MONEDA, TIPO_CAMBIO_COMPRA
        } = req.body;

        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            `INSERT INTO EXTRAS_VEHICULO (
                ID_VEHICULO, ARREGLO, EXTRAS_DETALLE, OBSERVACIONES,
                PRECIO, MONEDA, TIPO_CAMBIO_COMPRA
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.params.id, ARREGLO || null, EXTRAS_DETALLE || null,
                OBSERVACIONES || null, PRECIO || 0, MONEDA || 'CRC',
                TIPO_CAMBIO_COMPRA || null
            ]
        );
        await connection.end();

        res.json({ 
            success: true, 
            message: 'Extra guardado exitosamente',
            id: result.insertId
        });
    } catch (err) {
        console.error('Error al guardar extra:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Actualizar un extra
app.put('/api/extras/:id', async (req, res) => {
    try {
        const {
            ARREGLO, EXTRAS_DETALLE, OBSERVACIONES, PRECIO, MONEDA, TIPO_CAMBIO_COMPRA
        } = req.body;

        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            `UPDATE EXTRAS_VEHICULO SET
                ARREGLO = ?, EXTRAS_DETALLE = ?, OBSERVACIONES = ?,
                PRECIO = ?, MONEDA = ?, TIPO_CAMBIO_COMPRA = ?
            WHERE ID_EXTRA = ?`,
            [
                ARREGLO || null, EXTRAS_DETALLE || null, OBSERVACIONES || null,
                PRECIO || 0, MONEDA || 'CRC', TIPO_CAMBIO_COMPRA || null,
                req.params.id
            ]
        );
        await connection.end();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Extra no encontrado' });
        }

        res.json({ success: true, message: 'Extra actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar extra:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Eliminar TODOS los extras de un vehículo
app.delete('/api/vehiculos/:id/extras', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'DELETE FROM EXTRAS_VEHICULO WHERE ID_VEHICULO = ?',
            [req.params.id]
        );
        await connection.end();
        res.json({ success: true, message: 'Extras eliminados' });
    } catch (err) {
        console.error('Error al eliminar extras del vehículo:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Eliminar un extra
app.delete('/api/extras/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'DELETE FROM EXTRAS_VEHICULO WHERE ID_EXTRA = ?',
            [req.params.id]
        );
        await connection.end();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Extra no encontrado' });
        }

        res.json({ success: true, message: 'Extra eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar extra:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ===== API PARA OBTENER TODOS LOS DATOS COMPLETOS DE UN VEHÍCULO =====
app.get('/api/vehiculos/:id/completo', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const vehiculoId = req.params.id;
                
        // 1. Datos básicos del vehículo
        const [vehiculos] = await connection.execute(
            `SELECT 
                v.*,
                -- Fechas
                v.FECHA_INGRESO,
                v.FECHA_RECEPCION,
                -- Proveedor (si existe)
                p.NOMBRE_COMPLETO as proveedor_nombre,
                p.IDENTIFICACION as proveedor_identificacion,
                p.TELEFONO_PRINCIPAL as proveedor_telefono,
                p.EMAIL as proveedor_email,
                -- Cliente origen (para intercambios)
                co.NOMBRE_COMPLETO as cliente_origen_nombre,
                co.IDENTIFICACION as cliente_origen_identificacion,
                co.TELEFONO_PRINCIPAL as cliente_origen_telefono,
                co.EMAIL as cliente_origen_email,
                -- Catálogos
                m.NOMBRE as marca_nombre,
                c.NOMBRE as color_nombre,
                comb.NOMBRE as combustible_nombre,
                t.NOMBRE as transmision_nombre,
                -- Venta origen (si viene de un intercambio)
                vo.CODIGO_VENTA as venta_origen_codigo,
                vo.FECHA_VENTA as venta_origen_fecha
            FROM VEHICULOS v
            LEFT JOIN PERSONAS p ON v.ID_PROVEEDOR = p.ID_PERSONA
            LEFT JOIN PERSONAS co ON v.ID_CLIENTE_ORIGEN = co.ID_PERSONA
            LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
            LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
            LEFT JOIN CAT_COMBUSTIBLES comb ON v.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
            LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
            LEFT JOIN VENTAS vo ON v.ID_VENTA_ORIGEN = vo.ID_VENTA
            WHERE v.ID_VEHICULO = ?`,
            [vehiculoId]
        );

        if (vehiculos.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        const vehiculo = vehiculos[0];

        // 2. Costos del vehículo
        const [costos] = await connection.execute(
            'SELECT * FROM COSTOS_VEHICULO WHERE ID_VEHICULO = ? ORDER BY FECHA_CALCULO DESC LIMIT 1',
            [vehiculoId]
        );

        // 3. Extras del vehículo
        const [extras] = await connection.execute(
            'SELECT * FROM EXTRAS_VEHICULO WHERE ID_VEHICULO = ? ORDER BY FECHA DESC',
            [vehiculoId]
        );

        await connection.end();

        const response = {
            vehiculo: vehiculo,
            costos: costos.length > 0 ? costos[0] : null,
            extras: extras,
            intercambio_info: vehiculo.ES_INTERCAMBIO ? {
                es_intercambio: true,
                cliente_origen: vehiculo.ID_CLIENTE_ORIGEN ? {
                    id: vehiculo.ID_CLIENTE_ORIGEN,
                    nombre: vehiculo.cliente_origen_nombre,
                    identificacion: vehiculo.cliente_origen_identificacion
                } : null,
                monto_intercambio: vehiculo.MONTO_INTERCAMBIO,
                fecha_recepcion: vehiculo.FECHA_RECEPCION,
                venta_origen: vehiculo.ID_VENTA_ORIGEN ? {
                    id: vehiculo.ID_VENTA_ORIGEN,
                    codigo: vehiculo.venta_origen_codigo,
                    fecha: vehiculo.venta_origen_fecha
                } : null
            } : {
                es_intercambio: false
            }
        };

        res.json(response);

    } catch (err) {
        console.error('Error detallado al obtener datos completos:', err);
        res.status(500).json({ 
            error: 'Error en el servidor',
            detalles: err.message 
        });
    }
});

// ===== API PARA ESTADÍSTICAS DE INVENTARIO =====
app.get('/api/inventario/estadisticas', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Totales por estado
        const [porEstado] = await connection.execute(`
            SELECT 
                ESTADO,
                COUNT(*) as cantidad,
                SUM(CASE WHEN MONEDA = 'USD' THEN PRECIO_COMPRA ELSE 0 END) as total_usd,
                SUM(CASE WHEN MONEDA = 'CRC' THEN PRECIO_COMPRA ELSE 0 END) as total_crc
            FROM VEHICULOS v
            LEFT JOIN COSTOS_VEHICULO c ON v.ID_VEHICULO = c.ID_VEHICULO
            GROUP BY ESTADO
        `);

        // Totales generales
        const [totales] = await connection.execute(`
            SELECT 
                COUNT(*) as total_vehiculos,
                SUM(CASE WHEN v.ESTADO = 'COMPRADO' THEN 1 ELSE 0 END) as comprados,
                SUM(CASE WHEN v.ESTADO = 'VENDIDO' THEN 1 ELSE 0 END) as vendidos,
                SUM(CASE WHEN c.MONEDA = 'USD' THEN c.PRECIO_COMPRA ELSE 0 END) as inversion_usd,
                SUM(CASE WHEN c.MONEDA = 'CRC' THEN c.PRECIO_COMPRA ELSE 0 END) as inversion_crc
            FROM VEHICULOS v
            LEFT JOIN COSTOS_VEHICULO c ON v.ID_VEHICULO = c.ID_VEHICULO
        `);

        // Últimos 5 vehículos agregados
        const [ultimos] = await connection.execute(`
            SELECT v.*, m.NOMBRE as marca_nombre
            FROM VEHICULOS v
            LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
            ORDER BY v.FECHA_INGRESO DESC
            LIMIT 5
        `);

        await connection.end();

        res.json({
            por_estado: porEstado,
            totales: totales[0],
            ultimos_agregados: ultimos
        });
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ===== API PARA VENTAS PENDIENTES =====
app.get('/api/ventas/pendientes', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [ventas] = await connection.execute(`
            SELECT 
                v.ID_VENTA,
                v.CODIGO_VENTA,
                v.FECHA_VENTA,
                v.ESTADO_PAGO as ESTADO_VENTA,
                v.ID_VEHICULO,
                v.ID_CLIENTE_FACTURACION,
                v.ID_VENDEDOR,
                
                -- Datos del cliente
                cf.NOMBRE_COMPLETO as CLIENTE_NOMBRE,
                cf.IDENTIFICACION as CLIENTE_IDENTIFICACION,
                cf.TELEFONO_PRINCIPAL as CLIENTE_TELEFONO,
                cf.EMAIL as CLIENTE_EMAIL,
                
                -- Datos del vehículo
                veh.PLACA,
                veh.ESTILO,
                veh.MODELO,
                m.NOMBRE as MARCA_NOMBRE,
                CONCAT(m.NOMBRE, ' ', veh.ESTILO) as VEHICULO_DESCRIPCION,
                
                -- Datos del vendedor
                vend.NOMBRE_COMPLETO as VENDEDOR_NOMBRE,
                
                -- ===== NUEVOS CAMPOS: Información de pago =====
                -- Verificar si existe financiamiento
                CASE WHEN f.ID_FINANCIAMIENTOS IS NOT NULL THEN 'CREDITO' ELSE 'CONTADO' END as TIPO_VENTA,
                
                -- Plazo en meses (si existe)
                f.PLAZO_MESES,
                
                -- Forma de pago desde detalle_pagos
                (
                    SELECT GROUP_CONCAT(DISTINCT dp.FORMA_PAGO SEPARATOR ', ')
                    FROM DETALLE_PAGOS dp
                    WHERE dp.ID_VENTA = v.ID_VENTA
                ) as FORMA_PAGO
                
            FROM VENTAS v
            INNER JOIN PERSONAS cf ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
            INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
            INNER JOIN CAT_MARCAS m ON veh.ID_MARCA = m.ID_MARCA
            INNER JOIN PERSONAS vend ON v.ID_VENDEDOR = vend.ID_PERSONA
            LEFT JOIN FINANCIAMIENTOS f ON v.ID_VENTA = f.ID_VENTA
            ORDER BY v.FECHA_VENTA DESC
        `);
        
        await connection.end();
        
        res.json(ventas);
        
    } catch (err) {
        console.error('Error al obtener ventas pendientes:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== API PARA OBTENER VENTA COMPLETA  =====
app.get('/api/ventas/:id/completo', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const ventaId = req.params.id;
        
        // Datos de la venta - INCLUIR ID_APROBADOR
        const [ventas] = await connection.execute(`
            SELECT v.*, 
                   v.ID_APROBADOR
            FROM VENTAS v
            WHERE v.ID_VENTA = ?
        `, [ventaId]);
        
        if (ventas.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        const venta = ventas[0];
        
        // Datos del cliente de facturación
        const [clientesFact] = await connection.execute(
            'SELECT * FROM PERSONAS WHERE ID_PERSONA = ?',
            [venta.ID_CLIENTE_FACTURACION]
        );
        
        // Datos del cliente de inscripción (si existe)
        let clienteInscripcion = null;
        if (venta.ID_CLIENTE_INSCRIPCION) {
            const [clientesIns] = await connection.execute(
                'SELECT * FROM PERSONAS WHERE ID_PERSONA = ?',
                [venta.ID_CLIENTE_INSCRIPCION]
            );
            clienteInscripcion = clientesIns[0] || null;
        }
        
        // Datos del vendedor
        const [vendedores] = await connection.execute(
            'SELECT * FROM PERSONAS WHERE ID_PERSONA = ?',
            [venta.ID_VENDEDOR]
        );
        
        // ===== Datos del aprobador =====
        let aprobador = null;
        if (venta.ID_APROBADOR) {
            const [aprobadores] = await connection.execute(
                'SELECT * FROM PERSONAS WHERE ID_PERSONA = ?',
                [venta.ID_APROBADOR]
            );
            aprobador = aprobadores[0] || null;
        }
        
        // Datos del vehículo VENDIDO (el que se entrega al cliente)
        const [vehiculos] = await connection.execute(
            `SELECT v.*, 
                    m.NOMBRE as marca_nombre,
                    c.NOMBRE as color_nombre,
                    comb.NOMBRE as combustible_nombre,
                    t.NOMBRE as transmision_nombre
             FROM VEHICULOS v
             LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
             LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
             LEFT JOIN CAT_COMBUSTIBLES comb ON v.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
             LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
             WHERE v.ID_VEHICULO = ?`,
            [venta.ID_VEHICULO]
        );
        
        // Buscar vehículo RECIBIDO en intercambio
        let vehiculoRecibido = null;
        
        const [vehiculosRecibidos] = await connection.execute(
            `SELECT v.*, 
                    m.NOMBRE as marca_nombre,
                    c.NOMBRE as color_nombre,
                    comb.NOMBRE as combustible_nombre,
                    t.NOMBRE as transmision_nombre,
                    cv.PRECIO_COMPRA as monto_recibido,
                    cv.PRECIO_TRANSPASO as monto_traspaso
             FROM VEHICULOS v
             LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
             LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
             LEFT JOIN CAT_COMBUSTIBLES comb ON v.ID_COMBUSTIBLE = comb.ID_COMBUSTIBLE
             LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
             LEFT JOIN COSTOS_VEHICULO cv ON v.ID_VEHICULO = cv.ID_VEHICULO
             WHERE v.ES_INTERCAMBIO = TRUE 
             AND v.ID_VENTA_ORIGEN = ?`,
            [ventaId]
        );
        
        if (vehiculosRecibidos.length > 0) {
            vehiculoRecibido = vehiculosRecibidos[0];
        }
        
        // Obtener financiamiento si existe
        const [financiamientos] = await connection.execute(
            `SELECT * FROM FINANCIAMIENTOS WHERE ID_VENTA = ?`,
            [ventaId]
        );
        
        // Obtener anticipos (cuotas)
        let anticipos = [];
        if (financiamientos.length > 0) {
            const [anticiposResult] = await connection.execute(
                `SELECT a.* 
                 FROM ANTICIPOS a
                 WHERE a.ID_FINANCIAMIENTO = ?
                 ORDER BY a.FECHA_VENCIMIENTO ASC`,
                [financiamientos[0].ID_FINANCIAMIENTOS]
            );
            anticipos = anticiposResult;
        }
        
        // Obtener detalle de pagos
        const [detallePagos] = await connection.execute(
            `SELECT dp.*, cb.NOMBRE as banco_nombre
             FROM DETALLE_PAGOS dp
             LEFT JOIN CAT_BANCOS cb ON dp.ID_BANCO = cb.ID_BANCO
             WHERE dp.ID_VENTA = ?
             ORDER BY dp.FECHA_PAGO DESC`,
            [ventaId]
        );
        
        // Costos del vehículo vendido
        const [costos] = await connection.execute(
            'SELECT * FROM COSTOS_VEHICULO WHERE ID_VEHICULO = ? ORDER BY FECHA_CALCULO DESC LIMIT 1',
            [venta.ID_VEHICULO]
        );
        
        // Extras del vehículo vendido
        const [extras] = await connection.execute(
            'SELECT * FROM EXTRAS_VEHICULO WHERE ID_VEHICULO = ?',
            [venta.ID_VEHICULO]
        );
        
        await connection.end();
        
        // Construir respuesta con todos los datos - INCLUIR APROBADOR
        res.json({
            ID_VENTA: venta.ID_VENTA,
            CODIGO_VENTA: venta.CODIGO_VENTA,
            FECHA_VENTA: venta.FECHA_VENTA,
            ESTADO_VENTA: venta.ESTADO_PAGO,
            NOMBRE_NOTARIO: venta.NOMBRE_NOTARIO,
            PV_PURDI: venta.PV_PURDI,
            OBSERVACIONES_VENTA: venta.OBSERVACIONES_VENTA,
            CLIENTE_FACTURACION: clientesFact[0] || null,
            CLIENTE_INSCRIPCION: clienteInscripcion,
            VENDEDOR: vendedores[0] || null,
            APROBADOR: aprobador, 
            VEHICULO: vehiculos[0] || null,
            VEHICULOS_RECIBIDOS: vehiculosRecibidos,
            VEHICULO_RECIBIDO: vehiculosRecibidos[0] || null,
            ES_INTERCAMBIO: vehiculosRecibidos.length > 0,
            COSTOS: costos[0] || null, 
            EXTRAS: extras,
            FINANCIAMIENTO: financiamientos[0] || null,
            ANTICIPOS: anticipos,
            DETALLE_PAGOS: detallePagos
        });
        
    } catch (err) {
        console.error('Error al obtener venta completa:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== API PARA APROBAR VENTA =====
app.put('/api/ventas/:id/aprobar', async (req, res) => {
    try {
        const { 
            estado, 
            observaciones,
            subtotal,
            descuento_global,
            impuestos,
            total,
            exonerar_imp,
            items,
            id_aprobador 
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Iniciar transacción
        await connection.beginTransaction();
        
        try {
            // PRIMERO: Obtener información completa de la venta
            const [ventaInfo] = await connection.execute(
                `SELECT v.ID_VEHICULO, 
                        veh.ES_INTERCAMBIO, 
                        veh.ID_VENTA_ORIGEN,
                        v2.ID_VEHICULO AS VEHICULO_RECIBIDO_ID
                FROM VENTAS v
                INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
                LEFT JOIN VEHICULOS v2 ON v2.ID_VENTA_ORIGEN = v.ID_VENTA
                WHERE v.ID_VENTA = ?`,
                [req.params.id]
            );
            
            if (ventaInfo.length === 0) {
                await connection.rollback();
                await connection.end();
                return res.status(404).json({ error: 'Venta no encontrada' });
            }
            
            const idVehiculoVendido = ventaInfo[0].ID_VEHICULO;
            const esIntercambio = ventaInfo[0].ES_INTERCAMBIO === 1;
            const idVehiculoRecibido = ventaInfo[0].VEHICULO_RECIBIDO_ID;
            
            console.log('Procesando venta:', {
                idVehiculoVendido,
                esIntercambio,
                idVehiculoRecibido
            });
            
            // SEGUNDO: Actualizar el estado de la venta
            const [result] = await connection.execute(
                `UPDATE VENTAS 
                 SET ESTADO_PAGO = ?, 
                     OBSERVACIONES_VENTA = CONCAT(COALESCE(OBSERVACIONES_VENTA, ''), '\n', ?),
                     FECHA_APROBACION = NOW(),
                     ID_APROBADOR = ?,
                     SUB_TOTAL = ?,
                     DESCUENTO_GLOBAL = ?,
                     TOTAL = ?,
                     EXONERAR_IMP = ?
                 WHERE ID_VENTA = ?`,
                [
                    estado || 'YA FUE FACTURADA', 
                    observaciones || 'Aprobada en facturación',
                    id_aprobador,
                    subtotal || 0,
                    descuento_global || 0,
                    total || 0,
                    exonerar_imp || false,
                    req.params.id
                ]
            );
            
            if (result.affectedRows === 0) {
                await connection.rollback();
                await connection.end();
                return res.status(404).json({ error: 'Venta no encontrada' });
            }
            
            // TERCERO: Actualizar SOLO el vehículo VENDIDO a estado VENDIDO
            if (idVehiculoVendido) {
                const [vehiculoResult] = await connection.execute(
                    `UPDATE VEHICULOS 
                     SET ESTADO = 'VENDIDO',
                         ID_VENTA_ORIGEN = ?,
                         FECHA_RECEPCION = NOW()
                     WHERE ID_VEHICULO = ?`,
                    [req.params.id, idVehiculoVendido]
                );
                
                if (vehiculoResult.affectedRows > 0) {
                    console.log(`Vehículo vendido ${idVehiculoVendido} actualizado a VENDIDO`);
                }
            }
            
            // CUARTO: Si hay un vehículo recibido por intercambio, NO cambiar su estado
            if (esIntercambio && idVehiculoRecibido) {
                console.log(`Vehículo recibido por intercambio ${idVehiculoRecibido} se mantiene como COMPRADO`);
                
                await connection.execute(
                    `UPDATE VEHICULOS 
                     SET OBSERVACIONES = CONCAT(COALESCE(OBSERVACIONES, ''), 
                         '\nVehículo recibido por intercambio en venta ', ?)
                     WHERE ID_VEHICULO = ?`,
                    [req.params.id, idVehiculoRecibido]
                );
            }
            
            // QUINTO: Registrar en auditoría
            let descripcionAuditoria = `Venta ${req.params.id} aprobada. `;
            descripcionAuditoria += `Vehículo vendido ID: ${idVehiculoVendido} marcado como VENDIDO. `;
            
            if (esIntercambio) {
                descripcionAuditoria += `Vehículo recibido por intercambio ID: ${idVehiculoRecibido} se mantiene como COMPRADO. `;
            }
            
            descripcionAuditoria += `Total: ${total}`;
            
            await connection.execute(
                `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
                 VALUES (?, 'APROBAR_VENTA', ?)`,
                [id_aprobador, descripcionAuditoria]
            );
            
            // Confirmar transacción
            await connection.commit();
            await connection.end();
            
            res.json({ 
                message: 'Venta aprobada exitosamente',
                success: true,
                id_aprobador: id_aprobador,
                fecha_aprobacion: new Date(),
                id_vehiculo_vendido: idVehiculoVendido,
                estado_vehiculo_vendido: 'VENDIDO',
                es_intercambio: esIntercambio,
                id_vehiculo_recibido: idVehiculoRecibido,
                estado_vehiculo_recibido: esIntercambio ? 'COMPRADO' : null
            });
            
        } catch (error) {
            await connection.rollback();
            await connection.end();
            throw error;
        }
        
    } catch (err) {
        console.error('Error al aprobar venta:', err);
        res.status(500).json({ 
            error: 'Error en el servidor', 
            success: false,
            detalles: err.message 
        });
    }
});

// ===== API PARA RECHAZAR VENTA =====
app.put('/api/ventas/:id/rechazar', async (req, res) => {
    try {
        const { estado, motivo } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Obtener el vehículo asociado
        const [ventaInfo] = await connection.execute(
            `SELECT v.ID_VEHICULO 
             FROM VENTAS v 
             WHERE v.ID_VENTA = ?`,
            [req.params.id]
        );

        if (ventaInfo.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // 2. Actualizar estado de la venta
        const [result] = await connection.execute(
            `UPDATE VENTAS 
             SET ESTADO_PAGO = ?, 
                 OBSERVACIONES_VENTA = CONCAT(COALESCE(OBSERVACIONES_VENTA, ''), '\n', ?)
             WHERE ID_VENTA = ?`,
            [estado || 'PLAN YA FUE ANULADO', motivo || 'Rechazada en facturación', req.params.id]
        );

        // 3. Devolver el vehículo a COMPRADO
        await connection.execute(
            `UPDATE VEHICULOS 
             SET ESTADO = 'COMPRADO'
             WHERE ID_VEHICULO = ?`,
            [ventaInfo[0].ID_VEHICULO]
        );

        // 4. Auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
             VALUES (?, 'RECHAZAR_VENTA', ?)`,
            [1, `Venta ${req.params.id} rechazada. Motivo: ${motivo || 'No especificado'}`]
        );

        await connection.commit();
        await connection.end();
        res.json({ message: 'Venta rechazada exitosamente' });

    } catch (err) {
        await connection.rollback();
        await connection.end();
        console.error('Error al rechazar venta:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== API PARA CREAR PLAN DE VENTA COMPLETO =====
app.post('/api/plan-ventas', async (req, res) => {
    const {
        codigo_venta,
        fecha_venta,
        nombre_notario,
        id_vendedor,
        pv_purdi,
        estado_venta,
        cliente_facturar,
        cliente_inscribir,
        vehiculo,
        vehiculo_recibir,
        vehiculos_recibir,
        costos_vehiculo,
        forma_pago,
        financiamiento,
        anticipos,
        detalle_pagos
    } = req.body;

    if (!id_vendedor) return res.status(400).json({ error: 'El vendedor es requerido' });
    if (!vehiculo?.id_vehiculo && !vehiculo?.chasis) return res.status(400).json({ error: 'El vehículo es requerido' });

    const connection = await mysql.createConnection(dbConfig);

    try {
        await connection.beginTransaction();

        // ─── 1 & 2. CLIENTES ─────────────────────────────────────────
        const mismaCedula = cliente_facturar?.identificacion &&
                            cliente_inscribir?.identificacion &&
                            cliente_facturar.identificacion === cliente_inscribir.identificacion;

        // Función auxiliar para crear/obtener persona
        async function upsertPersona(conn, datos, idRol) {
            let idPersona = datos?.id_persona_existente || null;

            if (!idPersona && datos?.identificacion) {
                const [existe] = await conn.execute(
                    'SELECT ID_PERSONA FROM PERSONAS WHERE IDENTIFICACION = ?',
                    [datos.identificacion]
                );
                if (existe.length > 0) {
                    idPersona = existe[0].ID_PERSONA;
                    await conn.execute(
                        `UPDATE PERSONAS SET NOMBRE_COMPLETO=?,TELEFONO_PRINCIPAL=?,TELEFONO_SECUNDARIO=?,
                        ID_ESTADO_CIVIL=?,OCUPACION=?,DIRECCION=?,EMAIL=?,NACIONALIDAD=?,TIPO_DOCUMENTO=?
                        WHERE ID_PERSONA=?`,
                        [datos.nombre_completo, datos.telefono_principal, datos.telefono_secundario,
                        datos.id_estado_civil||null, datos.ocupacion||null, datos.direccion||null,
                        datos.email||null, datos.nacionalidad||null, datos.tipo_documento||null, idPersona]
                    );
                } else {
                    const [r] = await conn.execute(
                        `INSERT INTO PERSONAS (TIPO_DOCUMENTO,IDENTIFICACION,NOMBRE_COMPLETO,TELEFONO_PRINCIPAL,
                        TELEFONO_SECUNDARIO,ID_ESTADO_CIVIL,OCUPACION,DIRECCION,EMAIL,NACIONALIDAD,ESTADO)
                        VALUES (?,?,?,?,?,?,?,?,?,?,'ACTIVO')`,
                        [datos.tipo_documento||null, datos.identificacion, datos.nombre_completo,
                        datos.telefono_principal||null, datos.telefono_secundario||null,
                        datos.id_estado_civil||null, datos.ocupacion||null, datos.direccion||null,
                        datos.email||null, datos.nacionalidad||null]
                    );
                    idPersona = r.insertId;
                }
            }

            if (idPersona) {
                // Eliminar roles anteriores de cliente y asignar el correcto
                await conn.execute(
                    `DELETE FROM PERSONAS_ROLES WHERE ID_PERSONA = ? AND ID_ROL IN (1,2,3)`,
                    [idPersona]
                );
                await conn.execute(
                    `INSERT IGNORE INTO PERSONAS_ROLES (ID_PERSONA, ID_ROL, ESTADO) VALUES (?,?,'ACTIVO')`,
                    [idPersona, idRol]
                );
            }

            return idPersona;
        }

        let idClienteFacturar, idClienteInscribir;

        if (mismaCedula) {
            // Misma persona → Rol 3 (Cliente Ambos)
            idClienteFacturar = await upsertPersona(connection, cliente_facturar, 3);
            idClienteInscribir = idClienteFacturar;
        } else {
            // Personas distintas → Rol 1 y Rol 2 respectivamente
            idClienteFacturar  = await upsertPersona(connection, cliente_facturar,  1);
            idClienteInscribir = await upsertPersona(connection, cliente_inscribir, 2);
        }

        // ─── 3. VEHÍCULO VENDIDO ─────────────────────────────────────────
        let idVehiculo = vehiculo?.id_vehiculo || null;
        if (!idVehiculo && vehiculo?.chasis) {
            const [existeVeh] = await connection.execute(
                'SELECT ID_VEHICULO FROM VEHICULOS WHERE CHASIS = ?',
                [vehiculo.chasis]
            );
            if (existeVeh.length > 0) {
                idVehiculo = existeVeh[0].ID_VEHICULO;
            } else {
                // Crear vehículo nuevo
                const [rVeh] = await connection.execute(
                    `INSERT INTO VEHICULOS (
                        ID_PROVEEDOR, CHASIS, MOTOR, PLACA, ID_MARCA, MODELO,
                        ID_COLOR, ID_COMBUSTIBLE, ID_TRANSMISION, ESTILO,
                        TRACCION, CARROCERIA, C_C, CILINDROS,
                        KILOMETRAJE_ACTUAL, KILOMETRAJE_ANTERIOR, FECHA_INGRESO,
                        PV, ESTADO, OBSERVACIONES
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        null, vehiculo.chasis, vehiculo.motor || null, vehiculo.placa || null, 
                        vehiculo.id_marca, vehiculo.modelo,
                        vehiculo.id_color || null, vehiculo.id_combustible || null, 
                        vehiculo.id_transmision || null, vehiculo.estilo || null,
                        vehiculo.traccion || null, vehiculo.carroceria || null,
                        vehiculo.cc || null, vehiculo.cilindros || null,
                        vehiculo.kilometraje_actual || 0, vehiculo.kilometraje_anterior || 0,
                        new Date().toISOString().split('T')[0],
                        vehiculo.pv || null, 'COMPRADO', vehiculo.observaciones || null
                    ]
                );
                idVehiculo = rVeh.insertId;
            }
        }

        if (!idVehiculo) {
            throw new Error('No se pudo determinar el vehículo');
        }

        // ─── 4. CREAR VENTA ───────────────────────────────────────
        let codigoFinal = codigo_venta;
        if (!codigoFinal || codigoFinal === 'NUEVO') {
            const [lastVenta] = await connection.execute(
                `SELECT CODIGO_VENTA FROM VENTAS ORDER BY ID_VENTA DESC LIMIT 1`
            );
            let nextNum = 1;
            if (lastVenta.length > 0) {
                const match = lastVenta[0].CODIGO_VENTA.match(/\d+$/);
                if (match) nextNum = parseInt(match[0]) + 1;
            }
            codigoFinal = 'V' + String(nextNum).padStart(4, '0');
        }
        
        const [rv] = await connection.execute(
            `INSERT INTO VENTAS (
                CODIGO_VENTA, ID_VEHICULO, ID_CLIENTE_FACTURACION, ID_CLIENTE_INSCRIPCION,
                ID_VENDEDOR, NOMBRE_NOTARIO, FECHA_VENTA, PV_PURDI, ESTADO_PAGO
            ) VALUES (?,?,?,?,?,?,?,?,?)`,
            [
                codigoFinal, idVehiculo, idClienteFacturar, idClienteInscribir||null,
                id_vendedor, nombre_notario||null, fecha_venta||new Date(),
                pv_purdi||null, estado_venta || 'PENDIENTE DE FACTURAR'
            ]
        );
        const idVenta = rv.insertId;

        // ─── VEHÍCULO(S) A RECIBIR (INTERCAMBIO) ─────────────────────────
        const listaVehiculos = (vehiculos_recibir && vehiculos_recibir.length > 0)
            ? vehiculos_recibir
            : (vehiculo_recibir ? [vehiculo_recibir] : []);

        for (const vr of listaVehiculos) {
            const tieneIntercambio = vr && (
                (vr.placa && vr.placa.trim() !== '') ||
                (vr.chasis && vr.chasis.trim() !== '')
            );
            if (!tieneIntercambio) continue;

            console.log('Procesando intercambio - Vehículo recibido:', vr);

            const idClienteOrigen = idClienteInscribir || idClienteFacturar;
            if (!idClienteOrigen) throw new Error('Para un intercambio se requiere un cliente');

            let idVehRecibir = null;

            // Buscar si ya existe por chasis o placa
            if (vr.chasis) {
                const [exVR] = await connection.execute(
                    'SELECT ID_VEHICULO FROM VEHICULOS WHERE CHASIS = ?', [vr.chasis]
                );
                if (exVR.length > 0) idVehRecibir = exVR[0].ID_VEHICULO;
            }

            if (!idVehRecibir && vr.placa) {
                const [exVR] = await connection.execute(
                    'SELECT ID_VEHICULO FROM VEHICULOS WHERE PLACA = ?', [vr.placa]
                );
                if (exVR.length > 0) idVehRecibir = exVR[0].ID_VEHICULO;
            }

            if (!idVehRecibir) {
                // Crear nuevo vehículo (ya incluye ID_VENTA_ORIGEN)
                const [rVR] = await connection.execute(
                    `INSERT INTO VEHICULOS (
                        ID_PROVEEDOR, CHASIS, MOTOR, PLACA, ID_MARCA, MODELO,
                        ID_COLOR, ID_COMBUSTIBLE, ID_TRANSMISION, ESTILO, TRACCION, CARROCERIA,
                        C_C, CILINDROS, KILOMETRAJE_ACTUAL, KILOMETRAJE_ANTERIOR, PV,
                        ESTADO, OBSERVACIONES,
                        ES_INTERCAMBIO, ID_CLIENTE_ORIGEN, FECHA_RECEPCION, ID_VENTA_ORIGEN
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        null, // ID_PROVEEDOR (deberías usar un proveedor válido o NULL)
                        vr.chasis||null, vr.motor||null, vr.placa||null,
                        vr.id_marca||1, vr.modelo||new Date().getFullYear(),
                        vr.id_color||null, vr.id_combustible||null, vr.id_transmision||null,
                        vr.estilo||null, vr.traccion||null, vr.carroceria||null,
                        vr.cc||null, vr.cilindros||null,
                        vr.kilometraje_actual||0, vr.kilometraje_anterior||0,
                        vr.pv||null, 'COMPRADO',
                        vr.observaciones || 'Vehículo recibido en intercambio.',
                        true, idClienteOrigen, new Date(), idVenta
                    ]
                );
                idVehRecibir = rVR.insertId;
            } else {
                // Actualizar vehículo existente (incluyendo ID_VENTA_ORIGEN)
                await connection.execute(
                    `UPDATE VEHICULOS SET
                        ESTADO = 'COMPRADO', 
                        ES_INTERCAMBIO = TRUE,
                        ID_CLIENTE_ORIGEN = ?, 
                        FECHA_RECEPCION = ?,
                        ID_VENTA_ORIGEN = ?,
                        KILOMETRAJE_ACTUAL = ?,
                        OBSERVACIONES = CONCAT(IFNULL(OBSERVACIONES,''), ' | Recibido en intercambio el ', CURDATE())
                    WHERE ID_VEHICULO = ?`,
                    [idClienteOrigen, new Date(), idVenta, vr.kilometraje_actual||0, idVehRecibir]
                );
            }

            // Guardar costos del vehículo recibido
            if (vr.monto_recibido && parseFloat(vr.monto_recibido) > 0) {
                const [costoExistente] = await connection.execute(
                    'SELECT ID_COSTO FROM COSTOS_VEHICULO WHERE ID_VEHICULO = ?', [idVehRecibir]
                );
                if (costoExistente.length === 0) {
                    await connection.execute(
                        `INSERT INTO COSTOS_VEHICULO (ID_VEHICULO, PRECIO_COMPRA, PRECIO_TRANSPASO, TOTAL_INVERSION, PRECIO_COSTO)
                        VALUES (?,?,?,?,?)`,
                        [idVehRecibir, vr.monto_recibido, vr.monto_traspaso||0, vr.monto_recibido, vr.monto_recibido]
                    );
                } else {
                    await connection.execute(
                        `UPDATE COSTOS_VEHICULO SET PRECIO_COMPRA=?, PRECIO_TRANSPASO=?, TOTAL_INVERSION=?, PRECIO_COSTO=?
                        WHERE ID_VEHICULO=?`,
                        [vr.monto_recibido, vr.monto_traspaso||0, vr.monto_recibido, vr.monto_recibido, idVehRecibir]
                    );
                }
            }
        }

        // ─── 5. FINANCIAMIENTO (si es crédito) ────────────────────
        let idFinanciamiento = null;
        if (forma_pago?.tipo_venta === 'credito' || forma_pago?.tipo_venta === 'CREDITO') {
            if (!financiamiento) {
                console.warn('No hay datos de financiamiento aunque la venta es a crédito');
            } else {
                // Insertar financiamiento
                const [rf] = await connection.execute(
                    `INSERT INTO FINANCIAMIENTOS (
                        ID_VENTA, VALOR_CONSUMO, PRIMA, HONORARIOS, MONTO_FINANCIAR,
                        COMISION, TOTAL, TASA_NOMINAL, TASA_MENSUAL, INTERES_MORATORIO,
                        INTERESXADELANTO, PRESTAMO_TOTAL, PLAZO_MESES, FECHA_PRIMERPAGO,
                        ENTIDAD_FINANCIERA, CUOTA_MENSUAL, OBSERVACIONES, INTERESES_TOTAL
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        idVenta,
                        financiamiento.valor_consumo || 0,
                        financiamiento.prima || 0,
                        financiamiento.honorarios || 0,
                        financiamiento.monto_financiar || 0,
                        financiamiento.comision || 0,
                        financiamiento.total || 0,
                        financiamiento.tasa_nominal || 0,
                        financiamiento.tasa_mensual || 0,
                        financiamiento.interes_moratorio || 0,
                        financiamiento.intereses_adelantado || 0,
                        financiamiento.prestamo_total || 0,
                        financiamiento.plazo_meses || 0,
                        financiamiento.fecha_primer_pago || null,
                        financiamiento.entidad_financiera || null,
                        financiamiento.cuota_mensual || 0,
                        financiamiento.observaciones || null,
                        financiamiento.intereses_total || 0
                    ]
                );
                idFinanciamiento = rf.insertId;
            }
        }

        // ─── 6. ANTICIPOS (cuotas del crédito) ────────────────────
        if (Array.isArray(anticipos) && anticipos.length > 0 && idFinanciamiento) {
            for (const a of anticipos) {
                await connection.execute(
                    `INSERT INTO ANTICIPOS (
                        ID_FINANCIAMIENTO, FORMA_PAGO, NUM_DOCUMENTO, MONTO_COLONES,
                        MONTO_DOLARES, MONEDA, TIPO_CAMBIO, REALIZADO_POR, SALDO_PENDIENTE,
                        FECHA_ANTICIPO, FECHA_VENCIMIENTO, OBSERVACIONES, ESTADO_ANTICIPO
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        idFinanciamiento,
                        a.forma_pago || a.FORMA_PAGO || 'EFECTIVO',
                        a.num_documento || a.NUM_DOCUMENTO || `CUOTA-${a.numero_cuota || 1}`,
                        parseFloat(a.monto_colones || a.MONTO_COLONES) || 0,
                        parseFloat(a.monto_dolares || a.MONTO_DOLARES) || 0,
                        a.moneda || 'CRC',
                        parseFloat(a.tipo_cambio || a.TIPO_CAMBIO) || 1,
                        a.realizado_por || a.REALIZADO_POR || id_vendedor,
                        parseFloat(a.saldo_pendiente || a.SALDO_PENDIENTE) || 0,
                        a.fecha_anticipo || a.FECHA_ANTICIPO || new Date().toISOString().split('T')[0],
                        a.fecha_vencimiento || a.FECHA_VENCIMIENTO || null,
                        a.observaciones || a.OBSERVACIONES || null,
                        'PENDIENTE'
                    ]
                );
            }
        }

        // ─── 7. DETALLE_PAGOS (pagos iniciales) ───────────────────
        if (Array.isArray(detalle_pagos) && detalle_pagos.length > 0) {
            for (const dp of detalle_pagos) {
                await connection.execute(
                    `INSERT INTO DETALLE_PAGOS (
                        ID_VENTA, ID_ANTICIPO, TIPO_VENTA, FORMA_PAGO,
                        ID_BANCO, EFECTIVO, TRANSFERENCIA, NUM_TRANSFERENCIA,
                        NOM_DEPOSITANTE, TARJETA, NUMERO_TARJETA, TIPO_TARJETA,
                        DETALLE, MONEDA, TIPO_CAMBIO, FECHA_PAGO, ESTADO_PAGO, OBSERVACIONES
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        idVenta,
                        dp.id_anticipo || null,
                        forma_pago?.tipo_venta || 'CONTADO',
                        dp.forma_pago || null,
                        dp.id_banco || null,
                        parseFloat(dp.efectivo) || 0,
                        parseFloat(dp.transferencia) || 0,
                        dp.num_transferencia || null,
                        dp.nom_deposita || null,
                        parseFloat(dp.tarjeta) || 0,
                        dp.num_tarjeta || null,
                        dp.tipo_tarjeta || null,
                        dp.detalle || null,
                        dp.moneda || 'CRC',
                        parseFloat(dp.tipo_cambio) || 1,
                        dp.fecha_pago || new Date().toISOString().split('T')[0],
                        'PENDIENTE',
                        dp.observaciones || null
                    ]
                );
            }
        }

        // ─── 8. Actualizar estado del vehículo a COMPRADO ──────────
        if (idVehiculo) {
            await connection.execute(
                'UPDATE VEHICULOS SET ESTADO = "COMPRADO" WHERE ID_VEHICULO = ?',
                [idVehiculo]
            );
        }

        // ─── Guardar costos del vehículo vendido ─────────────────
        if (req.body.costos_vehiculo && idVehiculo) {
            const cv = req.body.costos_vehiculo;
            const [existeCosto] = await connection.execute(
                'SELECT ID_COSTO FROM COSTOS_VEHICULO WHERE ID_VEHICULO = ?',
                [idVehiculo]
            );
            if (existeCosto.length > 0) {
                await connection.execute(
                    `UPDATE COSTOS_VEHICULO SET
                        PRECIO_PUBLICO    = ?,
                        MONTO_TRASPASO    = ?,
                        PRECIO_COMPRA     = ?,
                        PRECIO_COSTO      = ?,
                        SALDO             = ?,
                        MONEDA            = ?,
                        TIPO_CAMBIO_COMPRA = ?,
                        TRASPASO_PAGADO   = ?
                    WHERE ID_VEHICULO = ?`,
                    [
                        cv.precio_publico     ?? 0,
                        cv.monto_traspaso     ?? 0,
                        cv.precio_compra      ?? 0,
                        cv.precio_costo       ?? cv.precio_compra ?? 0,
                        cv.saldo              ?? cv.precio_publico ?? 0,
                        cv.moneda             ?? 'CRC',
                        cv.tipo_cambio_compra ?? 1,
                        cv.traspaso_pagado    ?? 0,
                        idVehiculo
                    ]
                );
            } else {
                await connection.execute(
                    `INSERT INTO COSTOS_VEHICULO
                        (ID_VEHICULO, PRECIO_PUBLICO, MONTO_TRASPASO, PRECIO_COMPRA,
                        PRECIO_COSTO, SALDO, MONEDA, TIPO_CAMBIO_COMPRA, TRASPASO_PAGADO)
                    VALUES (?,?,?,?,?,?,?,?,?)`,
                    [
                        idVehiculo,
                        cv.precio_publico     ?? 0,
                        cv.monto_traspaso     ?? 0,
                        cv.precio_compra      ?? 0,
                        cv.precio_costo       ?? cv.precio_compra ?? 0,
                        cv.saldo              ?? cv.precio_publico ?? 0,
                        cv.moneda             ?? 'CRC',
                        cv.tipo_cambio_compra ?? 1,
                        cv.traspaso_pagado    ?? 0
                    ]
                );
            }
        }

        // ─── 9. Auditoría ─────────────────────────────────────────
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) VALUES (?,?,?)`,
            [id_vendedor, 'CREAR_PLAN_VENTA', `Plan de venta ${codigoFinal} creado`]
        );

        await connection.commit();
        await connection.end();

        res.status(201).json({
            id_venta:    idVenta,
            codigo_venta: codigoFinal,
            id_financiamiento: idFinanciamiento,
            message:     'Plan de venta creado exitosamente'
        });

    } catch (err) {
        await connection.rollback();
        await connection.end();
        console.error('Error al crear plan de venta:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Ya existe un plan con ese código o el vehículo ya fue vendido' });
        }
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== API PARA ACTUALIZAR PLAN DE VENTA EXISTENTE =====
app.put('/api/plan-ventas/:id', async (req, res) => {
    const ventaId = req.params.id;
    const {
        codigo_venta,
        fecha_venta,
        nombre_notario,
        id_vendedor,
        pv_purdi,
        estado_venta,
        cliente_facturar,
        cliente_inscribir,
        vehiculo,
        vehiculo_recibir,
        vehiculos_recibir,
        forma_pago,
        financiamiento,
        anticipos,
        detalle_pagos
    } = req.body;

    const connection = await mysql.createConnection(dbConfig);

    try {
        await connection.beginTransaction();

        // Verificar que la venta existe
        const [ventaExistente] = await connection.execute(
            'SELECT * FROM VENTAS WHERE ID_VENTA = ?',
            [ventaId]
        );

        if (ventaExistente.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // ─── 1. ACTUALIZAR CLIENTES si es necesario ──────────────────
        const mismaCedula = cliente_facturar?.identificacion &&
                            cliente_inscribir?.identificacion &&
                            cliente_facturar.identificacion === cliente_inscribir.identificacion;

        async function upsertPersona(conn, datos, idRol) {
            let idPersona = datos?.id_persona_existente || null;

            if (!idPersona && datos?.identificacion) {
                const [existe] = await conn.execute(
                    'SELECT ID_PERSONA FROM PERSONAS WHERE IDENTIFICACION = ?',
                    [datos.identificacion]
                );
                if (existe.length > 0) {
                    idPersona = existe[0].ID_PERSONA;
                    await conn.execute(
                        `UPDATE PERSONAS SET NOMBRE_COMPLETO=?,TELEFONO_PRINCIPAL=?,TELEFONO_SECUNDARIO=?,
                        ID_ESTADO_CIVIL=?,OCUPACION=?,DIRECCION=?,EMAIL=?,NACIONALIDAD=?,TIPO_DOCUMENTO=?
                        WHERE ID_PERSONA=?`,
                        [datos.nombre_completo, datos.telefono_principal, datos.telefono_secundario,
                        datos.id_estado_civil||null, datos.ocupacion||null, datos.direccion||null,
                        datos.email||null, datos.nacionalidad||null, datos.tipo_documento||null, idPersona]
                    );
                } else {
                    const [r] = await conn.execute(
                        `INSERT INTO PERSONAS (TIPO_DOCUMENTO,IDENTIFICACION,NOMBRE_COMPLETO,TELEFONO_PRINCIPAL,
                        TELEFONO_SECUNDARIO,ID_ESTADO_CIVIL,OCUPACION,DIRECCION,EMAIL,NACIONALIDAD,ESTADO)
                        VALUES (?,?,?,?,?,?,?,?,?,?,'ACTIVO')`,
                        [datos.tipo_documento||null, datos.identificacion, datos.nombre_completo,
                        datos.telefono_principal||null, datos.telefono_secundario||null,
                        datos.id_estado_civil||null, datos.ocupacion||null, datos.direccion||null,
                        datos.email||null, datos.nacionalidad||null]
                    );
                    idPersona = r.insertId;
                }
            }

            if (idPersona) {
                await conn.execute(
                    `DELETE FROM PERSONAS_ROLES WHERE ID_PERSONA = ? AND ID_ROL IN (1,2,3)`,
                    [idPersona]
                );
                await conn.execute(
                    `INSERT IGNORE INTO PERSONAS_ROLES (ID_PERSONA, ID_ROL, ESTADO) VALUES (?,?,'ACTIVO')`,
                    [idPersona, idRol]
                );
            }

            return idPersona;
        }

        let idClienteFacturar, idClienteInscribir;

        if (mismaCedula) {
            idClienteFacturar = await upsertPersona(connection, cliente_facturar, 3);
            idClienteInscribir = idClienteFacturar;
        } else {
            idClienteFacturar  = await upsertPersona(connection, cliente_facturar,  1);
            idClienteInscribir = await upsertPersona(connection, cliente_inscribir, 2);
        }

        // ─── 2. ACTUALIZAR VEHÍCULO VENDIDO si es necesario ───────
        let idVehiculo = vehiculo?.id_vehiculo || ventaExistente[0].ID_VEHICULO;
        
        if (vehiculo?.id_vehiculo && vehiculo.id_vehiculo !== ventaExistente[0].ID_VEHICULO) {
            // Actualizar el ID_VEHICULO en la venta
            await connection.execute(
                'UPDATE VENTAS SET ID_VEHICULO = ? WHERE ID_VENTA = ?',
                [vehiculo.id_vehiculo, ventaId]
            );
        }

        // ─── 3. VEHÍCULO(s) A RECIBIR (INTERCAMBIO) ─────────────────
        const listaVehiculos = (vehiculos_recibir && vehiculos_recibir.length > 0)
            ? vehiculos_recibir
            : (vehiculo_recibir ? [vehiculo_recibir] : []);

        for (const vr of listaVehiculos) {
            const tieneIntercambio = vr && (
                (vr.placa && vr.placa.trim() !== '') ||
                (vr.chasis && vr.chasis.trim() !== '')
            );
            if (!tieneIntercambio) continue;

            console.log('Procesando intercambio - Vehículo recibido:', vr);

            const idClienteOrigen = idClienteInscribir || idClienteFacturar;
            if (!idClienteOrigen) throw new Error('Para un intercambio se requiere un cliente');

            let idVehRecibir = null;

            if (vr.chasis) {
                const [exVR] = await connection.execute(
                    'SELECT ID_VEHICULO FROM VEHICULOS WHERE CHASIS = ?', [vr.chasis]
                );
                if (exVR.length > 0) idVehRecibir = exVR[0].ID_VEHICULO;
            }

            if (!idVehRecibir && vr.placa) {
                const [exVR] = await connection.execute(
                    'SELECT ID_VEHICULO FROM VEHICULOS WHERE PLACA = ?', [vr.placa]
                );
                if (exVR.length > 0) idVehRecibir = exVR[0].ID_VEHICULO;
            }

            if (!idVehRecibir) {
                const [rVR] = await connection.execute(
                    `INSERT INTO VEHICULOS (
                        ID_PROVEEDOR, CHASIS, MOTOR, PLACA, ID_MARCA, MODELO,
                        ID_COLOR, ID_COMBUSTIBLE, ID_TRANSMISION, ESTILO, TRACCION, CARROCERIA,
                        C_C, CILINDROS, KILOMETRAJE_ACTUAL, KILOMETRAJE_ANTERIOR, PV,
                        ESTADO, OBSERVACIONES,
                        ES_INTERCAMBIO, ID_CLIENTE_ORIGEN, FECHA_RECEPCION
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        idClienteOrigen,
                        vr.chasis||null, vr.motor||null, vr.placa||null,
                        vr.id_marca||1, vr.modelo||new Date().getFullYear(),
                        vr.id_color||null, vr.id_combustible||null, vr.id_transmision||null,
                        vr.estilo||null, vr.traccion||null, vr.carroceria||null,
                        vr.cc||null, vr.cilindros||null,
                        vr.kilometraje_actual||0, vr.kilometraje_anterior||0,
                        vr.pv||null, 'COMPRADO',
                        vr.observaciones || 'Vehículo recibido en intercambio.',
                        true, idClienteOrigen, new Date()
                    ]
                );
                idVehRecibir = rVR.insertId;
            } else {
                await connection.execute(
                    `UPDATE VEHICULOS SET
                        ESTADO = 'COMPRADO', ES_INTERCAMBIO = TRUE,
                        ID_CLIENTE_ORIGEN = ?, FECHA_RECEPCION = ?,
                        KILOMETRAJE_ACTUAL = ?,
                        OBSERVACIONES = CONCAT(IFNULL(OBSERVACIONES,''), ' | Recibido en intercambio el ', CURDATE())
                    WHERE ID_VEHICULO = ?`,
                    [idClienteOrigen, new Date(), vr.kilometraje_actual||0, idVehRecibir]
                );
            }

            if (vr.monto_recibido && parseFloat(vr.monto_recibido) > 0) {
                const [costoExistente] = await connection.execute(
                    'SELECT ID_COSTO FROM COSTOS_VEHICULO WHERE ID_VEHICULO = ?', [idVehRecibir]
                );
                if (costoExistente.length === 0) {
                    await connection.execute(
                        `INSERT INTO COSTOS_VEHICULO (ID_VEHICULO, PRECIO_COMPRA, PRECIO_TRANSPASO, TOTAL_INVERSION, PRECIO_COSTO)
                         VALUES (?,?,?,?,?)`,
                        [idVehRecibir, vr.monto_recibido, vr.monto_traspaso||0, vr.monto_recibido, vr.monto_recibido]
                    );
                } else {
                    await connection.execute(
                        `UPDATE COSTOS_VEHICULO SET PRECIO_COMPRA=?, PRECIO_TRANSPASO=?, TOTAL_INVERSION=?, PRECIO_COSTO=?
                         WHERE ID_VEHICULO=?`,
                        [vr.monto_recibido, vr.monto_traspaso||0, vr.monto_recibido, vr.monto_recibido, idVehRecibir]
                    );
                }
            }

            // Vincular vehículo recibido a esta venta
            await connection.execute(
                'UPDATE VEHICULOS SET ID_VENTA_ORIGEN = ? WHERE ID_VEHICULO = ?',
                [ventaId, idVehRecibir]
            );
        }

        // ─── 4. ACTUALIZAR DATOS DE LA VENTA ─────────────────────
        await connection.execute(
            `UPDATE VENTAS SET
                NOMBRE_NOTARIO = COALESCE(?, NOMBRE_NOTARIO),
                PV_PURDI = COALESCE(?, PV_PURDI)
            WHERE ID_VENTA = ?`,
            [
                nombre_notario || null,
                pv_purdi || null,
                ventaId
            ]
        );

        // ─── 5. VERIFICAR SI YA EXISTE FINANCIAMIENTO ────────────
        const [financiamientoExistente] = await connection.execute(
            'SELECT ID_FINANCIAMIENTOS FROM FINANCIAMIENTOS WHERE ID_VENTA = ?',
            [ventaId]
        );

        let idFinanciamiento = null;

        // ─── 6. MANEJAR FINANCIAMIENTO (si es crédito) ───────────
        if (forma_pago?.tipo_venta === 'credito' || forma_pago?.tipo_venta === 'CREDITO') {
            if (financiamientoExistente.length > 0) {
                // Actualizar financiamiento existente
                idFinanciamiento = financiamientoExistente[0].ID_FINANCIAMIENTOS;
                
                await connection.execute(
                    `UPDATE FINANCIAMIENTOS SET
                        VALOR_CONSUMO = ?,
                        PRIMA = ?,
                        HONORARIOS = ?,
                        MONTO_FINANCIAR = ?,
                        COMISION = ?,
                        TOTAL = ?,
                        TASA_NOMINAL = ?,
                        TASA_MENSUAL = ?,
                        INTERES_MORATORIO = ?,
                        INTERESXADELANTO = ?,
                        PRESTAMO_TOTAL = ?,
                        PLAZO_MESES = ?,
                        FECHA_PRIMERPAGO = ?,
                        ENTIDAD_FINANCIERA = ?,
                        CUOTA_MENSUAL = ?,
                        OBSERVACIONES = ?,
                        INTERESES_TOTAL = ?
                    WHERE ID_FINANCIAMIENTOS = ?`,
                    [
                        financiamiento.valor_consumo || 0,
                        financiamiento.prima || 0,
                        financiamiento.honorarios || 0,
                        financiamiento.monto_financiar || 0,
                        financiamiento.comision || 0,
                        financiamiento.total || 0,
                        financiamiento.tasa_nominal || 0,
                        financiamiento.tasa_mensual || 0,
                        financiamiento.interes_moratorio || 0,
                        financiamiento.intereses_adelantado || 0,
                        financiamiento.prestamo_total || 0,
                        financiamiento.plazo_meses || 0,
                        financiamiento.fecha_primer_pago || null,
                        financiamiento.entidad_financiera || null,
                        financiamiento.cuota_mensual || 0,
                        financiamiento.observaciones || null,
                        financiamiento.intereses_total || 0,
                        idFinanciamiento
                    ]
                );
            } else if (financiamiento) {
                // Crear nuevo financiamiento
                const [rf] = await connection.execute(
                    `INSERT INTO FINANCIAMIENTOS (
                        ID_VENTA, VALOR_CONSUMO, PRIMA, HONORARIOS, MONTO_FINANCIAR,
                        COMISION, TOTAL, TASA_NOMINAL, TASA_MENSUAL, INTERES_MORATORIO,
                        INTERESXADELANTO, PRESTAMO_TOTAL, PLAZO_MESES, FECHA_PRIMERPAGO,
                        ENTIDAD_FINANCIERA, CUOTA_MENSUAL, OBSERVACIONES, INTERESES_TOTAL
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        ventaId,
                        financiamiento.valor_consumo || 0,
                        financiamiento.prima || 0,
                        financiamiento.honorarios || 0,
                        financiamiento.monto_financiar || 0,
                        financiamiento.comision || 0,
                        financiamiento.total || 0,
                        financiamiento.tasa_nominal || 0,
                        financiamiento.tasa_mensual || 0,
                        financiamiento.interes_moratorio || 0,
                        financiamiento.intereses_adelantado || 0,
                        financiamiento.prestamo_total || 0,
                        financiamiento.plazo_meses || 0,
                        financiamiento.fecha_primer_pago || null,
                        financiamiento.entidad_financiera || null,
                        financiamiento.cuota_mensual || 0,
                        financiamiento.observaciones || null,
                        financiamiento.intereses_total || 0
                    ]
                );
                idFinanciamiento = rf.insertId;
            }
        }

        // ─── 7. MANEJAR ANTICIPOS (cuotas) ───────────────────────        
        if (Array.isArray(anticipos) && anticipos.length > 0 && idFinanciamiento) {
            // Obtener anticipos existentes para este financiamiento
            const [anticiposExistentes] = await connection.execute(
                'SELECT ID_ANTICIPO, NUM_DOCUMENTO FROM ANTICIPOS WHERE ID_FINANCIAMIENTO = ?',
                [idFinanciamiento]
            );

            const documentosExistentes = new Set(anticiposExistentes.map(a => a.NUM_DOCUMENTO));

            for (const a of anticipos) {
                const numDocumento = a.num_documento || a.NUM_DOCUMENTO || `CUOTA-${Date.now()}`;
                
                if (documentosExistentes.has(numDocumento)) {
                    // Actualizar anticipo existente
                    await connection.execute(
                        `UPDATE ANTICIPOS SET
                            FORMA_PAGO = ?,
                            MONTO_COLONES = ?,
                            MONTO_DOLARES = ?,
                            MONEDA = ?,
                            TIPO_CAMBIO = ?,
                            REALIZADO_POR = ?,
                            SALDO_PENDIENTE = ?,
                            FECHA_ANTICIPO = ?,
                            FECHA_VENCIMIENTO = ?,
                            OBSERVACIONES = ?,
                            ESTADO_ANTICIPO = ?
                        WHERE ID_FINANCIAMIENTO = ? AND NUM_DOCUMENTO = ?`,
                        [
                            a.forma_pago || 'EFECTIVO',
                            parseFloat(a.monto_colones) || 0,
                            parseFloat(a.monto_dolares) || 0,
                            a.moneda || 'CRC',
                            parseFloat(a.tipo_cambio) || 1,
                            a.realizado_por || id_vendedor,
                            parseFloat(a.saldo_pendiente) || 0,
                            a.fecha_anticipo || new Date().toISOString().split('T')[0],
                            a.fecha_vencimiento || null,
                            a.observaciones || null,
                            a.estado_anticipo || 'PENDIENTE',
                            idFinanciamiento,
                            numDocumento
                        ]
                    );
                } else {
                    // Insertar nuevo anticipo
                    await connection.execute(
                        `INSERT INTO ANTICIPOS (
                            ID_FINANCIAMIENTO, FORMA_PAGO, NUM_DOCUMENTO, MONTO_COLONES,
                            MONTO_DOLARES, MONEDA, TIPO_CAMBIO, REALIZADO_POR, SALDO_PENDIENTE,
                            FECHA_ANTICIPO, FECHA_VENCIMIENTO, OBSERVACIONES, ESTADO_ANTICIPO
                        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                        [
                            idFinanciamiento,
                            a.forma_pago || 'EFECTIVO',
                            numDocumento,
                            parseFloat(a.monto_colones) || 0,
                            parseFloat(a.monto_dolares) || 0,
                            a.moneda || 'CRC',
                            parseFloat(a.tipo_cambio) || 1,
                            a.realizado_por || id_vendedor,
                            parseFloat(a.saldo_pendiente) || 0,
                            a.fecha_anticipo || new Date().toISOString().split('T')[0],
                            a.fecha_vencimiento || null,
                            a.observaciones || null,
                            a.estado_anticipo || 'PENDIENTE'
                        ]
                    );
                }
            }
        }

        // ─── 8. DETALLE_PAGOS (pagos iniciales) ───────────────────
        let detallesPagoFinal = detalle_pagos;
        
        if ((!detallesPagoFinal || detallesPagoFinal.length === 0) && forma_pago) {
            const montoTotal = parseFloat(forma_pago.monto_total) || 0;
            const efectivo   = parseFloat(forma_pago.efectivo)    || 0;
            const transferencia = parseFloat(forma_pago.transferencia) || 0;
            const tarjeta    = parseFloat(forma_pago.tarjeta)     || 0;
        
            // Solo crear detalle si hay algún monto
            if (montoTotal > 0 || efectivo > 0 || transferencia > 0 || tarjeta > 0) {
                detallesPagoFinal = [{
                    tipo_venta:       forma_pago.tipo_venta || 'CONTADO',
                    forma_pago:       forma_pago.forma_pago_pago || 'Efectivo',
                    id_banco:         forma_pago.id_banco || null,
                    efectivo:         efectivo,
                    transferencia:    transferencia,
                    num_transferencia: forma_pago.num_transferencia || null,
                    nom_deposita:     forma_pago.nom_deposita || null,
                    tarjeta:          tarjeta,
                    num_tarjeta:      forma_pago.num_tarjeta || null,
                    tipo_tarjeta:     forma_pago.tipo_tarjeta || null,
                    moneda:           forma_pago.moneda || 'CRC',
                    tipo_cambio:      parseFloat(forma_pago.tipo_cambio) || 1,
                    fecha_pago:       forma_pago.fecha_pago || new Date().toISOString().split('T')[0],
                    observaciones:    `Pago contado - ${forma_pago.forma_pago_pago || 'Efectivo'}`
                }];
            }
        }
        
        if (Array.isArray(detallesPagoFinal) && detallesPagoFinal.length > 0) {
            // Primero eliminar detalles anteriores para no duplicar
            await connection.execute('DELETE FROM DETALLE_PAGOS WHERE ID_VENTA = ?', [ventaId]);
            
            for (const dp of detallesPagoFinal) {
                await connection.execute(
                    `INSERT INTO DETALLE_PAGOS (
                        ID_VENTA, ID_ANTICIPO, TIPO_VENTA, FORMA_PAGO,
                        ID_BANCO, EFECTIVO, TRANSFERENCIA, NUM_TRANSFERENCIA,
                        NOM_DEPOSITANTE, TARJETA, NUMERO_TARJETA, TIPO_TARJETA,
                        DETALLE, MONEDA, TIPO_CAMBIO, FECHA_PAGO, ESTADO_PAGO, OBSERVACIONES
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        ventaId,
                        dp.id_anticipo || null,
                        dp.tipo_venta || forma_pago?.tipo_venta || 'CONTADO',
                        dp.forma_pago || null,
                        dp.id_banco || null,
                        parseFloat(dp.efectivo) || 0,
                        parseFloat(dp.transferencia) || 0,
                        dp.num_transferencia || null,
                        dp.nom_deposita || null,
                        parseFloat(dp.tarjeta) || 0,
                        dp.num_tarjeta || null,
                        dp.tipo_tarjeta || null,
                        dp.detalle || null,
                        dp.moneda || 'CRC',
                        parseFloat(dp.tipo_cambio) || 1,
                        dp.fecha_pago || new Date().toISOString().split('T')[0],
                        'PENDIENTE',
                        dp.observaciones || null
                    ]
                );
            }
        }

        // ─── Guardar costos del vehículo vendido ─────────────────
        if (req.body.costos_vehiculo && idVehiculo) {
            const cv = req.body.costos_vehiculo;
            const [existeCosto] = await connection.execute(
                'SELECT ID_COSTO FROM COSTOS_VEHICULO WHERE ID_VEHICULO = ?',
                [idVehiculo]
            );
            if (existeCosto.length > 0) {
                await connection.execute(
                    `UPDATE COSTOS_VEHICULO SET
                        PRECIO_PUBLICO    = ?,
                        MONTO_TRASPASO    = ?,
                        PRECIO_COMPRA     = ?,
                        PRECIO_COSTO      = ?,
                        SALDO             = ?,
                        MONEDA            = ?,
                        TIPO_CAMBIO_COMPRA = ?,
                        TRASPASO_PAGADO   = ?
                    WHERE ID_VEHICULO = ?`,
                    [
                        cv.precio_publico     ?? 0,
                        cv.monto_traspaso     ?? 0,
                        cv.precio_compra      ?? 0,
                        cv.precio_costo       ?? cv.precio_compra ?? 0,
                        cv.saldo              ?? cv.precio_publico ?? 0,
                        cv.moneda             ?? 'CRC',
                        cv.tipo_cambio_compra ?? 1,
                        cv.traspaso_pagado    ?? 0,
                        idVehiculo
                    ]
                );
            } else {
                await connection.execute(
                    `INSERT INTO COSTOS_VEHICULO
                        (ID_VEHICULO, PRECIO_PUBLICO, MONTO_TRASPASO, PRECIO_COMPRA,
                        PRECIO_COSTO, SALDO, MONEDA, TIPO_CAMBIO_COMPRA, TRASPASO_PAGADO)
                    VALUES (?,?,?,?,?,?,?,?,?)`,
                    [
                        idVehiculo,
                        cv.precio_publico     ?? 0,
                        cv.monto_traspaso     ?? 0,
                        cv.precio_compra      ?? 0,
                        cv.precio_costo       ?? cv.precio_compra ?? 0,
                        cv.saldo              ?? cv.precio_publico ?? 0,
                        cv.moneda             ?? 'CRC',
                        cv.tipo_cambio_compra ?? 1,
                        cv.traspaso_pagado    ?? 0
                    ]
                );
            }
        }

        // ─── 9. AUDITORÍA ─────────────────────────────────────────
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) VALUES (?,?,?)`,
            [id_vendedor, 'ACTUALIZAR_PLAN_VENTA', `Plan de venta ${codigo_venta} actualizado`]
        );

        await connection.commit();
        await connection.end();

        res.json({
            id_venta: ventaId,
            codigo_venta: codigo_venta,
            id_financiamiento: idFinanciamiento,
            message: 'Plan de venta actualizado exitosamente'
        });

    } catch (err) {
        await connection.rollback();
        await connection.end();
        console.error('Error al actualizar plan de venta:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Ya existe un plan con ese código o el vehículo ya fue vendido' });
        }
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== APIS PARA ANTICIPOS=====
// Obtener anticipos por financiamiento
app.get('/api/anticipos', async (req, res) => {
    try {
        const { id_financiamiento, id_venta } = req.query;
        let query = `
            SELECT a.*, f.ID_VENTA, v.CODIGO_VENTA
            FROM ANTICIPOS a
            LEFT JOIN FINANCIAMIENTOS f ON a.ID_FINANCIAMIENTO = f.ID_FINANCIAMIENTOS
            LEFT JOIN VENTAS v ON f.ID_VENTA = v.ID_VENTA
            WHERE 1=1`;
        const params = [];

        if (id_financiamiento) {
            query += ' AND a.ID_FINANCIAMIENTO = ?';
            params.push(id_financiamiento);
        } else if (id_venta) {
            query += ' AND f.ID_VENTA = ?';
            params.push(id_venta);
        }
        query += ' ORDER BY a.FECHA_VENCIMIENTO ASC, a.ID_ANTICIPO ASC';

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(query, params);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener anticipos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener un anticipo por ID
app.get('/api/anticipos/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [anticipos] = await connection.execute(
            `SELECT a.*, f.ID_VENTA, v.CODIGO_VENTA
             FROM ANTICIPOS a
             LEFT JOIN FINANCIAMIENTOS f ON a.ID_FINANCIAMIENTO = f.ID_FINANCIAMIENTOS
             LEFT JOIN VENTAS v ON f.ID_VENTA = v.ID_VENTA
             WHERE a.ID_ANTICIPO = ?`,
            [req.params.id]
        );
        
        await connection.end();
        
        if (anticipos.length === 0) {
            return res.status(404).json({ error: 'Anticipo no encontrado' });
        }
        
        res.json(anticipos[0]);
        
    } catch (err) {
        console.error('Error al obtener anticipo:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Crear un anticipo (cuota)
app.post('/api/anticipos', async (req, res) => {
    const {
        id_financiamiento,
        forma_pago,
        num_documento,
        monto_colones,
        monto_dolares,
        moneda,
        tipo_cambio,
        realizado_por,
        saldo_pendiente,
        fecha_anticipo,
        fecha_vencimiento,
        observaciones,
        estado_anticipo
    } = req.body;

    if (!id_financiamiento || !forma_pago || !num_documento) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            `INSERT INTO ANTICIPOS
             (ID_FINANCIAMIENTO, FORMA_PAGO, NUM_DOCUMENTO, MONTO_COLONES,
              MONTO_DOLARES, MONEDA, TIPO_CAMBIO, REALIZADO_POR, SALDO_PENDIENTE,
              FECHA_ANTICIPO, FECHA_VENCIMIENTO, OBSERVACIONES, ESTADO_ANTICIPO)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id_financiamiento,
                forma_pago,
                num_documento,
                parseFloat(monto_colones) || 0,
                parseFloat(monto_dolares) || 0,
                moneda || 'CRC',
                parseFloat(tipo_cambio)   || 1,
                realizado_por || '',
                parseFloat(saldo_pendiente) || parseFloat(monto_colones) || 0,
                fecha_anticipo || new Date().toISOString().split('T')[0],
                fecha_vencimiento || null,
                observaciones || null,
                estado_anticipo || 'PENDIENTE'
            ]
        );
        await connection.end();
        res.status(201).json({ id: result.insertId, message: 'Anticipo creado' });
    } catch (err) {
        console.error('Error al crear anticipo:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// Actualizar un anticipo
app.put('/api/anticipos/:id', async (req, res) => {
    const { id } = req.params;
    const {
        forma_pago,
        num_documento,
        monto_colones,
        monto_dolares,
        moneda,
        tipo_cambio,
        realizado_por,
        saldo_pendiente,
        fecha_anticipo,
        fecha_vencimiento,
        observaciones,
        estado_anticipo
    } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);

        // ── Obtener el anticipo actual para usar sus valores como fallback ──
        const [actual] = await connection.execute(
            'SELECT * FROM ANTICIPOS WHERE ID_ANTICIPO = ?', [id]
        );
        if (actual.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Anticipo no encontrado' });
        }
        const ant = actual[0];

        await connection.execute(
            `UPDATE ANTICIPOS SET
             FORMA_PAGO        = ?,
             NUM_DOCUMENTO     = ?,
             MONTO_COLONES     = ?,
             MONTO_DOLARES     = ?,
             MONEDA            = ?,
             TIPO_CAMBIO       = ?,
             REALIZADO_POR     = ?,
             SALDO_PENDIENTE   = ?,
             FECHA_ANTICIPO    = ?,
             FECHA_VENCIMIENTO = ?,
             OBSERVACIONES     = ?,
             ESTADO_ANTICIPO   = ?
             WHERE ID_ANTICIPO = ?`,
            [
                forma_pago      ?? ant.FORMA_PAGO      ?? 'EFECTIVO',
                num_documento   ?? ant.NUM_DOCUMENTO   ?? '',
                parseFloat(monto_colones)   || parseFloat(ant.MONTO_COLONES)   || 0,
                parseFloat(monto_dolares)   || parseFloat(ant.MONTO_DOLARES)   || 0,
                moneda          ?? ant.MONEDA          ?? 'CRC',
                parseFloat(tipo_cambio)     || parseFloat(ant.TIPO_CAMBIO)     || 1,
                realizado_por   ?? ant.REALIZADO_POR   ?? '',
                parseFloat(saldo_pendiente) !== undefined
                    ? parseFloat(saldo_pendiente)
                    : parseFloat(ant.SALDO_PENDIENTE)  || 0,
                fecha_anticipo  ?? ant.FECHA_ANTICIPO  ?? new Date().toISOString().split('T')[0],
                fecha_vencimiento != null
                    ? fecha_vencimiento
                    : ant.FECHA_VENCIMIENTO ?? null,
                observaciones   ?? ant.OBSERVACIONES   ?? null,
                estado_anticipo ?? ant.ESTADO_ANTICIPO ?? 'PENDIENTE',
                id
            ]
        );

        await connection.end();
        res.json({ message: 'Anticipo actualizado' });

    } catch (err) {
        console.error('Error al actualizar anticipo:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// Eliminar un anticipo
app.delete('/api/anticipos/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM ANTICIPOS WHERE ID_ANTICIPO = ?', [req.params.id]);
        await connection.end();
        res.json({ message: 'Anticipo eliminado' });
    } catch (err) {
        console.error('Error al eliminar anticipo:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== REGISTRAR PAGO DE ANTICIPO =====
app.post('/api/anticipos/:id/pagar', async (req, res) => {
    const { id } = req.params;
    const {
        monto_pago,
        forma_pago,
        id_banco,
        num_transferencia,
        nom_deposita,
        num_tarjeta,
        tipo_tarjeta,
        fecha_pago,
        realizado_por
    } = req.body;

    if (!monto_pago || monto_pago <= 0) {
        return res.status(400).json({ error: 'El monto de pago es requerido' });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    try {
        await connection.beginTransaction();

        // Obtener el anticipo actual
        const [anticipos] = await connection.execute(
            `SELECT a.*, f.ID_VENTA 
             FROM ANTICIPOS a
             LEFT JOIN FINANCIAMIENTOS f ON a.ID_FINANCIAMIENTO = f.ID_FINANCIAMIENTOS
             WHERE a.ID_ANTICIPO = ? FOR UPDATE`,
            [id]
        );

        if (anticipos.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Anticipo no encontrado' });
        }

        const anticipo = anticipos[0];
        const nuevoSaldo = Math.max(0, anticipo.SALDO_PENDIENTE - monto_pago);
        
        // Determinar nuevo estado
        let nuevoEstado = anticipo.ESTADO_ANTICIPO;
        if (nuevoSaldo <= 0) {
            nuevoEstado = 'COMPLETADO';
        } else if (nuevoSaldo < anticipo.SALDO_PENDIENTE) {
            nuevoEstado = 'PARCIAL';
        }

        // Actualizar el anticipo
        await connection.execute(
            `UPDATE ANTICIPOS 
             SET SALDO_PENDIENTE = ?, ESTADO_ANTICIPO = ?
             WHERE ID_ANTICIPO = ?`,
            [nuevoSaldo, nuevoEstado, id]
        );

        // Registrar el detalle del pago
        await connection.execute(
            `INSERT INTO DETALLE_PAGOS (
                ID_VENTA, ID_ANTICIPO, TIPO_VENTA, FORMA_PAGO,
                ID_BANCO, EFECTIVO, TRANSFERENCIA, NUM_TRANSFERENCIA,
                NOM_DEPOSITANTE, TARJETA, NUMERO_TARJETA, TIPO_TARJETA,
                FECHA_PAGO, ESTADO_PAGO, OBSERVACIONES
            ) VALUES (?, ?, 'CREDITO', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETADO', ?)`,
            [
                anticipo.ID_VENTA,
                id,
                forma_pago || 'EFECTIVO',
                id_banco || null,
                forma_pago === 'EFECTIVO' ? monto_pago : 0,
                forma_pago === 'TRANSFERENCIA' ? monto_pago : 0,
                num_transferencia || null,
                nom_deposita || null,
                forma_pago === 'TARJETA' ? monto_pago : 0,
                num_tarjeta || null,
                tipo_tarjeta || null,
                fecha_pago || new Date().toISOString().split('T')[0],
                `Pago de cuota ${anticipo.NUM_DOCUMENTO}`
            ]
        );

        await connection.commit();
        await connection.end();

        res.json({ 
            message: 'Pago registrado exitosamente',
            nuevo_saldo: nuevoSaldo,
            estado: nuevoEstado
        });

    } catch (err) {
        await connection.rollback();
        await connection.end();
        console.error('Error al registrar pago:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== API PARA DETALLE DE PAGOS =====
app.get('/api/detalle-pagos', async (req, res) => {
    try {
        const { id_venta, id_anticipo } = req.query;
        let query = `
            SELECT dp.*, cb.NOMBRE as banco_nombre
            FROM DETALLE_PAGOS dp
            LEFT JOIN CAT_BANCOS cb ON dp.ID_BANCO = cb.ID_BANCO
            WHERE 1=1`;
        const params = [];

        if (id_venta) {
            query += ' AND dp.ID_VENTA = ?';
            params.push(id_venta);
        }
        if (id_anticipo) {
            query += ' AND dp.ID_ANTICIPO = ?';
            params.push(id_anticipo);
        }

        query += ' ORDER BY dp.FECHA_PAGO DESC';

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(query, params);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener detalle de pagos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ===== API PARA CUENTAS POR COBRAR =====
app.get('/api/cuentas-cobrar', async (req, res) => {
    try {
        const { plan_venta, cliente, estado } = req.query;

        // ── PARTE 1: ANTICIPOS (créditos) ─────────────────────────────────
        let qAnticipos = `
            SELECT
                a.ID_ANTICIPO AS id,
                a.ID_ANTICIPO AS id_cuenta,
                'anticipo'    AS tipo_registro,
                f.ID_VENTA    AS id_venta,
                v.CODIGO_VENTA AS plan_venta,
                pf.NOMBRE_COMPLETO AS cliente,
                pf.IDENTIFICACION  AS cedula,
                pf.TELEFONO_PRINCIPAL AS telefono,
                CONCAT(IFNULL(m.NOMBRE,''), ' ', IFNULL(ve.ESTILO,'')) AS vehiculo,
                ve.PLACA AS placa,
                CAST(
                    SUBSTRING_INDEX(SUBSTRING_INDEX(a.NUM_DOCUMENTO, '-', 2), '-', -1)
                AS UNSIGNED) AS numero_cuota,
                a.FECHA_VENCIMIENTO AS fecha_vencimiento,
                a.MONTO_COLONES     AS monto_cuota,
                a.SALDO_PENDIENTE   AS saldo_pendiente,
                f.TASA_NOMINAL      AS interes_nominal,
                f.INTERES_MORATORIO AS interes_moratorio,
                CASE
                    WHEN a.ESTADO_ANTICIPO = 'COMPLETADO'                              THEN 'pagado'
                    WHEN a.FECHA_VENCIMIENTO < CURDATE() AND a.SALDO_PENDIENTE > 0     THEN 'atrasado'
                    WHEN a.SALDO_PENDIENTE > 0                                         THEN 'pendiente'
                    ELSE 'pendiente'
                END AS estado,
                a.OBSERVACIONES AS observaciones
            FROM ANTICIPOS a
            JOIN  FINANCIAMIENTOS f ON a.ID_FINANCIAMIENTO = f.ID_FINANCIAMIENTOS
            JOIN  VENTAS v          ON f.ID_VENTA = v.ID_VENTA
            LEFT JOIN PERSONAS pf   ON v.ID_CLIENTE_FACTURACION = pf.ID_PERSONA
            LEFT JOIN VEHICULOS ve  ON v.ID_VEHICULO = ve.ID_VEHICULO
            LEFT JOIN CAT_MARCAS m  ON ve.ID_MARCA = m.ID_MARCA
            WHERE v.ESTADO_PAGO = 'YA FUE FACTURADA'
        `;

        // ── PARTE 2: DETALLE_PAGOS pendientes (contado sin anticipo) ──────
        let qDetalle = `
            SELECT
                dp.ID_DETALLEPAGO AS id,
                dp.ID_DETALLEPAGO AS id_cuenta,
                'detalle_pago'     AS tipo_registro,
                v.ID_VENTA         AS id_venta,
                v.CODIGO_VENTA     AS plan_venta,
                pf.NOMBRE_COMPLETO AS cliente,
                pf.IDENTIFICACION  AS cedula,
                pf.TELEFONO_PRINCIPAL AS telefono,
                CONCAT(IFNULL(m.NOMBRE,''), ' ', IFNULL(ve.ESTILO,'')) AS vehiculo,
                ve.PLACA AS placa,
                1        AS numero_cuota,
                dp.FECHA_PAGO AS fecha_vencimiento,
                (dp.EFECTIVO + dp.TRANSFERENCIA + dp.TARJETA) AS monto_cuota,
                (dp.EFECTIVO + dp.TRANSFERENCIA + dp.TARJETA) AS saldo_pendiente,
                0 AS interes_nominal,
                0 AS interes_moratorio,
                CASE
                    WHEN dp.FECHA_PAGO < CURDATE() THEN 'atrasado'
                    ELSE 'pendiente'
                END AS estado,
                dp.OBSERVACIONES AS observaciones
            FROM DETALLE_PAGOS dp
            JOIN  VENTAS v         ON dp.ID_VENTA = v.ID_VENTA
            LEFT JOIN PERSONAS pf  ON v.ID_CLIENTE_FACTURACION = pf.ID_PERSONA
            LEFT JOIN VEHICULOS ve ON v.ID_VEHICULO = ve.ID_VEHICULO
            LEFT JOIN CAT_MARCAS m ON ve.ID_MARCA = m.ID_MARCA
            WHERE v.ESTADO_PAGO  = 'YA FUE FACTURADA'
              AND dp.ESTADO_PAGO = 'PENDIENTE'
              AND dp.ID_ANTICIPO IS NULL
        `;

        const pA = [];   // params anticipos
        const pD = [];   // params detalle_pagos

        // Filtros compartidos
        if (plan_venta) {
            qAnticipos += ' AND v.CODIGO_VENTA LIKE ?';   pA.push(`%${plan_venta}%`);
            qDetalle   += ' AND v.CODIGO_VENTA LIKE ?';   pD.push(`%${plan_venta}%`);
        }
        if (cliente) {
            qAnticipos += ' AND (pf.NOMBRE_COMPLETO LIKE ? OR pf.IDENTIFICACION LIKE ?)';
            pA.push(`%${cliente}%`, `%${cliente}%`);
            qDetalle   += ' AND (pf.NOMBRE_COMPLETO LIKE ? OR pf.IDENTIFICACION LIKE ?)';
            pD.push(`%${cliente}%`, `%${cliente}%`);
        }

        // Filtro de estado
        if (estado === 'pagado') {
            qAnticipos += ' AND a.ESTADO_ANTICIPO = "COMPLETADO"';
            qDetalle   += ' AND 1=0';   // detalle_pagos pendientes nunca son "pagado"
        } else if (estado === 'pendiente') {
            qAnticipos += ' AND a.ESTADO_ANTICIPO IN ("PENDIENTE","PARCIAL") AND a.FECHA_VENCIMIENTO >= CURDATE()';
            qDetalle   += ' AND dp.FECHA_PAGO >= CURDATE()';
        } else if (estado === 'atrasado') {
            qAnticipos += ' AND a.ESTADO_ANTICIPO IN ("PENDIENTE","PARCIAL") AND a.FECHA_VENCIMIENTO < CURDATE()';
            qDetalle   += ' AND dp.FECHA_PAGO < CURDATE()';
        }

        const connection = await mysql.createConnection(dbConfig);
        const [rowsA] = await connection.execute(qAnticipos, pA);
        const [rowsD] = await connection.execute(qDetalle,   pD);
        await connection.end();

        // Combinar y ordenar
        const rows = [...rowsA, ...rowsD].sort((a, b) => {
            if (a.plan_venta < b.plan_venta) return -1;
            if (a.plan_venta > b.plan_venta) return  1;
            return (a.numero_cuota || 0) - (b.numero_cuota || 0);
        });

        res.json(rows);
    } catch (err) {
        console.error('Error al obtener cuentas por cobrar:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// Marcar un DETALLE_PAGO como completado
app.put('/api/detalle-pagos/:id/pagar', async (req, res) => {
    try {
        const { estado_pago, fecha_pago, realizado_por, num_documento } = req.body;
        const connection = await mysql.createConnection(dbConfig);

        const [result] = await connection.execute(
            `UPDATE DETALLE_PAGOS
             SET ESTADO_PAGO = ?,
                 FECHA_PAGO  = ?,
                 OBSERVACIONES = CONCAT(IFNULL(OBSERVACIONES,''), ' | Cobrado por: ', ?, ' Doc: ', ?)
             WHERE ID_DETALLEPAGO = ?`,
            [
                estado_pago    || 'COMPLETADO',
                fecha_pago     || new Date().toISOString().split('T')[0],
                realizado_por  || 'Sistema',
                num_documento  || '',
                req.params.id
            ]
        );

        await connection.end();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Detalle de pago no encontrado' });
        }

        res.json({ message: 'Pago marcado como completado' });
    } catch (err) {
        console.error('Error al marcar pago:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== APIS PARA FINANCIAMIENTOS =====
app.get('/api/financiamientos', async (req, res) => {
    try {
        const { id_venta } = req.query;
        let query = `SELECT * FROM FINANCIAMIENTOS WHERE 1=1`;
        const params = [];

        if (id_venta) {
            query += ' AND ID_VENTA = ?';
            params.push(id_venta);
        }

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(query, params);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener financiamientos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.get('/api/dashboard', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Estadísticas rápidas
        const [estadisticas] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM PERSONAS WHERE ESTADO = 'ACTIVO') as personas_activas,
                (SELECT COUNT(*) FROM USUARIOS WHERE ESTADO = 'ACTIVO') as usuarios_activos,
                (SELECT COUNT(*) FROM PERSONAS_ROLES WHERE ID_ROL = 5 AND ESTADO = 'ACTIVO') as vendedores_activos,
                (SELECT COUNT(*) FROM VENTAS WHERE DATE(FECHA_VENTA) = CURDATE()) as ventas_hoy,
                (SELECT COUNT(*) FROM VEHICULOS WHERE ESTADO = 'COMPRADO') as vehiculos_inventario,
                (SELECT COUNT(*) FROM VEHICULOS WHERE ESTADO = 'VENDIDO') as vehiculos_vendidos
        `);
        
        // Últimas personas registradas
        const [ultimasPersonas] = await connection.execute(`
            SELECT 
                p.*,
                CASE WHEN u.ID_USUARIO IS NOT NULL THEN 'SI' ELSE 'NO' END as tiene_usuario
            FROM PERSONAS p
            LEFT JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
            ORDER BY p.FECHA_REGISTRO DESC
            LIMIT 10
        `);
        
        // Últimos usuarios creados
        const [ultimosUsuarios] = await connection.execute(`
            SELECT 
                u.*,
                p.NOMBRE_COMPLETO
            FROM USUARIOS u
            INNER JOIN PERSONAS p ON u.ID_PERSONA = p.ID_PERSONA
            ORDER BY u.FECHA_CREACION DESC
            LIMIT 10
        `);
        
        await connection.end();
        
        res.json({
            estadisticas: estadisticas[0],
            ultimas_personas: ultimasPersonas,
            ultimos_usuarios: ultimosUsuarios
        });
    } catch (err) {
        console.error('Error al cargar dashboard:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// APIs para Certificados de Garantía
// buscar cliente por cédula (para certificado)
app.get('/api/certificados/clientes/:cedula', async (req, res) => {
    try {
        const cedula = req.params.cedula;
        const connection = await mysql.createConnection(dbConfig);
        
        // Buscar persona por identificación
        const [personas] = await connection.execute(
            `SELECT p.* 
             FROM PERSONAS p
             WHERE p.IDENTIFICACION = ?`,
            [cedula]
        );
        
        if (personas.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        const cliente = personas[0];
        
        // Buscar vehículos vendidos a este cliente
        const [ventas] = await connection.execute(
            `SELECT v.*, 
                    m.NOMBRE as marca_nombre,
                    c.NOMBRE as color_nombre,
                    cb.NOMBRE as combustible_nombre,
                    t.NOMBRE as transmision_nombre
             FROM VENTAS ve
             INNER JOIN VEHICULOS v ON ve.ID_VEHICULO = v.ID_VEHICULO
             LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
             LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
             LEFT JOIN CAT_COMBUSTIBLES cb ON v.ID_COMBUSTIBLE = cb.ID_COMBUSTIBLE
             LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
             WHERE ve.ID_CLIENTE_FACTURACION = ? OR ve.ID_CLIENTE_INSCRIPCION = ?`,
            [cliente.ID_PERSONA, cliente.ID_PERSONA]
        );
        
        await connection.end();
        
        res.json({
            cliente: cliente,
            vehiculos: ventas
        });
        
    } catch (err) {
        console.error('Error al buscar cliente:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener vehículo por placa (para certificado)
app.get('/api/certificados/vehiculos/placa/:placa', async (req, res) => {
    try {
        const placa = req.params.placa;
        const connection = await mysql.createConnection(dbConfig);
        
        const [vehiculos] = await connection.execute(
            `SELECT v.*, 
                    m.NOMBRE as marca_nombre,
                    c.NOMBRE as color_nombre,
                    cb.NOMBRE as combustible_nombre,
                    t.NOMBRE as transmision_nombre,
                    p.NOMBRE_COMPLETO as proveedor_nombre
             FROM VEHICULOS v
             LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
             LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
             LEFT JOIN CAT_COMBUSTIBLES cb ON v.ID_COMBUSTIBLE = cb.ID_COMBUSTIBLE
             LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
             LEFT JOIN PERSONAS p ON v.ID_PROVEEDOR = p.ID_PERSONA
             WHERE v.PLACA = ?`,
            [placa]
        );
        
        await connection.end();
        
        if (vehiculos.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        
        res.json(vehiculos[0]);
        
    } catch (err) {
        console.error('Error al obtener vehículo:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ===== APIS FINANCIERAS (CIERRES Y GASTOS) =====

//  HELPER: parseNumberServer
function parseNumberServer(str) {
    if (!str && str !== 0) return 0;
    const num = parseFloat(str.toString().replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? 0 : num;
}

//  MAPEO DE GASTOS: descripción → tipo_gasto del ENUM
const GASTOS_TIPO_MAP = {
    'ALQUILER':        'ALQUILER',
    'TEL 1':           'TEL_CEL',
    'CEL 2':           'TEL_CEL',
    'CEL 3':           'TEL_CEL',
    'CEL 4':           'TEL_CEL',
    'CORRIENTE':       'SERVICIOS',
    'AGUA Y BASURA':   'SERVICIOS',
    'CABLE':           'SERVICIOS',
    'INTERNET':        'SERVICIOS',
    'CRAUTOS':         'OTROS',
    'JARDIN':          'OTROS',
    'SEGURO CARROS':   'SEGUROS',
    'LIQUIDOS':        'VEHICULOS',
    'SELCA':           'OTROS',
    'HERMANOS':        'PERSONAL',
    'PAPI':            'PERSONAL',
    'MANFRED':         'PERSONAL',
    'NAZA':            'PERSONAL',
    'TAVITO':          'PERSONAL',
    'RAFITA':          'PERSONAL',
    'PAGO DE CARRO':   'VEHICULOS',
};

function getTipoGasto(descripcion) {
    const upper = (descripcion || '').toUpperCase().trim();
    return GASTOS_TIPO_MAP[upper] || 'OTROS';
}

//  Obtiene o crea el cierre del mes indicado.
app.get('/api/financiero/cierre', async (req, res) => {
    try {
        const { year, month } = req.query;
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month); // 0 = anual, 1-12 = mes

        const connection = await mysql.createConnection(dbConfig);

        if (m === 0) {
            // ── RESUMEN ANUAL ──────────────────────────────────────
            const [cierres] = await connection.execute(
                `SELECT c.*,
                        MONTH(c.FECHA_INICIO) as mes
                 FROM CIERRES c
                 WHERE YEAR(c.FECHA_INICIO) = ?
                   AND c.TIPO_CIERRE = 'MENSUAL'
                 ORDER BY c.FECHA_INICIO ASC`,
                [y]
            );

            // Sumar gastos detallados por mes
            const [gastosDetalle] = await connection.execute(
                `SELECT gd.*, c.FECHA_INICIO
                 FROM GASTOS_DETALLE gd
                 INNER JOIN CIERRES c ON gd.ID_CIERRE = c.ID_CIERRE
                 WHERE YEAR(c.FECHA_INICIO) = ?
                   AND c.TIPO_CIERRE = 'MENSUAL'
                 ORDER BY c.FECHA_INICIO ASC, gd.ID_GASTO_DETALLE ASC`,
                [y]
            );

            // Vehículos comprados en el año
            const [comprados] = await connection.execute(
                `SELECT COUNT(*) as cantidad,
                        COALESCE(SUM(cv.PRECIO_COMPRA),0) as monto
                 FROM VEHICULOS v
                 LEFT JOIN COSTOS_VEHICULO cv ON v.ID_VEHICULO = cv.ID_VEHICULO
                 WHERE YEAR(v.FECHA_INGRESO) = ?`,
                [y]
            );

            // Vehículos vendidos en el año (con ganancia)
            const [vendidos] = await connection.execute(
                `SELECT COUNT(*) as cantidad,
                        COALESCE(SUM(cv.PRECIO_PUBLICO - cv.TOTAL_INVERSION),0) as ganancia,
                        COALESCE(SUM(cv.PRECIO_PUBLICO),0) as monto_venta
                 FROM VENTAS vt
                 INNER JOIN VEHICULOS v ON vt.ID_VEHICULO = v.ID_VEHICULO
                 LEFT JOIN COSTOS_VEHICULO cv ON v.ID_VEHICULO = cv.ID_VEHICULO
                 WHERE YEAR(vt.FECHA_VENTA) = ?`,
                [y]
            );

            await connection.end();

            // Acumular totales anuales
            const totalesAnuales = cierres.reduce((acc, c) => {
                acc.plata_inicial   += parseFloat(c.PLATA_INICIAL   || 0);
                acc.bcr_colones     += parseFloat(c.BCR_COLONES     || 0);
                acc.bcr_dolares     += parseFloat(c.BCR_DOLARES     || 0);
                acc.bac_colones     += parseFloat(c.BAC_COLONES     || 0);
                acc.bac_dolares     += parseFloat(c.BAC_DOLARES     || 0);
                acc.total_bancos    += parseFloat(c.TOTAL_BANCOS    || 0);
                acc.inventario_neto += parseFloat(c.INVENTARIO_NETO || 0);
                acc.creditos        += parseFloat(c.CREDITOS_PENDIENTES || 0);
                acc.efectivo        += parseFloat(c.EFECTIVO_DISPONIBLE || 0);
                acc.total_gastos    += parseFloat(c.TOTAL_GASTOS    || 0);
                acc.ganancia_neta   += parseFloat(c.GANANCIA_NETA   || 0);
                return acc;
            }, {
                plata_inicial: 0, bcr_colones: 0, bcr_dolares: 0,
                bac_colones: 0, bac_dolares: 0, total_bancos: 0,
                inventario_neto: 0, creditos: 0, efectivo: 0,
                total_gastos: 0, ganancia_neta: 0
            });

            return res.json({
                tipo: 'anual',
                year: y,
                meses: cierres,
                gastos_detalle: gastosDetalle,
                totales_anuales: totalesAnuales,
                vehiculos: {
                    comprados: comprados[0],
                    vendidos: vendidos[0]
                }
            });
        }

        // ── MES ESPECÍFICO ─────────────────────────────────────────
        const fechaInicio = `${y}-${String(m).padStart(2,'0')}-01`;
        const fechaFin    = new Date(y, m, 0).toISOString().split('T')[0]; // último día del mes

        // Buscar cierre existente
        let [cierres] = await connection.execute(
            `SELECT * FROM CIERRES
             WHERE TIPO_CIERRE = 'MENSUAL'
               AND YEAR(FECHA_INICIO) = ?
               AND MONTH(FECHA_INICIO) = ?
             LIMIT 1`,
            [y, m]
        );

        let cierre;
        let idCierre;

        if (cierres.length === 0) {
            // Crear cierre vacío para el mes
            const [ins] = await connection.execute(
                `INSERT INTO CIERRES (TIPO_CIERRE, FECHA_INICIO, FECHA_FIN, ESTADO)
                 VALUES ('MENSUAL', ?, ?, 'BORRADOR')`,
                [fechaInicio, fechaFin]
            );
            idCierre = ins.insertId;
            cierre   = {
                ID_CIERRE: idCierre, TIPO_CIERRE: 'MENSUAL',
                FECHA_INICIO: fechaInicio, FECHA_FIN: fechaFin,
                PLATA_INICIAL: 0, BCR_COLONES: 0, BCR_DOLARES: 0,
                BAC_COLONES: 0, BAC_DOLARES: 0, TOTAL_BANCOS: 0,
                INVENTARIO_NETO: 0, CREDITOS_PENDIENTES: 0,
                EFECTIVO_DISPONIBLE: 0, TOTAL_GASTOS: 0,
                GANANCIA_NETA: 0, ESTADO: 'BORRADOR'
            };
        } else {
            cierre   = cierres[0];
            idCierre = cierre.ID_CIERRE;
        }

        // Obtener gastos detallados del mes
        const [gastos] = await connection.execute(
            `SELECT * FROM GASTOS_DETALLE
             WHERE ID_CIERRE = ?
             ORDER BY ID_GASTO_DETALLE ASC`,
            [idCierre]
        );

        // Vehículos comprados en el mes
        const [compradosMes] = await connection.execute(
            `SELECT v.ID_VEHICULO,
                    CONCAT(m.NOMBRE, ' ', v.ESTILO, ' ', v.MODELO) as descripcion,
                    COALESCE(cv.PRECIO_COMPRA, 0) as monto,
                    v.PLACA, v.FECHA_INGRESO
             FROM VEHICULOS v
             LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
             LEFT JOIN COSTOS_VEHICULO cv ON v.ID_VEHICULO = cv.ID_VEHICULO
             WHERE YEAR(v.FECHA_INGRESO) = ? AND MONTH(v.FECHA_INGRESO) = ?
             ORDER BY v.FECHA_INGRESO DESC`,
            [y, m]
        );

        // Vehículos vendidos en el mes
        const [vendidosMes] = await connection.execute(
            `SELECT v.ID_VEHICULO,
                    CONCAT(m.NOMBRE, ' ', v.ESTILO, ' ', v.MODELO) as descripcion,
                    COALESCE(cv.PRECIO_PUBLICO - cv.TOTAL_INVERSION, 0) as ganancia,
                    COALESCE(cv.PRECIO_PUBLICO, 0) as precio_venta,
                    v.PLACA, vt.FECHA_VENTA, vt.CODIGO_VENTA
             FROM VENTAS vt
             INNER JOIN VEHICULOS v ON vt.ID_VEHICULO = v.ID_VEHICULO
             LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
             LEFT JOIN COSTOS_VEHICULO cv ON v.ID_VEHICULO = cv.ID_VEHICULO
             WHERE YEAR(vt.FECHA_VENTA) = ? AND MONTH(vt.FECHA_VENTA) = ?
             ORDER BY vt.FECHA_VENTA DESC`,
            [y, m]
        );

        await connection.end();

        res.json({
            tipo: 'mensual',
            year: y,
            month: m,
            cierre,
            gastos,
            vehiculos: {
                comprados: compradosMes,
                vendidos: vendidosMes
            }
        });

    } catch (err) {
        console.error('Error al obtener cierre financiero:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

//  Guarda o actualiza el cierre mensual completo con sus gastos
app.post('/api/financiero/guardar', async (req, res) => {
    const {
        year, month,
        plata_inicial,
        bcr_colones, bcr_dolares,
        bac_colones, bac_dolares,
        inventario_neto, creditos, efectivo,
        gastos,          // array: [{ descripcion, monto }]
        id_persona_cierre // quien guarda (opcional)
    } = req.body;

    if (!year || !month) {
        return res.status(400).json({ error: 'year y month son requeridos' });
    }

    const y = parseInt(year);
    const m = parseInt(month);
    const fechaInicio = `${y}-${String(m).padStart(2,'0')}-01`;
    const fechaFin    = new Date(y, m, 0).toISOString().split('T')[0];

    // Calcular totales
    const totalBancos    = parseNumberServer(bcr_colones) + parseNumberServer(bcr_dolares)
                         + parseNumberServer(bac_colones) + parseNumberServer(bac_dolares);
    const totalActivos   = parseNumberServer(inventario_neto) + parseNumberServer(creditos) + parseNumberServer(efectivo);
    const totalGastos    = (gastos || []).reduce((s, g) => s + parseNumberServer(g.monto), 0);
    const gananciaNeta   = parseNumberServer(plata_inicial) - totalGastos;

    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();

        // Buscar cierre existente
        const [existing] = await connection.execute(
            `SELECT ID_CIERRE FROM CIERRES
             WHERE TIPO_CIERRE = 'MENSUAL' AND YEAR(FECHA_INICIO) = ? AND MONTH(FECHA_INICIO) = ?
             LIMIT 1`,
            [y, m]
        );

        let idCierre;

        if (existing.length > 0) {
            idCierre = existing[0].ID_CIERRE;
            await connection.execute(
                `UPDATE CIERRES SET
                    FECHA_FIN             = ?,
                    PLATA_INICIAL         = ?,
                    BCR_COLONES           = ?,
                    BCR_DOLARES           = ?,
                    BAC_COLONES           = ?,
                    BAC_DOLARES           = ?,
                    TOTAL_BANCOS          = ?,
                    INVENTARIO_NETO       = ?,
                    CREDITOS_PENDIENTES   = ?,
                    EFECTIVO_DISPONIBLE   = ?,
                    TOTAL_ACTIVOS         = ?,
                    TOTAL_GASTOS          = ?,
                    TOTAL_EGRESOS         = ?,
                    GANANCIA_NETA         = ?,
                    CERRADO_POR           = ?,
                    FECHA_CIERRE          = NOW()
                 WHERE ID_CIERRE = ?`,
                [
                    fechaFin,
                    parseNumberServer(plata_inicial),
                    parseNumberServer(bcr_colones),
                    parseNumberServer(bcr_dolares),
                    parseNumberServer(bac_colones),
                    parseNumberServer(bac_dolares),
                    totalBancos,
                    parseNumberServer(inventario_neto),
                    parseNumberServer(creditos),
                    parseNumberServer(efectivo),
                    totalActivos,
                    totalGastos,
                    totalGastos,
                    gananciaNeta,
                    id_persona_cierre || null,
                    idCierre
                ]
            );
            // Borrar gastos anteriores para re-insertarlos
            await connection.execute(
                'DELETE FROM GASTOS_DETALLE WHERE ID_CIERRE = ?',
                [idCierre]
            );
        } else {
            const [ins] = await connection.execute(
                `INSERT INTO CIERRES (
                    TIPO_CIERRE, FECHA_INICIO, FECHA_FIN,
                    PLATA_INICIAL, BCR_COLONES, BCR_DOLARES, BAC_COLONES, BAC_DOLARES,
                    TOTAL_BANCOS, INVENTARIO_NETO, CREDITOS_PENDIENTES, EFECTIVO_DISPONIBLE,
                    TOTAL_ACTIVOS, TOTAL_GASTOS, TOTAL_EGRESOS, GANANCIA_NETA,
                    CERRADO_POR, ESTADO
                ) VALUES ('MENSUAL', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BORRADOR')`,
                [
                    fechaInicio, fechaFin,
                    parseNumberServer(plata_inicial),
                    parseNumberServer(bcr_colones),
                    parseNumberServer(bcr_dolares),
                    parseNumberServer(bac_colones),
                    parseNumberServer(bac_dolares),
                    totalBancos,
                    parseNumberServer(inventario_neto),
                    parseNumberServer(creditos),
                    parseNumberServer(efectivo),
                    totalActivos,
                    totalGastos,
                    totalGastos,
                    gananciaNeta,
                    id_persona_cierre || null
                ]
            );
            idCierre = ins.insertId;
        }

        // Insertar gastos detallados
        if (Array.isArray(gastos) && gastos.length > 0) {
            for (const g of gastos) {
                const monto = parseNumberServer(g.monto);
                if (monto === 0 && !g.descripcion) continue; // skip líneas vacías
                await connection.execute(
                    `INSERT INTO GASTOS_DETALLE
                     (ID_CIERRE, TIPO_GASTO, DESCRIPCION, MONTO_COLONES, MONEDA, FECHA_GASTO, REGISTRADO_POR)
                     VALUES (?, ?, ?, ?, 'CRC', ?, ?)`,
                    [
                        idCierre,
                        getTipoGasto(g.descripcion),
                        (g.descripcion || '').trim().toUpperCase(),
                        monto,
                        fechaFin,
                        id_persona_cierre || null
                    ]
                );
            }
        }

        // Auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN)
             VALUES (?, 'GUARDAR_CIERRE_FINANCIERO', ?)`,
            [
                id_persona_cierre || 1,
                `Cierre financiero guardado: ${y}/${String(m).padStart(2,'0')}`
            ]
        );

        await connection.commit();
        await connection.end();

        res.json({
            id_cierre:    idCierre,
            total_gastos: totalGastos,
            total_bancos: totalBancos,
            ganancia_neta: gananciaNeta,
            message: 'Cierre financiero guardado correctamente'
        });

    } catch (err) {
        await connection.rollback();
        await connection.end();
        console.error('Error al guardar cierre:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

//  Lista qué meses tienen datos guardados en un año
app.get('/api/financiero/meses-disponibles', async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.execute(
            `SELECT MONTH(FECHA_INICIO) as mes,
                    ID_CIERRE, ESTADO, TOTAL_GASTOS, GANANCIA_NETA,
                    FECHA_CIERRE
             FROM CIERRES
             WHERE TIPO_CIERRE = 'MENSUAL' AND YEAR(FECHA_INICIO) = ?
             ORDER BY mes ASC`,
            [year]
        );

        await connection.end();
        res.json({ year, meses: rows });
    } catch (err) {
        console.error('Error al obtener meses disponibles:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

//  GET /api/financiero/gastos-plantilla
app.get('/api/financiero/gastos-plantilla', async (req, res) => {
    res.json([
        { id: 1,  descripcion: 'ALQUILER',      tipo: 'ALQUILER'  },
        { id: 2,  descripcion: 'ALQUILER',      tipo: 'ALQUILER'  },
        { id: 3,  descripcion: 'TEL 1',         tipo: 'TEL_CEL'   },
        { id: 4,  descripcion: 'CEL 2',         tipo: 'TEL_CEL'   },
        { id: 5,  descripcion: 'CEL 3',         tipo: 'TEL_CEL'   },
        { id: 6,  descripcion: 'CEL 4',         tipo: 'TEL_CEL'   },
        { id: 7,  descripcion: 'CORRIENTE',     tipo: 'SERVICIOS' },
        { id: 8,  descripcion: 'AGUA Y BASURA', tipo: 'SERVICIOS' },
        { id: 9,  descripcion: 'CABLE',         tipo: 'SERVICIOS' },
        { id: 10, descripcion: 'CRAUTOS',       tipo: 'OTROS'     },
        { id: 11, descripcion: 'INTERNET',      tipo: 'SERVICIOS' },
        { id: 12, descripcion: 'JARDIN',        tipo: 'OTROS'     },
        { id: 13, descripcion: 'SEGURO CARROS', tipo: 'SEGUROS'   },
        { id: 14, descripcion: 'LIQUIDOS',      tipo: 'VEHICULOS' },
        { id: 15, descripcion: 'SELCA',         tipo: 'OTROS'     },
        { id: 16, descripcion: 'HERMANOS',      tipo: 'PERSONAL'  },
        { id: 17, descripcion: 'PAPI',          tipo: 'PERSONAL'  },
        { id: 18, descripcion: 'MANFRED',       tipo: 'PERSONAL'  },
        { id: 19, descripcion: 'NAZA',          tipo: 'PERSONAL'  },
        { id: 20, descripcion: 'TAVITO',        tipo: 'PERSONAL'  },
        { id: 21, descripcion: 'RAFITA',        tipo: 'PERSONAL'  },
        { id: 22, descripcion: 'PAGO DE CARRO', tipo: 'VEHICULOS' }
    ]);
});

// ===== RUTA PARA SERVIR ARCHIVO HTML =====
/* Servir archivo index.html */
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','index.html'));
});

// ===== INICIO DEL SERVIDOR =====
/* Iniciar servidor */
app.listen(3000, () => {
    console.log(' URL: http://localhost:3000');
});
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);
});
