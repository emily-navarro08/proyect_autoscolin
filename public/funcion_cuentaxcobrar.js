const API_BASE_URL = 'http://localhost:3000/api';
const API_CXC = {
    cuentas:   `${API_BASE_URL}/cuentas-cobrar`,
    anticipos: `${API_BASE_URL}/anticipos`,
    pago:      `${API_BASE_URL}/cuentas-cobrar/pago`,
};

// Estado global
let cuentasPorCobrar = [];
let anticiposData    = [];
let cuentaSeleccionada = null;

//  UTILIDADES
function formatoNumero(num) {
    const n = Math.round(parseFloat(num) || 0);
    const partes = n.toFixed(2).split('.');
    const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return '₡ ' + entero + ',' + partes[1];
}

function mostrarToast(msg, tipo = 'info') {
    const t = document.createElement('div');
    t.className = `toast-notif ${tipo}`;
    const iconos = { success:'check-circle', error:'times-circle', warning:'exclamation-triangle', info:'info-circle' };
    t.innerHTML = `<i class="fas fa-${iconos[tipo]||'info-circle'}"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

async function apiFetch(url, opciones = {}) {
    const defaults = {
        headers: { 'Content-Type': 'application/json' },
    };
    const resp = await fetch(url, { ...defaults, ...opciones,
        headers: { ...defaults.headers, ...(opciones.headers || {}) }
    });
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(err.error || `Error ${resp.status}`);
    }
    return resp.json();
}

function generarNumeroRecibo() {
    const d = new Date();
    const aa = d.getFullYear().toString().slice(-2);
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const rnd = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RCP-${aa}${mm}${dd}-${rnd}`;
}

//  CALCULAR DÍAS DE ATRASO Y ESTADO
function calcularEstado(cuenta) {
    console.log('Calculando estado para cuenta ID:', cuenta.id);
    
    // Verificar si está pagado (usando el campo 'estado' que viene del backend)
    if (cuenta.estado === 'pagado') {
        console.log('  → Es PAGADO');
        return { clase: 'estado-pagado', texto: 'Pagado', dias: 0 };
    }

    // Obtener la fecha de vencimiento (viene como 'fecha_vencimiento')
    let fechaVencimientoStr = cuenta.fecha_vencimiento;
    
    if (!fechaVencimientoStr) {
        console.warn('  ⚠️ Sin fecha de vencimiento');
        return { clase: 'estado-pendiente', texto: 'Pendiente', dias: 0 };
    }

    console.log('  → Fecha original:', fechaVencimientoStr);

    try {
        // Extraer la parte de la fecha (ignorar la hora)
        // El formato es "2026-02-21T06:00:00.000Z"
        const fechaParte = fechaVencimientoStr.split('T')[0]; // Obtiene "2026-02-21"
        
        if (!fechaParte) {
            throw new Error('Formato de fecha no válido');
        }
        
        // Separar año, mes, día
        const [year, month, day] = fechaParte.split('-').map(Number);
        
        // Crear fecha (los meses en JavaScript son 0-indexados, por eso restamos 1)
        const fechaVencimiento = new Date(year, month - 1, day);
        fechaVencimiento.setHours(0, 0, 0, 0);
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        console.log(`  → Fecha vencimiento: ${fechaVencimiento.toLocaleDateString()}, Hoy: ${hoy.toLocaleDateString()}`);

        // Calcular diferencia en días
        const diffTime = hoy.getTime() - fechaVencimiento.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log(`  → Días de diferencia: ${diffDays}`);

        // Determinar estado basado en días de atraso
        if (diffDays > 0) {
            return { 
                clase: 'estado-atrasado', 
                texto: 'Atrasado', 
                dias: diffDays 
            };
        }
        
        return { 
            clase: 'estado-pendiente', 
            texto: 'Pendiente', 
            dias: 0 
        };
        
    } catch (e) {
        console.error('Error al calcular estado:', e);
        return { clase: 'estado-pendiente', texto: 'Pendiente', dias: 0 };
    }
}

