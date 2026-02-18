const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const app = express();
const bcrypt = require('bcrypt');

// ===== CONFIGURACIÓN GENERAL =====
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== CONFIGURACIÓN DE BASE DE DATOS =====
const dbConfig = {
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    user: '2kMd2TkhjVzTXcf.root',
    password: 'PtWpFOTh6nBlTkf2',
    database: 'sistema_autoscolin',
    port: 4000,
    multipleStatements: true,
    ssl: {
        ca: fs.readFileSync('certs/isrgrootx1.pem'),
        rejectUnauthorized: true
    }
};

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
// Obtener un rol por ID - CORREGIDO
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

// Ruta de login actualizada para tu estructura
app.post('/api/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Consulta actualizada según tu estructura
        const [rows] = await connection.execute(
        `
        SELECT 
            p.ID_PERSONA,
            p.NOMBRE_COMPLETO,
            p.EMAIL,
            u.USERNAME,
            r.NOMBRE AS rol,
            u.ESTADO as estado_usuario,
            u.INTENTOS_FALLIDOS,
            u.FECHA_BLOQUEO
        FROM PERSONAS p
        INNER JOIN USUARIOS u ON p.ID_PERSONA = u.ID_PERSONA
        INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
        INNER JOIN ROLES r ON pr.ID_ROL = r.ID_ROL
        WHERE p.EMAIL = ? 
        AND u.PASSWORD_HASH = ?
        AND u.ESTADO = 'ACTIVO'
        AND pr.ESTADO = 'ACTIVO'
        LIMIT 1
        `,
        [correo, contrasena]
        );
        await connection.end();

        if (rows.length === 0) {
            return res.status(401).json({ 
                error: 'Credenciales incorrectas o usuario inactivo' 
            });
        }

        const usuario = rows[0];
        
        // Verificar si el usuario está bloqueado
        if (usuario.FECHA_BLOQUEO && new Date(usuario.FECHA_BLOQUEO) > new Date()) {
            return res.status(403).json({ 
                error: 'Usuario bloqueado temporalmente' 
            });
        }

        // Actualizar último acceso (opcional)
        await actualizarUltimoAcceso(usuario.ID_PERSONA);

        res.json({ 
            id_persona: usuario.ID_PERSONA,
            nombre: usuario.NOMBRE_COMPLETO, 
            rol: usuario.rol,
            email: usuario.EMAIL,
            username: usuario.USERNAME
        });
        
        console.log(`Usuario logueado: ${usuario.NOMBRE_COMPLETO} - ${usuario.rol}`);
    } catch (err) {
        console.error('Error de servidor:', err);
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
// Obtener todos los vehículos con información relacionada
app.get('/api/vehiculos', async (req, res) => {
    try {
        const { chasis, placa, estado, id_proveedor } = req.query;
        
        let query = `
            SELECT 
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
            WHERE 1=1
        `;
        
        const params = [];
        
        if (chasis) {
            query += ' AND v.CHASIS LIKE ?';
            params.push(`%${chasis}%`);
        }
        
        if (placa) {
            query += ' AND v.PLACA LIKE ?';
            params.push(`%${placa}%`);
        }
        
        if (estado) {
            query += ' AND v.ESTADO = ?';
            params.push(estado);
        }
        
        if (id_proveedor) {
            query += ' AND v.ID_PROVEEDOR = ?';
            params.push(id_proveedor);
        }
        
        query += ' ORDER BY v.FECHA_INGRESO DESC';
        
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(query, params);
        await connection.end();
        
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener vehículos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
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
            ID_PROVEEDOR,
            CHASIS,
            MOTOR,
            PLACA,
            ID_MARCA,
            MODELO,
            ID_COLOR,
            ID_COMBUSTIBLE,
            ID_TRANSMISION,
            ESTILO,
            TRACCION,
            CARROCERIA,
            C_C,
            CILINDROS,
            KILOMETRAJE_ACTUAL,
            KILOMETRAJE_ANTERIOR,
            FECHA_INGRESO,
            PV,
            ESTADO,
            OBSERVACIONES
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            `INSERT INTO VEHICULOS (
                ID_PROVEEDOR, CHASIS, MOTOR, PLACA, ID_MARCA, MODELO,
                ID_COLOR, ID_COMBUSTIBLE, ID_TRANSMISION, ESTILO,
                TRACCION, CARROCERIA, C_C, CILINDROS,
                KILOMETRAJE_ACTUAL, KILOMETRAJE_ANTERIOR, FECHA_INGRESO,
                PV, ESTADO, OBSERVACIONES
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ID_PROVEEDOR, CHASIS, MOTOR || null, PLACA || null, ID_MARCA, MODELO,
                ID_COLOR || null, ID_COMBUSTIBLE || null, ID_TRANSMISION || null,
                ESTILO || null, TRACCION || null, CARROCERIA || null,
                C_C || null, CILINDROS || null,
                KILOMETRAJE_ACTUAL || 0, KILOMETRAJE_ANTERIOR || 0,
                FECHA_INGRESO || new Date().toISOString().split('T')[0],
                PV || null, ESTADO || 'COMPRADO', OBSERVACIONES || null
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
            ID_PROVEEDOR,
            CHASIS,
            MOTOR,
            PLACA,
            ID_MARCA,
            MODELO,
            ID_COLOR,
            ID_COMBUSTIBLE,
            ID_TRANSMISION,
            ESTILO,
            TRACCION,
            CARROCERIA,
            C_C,
            CILINDROS,
            KILOMETRAJE_ACTUAL,
            KILOMETRAJE_ANTERIOR,
            FECHA_INGRESO,
            PV,
            ESTADO,
            OBSERVACIONES
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            `UPDATE VEHICULOS SET
                ID_PROVEEDOR = ?,
                CHASIS = ?,
                MOTOR = ?,
                PLACA = ?,
                ID_MARCA = ?,
                MODELO = ?,
                ID_COLOR = ?,
                ID_COMBUSTIBLE = ?,
                ID_TRANSMISION = ?,
                ESTILO = ?,
                TRACCION = ?,
                CARROCERIA = ?,
                C_C = ?,
                CILINDROS = ?,
                KILOMETRAJE_ACTUAL = ?,
                KILOMETRAJE_ANTERIOR = ?,
                FECHA_INGRESO = ?,
                PV = ?,
                ESTADO = ?,
                OBSERVACIONES = ?
            WHERE ID_VEHICULO = ?`,
            [
                ID_PROVEEDOR, CHASIS, MOTOR || null, PLACA || null, ID_MARCA, MODELO,
                ID_COLOR || null, ID_COMBUSTIBLE || null, ID_TRANSMISION || null,
                ESTILO || null, TRACCION || null, CARROCERIA || null,
                C_C || null, CILINDROS || null,
                KILOMETRAJE_ACTUAL || 0, KILOMETRAJE_ANTERIOR || 0,
                FECHA_INGRESO || null,
                PV || null, ESTADO || 'COMPRADO', OBSERVACIONES || null,
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

// Eliminar un vehículo
app.delete('/api/vehiculos/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            'DELETE FROM VEHICULOS WHERE ID_VEHICULO = ?',
            [req.params.id]
        );
        
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        
        res.json({ message: 'Vehículo eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar vehículo:', err);
        res.status(500).json({ error: 'Error en el servidor' });
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
                    ve.FECHA_VENTA,
                    ve.CODIGO_VENTA
             FROM VENTAS ve
             INNER JOIN VEHICULOS v ON ve.ID_VEHICULO = v.ID_VEHICULO
             LEFT JOIN CAT_MARCAS m ON v.ID_MARCA = m.ID_MARCA
             LEFT JOIN CAT_COLORES c ON v.ID_COLOR = c.ID_COLOR
             LEFT JOIN CAT_COMBUSTIBLES cb ON v.ID_COMBUSTIBLE = cb.ID_COMBUSTIBLE
             LEFT JOIN CAT_TRANSMISIONES t ON v.ID_TRANSMISION = t.ID_TRANSMISION
             WHERE ve.ID_CLIENTE_FACTURACION = ? OR ve.ID_CLIENTE_INSCRIPCION = ?
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

/* Obtener todos los vendedores (Cpersonas con rol de vendedor) */
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
            AND pr.ID_ROL = 5
            AND pr.ESTADO = 'ACTIVO'
        `, [id]);
        
        if (vendedor.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }
        
        // Obtener estadísticas del vendedor
        const [estadisticas] = await connection.execute(`
            SELECT 
                COUNT(*) as total_ventas,
                SUM(fp.PRIMA) as total_prima,
                SUM(fp.SALDO) as total_saldo_pendiente,
                MAX(v.FECHA_VENTA) as ultima_venta
            FROM VENTAS v
            LEFT JOIN FORMAS_PAGO fp ON v.ID_VENTA = fp.ID_VENTA
            WHERE v.ID_VENDEDOR = ?
        `, [id]);
        
        // Obtener ventas recientes
        const [ventas] = await connection.execute(`
            SELECT 
                v.ID_VENTA,
                v.CODIGO_VENTA,
                v.FECHA_VENTA,
                veh.PLACA,
                veh.ID_MARCA,
                veh.MODELO,
                cf.NOMBRE_COMPLETO as cliente_facturacion,
                fp.TIPO_VENTA,
                fp.PRIMA,
                fp.SALDO,
                fp.ESTADO_PAGO
            FROM VENTAS v
            INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
            INNER JOIN PERSONAS cf ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
            LEFT JOIN FORMAS_PAGO fp ON v.ID_VENTA = fp.ID_VENTA
            WHERE v.ID_VENDEDOR = ?
            ORDER BY v.FECHA_VENTA DESC
            LIMIT 10
        `, [id]);
        
        await connection.end();
        
        res.json({
            vendedor: vendedor[0],
            estadisticas: estadisticas[0],
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

/* 4. VENTAS DE VENDEDORES*/
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
        
        let query = `
            SELECT 
                v.*,
                veh.PLACA, veh.ID_MARCA, veh.MODELO, veh.ESTILO,
                cf.NOMBRE_COMPLETO as cliente_facturacion,
                ci.NOMBRE_COMPLETO as cliente_inscripcion,
                fp.TIPO_VENTA, fp.PRIMA, fp.SALDO, fp.ESTADO_PAGO, fp.PLAZO_MESES, fp.ENTIDAD_FINANCIERA,
                COALESCE((
                    SELECT SUM(MONTO_COLONES) 
                    FROM ANTICIPOS a 
                    WHERE a.ID_VENTA = v.ID_VENTA
                ), 0) as total_anticipos
            FROM VENTAS v
            INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
            INNER JOIN PERSONAS cf ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
            LEFT JOIN PERSONAS ci ON v.ID_CLIENTE_INSCRIPCION = ci.ID_PERSONA
            LEFT JOIN FORMAS_PAGO fp ON v.ID_VENTA = fp.ID_VENTA
            WHERE v.ID_VENDEDOR = ?
        `;

        const params = [id];
        let offset = (pagina - 1) * limite;

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
            query += ' AND fp.ESTADO_PAGO = ?';
            params.push(estado_pago);
        }

        // Contar total de registros
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
        const [countResult] = await connection.execute(countQuery, params);
        const totalRegistros = countResult[0].total;

        // Aplicar paginación
        query += ' ORDER BY v.FECHA_VENTA DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limite), offset);

        const [ventas] = await connection.execute(query, params);
        
        await connection.end();
        
        res.json({
            total: totalRegistros,
            pagina: parseInt(pagina),
            por_pagina: parseInt(limite),
            total_paginas: Math.ceil(totalRegistros / limite),
            ventas: ventas
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener ventas del vendedor' });
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
        const hashedPassword = await bcrypt.hash(PASSWORD, 10);
        
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

// ============================================
// APIS PARA VALIDACIONES
// ============================================

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
            TIPO_CAMBIO_COMPRA, OBSERVACION
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
                    PRIMA_FINANCIAMIENTO = ?, CUOTA_FINANCIAMIENTO = ?, SALDO = ?,
                    MONEDA = ?, TIPO_CAMBIO_COMPRA = ?, OBSERVACION = ?,
                    FECHA_CALCULO = CURDATE()
                WHERE ID_VEHICULO = ?`,
                [
                    PRECIO_COMPRA, PRECIO_TRANSPASO, COSTO, PRIMA, COMISION,
                    TOTAL_INVERSION, PRECIO_COSTO, PRECIO_PUBLICO, PRECIO_DESCUENTO,
                    PRIMA_FINANCIAMIENTO, CUOTA_FINANCIAMIENTO, SALDO,
                    MONEDA, TIPO_CAMBIO_COMPRA, OBSERVACION, req.params.id
                ]
            );
        } else {
            // Insertar nuevo
            [result] = await connection.execute(
                `INSERT INTO COSTOS_VEHICULO (
                    ID_VEHICULO, PRECIO_COMPRA, PRECIO_TRANSPASO, COSTO, PRIMA,
                    COMISION, TOTAL_INVERSION, PRECIO_COSTO, PRECIO_PUBLICO,
                    PRECIO_DESCUENTO, PRIMA_FINANCIAMIENTO, CUOTA_FINANCIAMIENTO,
                    SALDO, MONEDA, TIPO_CAMBIO_COMPRA, OBSERVACION
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.params.id, PRECIO_COMPRA, PRECIO_TRANSPASO, COSTO, PRIMA,
                    COMISION, TOTAL_INVERSION, PRECIO_COSTO, PRECIO_PUBLICO,
                    PRECIO_DESCUENTO, PRIMA_FINANCIAMIENTO, CUOTA_FINANCIAMIENTO,
                    SALDO, MONEDA, TIPO_CAMBIO_COMPRA, OBSERVACION
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
        console.error('Error al guardar costos:', err);
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
        
        console.log('Buscando vehículo ID:', vehiculoId); // Para depuración
        
        // 1. Datos básicos del vehículo
        const [vehiculos] = await connection.execute(
            `SELECT 
                v.*,
                p.NOMBRE_COMPLETO as proveedor_nombre,
                p.IDENTIFICACION as proveedor_identificacion,
                p.TELEFONO_PRINCIPAL as proveedor_telefono,
                p.EMAIL as proveedor_email,
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
            [vehiculoId]
        );

        if (vehiculos.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

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

        // 4. Ventas del vehículo
        const [ventas] = await connection.execute(
            `SELECT v.*, 
                    fp.*,
                    cf.NOMBRE_COMPLETO as cliente_facturacion_nombre,
                    ci.NOMBRE_COMPLETO as cliente_inscripcion_nombre
             FROM VENTAS v
             LEFT JOIN FORMAS_PAGO fp ON v.ID_VENTA = fp.ID_VENTA
             LEFT JOIN PERSONAS cf ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
             LEFT JOIN PERSONAS ci ON v.ID_CLIENTE_INSCRIPCION = ci.ID_PERSONA
             WHERE v.ID_VEHICULO = ?`,
            [vehiculoId]
        );

        await connection.end();

        const response = {
            vehiculo: vehiculos[0],
            costos: costos,
            extras: extras,
            ventas: ventas
        };

        console.log('Datos enviados:', response); // Para depuración
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

// ===== APIs DE VENTAS (COLOCAR ESTO ANTES DE LOS MIDDLEWARE DE VERIFICACIÓN) =====

// ===== API PARA VENTAS PENDIENTES =====
app.get('/api/ventas/pendientes', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [ventas] = await connection.execute(`
            SELECT 
                v.ID_VENTA,
                v.CODIGO_VENTA,
                v.FECHA_VENTA,
                v.ESTADO_VENTA,
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
                
                -- Datos de forma de pago
                fp.ID_FORMA_PAGO,
                fp.TIPO_VENTA,
                fp.FORMA_PAGO,
                fp.PLAZO_MESES,
                fp.PRIMA,
                fp.SALDO,
                fp.ENTIDAD_FINANCIERA
                
            FROM VENTAS v
            INNER JOIN PERSONAS cf ON v.ID_CLIENTE_FACTURACION = cf.ID_PERSONA
            INNER JOIN VEHICULOS veh ON v.ID_VEHICULO = veh.ID_VEHICULO
            INNER JOIN CAT_MARCAS m ON veh.ID_MARCA = m.ID_MARCA
            INNER JOIN PERSONAS vend ON v.ID_VENDEDOR = vend.ID_PERSONA
            LEFT JOIN FORMAS_PAGO fp ON v.ID_VENTA = fp.ID_VENTA
            WHERE v.ESTADO_VENTA = 'PENDIENTE DE FACTURAR'
            ORDER BY v.FECHA_VENTA DESC
        `);
        
        await connection.end();
        
        // Agrupar formas de pago por venta
        const ventasMap = new Map();
        ventas.forEach(row => {
            if (!ventasMap.has(row.ID_VENTA)) {
                ventasMap.set(row.ID_VENTA, {
                    ID_VENTA: row.ID_VENTA,
                    CODIGO_VENTA: row.CODIGO_VENTA,
                    FECHA_VENTA: row.FECHA_VENTA,
                    ESTADO_VENTA: row.ESTADO_VENTA,
                    ID_VEHICULO: row.ID_VEHICULO,
                    ID_CLIENTE_FACTURACION: row.ID_CLIENTE_FACTURACION,
                    ID_VENDEDOR: row.ID_VENDEDOR,
                    CLIENTE_NOMBRE: row.CLIENTE_NOMBRE,
                    CLIENTE_IDENTIFICACION: row.CLIENTE_IDENTIFICACION,
                    CLIENTE_TELEFONO: row.CLIENTE_TELEFONO,
                    CLIENTE_EMAIL: row.CLIENTE_EMAIL,
                    PLACA: row.PLACA,
                    ESTILO: row.ESTILO,
                    MODELO: row.MODELO,
                    MARCA_NOMBRE: row.MARCA_NOMBRE,
                    VEHICULO_DESCRIPCION: row.VEHICULO_DESCRIPCION,
                    VENDEDOR_NOMBRE: row.VENDEDOR_NOMBRE,
                    FORMAS_PAGO: []
                });
            }
            
            if (row.ID_FORMA_PAGO) {
                ventasMap.get(row.ID_VENTA).FORMAS_PAGO.push({
                    ID_FORMA_PAGO: row.ID_FORMA_PAGO,
                    TIPO_VENTA: row.TIPO_VENTA,
                    FORMA_PAGO: row.FORMA_PAGO,
                    PLAZO_MESES: row.PLAZO_MESES,
                    PRIMA: row.PRIMA,
                    SALDO: row.SALDO,
                    ENTIDAD_FINANCIERA: row.ENTIDAD_FINANCIERA
                });
            }
        });
        
        res.json(Array.from(ventasMap.values()));
        
    } catch (err) {
        console.error('Error al obtener ventas pendientes:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== API PARA OBTENER VENTA COMPLETA =====
app.get('/api/ventas/:id/completo', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const ventaId = req.params.id;
        
        // Datos de la venta
        const [ventas] = await connection.execute(`
            SELECT v.*, 
                   fp.ID_FORMA_PAGO,
                   fp.TIPO_VENTA,
                   fp.FORMA_PAGO,
                   fp.PLAZO_MESES,
                   fp.FECHA_PRIMER_PAGO,
                   fp.ENTIDAD_FINANCIERA,
                   fp.INTERES_NOMINAL,
                   fp.INTERES_MORATORIO,
                   fp.PRIMA,
                   fp.SALDO,
                   fp.ESTADO_PAGO
            FROM VENTAS v
            LEFT JOIN FORMAS_PAGO fp ON v.ID_VENTA = fp.ID_VENTA
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
        
        // Datos del vehículo
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
        
        // Costos del vehículo
        const [costos] = await connection.execute(
            'SELECT * FROM COSTOS_VEHICULO WHERE ID_VEHICULO = ? ORDER BY FECHA_CALCULO DESC LIMIT 1',
            [venta.ID_VEHICULO]
        );
        
        // Extras del vehículo
        const [extras] = await connection.execute(
            'SELECT * FROM EXTRAS_VEHICULO WHERE ID_VEHICULO = ?',
            [venta.ID_VEHICULO]
        );
        
        await connection.end();
        
        res.json({
            ID_VENTA: venta.ID_VENTA,
            CODIGO_VENTA: venta.CODIGO_VENTA,
            FECHA_VENTA: venta.FECHA_VENTA,
            ESTADO_VENTA: venta.ESTADO_VENTA,
            NOMBRE_NOTARIO: venta.NOMBRE_NOTARIO,
            PV_PURDI: venta.PV_PURDI,
            OBSERVACIONES_VENTA: venta.OBSERVACIONES_VENTA,
            CLIENTE_FACTURACION: clientesFact[0] || null,
            CLIENTE_INSCRIPCION: clienteInscripcion,
            VENDEDOR: vendedores[0] || null,
            VEHICULO: vehiculos[0] || null,
            COSTOS: costos,
            EXTRAS: extras,
            FORMA_PAGO: {
                ID_FORMA_PAGO: venta.ID_FORMA_PAGO,
                TIPO_VENTA: venta.TIPO_VENTA,
                FORMA_PAGO: venta.FORMA_PAGO,
                PLAZO_MESES: venta.PLAZO_MESES,
                FECHA_PRIMER_PAGO: venta.FECHA_PRIMER_PAGO,
                ENTIDAD_FINANCIERA: venta.ENTIDAD_FINANCIERA,
                INTERES_NOMINAL: venta.INTERES_NOMINAL,
                INTERES_MORATORIO: venta.INTERES_MORATORIO,
                PRIMA: venta.PRIMA,
                SALDO: venta.SALDO,
                ESTADO_PAGO: venta.ESTADO_PAGO
            }
        });
        
    } catch (err) {
        console.error('Error al obtener venta completa:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== API PARA APROBAR VENTA =====
app.put('/api/ventas/:id/aprobar', async (req, res) => {
    try {
        const { estado, observaciones } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            `UPDATE VENTAS 
             SET ESTADO_VENTA = ?, 
                 OBSERVACIONES_VENTA = CONCAT(COALESCE(OBSERVACIONES_VENTA, ''), '\n', ?)
             WHERE ID_VENTA = ?`,
            [estado || 'YA FUE FACTURADA', observaciones || 'Aprobada en facturación', req.params.id]
        );
        
        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        // Registrar en auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
             VALUES (?, 'APROBAR_VENTA', ?)`,
            [req.user?.id || 1, `Venta ${req.params.id} aprobada`]
        );
        
        await connection.end();
        res.json({ message: 'Venta aprobada exitosamente' });
        
    } catch (err) {
        console.error('Error al aprobar venta:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== API PARA RECHAZAR VENTA =====
app.put('/api/ventas/:id/rechazar', async (req, res) => {
    try {
        const { estado, motivo } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            `UPDATE VENTAS 
             SET ESTADO_VENTA = ?, 
                 OBSERVACIONES_VENTA = CONCAT(COALESCE(OBSERVACIONES_VENTA, ''), '\n', ?)
             WHERE ID_VENTA = ?`,
            [estado || 'PLAN YA FUE ANULADO', motivo || 'Rechazada en facturación', req.params.id]
        );
        
        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        // Registrar en auditoría
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) 
             VALUES (?, 'RECHAZAR_VENTA', ?)`,
            [req.user?.id || 1, `Venta ${req.params.id} rechazada. Motivo: ${motivo || 'No especificado'}`]
        );
        
        await connection.end();
        res.json({ message: 'Venta rechazada exitosamente' });
        
    } catch (err) {
        console.error('Error al rechazar venta:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ===== API PARA CREAR VENTA DE PRUEBA =====
app.post('/api/ventas/test', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar si hay vehículos disponibles
        const [vehiculos] = await connection.execute(
            'SELECT ID_VEHICULO FROM VEHICULOS WHERE ESTADO = "COMPRADO" LIMIT 1'
        );
        
        if (vehiculos.length === 0) {
            await connection.end();
            return res.status(400).json({ error: 'No hay vehículos disponibles para crear ventas de prueba' });
        }
        
        // Verificar si hay clientes
        const [clientes] = await connection.execute(
            'SELECT ID_PERSONA FROM PERSONAS WHERE ESTADO = "ACTIVO" LIMIT 1'
        );
        
        if (clientes.length === 0) {
            await connection.end();
            return res.status(400).json({ error: 'No hay clientes registrados' });
        }
        
        // Verificar si hay vendedores
        const [vendedores] = await connection.execute(
            `SELECT p.ID_PERSONA FROM PERSONAS p
             INNER JOIN PERSONAS_ROLES pr ON p.ID_PERSONA = pr.ID_PERSONA
             WHERE pr.ID_ROL = 5 AND pr.ESTADO = 'ACTIVO' AND p.ESTADO = 'ACTIVO'
             LIMIT 1`
        );
        
        if (vendedores.length === 0) {
            await connection.end();
            return res.status(400).json({ error: 'No hay vendedores registrados' });
        }
        
        // Crear venta de prueba
        const codigoVenta = 'TEST-' + Date.now().toString().slice(-6);
        const [result] = await connection.execute(
            `INSERT INTO VENTAS (
                CODIGO_VENTA, ID_VEHICULO, ID_CLIENTE_FACTURACION, 
                ID_VENDEDOR, FECHA_VENTA, ESTADO_VENTA
            ) VALUES (?, ?, ?, ?, NOW(), 'PENDIENTE DE FACTURAR')`,
            [codigoVenta, vehiculos[0].ID_VEHICULO, clientes[0].ID_PERSONA, vendedores[0].ID_PERSONA]
        );
        
        // Crear forma de pago de prueba
        await connection.execute(
            `INSERT INTO FORMAS_PAGO (
                ID_VENTA, TIPO_VENTA, FORMA_PAGO, PRIMA, SALDO
            ) VALUES (?, 'CONTADO', 'EFECTIVO', 5000000, 0)`,
            [result.insertId]
        );
        
        await connection.end();
        
        res.json({ 
            message: 'Venta de prueba creada exitosamente',
            id_venta: result.insertId,
            codigo: codigoVenta
        });
        
    } catch (err) {
        console.error('Error al crear venta de prueba:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
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

// ===== APIs PARA ANTICIPOS =====
// Obtener un anticipo por ID
app.get('/api/anticipos/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [anticipos] = await connection.execute(
            'SELECT * FROM ANTICIPOS WHERE ID_ANTICIPO = ?',
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

// Crear un nuevo anticipo
app.post('/api/anticipos', async (req, res) => {
    try {
        const {
            id_venta,
            forma_pago,
            num_documento,
            monto_colones,
            monto_dolares,
            moneda,
            tipo_cambio,
            realizado_por,
            fecha_anticipo,
            saldo_pendiente,
            observaciones
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            `INSERT INTO ANTICIPOS (
                ID_VENTA, FORMA_PAGO, NUM_DOCUMENTO, MONTO_COLONES,
                MONTO_DOLARES, MONEDA, TIPO_CAMBIO, REALIZADO_POR,
                FECHA_ANTICIPO, SALDO_PENDIENTE, OBSERVACIONES
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_venta || null,
                forma_pago,
                num_documento,
                monto_colones || 0,
                monto_dolares || 0,
                moneda || 'CRC',
                tipo_cambio || 1,
                realizado_por,
                fecha_anticipo || new Date(),
                saldo_pendiente || monto_colones,
                observaciones || null
            ]
        );
        
        await connection.end();
        
        res.json({ 
            id: result.insertId, 
            message: 'Anticipo creado exitosamente' 
        });
        
    } catch (err) {
        console.error('Error al crear anticipo:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Actualizar un anticipo
app.put('/api/anticipos/:id', async (req, res) => {
    try {
        const {
            id_venta,
            forma_pago,
            num_documento,
            monto_colones,
            monto_dolares,
            moneda,
            tipo_cambio,
            realizado_por,
            fecha_anticipo,
            saldo_pendiente,
            observaciones
        } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            `UPDATE ANTICIPOS SET
                ID_VENTA = ?,
                FORMA_PAGO = ?,
                NUM_DOCUMENTO = ?,
                MONTO_COLONES = ?,
                MONTO_DOLARES = ?,
                MONEDA = ?,
                TIPO_CAMBIO = ?,
                REALIZADO_POR = ?,
                FECHA_ANTICIPO = ?,
                SALDO_PENDIENTE = ?,
                OBSERVACIONES = ?
            WHERE ID_ANTICIPO = ?`,
            [
                id_venta || null,
                forma_pago,
                num_documento,
                monto_colones || 0,
                monto_dolares || 0,
                moneda || 'CRC',
                tipo_cambio || 1,
                realizado_por,
                fecha_anticipo || new Date(),
                saldo_pendiente || monto_colones,
                observaciones || null,
                req.params.id
            ]
        );
        
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Anticipo no encontrado' });
        }
        
        res.json({ message: 'Anticipo actualizado exitosamente' });
        
    } catch (err) {
        console.error('Error al actualizar anticipo:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Eliminar un anticipo
app.delete('/api/anticipos/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            'DELETE FROM ANTICIPOS WHERE ID_ANTICIPO = ?',
            [req.params.id]
        );
        
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Anticipo no encontrado' });
        }
        
        res.json({ message: 'Anticipo eliminado exitosamente' });
        
    } catch (err) {
        console.error('Error al eliminar anticipo:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ================================================================
//  NUEVO ENDPOINT — Agregar a server.js (antes de app.listen)
//  POST /api/plan-ventas  — Guarda plan completo en una transacción
// ================================================================

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
        forma_pago,
        anticipos
    } = req.body;

    if (!id_vendedor) return res.status(400).json({ error: 'El vendedor es requerido' });
    if (!vehiculo?.id_vehiculo && !vehiculo?.chasis) return res.status(400).json({ error: 'El vehículo es requerido' });

    const connection = await mysql.createConnection(dbConfig);

    try {
        await connection.beginTransaction();

        // ─── 1. CLIENTE FACTURAR ─────────────────────────────────
        let idClienteFacturar = cliente_facturar?.id_persona_existente || null;
        if (!idClienteFacturar && cliente_facturar?.identificacion) {
            // Buscar por identificación
            const [existeF] = await connection.execute(
                'SELECT ID_PERSONA FROM PERSONAS WHERE IDENTIFICACION = ?',
                [cliente_facturar.identificacion]
            );
            if (existeF.length > 0) {
                idClienteFacturar = existeF[0].ID_PERSONA;
                // Actualizar datos
                await connection.execute(
                    `UPDATE PERSONAS SET NOMBRE_COMPLETO=?,TELEFONO_PRINCIPAL=?,TELEFONO_SECUNDARIO=?,
                     ID_ESTADO_CIVIL=?,OCUPACION=?,DIRECCION=?,EMAIL=?,NACIONALIDAD=?,TIPO_DOCUMENTO=?
                     WHERE ID_PERSONA=?`,
                    [
                        cliente_facturar.nombre_completo, cliente_facturar.telefono_principal,
                        cliente_facturar.telefono_secundario, cliente_facturar.id_estado_civil||null,
                        cliente_facturar.ocupacion||null, cliente_facturar.direccion||null,
                        cliente_facturar.email||null, cliente_facturar.nacionalidad||null,
                        cliente_facturar.tipo_documento||null, idClienteFacturar
                    ]
                );
            } else {
                // Crear nuevo cliente
                const [rf] = await connection.execute(
                    `INSERT INTO PERSONAS (TIPO_DOCUMENTO,IDENTIFICACION,NOMBRE_COMPLETO,TELEFONO_PRINCIPAL,
                     TELEFONO_SECUNDARIO,ID_ESTADO_CIVIL,OCUPACION,DIRECCION,EMAIL,NACIONALIDAD,ESTADO)
                     VALUES (?,?,?,?,?,?,?,?,?,?,'ACTIVO')`,
                    [
                        cliente_facturar.tipo_documento||null, cliente_facturar.identificacion,
                        cliente_facturar.nombre_completo, cliente_facturar.telefono_principal||null,
                        cliente_facturar.telefono_secundario||null, cliente_facturar.id_estado_civil||null,
                        cliente_facturar.ocupacion||null, cliente_facturar.direccion||null,
                        cliente_facturar.email||null, cliente_facturar.nacionalidad||null
                    ]
                );
                idClienteFacturar = rf.insertId;
                // Asignar rol cliente
                await connection.execute(
                    'INSERT IGNORE INTO PERSONAS_ROLES (ID_PERSONA, ID_ROL, ESTADO) VALUES (?,1,"ACTIVO")',
                    [idClienteFacturar]
                );
            }
        }

        // ─── 2. CLIENTE INSCRIBIR ─────────────────────────────────
        let idClienteInscribir = cliente_inscribir?.id_persona_existente || null;
        if (!idClienteInscribir && cliente_inscribir?.identificacion && cliente_inscribir.identificacion !== cliente_facturar?.identificacion) {
            const [existeI] = await connection.execute(
                'SELECT ID_PERSONA FROM PERSONAS WHERE IDENTIFICACION = ?',
                [cliente_inscribir.identificacion]
            );
            if (existeI.length > 0) {
                idClienteInscribir = existeI[0].ID_PERSONA;
            } else {
                const [ri] = await connection.execute(
                    `INSERT INTO PERSONAS (TIPO_DOCUMENTO,IDENTIFICACION,NOMBRE_COMPLETO,TELEFONO_PRINCIPAL,
                     TELEFONO_SECUNDARIO,ID_ESTADO_CIVIL,OCUPACION,DIRECCION,EMAIL,NACIONALIDAD,ESTADO)
                     VALUES (?,?,?,?,?,?,?,?,?,?,'ACTIVO')`,
                    [
                        cliente_inscribir.tipo_documento||null, cliente_inscribir.identificacion,
                        cliente_inscribir.nombre_completo, cliente_inscribir.telefono_principal||null,
                        cliente_inscribir.telefono_secundario||null, cliente_inscribir.id_estado_civil||null,
                        cliente_inscribir.ocupacion||null, cliente_inscribir.direccion||null,
                        cliente_inscribir.email||null, cliente_inscribir.nacionalidad||null
                    ]
                );
                idClienteInscribir = ri.insertId;
                await connection.execute(
                    'INSERT IGNORE INTO PERSONAS_ROLES (ID_PERSONA, ID_ROL, ESTADO) VALUES (?,2,"ACTIVO")',
                    [idClienteInscribir]
                );
            }
        } else if (cliente_inscribir?.identificacion === cliente_facturar?.identificacion) {
            idClienteInscribir = idClienteFacturar;
        }

        // ─── 3. VEHÍCULO ─────────────────────────────────────────
        let idVehiculo = vehiculo?.id_vehiculo || null;
        if (!idVehiculo && vehiculo?.chasis) {
            const [existeVeh] = await connection.execute(
                'SELECT ID_VEHICULO FROM VEHICULOS WHERE CHASIS = ?',
                [vehiculo.chasis]
            );
            if (existeVeh.length > 0) {
                idVehiculo = existeVeh[0].ID_VEHICULO;
            }
        }

        if (!idVehiculo && !cliente_facturar) {
            throw new Error('No se encontró el vehículo');
        }

        // ─── 4. CREAR VENTA ───────────────────────────────────────
        const codigoFinal = codigo_venta || ('PV-' + Date.now().toString().slice(-6));
        const [rv] = await connection.execute(
            `INSERT INTO VENTAS (CODIGO_VENTA, ID_VEHICULO, ID_CLIENTE_FACTURACION, ID_CLIENTE_INSCRIPCION,
             ID_VENDEDOR, NOMBRE_NOTARIO, FECHA_VENTA, PV_PURDI, ESTADO_VENTA)
             VALUES (?,?,?,?,?,?,?,?,?)`,
            [
                codigoFinal, idVehiculo, idClienteFacturar, idClienteInscribir||null,
                id_vendedor, nombre_notario||null, fecha_venta||new Date(),
                pv_purdi||null, estado_venta||'PENDIENTE DE FACTURAR'
            ]
        );
        const idVenta = rv.insertId;

        // ─── 5. FORMA DE PAGO ─────────────────────────────────────
        if (forma_pago) {
            await connection.execute(
                `INSERT INTO FORMAS_PAGO (ID_VENTA, TIPO_VENTA, PLAZO_MESES, FECHA_PRIMER_PAGO,
                 ENTIDAD_FINANCIERA, INTERES_NOMINAL, INTERES_MORATORIO, PRIMA, SALDO, ESTADO_PAGO)
                 VALUES (?,?,?,?,?,?,?,?,?,'PENDIENTE')`,
                [
                    idVenta,
                    (forma_pago.tipo_venta||'CONTADO').toUpperCase(),
                    forma_pago.plazo_meses||0,
                    forma_pago.fecha_primer_pago||null,
                    forma_pago.entidad_financiera||null,
                    forma_pago.interes_nominal||null,
                    forma_pago.interes_moratorio||null,
                    forma_pago.prima||0,
                    forma_pago.saldo||0
                ]
            );
        }

        // ─── 6. ANTICIPOS (si se enviaron junto al plan) ──────────
        if (Array.isArray(anticipos) && anticipos.length > 0) {
            for (const a of anticipos) {
                await connection.execute(
                    `INSERT INTO ANTICIPOS (ID_VENTA, FORMA_PAGO, NUM_DOCUMENTO, MONTO_COLONES,
                     MONTO_DOLARES, TIPO_CAMBIO, REALIZADO_POR, FECHA_ANTICIPO, SALDO_PENDIENTE, OBSERVACIONES)
                     VALUES (?,?,?,?,?,?,?,?,?,?)`,
                    [
                        idVenta,
                        a.forma_pago||a.FORMA_PAGO||'',
                        a.num_documento||a.NUM_DOCUMENTO||'',
                        a.monto_colones||a.MONTO_COLONES||0,
                        a.monto_dolares||a.MONTO_DOLARES||0,
                        a.tipo_cambio||a.TIPO_CAMBIO||1,
                        a.realizado_por||a.REALIZADO_POR||'',
                        a.fecha_anticipo||a.FECHA_ANTICIPO||new Date(),
                        a.saldo_pendiente||a.SALDO_PENDIENTE||0,
                        a.observaciones||a.OBSERVACIONES||null
                    ]
                );
            }
        }

        // ─── 7. Actualizar estado del vehículo a VENDIDO ──────────
        if (idVehiculo) {
            await connection.execute(
                'UPDATE VEHICULOS SET ESTADO = "VENDIDO" WHERE ID_VEHICULO = ?',
                [idVehiculo]
            );
        }

        // ─── 8. Auditoría ─────────────────────────────────────────
        await connection.execute(
            `INSERT INTO AUDITORIA (ID_PERSONA, ACCION, DESCRIPCIÓN) VALUES (?,?,?)`,
            [id_vendedor, 'CREAR_PLAN_VENTA', `Plan de venta ${codigoFinal} creado`]
        );

        await connection.commit();
        await connection.end();

        res.status(201).json({
            id_venta:    idVenta,
            codigo_venta: codigoFinal,
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


// ================================================================
//  GET /api/anticipos?id_venta=X  — Filtrar anticipos por venta
//  (Reemplaza o complementa el GET /api/anticipos existente)
// ================================================================
app.get('/api/anticipos', async (req, res) => {
    try {
        const { id_venta } = req.query;
        let query = `
            SELECT a.*, v.CODIGO_VENTA
            FROM ANTICIPOS a
            LEFT JOIN VENTAS v ON a.ID_VENTA = v.ID_VENTA
            WHERE 1=1`;
        const params = [];

        if (id_venta) {
            query += ' AND a.ID_VENTA = ?';
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

// ================================================================
//  POST /api/anticipos  — Crear un anticipo individual
// ================================================================
app.post('/api/anticipos', async (req, res) => {
    const {
        id_venta, forma_pago, num_documento,
        monto_colones, monto_dolares, tipo_cambio,
        realizado_por, fecha_anticipo, saldo_pendiente, observaciones
    } = req.body;

    if (!id_venta || !forma_pago || !num_documento) {
        return res.status(400).json({ error: 'Faltan campos requeridos: id_venta, forma_pago, num_documento' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            `INSERT INTO ANTICIPOS
             (ID_VENTA, FORMA_PAGO, NUM_DOCUMENTO, MONTO_COLONES,
              MONTO_DOLARES, TIPO_CAMBIO, REALIZADO_POR, FECHA_ANTICIPO,
              SALDO_PENDIENTE, OBSERVACIONES)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
                id_venta,
                forma_pago,
                num_documento,
                parseNumberServer(monto_colones) || 0,
                parseNumberServer(monto_dolares) || 0,
                parseNumberServer(tipo_cambio)   || 1,
                realizado_por || '',
                fecha_anticipo || new Date().toISOString().split('T')[0],
                parseNumberServer(saldo_pendiente) || 0,
                observaciones || null
            ]
        );
        await connection.end();
        res.status(201).json({ id: result.insertId, message: 'Anticipo creado exitosamente' });
    } catch (err) {
        console.error('Error al crear anticipo:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ================================================================
//  PUT /api/anticipos/:id  — Actualizar un anticipo
// ================================================================
app.put('/api/anticipos/:id', async (req, res) => {
    const { id } = req.params;
    const {
        forma_pago, num_documento, monto_colones,
        monto_dolares, tipo_cambio, realizado_por,
        fecha_anticipo, saldo_pendiente, observaciones
    } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `UPDATE ANTICIPOS SET
             FORMA_PAGO=?, NUM_DOCUMENTO=?, MONTO_COLONES=?,
             MONTO_DOLARES=?, TIPO_CAMBIO=?, REALIZADO_POR=?,
             FECHA_ANTICIPO=?, SALDO_PENDIENTE=?, OBSERVACIONES=?
             WHERE ID_ANTICIPO=?`,
            [
                forma_pago, num_documento,
                parseNumberServer(monto_colones) || 0,
                parseNumberServer(monto_dolares) || 0,
                parseNumberServer(tipo_cambio)   || 1,
                realizado_por || '',
                fecha_anticipo,
                parseNumberServer(saldo_pendiente) || 0,
                observaciones || null,
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

// ================================================================
//  DELETE /api/anticipos/:id  — Eliminar un anticipo
// ================================================================
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

// ================================================================
//  GET /api/personas?nombre=X&estado=ACTIVO  — ya existe pero
//  asegúrate de que soporte búsqueda por nombre Y por identificación
// ================================================================

// Si no tienes esta versión exacta, reemplaza el GET /api/personas con:
app.get('/api/personas', async (req, res) => {
    try {
        const { nombre, identificacion, estado } = req.query;
        let query = `
            SELECT p.*, ec.NOMBRE as estado_civil_nombre
            FROM PERSONAS p
            LEFT JOIN CAT_ESTADOS_CIVIL ec ON p.ID_ESTADO_CIVIL = ec.ID_ESTADO_CIVIL
            WHERE 1=1`;
        const params = [];

        if (nombre) {
            // Busca en nombre Y en identificación para máxima flexibilidad
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
        query += ' ORDER BY p.NOMBRE_COMPLETO LIMIT 50';

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(query, params);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener personas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ================================================================
//  GET /api/cuentas-cobrar
//  Retorna las cuotas de crédito con su estado de pago
//  Query params opcionales: plan_venta, cliente, estado
// ================================================================
app.get('/api/cuentas-cobrar', async (req, res) => {
    try {
        const { plan_venta, cliente, estado } = req.query;

        let query = `
            SELECT
                a.ID_ANTICIPO                           AS id,
                a.ID_ANTICIPO                           AS id_cuenta,
                a.ID_VENTA                              AS id_venta,
                v.CODIGO_VENTA                          AS plan_venta,
                pf.NOMBRE_COMPLETO                      AS cliente,
                pf.IDENTIFICACION                       AS cedula,
                pf.TELEFONO_PRINCIPAL                   AS telefono,
                pf.DIRECCION                            AS direccion,
                CONCAT(IFNULL(m.NOMBRE,''), ' ', IFNULL(ve.ESTILO,'')) AS vehiculo,
                ve.PLACA                                AS placa,
                -- El número de cuota se extrae del campo NUM_DOCUMENTO (ej: CUOTA-1-...)
                CAST(
                    SUBSTRING_INDEX(SUBSTRING_INDEX(a.NUM_DOCUMENTO, '-', 2), '-', -1)
                AS UNSIGNED)                            AS numero_cuota,
                a.FECHA_VENCIMIENTO                      AS fecha_vencimiento,  -- 👈 CAMBIO CLAVE: ahora usa FECHA_VENCIMIENTO
                a.MONTO_COLONES                         AS monto_cuota,
                a.SALDO_PENDIENTE                       AS saldo_pendiente,
                fp.INTERES_NOMINAL                      AS interes_nominal,
                fp.INTERES_MORATORIO                    AS interes_moratorio,
                -- Estado: si SALDO_PENDIENTE = 0 → pagado, si no → pendiente
                CASE
                    WHEN a.SALDO_PENDIENTE <= 0 THEN 'pagado'
                    WHEN a.FECHA_VENCIMIENTO < CURDATE() AND a.SALDO_PENDIENTE > 0 THEN 'atrasado'  -- 👈 CAMBIO CLAVE aquí también
                    WHEN a.SALDO_PENDIENTE > 0 THEN 'pendiente'
                    ELSE 'pendiente'
                END                                     AS estado,
                a.OBSERVACIONES                         AS observaciones,
                a.REALIZADO_POR                         AS realizado_por
            FROM ANTICIPOS a
            JOIN VENTAS v      ON a.ID_VENTA = v.ID_VENTA
            LEFT JOIN PERSONAS pf ON v.ID_CLIENTE_FACTURACION = pf.ID_PERSONA
            LEFT JOIN VEHICULOS ve ON v.ID_VEHICULO = ve.ID_VEHICULO
            LEFT JOIN CAT_MARCAS m ON ve.ID_MARCA = m.ID_MARCA
            LEFT JOIN FORMAS_PAGO fp ON v.ID_VENTA = fp.ID_VENTA
            -- Solo las filas que son cuotas de amortización (contienen "CUOTA-" en NUM_DOCUMENTO)
            WHERE a.NUM_DOCUMENTO LIKE 'CUOTA-%'
        `;

        const params = [];

        if (plan_venta) {
            query += ' AND v.CODIGO_VENTA LIKE ?';
            params.push(`%${plan_venta}%`);
        }
        if (cliente) {
            query += ' AND (pf.NOMBRE_COMPLETO LIKE ? OR pf.IDENTIFICACION LIKE ?)';
            params.push(`%${cliente}%`, `%${cliente}%`);
        }
        if (estado === 'pagado') {
            query += ' AND a.SALDO_PENDIENTE <= 0';
        } else if (estado === 'pendiente') {
            query += ' AND a.SALDO_PENDIENTE > 0 AND a.FECHA_VENCIMIENTO >= CURDATE()';
        } else if (estado === 'atrasado') {
            query += ' AND a.SALDO_PENDIENTE > 0 AND a.FECHA_VENCIMIENTO < CURDATE()';
        }

        query += ' ORDER BY v.CODIGO_VENTA, numero_cuota ASC';

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(query, params);
        await connection.end();

        res.json(rows);
    } catch (err) {
        console.error('Error al obtener cuentas por cobrar:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
});

// ================================================================
//  POST /api/cuentas-cobrar/pago
//  Registra el pago de una cuota:
//    1. Actualiza SALDO_PENDIENTE en ANTICIPOS
//    2. Crea un nuevo registro en ANTICIPOS como recibo de pago
// ================================================================
app.post('/api/cuentas-cobrar/pago', async (req, res) => {
    const {
        id_cuenta,         // ID_ANTICIPO de la cuota a pagar
        id_venta,
        numero_cuota,
        numero_recibo,
        forma_pago,
        num_documento,
        monto_colones,
        tipo_cambio,
        monto_dolares,
        realizado_por,
        fecha_pago,
        saldo_pendiente,   // saldo que queda después del pago
    } = req.body;

    if (!id_cuenta || !forma_pago || !num_documento || !monto_colones || !fecha_pago || !realizado_por) {
        return res.status(400).json({ error: 'Faltan campos requeridos para registrar el pago' });
    }

    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();

        // 1. Actualizar el saldo pendiente de la cuota original
        await connection.execute(
            `UPDATE ANTICIPOS
             SET SALDO_PENDIENTE = ?,
                 REALIZADO_POR  = ?,
                 OBSERVACIONES  = CONCAT(IFNULL(OBSERVACIONES,''), ' | PAGADO: ', ?)
             WHERE ID_ANTICIPO  = ?`,
            [
                Math.max(0, parseFloat(saldo_pendiente) || 0),
                realizado_por,
                fecha_pago,
                id_cuenta
            ]
        );

        // 2. Crear registro de pago (recibo) en ANTICIPOS
        const docRecibo = numero_recibo || num_documento;
        await connection.execute(
            `INSERT INTO ANTICIPOS
             (ID_VENTA, FORMA_PAGO, NUM_DOCUMENTO, MONTO_COLONES,
              MONTO_DOLARES, TIPO_CAMBIO, REALIZADO_POR, FECHA_ANTICIPO,
              SALDO_PENDIENTE, OBSERVACIONES)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
                id_venta,
                forma_pago,
                docRecibo,
                parseFloat(monto_colones)  || 0,
                parseFloat(monto_dolares)  || 0,
                parseFloat(tipo_cambio)    || 1,
                realizado_por,
                fecha_pago,
                Math.max(0, parseFloat(saldo_pendiente) || 0),
                `Pago cuota #${numero_cuota} — Recibo: ${docRecibo}`
            ]
        );

        await connection.commit();
        await connection.end();

        res.status(201).json({
            message:       'Pago registrado correctamente',
            numero_recibo: docRecibo,
        });

    } catch (err) {
        await connection.rollback();
        await connection.end();
        console.error('Error al registrar pago:', err);
        res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
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
