// Funcionalidad para el menú móvil
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
        
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
        
        // Cerrar sidebar al hacer clic en enlace (en móviles)
        const sidebarLinks = sidebar.querySelectorAll('a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        });
    }
    
    // Dropdown functionality
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.parentElement;
            parent.classList.toggle('active');
        });
    });

// Ajustar altura del menú en móviles
    function adjustMenuHeight() {
        const menuContainer = document.querySelector('.menu-container');
        const sidebarButtons = document.querySelector('.sidebar-buttons-section');
        
        if (window.innerWidth <= 768 && menuContainer) {
            if (sidebarButtons) {
                // Si hay botones, calcula el espacio disponible
                const sidebarHeight = window.innerHeight;
                const buttonsHeight = sidebarButtons.offsetHeight;
                const headerHeight = document.querySelector('.sidebar h2').offsetHeight;
                const padding = 40; // Padding y márgenes
                
                menuContainer.style.maxHeight = (sidebarHeight - buttonsHeight - headerHeight - padding) + 'px';
            } else {
                // Si NO hay botones, usa toda la altura disponible
                const sidebarHeight = window.innerHeight;
                const headerHeight = document.querySelector('.sidebar h2').offsetHeight;
                const padding = 30;
                
                menuContainer.style.maxHeight = (sidebarHeight - headerHeight - padding) + 'px';
            }
        } else {
            // En desktop, remover max-height
            if (menuContainer) {
                menuContainer.style.maxHeight = 'none';
            }
        }
    }
    
    // Ejecutar al cargar y al redimensionar
    adjustMenuHeight();
    window.addEventListener('resize', adjustMenuHeight);    
});