//  CARGA DE DATOS DESDE API
async function cargarCuentasPorCobrar() {
    const tbody = document.getElementById('tablaCuentasCuerpo');

    tbody.innerHTML = `<tr class="loading-row"><td colspan="10"><span class="spinner-inline"></span> Cargando cuentas...</td></tr>`;

    try {
        const plan     = document.getElementById('filtroPlan')?.value.trim()   || '';
        const cliente  = document.getElementById('filtroCliente')?.value.trim() || '';
        const estado   = document.getElementById('filtroEstado')?.value         || '';

        const params = new URLSearchParams();
        if (plan)    params.append('plan_venta', plan);
        if (cliente) params.append('cliente', cliente);
        if (estado)  params.append('estado', estado);

        const url = `${API_CXC.cuentas}?${params.toString()}`;
        console.log('📡 URL de petición:', url);
        
        cuentasPorCobrar = await apiFetch(url);

        console.log('📊 DATOS RECIBIDOS DEL BACKEND:');
        console.log('Cantidad de registros:', cuentasPorCobrar.length);
        
        if (cuentasPorCobrar.length > 0) {
            console.log('Primer registro completo:', JSON.stringify(cuentasPorCobrar[0], null, 2));
            console.log('Campos disponibles en el primer registro:', Object.keys(cuentasPorCobrar[0]));
            
            // Verificar específicamente los campos que necesitamos
            const primerRegistro = cuentasPorCobrar[0];
            console.log('ID_ANTICIPO:', primerRegistro.ID_ANTICIPO);
            console.log('FECHA_VENCIMIENTO:', primerRegistro.FECHA_VENCIMIENTO);
            console.log('ESTADO_ANTICIPO:', primerRegistro.ESTADO_ANTICIPO);
            console.log('OBSERVACIONES:', primerRegistro.OBSERVACIONES);
        }

        renderizarTabla(cuentasPorCobrar);
    } catch (e) {
        console.error('Error cargando cuentas:', e);
        mostrarToast('Error al cargar cuentas: ' + e.message, 'error');
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:#e74c3c;">
            <i class="fas fa-exclamation-triangle"></i> No se pudieron cargar los datos.
        </td></tr>`;
    }
}

//  RENDERIZAR TABLA
function renderizarTabla(cuentas) {
    const tbody = document.getElementById('tablaCuentasCuerpo');
    if (!tbody) return;

    if (!cuentas || cuentas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:#7f8c8d;">
            <i class="fas fa-search" style="font-size:2rem;margin-bottom:10px;display:block;"></i>
            No se encontraron resultados
        </td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    cuentas.forEach(cuenta => {
        const { clase, texto, dias } = calcularEstado(cuenta);

        // Determinar si está pagado
        const estaPagado = cuenta.estado === 'pagado';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cuenta.plan_venta || '-'}</td>
            <td>${cuenta.cliente || '-'}</td>
            <td>${cuenta.vehiculo || '-'}</td>
            <td style="text-align:center;">${cuenta.numero_cuota || '-'}</td>
            <td style="text-align:center;">${formatFecha(cuenta.fecha_vencimiento)}</td>
            <td style="text-align:right;">${formatoNumero(cuenta.monto_cuota || 0)}</td>
            <td style="text-align:right;">${formatoNumero(cuenta.saldo_pendiente || 0)}</td>
            <td style="text-align:center;">${dias > 0 ? dias : '-'}</td>
            <td style="text-align:center;"><span class="${clase}">${texto}</span></td>
            <td style="text-align:center;">
                ${!estaPagado
                    ? `<button class="btn-cobrar" onclick="abrirModalPago(${cuenta.id})">
                           <i class="fas fa-dollar-sign"></i> Cobrar
                       </button>`
                    : `<button class="btn-ver-detalle" onclick="verDetallePago(${cuenta.id})">
                           <i class="fas fa-eye"></i> Ver
                       </button>`
                }
            </td>`;
        tbody.appendChild(tr);
    });
}

