// Función para cargar información del usuario
document.addEventListener('DOMContentLoaded', function() {
    cargarInfoUsuario();
    
    // También verificar si hay sesión activa
    if (!sessionStorage.getItem('usuarioId')) {
        // Redirigir al login si no hay sesión
        window.location.href = '/index.html';
    }
});

function cargarInfoUsuario() {
    const nombre = sessionStorage.getItem('usuarioNombre');
    const rol = sessionStorage.getItem('usuarioRol');
    const username = sessionStorage.getItem('usuarioUsername');
    
    if (nombre && rol) {
        document.getElementById('usuarioInfo').innerHTML = 
            `🖥️ ${nombre} - ${rol.toUpperCase()}`;
    } else {
        // Intentar obtener la información desde la API si no está en sessionStorage
        const usuarioId = sessionStorage.getItem('usuarioId');
        if (usuarioId) {
            fetch(`/api/usuarios/${usuarioId}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.NOMBRE_COMPLETO) {
                        sessionStorage.setItem('usuarioNombre', data.NOMBRE_COMPLETO);
                        // Necesitarías también obtener el rol
                        cargarInfoUsuario(); // Recargar
                    }
                })
                .catch(error => {
                    console.error('Error al obtener información del usuario:', error);
                });
        }
    }
}

// Función para cerrar sesión
function cerrarSesion() {
    sessionStorage.clear(); // Limpiar toda la sesión
    localStorage.removeItem('usuarioNombre'); // También limpiar localStorage si lo usas
    localStorage.removeItem('usuarioRol');
    window.location.href = '/index.html';
}