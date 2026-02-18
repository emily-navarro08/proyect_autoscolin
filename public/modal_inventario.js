// Datos iniciales de observaciones/gastos
let observations = [];
let observationCounter = 5;
        
// Función para cargar las observaciones en la lista
function loadObservations(vehiculoId) {
    const observationsList = document.getElementById('observations-list');
    if (!observationsList) return;
    
    observationsList.innerHTML = '';
    
    observations.forEach(observation => {
        const observationItem = document.createElement('div');
        observationItem.className = 'observation-item';
        observationItem.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 10px;
            background: #f9f9f9;
        `;
        
        observationItem.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="observation-input" value="${observation.description}" 
                       data-id="${observation.id}" placeholder="Descripción del gasto"
                       style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <button class="delete-btn" data-id="${observation.id}" 
                        style="background: #e74c3c; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                    Eliminar
                </button>
            </div>
            <div class="price-input-group" style="display: flex; gap: 15px;">
                <div class="price-input-wrapper" style="flex: 1;">
                    <span class="currency-symbol">$</span>
                    <input type="text" class="price-input price-dolar" value="${observation.amountUSD}" 
                           data-id="${observation.id}" data-currency="USD" 
                           oninput="actualizarObservacionMonto(${observation.id}, this.value, 'USD', '${vehiculoId}')"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div class="price-input-wrapper" style="flex: 1;">
                    <span class="currency-symbol">₡</span>
                    <input type="text" class="price-input price-colon" value="${observation.amountCRC}" 
                           data-id="${observation.id}" data-currency="CRC" 
                           oninput="actualizarObservacionMonto(${observation.id}, this.value, 'CRC', '${vehiculoId}')"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            </div>
        `;
        observationsList.appendChild(observationItem);
    });
    
    // Agregar eventos a los botones de eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteObservation(id, vehiculoId);
        });
    });
}

// Función para actualizar el monto de una observación
function actualizarObservacionMonto(id, valor, moneda, vehiculoId) {
    const observationIndex = observations.findIndex(obs => obs.id === id);
    if (observationIndex === -1) return;
    
    const tipoCambio = limpiarFormatoMoneda(document.getElementById(`tipo_cambio_${vehiculoId}`).value);
    
    if (moneda === 'USD') {
        observations[observationIndex].amountUSD = valor;
        observations[observationIndex].amountCRC = formatearColones(limpiarFormatoMoneda(valor) * tipoCambio);
    } else {
        observations[observationIndex].amountCRC = valor;
        observations[observationIndex].amountUSD = formatearDolares(limpiarFormatoMoneda(valor) / tipoCambio);
    }
    
    // Recargar observaciones para mostrar valores actualizados
    loadObservations(vehiculoId);
    
    // Recalcular total inversión
    calcularTotalInversion(vehiculoId);
}
        
// Función para agregar nueva observación/gasto
function addNewObservation(vehiculoId) {
    const tipoCambio = limpiarFormatoMoneda(document.getElementById(`tipo_cambio_${vehiculoId}`).value);
    
    const newObservation = {
        id: observationCounter++,
        description: "Nuevo gasto",
        amountUSD: "0.00",
        amountCRC: "0.00"
    };
    
    observations.push(newObservation);
    loadObservations(vehiculoId);
}

// Función para eliminar una observación
function deleteObservation(id, vehiculoId) {
    if (observations.length <= 0) {
        alert("Debe haber al menos una observación.");
        return;
    }
    
    observations = observations.filter(obs => obs.id !== id);
    loadObservations(vehiculoId);
    calcularTotalInversion(vehiculoId);
}
        
        // Función para actualizar una observación
        function updateObservation(id, field, value) {
            const observationIndex = observations.findIndex(obs => obs.id === id);
            if (observationIndex !== -1) {
                observations[observationIndex][field] = value;
            }
        }
        
        // Función para formatear moneda
        function formatCurrency(input) {
            // Solo formatear si no está vacío
            if (!input.value.trim()) {
                return;
            }
            
            // Remover cualquier carácter que no sea número o punto decimal
            let value = input.value.replace(/[^\d.]/g, '');
            
            // Si hay un valor, formatearlo como moneda
            if (value) {
                // Separar parte entera y decimal
                let parts = value.split('.');
                let integerPart = parts[0];
                let decimalPart = parts.length > 1 ? '.' + parts[1].substring(0, 2) : '.00';
                
                // Formatear parte entera con separadores de miles
                if (integerPart.length > 3) {
                    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                }
                
                input.value = integerPart + decimalPart;
            }
        }
        
// ========== INICIALIZACIÓN DE LA PÁGINA ==========

document.addEventListener('DOMContentLoaded', function() {
    // Configurar botón para agregar observaciones
    const addBtn = document.getElementById('add-observation-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            // Obtener el vehículo activo del modal actual
            const modalVisible = document.querySelector('.modal[style*="display: block"]');
            if (modalVisible) {
                const vehiculoId = modalVisible.id.replace('modal', '').toLowerCase();
                addNewObservation(vehiculoId);
            }
        });
    }
    
    // Configurar botones de acción del modal
    const confirmBtn = document.querySelector('.btn-confirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            alert('Información del inventario confirmada y guardada exitosamente.');
        });
    }
    
    const cancelBtn = document.querySelector('.btn-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm('¿Está seguro de que desea cancelar? Se perderán los cambios no guardados.')) {
                location.reload();
            }
        });
    }
    
    // Auto-ajuste de textareas
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    });
});