function formatFecha(f) {
    if (!f) return '-';
    try {
        // Si viene con formato ISO (2026-02-21T06:00:00.000Z)
        if (f.includes('T')) {
            const [year, month, day] = f.split('T')[0].split('-');
            return `${day}/${month}/${year}`;
        }
        // Si viene en otro formato
        const d = new Date(f);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('es-CR');
    } catch (e) {
        return '-';
    }
}

//  FILTROS
function aplicarFiltros() {
    cargarCuentasPorCobrar();
}

function limpiarFiltros() {
    document.getElementById('filtroPlan').value    = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroEstado').value  = '';
    cargarCuentasPorCobrar();
}

//  MODAL DE PAGO
function abrirModalPago(cuentaId) {
    console.log('Abriendo modal para cuenta ID:', cuentaId);
    
    // Buscar la cuenta por su ID
    cuentaSeleccionada = cuentasPorCobrar.find(c => c.id == cuentaId);
    
    if (!cuentaSeleccionada) {
        console.error('No se encontró la cuenta:', cuentaId);
        mostrarToast('No se encontró la cuenta seleccionada', 'error');
        return;
    }

    console.log('Cuenta seleccionada:', cuentaSeleccionada);

    // Extraer datos directamente de la cuenta (usando los nombres que vienen del backend)
    const planVenta = cuentaSeleccionada.plan_venta || '-';
    const cliente = cuentaSeleccionada.cliente || '-';
    const numeroCuota = cuentaSeleccionada.numero_cuota || '1';
    const montoCuota = parseFloat(cuentaSeleccionada.monto_cuota) || 0;
    const fechaVencimiento = cuentaSeleccionada.fecha_vencimiento;
    const saldoPendiente = parseFloat(cuentaSeleccionada.saldo_pendiente) || montoCuota;
    const observaciones = cuentaSeleccionada.observaciones || '';

    // Extraer datos de la observación
    let pagoIntereses = 0;
    let amortizacion = 0;
    let capital = 0;
    
    if (observaciones) {
        console.log('Procesando observaciones:', observaciones);
        
        // Extraer Capital (formato: "Capital: ₡ 214.549,00")
        const capitalMatch = observaciones.match(/Capital:\s*[₡]?\s*([\d.,]+)/);
        if (capitalMatch) {
            capital = parseFloat(capitalMatch[1].replace(/\./g, '').replace(',', '.'));
            console.log('  → Capital extraído:', capital);
        }
        
        // Extraer Intereses (formato: "Intereses: ₡ 170.750,00")
        const interesesMatch = observaciones.match(/Intereses:\s*[₡]?\s*([\d.,]+)/);
        if (interesesMatch) {
            pagoIntereses = parseFloat(interesesMatch[1].replace(/\./g, '').replace(',', '.'));
            console.log('  → Intereses extraídos:', pagoIntereses);
        }
    }

    // Calcular amortización (Monto de cuota - Intereses)
    amortizacion = Math.round(montoCuota - pagoIntereses);

    // Formatear la fecha para mostrarla
    const fechaFormateada = formatFecha(fechaVencimiento);

    const detalleHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px; background: white; padding: 15px; border-radius: 8px;">
            <div><strong>Plan:</strong> ${planVenta}</div>
            <div><strong>Cliente:</strong> ${cliente}</div>
            <div><strong>Cuota #:</strong> ${numeroCuota}</div>
            <div><strong>Monto Cuota:</strong> ${formatoNumero(montoCuota)}</div>
            <div><strong>Vence:</strong> ${fechaFormateada}</div>
            <div><strong>Saldo:</strong> ${formatoNumero(saldoPendiente)}</div>
            <div><strong>Capital:</strong> ${formatoNumero(capital)}</div>
            <div><strong>Intereses:</strong> ${formatoNumero(pagoIntereses)}</div>
            <div><strong>Amortización:</strong> ${formatoNumero(amortizacion)}</div>
        </div>
    `;

    document.getElementById('detalleCuotaPago').innerHTML = detalleHTML;
    
    // Guardar los valores en la cuenta seleccionada
    cuentaSeleccionada.pagoIntereses = pagoIntereses;
    cuentaSeleccionada.amortizacion = amortizacion;
    cuentaSeleccionada.capital = capital;

    // Establecer valores por defecto en el formulario
    document.getElementById('pagoMonto').value = Math.round(saldoPendiente);
    document.getElementById('pagoFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('pagoDocumento').value = '';
    document.getElementById('pagoRealizadoPor').value = '';
    document.getElementById('pagoForma').value = 'Efectivo';
    
    // Limpiar campos de detalles de pago
    document.getElementById('efectivo').value = '0.00';
    document.getElementById('transferencia').value = '0.00';
    document.getElementById('num_transferencia').value = '';
    document.getElementById('nom_deposita').value = '';
    document.getElementById('banco').value = '';
    document.getElementById('tarjeta').value = '0.00';
    document.getElementById('num_tarjeta').value = '';
    document.getElementById('tipo_tarjeta').value = '';

    document.getElementById('modalPagoCuota').style.display = 'flex';
}

function cerrarModalPago() {
    document.getElementById('modalPagoCuota').style.display = 'none';
    cuentaSeleccionada = null;
}

//  PROCESAR PAGO → API  →  RECIBO
async function procesarPagoCuota() {
    if (!cuentaSeleccionada) return;

    const formaPago    = document.getElementById('pagoForma').value;
    const documento    = document.getElementById('pagoDocumento').value.trim();
    const monto        = parseFloat(document.getElementById('pagoMonto').value);
    const fechaPago    = document.getElementById('pagoFecha').value;
    const realizadoPor = document.getElementById('pagoRealizadoPor').value.trim();

    // Validaciones
    if (!formaPago || !documento || !monto || !fechaPago || !realizadoPor) {
        mostrarToast('Complete todos los campos', 'warning'); 
        return;
    }
    if (monto <= 0) {
        mostrarToast('El monto debe ser mayor a cero', 'warning'); 
        return;
    }

    const saldoPendiente = cuentaSeleccionada.SALDO_PENDIENTE || cuentaSeleccionada.monto_cuota || 0;
    if (monto > saldoPendiente) {
        mostrarToast('El monto no puede superar el saldo pendiente', 'warning'); 
        return;
    }

    const numeroRecibo = generarNumeroRecibo();

    // Preparar observación actualizada
    const nuevaObservacion = cuentaSeleccionada.OBSERVACIONES || 
        `Cuota ${cuentaSeleccionada.NUMERO_CUOTA} | Vence: ${formatFecha(cuentaSeleccionada.FECHA_VENCIMIENTO)} | Pagado: ${fechaPago} | Recibo: ${numeroRecibo}`;

    // Payload para la API
    const payload = {
        id_anticipo:        cuentaSeleccionada.ID_ANTICIPO,
        id_financiamiento:  cuentaSeleccionada.ID_FINANCIAMIENTO,
        forma_pago:         formaPago,
        num_documento:      documento,
        monto_colones:      Math.round(monto),
        monto_dolares:      0,
        moneda:             'CRC',
        tipo_cambio:        1,
        realizado_por:      realizadoPor,
        fecha_anticipo:     fechaPago,
        saldo_pendiente:    Math.round(saldoPendiente - monto),
        observaciones:      nuevaObservacion,
        estado_anticipo:    (saldoPendiente - monto) <= 0 ? 'COMPLETADO' : 'PAGADO'
    };

    try {
        // Llamada a la API para actualizar el anticipo
        await apiFetch(`${API_CXC.anticipos}/${cuentaSeleccionada.ID_ANTICIPO}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        mostrarToast('Pago registrado exitosamente', 'success');

        // Preparar datos para la factura
        const datosFactura = {
            numero_recibo:    numeroRecibo,
            plan_venta:       cuentaSeleccionada.CODIGO_VENTA || '-',
            numero_cuota:     cuentaSeleccionada.NUMERO_CUOTA || '-',
            cliente:          cuentaSeleccionada.NOMBRE_COMPLETO || '-',
            cedula:           cuentaSeleccionada.IDENTIFICACION || '-',
            telefono:         cuentaSeleccionada.TELEFONO_PRINCIPAL || 'N/A',
            direccion:        cuentaSeleccionada.DIRECCION || 'N/A',
            vehiculo:         cuentaSeleccionada.VEHICULO || '-',
            monto_pagado:     monto,
            saldo_anterior:   saldoPendiente,
            interes_nominal:  cuentaSeleccionada.interes_nominal || '0.00',
            interes_moratorio: '0.00',
            interes_adicional: '0.00',
            pago_intereses:   cuentaSeleccionada.pagoIntereses || 0,
            amortizacion:     cuentaSeleccionada.amortizacion || 0,
            capital:          cuentaSeleccionada.capital || 0,
            saldo_nuevo:      Math.round(saldoPendiente - monto),
            saldo_actual:     Math.round(saldoPendiente - monto),
            realizado_por:    realizadoPor,
            fecha:            fechaPago,
        };

        generarFactura(datosFactura);
        cerrarModalPago();
        document.getElementById('modalFacturaPago').style.display = 'flex';

        // Recargar tabla
        await cargarCuentasPorCobrar();

    } catch (e) {
        console.error('Error procesando pago:', e);
        mostrarToast('Error al registrar el pago: ' + e.message, 'error');
    }
}

// ================================================================
//  VER DETALLE DE PAGO YA REGISTRADO
// ================================================================
async function verDetallePago(cuentaId) {
    const cuenta = cuentasPorCobrar.find(c => c.id == cuentaId);
    if (!cuenta) return;

    try {
        // Extraer datos de la observación
        let pagoIntereses = 0;
        let amortizacion = 0;
        let capital = 0;
        
        if (cuenta.observaciones) {
            const observacion = cuenta.observaciones;
            
            const capitalMatch = observacion.match(/Capital:\s*[₡]?\s*([\d.,]+)/);
            if (capitalMatch) {
                capital = parseFloat(capitalMatch[1].replace(/\./g, '').replace(',', '.'));
            }
            
            const interesesMatch = observacion.match(/Intereses:\s*[₡]?\s*([\d.,]+)/);
            if (interesesMatch) {
                pagoIntereses = parseFloat(interesesMatch[1].replace(/\./g, '').replace(',', '.'));
            }
        }

        const montoCuota = parseFloat(cuenta.monto_cuota) || 0;
        amortizacion = Math.round(montoCuota - pagoIntereses);

        const datosFactura = {
            numero_recibo:    `REC-${cuenta.id}-${new Date().getTime()}`,
            plan_venta:       cuenta.plan_venta || '-',
            numero_cuota:     cuenta.numero_cuota || '-',
            cliente:          cuenta.cliente || '-',
            cedula:           cuenta.cedula || '-',
            telefono:         cuenta.telefono || 'N/A',
            direccion:        'N/A',
            vehiculo:         cuenta.vehiculo || '-',
            monto_pagado:     parseFloat(cuenta.monto_cuota) || 0,
            saldo_anterior:   parseFloat(cuenta.saldo_pendiente) || 0,
            interes_nominal:  cuenta.interes_nominal || '0.00',
            interes_moratorio: cuenta.interes_moratorio || '0.00',
            interes_adicional: '0.00',
            pago_intereses:   pagoIntereses,
            amortizacion:     amortizacion,
            capital:          capital,
            saldo_nuevo:      parseFloat(cuenta.saldo_pendiente) || 0,
            saldo_actual:     parseFloat(cuenta.saldo_pendiente) || 0,
            realizado_por:    'Sistema',
            fecha:            new Date().toISOString(),
        };

        generarFactura(datosFactura);
        document.getElementById('modalFacturaPago').style.display = 'flex';

    } catch (e) {
        console.error('Error al obtener detalle:', e);
        mostrarToast('Error al cargar el recibo: ' + e.message, 'error');
    }
}


// ================================================================
//  MODAL FACTURA
// ================================================================
function cerrarModalFactura() {
    document.getElementById('modalFacturaPago').style.display = 'none';
}

function imprimirFactura() {
    const contenido = document.getElementById('facturaParaImprimir');
    if (!contenido) return;
    const estilos = document.querySelector('style')?.innerHTML || '';
    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <html><head>
            <title>Recibo de Pago - Autos Colín</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>body{font-family:'Courier New',monospace;margin:0;padding:20px;}${estilos}</style>
        </head><body>
            ${contenido.outerHTML}
            <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
        </body></html>`);
    ventana.document.close();
}

// ================================================================
//  GENERAR HTML DE FACTURA
// ================================================================
function generarFactura(d) {
    const html = `
        <div class="factura-container" id="facturaParaImprimir">
            <div class="factura-header">
                <img src="/img/icon-192.png" alt="Logo Autos Colín" onerror="this.style.display='none'">
                <h1>AUTOS COLÍN</h1>
                <h3>AUTOS COLÍN S.R.L</h3>
                <div class="factura-empresa">
                    <strong>Cédula Jurídica:</strong> 3-101-722004<br>
                    <strong>Teléfonos:</strong> 8707-8363 / 2572-1170<br>
                    <strong>Dirección:</strong> 200 Sur entrada principal Parque Industrial
                </div>
            </div>

            <div class="factura-info">
                <div class="factura-info-left">
                    <strong>N° RECIBO:</strong> ${d.numero_recibo}<br>
                    <strong>FECHA:</strong> ${formatFecha(d.fecha)}<br>
                    <strong>HORA:</strong> ${new Date().toLocaleTimeString('es-CR')}
                </div>
                <div class="factura-info-right">
                    <strong>PLAN VENTA:</strong> ${d.plan_venta}<br>
                    <strong>CUOTA N°:</strong> ${d.numero_cuota}<br>
                    <strong>CAJERO:</strong> ${d.realizado_por}
                </div>
            </div>

            <div class="factura-cliente">
                <strong>CLIENTE:</strong> ${d.cliente}<br>
                <strong>CÉDULA:</strong> ${d.cedula}
            </div>

            <table class="factura-detalle">
                <thead>
                    <tr><th>DESCRIPCIÓN</th><th style="text-align:right;">MONTO</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Pago de Cuota #${d.numero_cuota} — ${d.vehiculo}</td>
                        <td style="text-align:right;">${formatoNumero(d.monto_pagado)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="factura-monto-letras">
                SON: ${numeroALetras(d.monto_pagado)}
            </div>

            <table class="factura-tabla-intereses">
                <tr>
                    <td class="label">SALDO ANTERIOR:</td>
                    <td style="text-align:right;">${formatoNumero(d.saldo_anterior)}</td>
                    <td class="label">INTERÉS NOMINAL:</td>
                    <td style="text-align:right;">${d.interes_nominal}%</td>
                </tr>
                <tr>
                    <td class="label">CAPITAL:</td>
                    <td style="text-align:right;">${formatoNumero(d.capital || 0)}</td>
                    <td class="label">INTERÉS MORATORIO:</td>
                    <td style="text-align:right;">${d.interes_moratorio}%</td>
                </tr>
                <tr>
                    <td class="label">PAGO A INTERESES:</td>
                    <td style="text-align:right;">${formatoNumero(d.pago_intereses)}</td>
                    <td class="label">INTERÉS ADICIONAL:</td>
                    <td style="text-align:right;">${d.interes_adicional}%</td>
                </tr>
                <tr>
                    <td class="label">AMORTIZACIÓN:</td>
                    <td style="text-align:right;">${formatoNumero(d.amortizacion)}</td>
                    <td class="label"></td>
                    <td style="text-align:right;"></td>
                </tr>
                <tr>
                    <td class="label">SALDO NUEVO:</td>
                    <td style="text-align:right;">${formatoNumero(d.saldo_nuevo)}</td>
                    <td class="label">SALDO ACTUAL:</td>
                    <td style="text-align:right;">${formatoNumero(d.saldo_actual)}</td>
                </tr>
            </table>

            <div class="factura-firma">
                <div class="linea-firma"></div>
                <p>FIRMA AUTORIZADA</p>
                <p>${d.realizado_por}</p>
            </div>

            <div class="factura-gracias">¡GRACIAS POR PREFERIRNOS!</div>
        </div>`;

    const body = document.getElementById('facturaPagoBody');
    if (body) body.innerHTML = html;
}

// ================================================================
//  EXPORTAR CSV
// ================================================================
function exportarReporte() {
    if (!cuentasPorCobrar.length) { mostrarToast('No hay datos para exportar', 'warning'); return; }

    let csv = "Plan,Cliente,Vehículo,Cuota,Fecha Vencimiento,Monto Cuota,Saldo Pendiente,Estado\n";
    cuentasPorCobrar.forEach(c => {
        csv += [
            c.plan_venta    || c.CODIGO_VENTA    || '',
            `"${c.cliente   || c.NOMBRE_COMPLETO || ''}"`,
            c.vehiculo      || c.VEHICULO        || '',
            c.numero_cuota  || c.NUMERO_CUOTA    || '',
            c.fecha_vencimiento|| c.FECHA_VENCIMIENTO|| '',
            c.monto_cuota   || c.MONTO_CUOTA     || 0,
            c.saldo_pendiente|| c.SALDO_PENDIENTE || 0,
            c.estado        || '',
        ].join(',') + '\n';
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `cuentas_cobrar_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('CSV exportado correctamente', 'success');
}

// ================================================================
//  NÚMERO A LETRAS
// ================================================================
function numeroALetras(numero) {
    const unidades  = ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE'];
    const especiales= ['DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
    const decenas   = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
    const centenas  = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];

    if (numero === 0) return 'CERO';

    let entero  = Math.floor(numero);
    let decimal = Math.round((numero - entero) * 100);
    const decStr = decimal < 10 ? '0' + decimal : String(decimal);

    function grupo(n) {
        if (n === 0) return '';
        if (n === 100) return 'CIEN ';
        let r = '';
        if (n >= 100) { r += centenas[Math.floor(n/100)] + ' '; n %= 100; }
        if (n >= 10 && n <= 19) { r += especiales[n-10] + ' '; }
        else {
            if (n >= 10) { r += decenas[Math.floor(n/10)] + ' '; n %= 10; }
            if (n > 0)   { r += unidades[n] + ' '; }
        }
        return r;
    }

    let r = '';
    if (entero >= 1000000) {
        const m = Math.floor(entero / 1000000);
        r += m === 1 ? 'UN MILLÓN ' : grupo(m) + 'MILLONES ';
        entero %= 1000000;
    }
    if (entero >= 1000) {
        const m = Math.floor(entero / 1000);
        r += m === 1 ? 'MIL ' : grupo(m) + 'MIL ';
        entero %= 1000;
    }
    if (entero > 0) r += grupo(entero);

    return r.trim() + ' CON ' + decStr + '/100 COLONES';
}

// ================================================================
//  INICIALIZACIÓN
// ================================================================
document.addEventListener('DOMContentLoaded', function () {
    cargarCuentasPorCobrar();

    // Menú móvil
    const menuToggle = document.getElementById('menuToggle');
    const sidebar    = document.getElementById('sidebar');
    const overlay    = document.getElementById('overlay');

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // Cerrar modales con Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { cerrarModalPago(); cerrarModalFactura(); }
    });

    // Cerrar al hacer clic fuera del modal
    ['modalPagoCuota','modalFacturaPago'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', e => { if (e.target === el) el.style.display = 'none'; });
    });

    // Buscar al presionar Enter en filtros
    ['filtroPlan','filtroCliente'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => {
            if (e.key === 'Enter') aplicarFiltros();
        });
    });
    document.getElementById('filtroEstado')?.addEventListener('change', aplicarFiltros);
});