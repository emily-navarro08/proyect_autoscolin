// ================================================================
//  CUENTAS POR COBRAR — funcion_cuentaxcobrar.js
//  Integración completa con API REST
// ================================================================

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

// ================================================================
//  UTILIDADES
// ================================================================

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

// ================================================================
//  CALCULAR DÍAS DE ATRASO Y ESTADO
// ================================================================
function calcularEstado(cuenta) {
    if (cuenta.estado === 'pagado') return { clase: 'estado-pagado', texto: 'Pagado', dias: 0 };

    const hoy  = new Date();
    const vence = new Date(cuenta.fecha_vencimiento + 'T12:00:00');
    const diff  = Math.ceil((hoy - vence) / (1000 * 60 * 60 * 24));

    if (diff > 30) return { clase: 'estado-atrasado', texto: 'Atrasado', dias: diff };
    if (diff > 0)  return { clase: 'estado-atrasado', texto: 'Atrasado', dias: diff };
    return { clase: 'estado-pendiente', texto: 'Pendiente', dias: 0 };
}

// ================================================================
//  CARGA DE DATOS DESDE API
// ================================================================
async function cargarCuentasPorCobrar() {
    const tbody = document.getElementById('tablaCuentasCuerpo');
    const icono = document.getElementById('icono-recargar');

    tbody.innerHTML = `<tr class="loading-row"><td colspan="10"><span class="spinner-inline"></span> Cargando cuentas...</td></tr>`;
    if (icono) icono.style.animation = 'spin .7s linear infinite';

    try {
        // Leer filtros actuales para pasarlos como query params
        const plan     = document.getElementById('filtroPlan')?.value.trim()   || '';
        const cliente  = document.getElementById('filtroCliente')?.value.trim() || '';
        const estado   = document.getElementById('filtroEstado')?.value         || '';

        const params = new URLSearchParams();
        if (plan)    params.append('plan_venta', plan);
        if (cliente) params.append('cliente', cliente);
        if (estado)  params.append('estado', estado);

        const url = `${API_CXC.cuentas}?${params.toString()}`;
        cuentasPorCobrar = await apiFetch(url);

        renderizarTabla(cuentasPorCobrar);
    } catch (e) {
        console.error('Error cargando cuentas:', e);
        mostrarToast('Error al cargar cuentas: ' + e.message, 'error');
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:#e74c3c;">
            <i class="fas fa-exclamation-triangle"></i> No se pudieron cargar los datos. Verifique la conexión al servidor.
        </td></tr>`;
    } finally {
        if (icono) icono.style.animation = '';
    }
}

// ================================================================
//  RENDERIZAR TABLA
// ================================================================
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

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cuenta.plan_venta || cuenta.CODIGO_VENTA || '-'}</td>
            <td>${cuenta.cliente    || cuenta.NOMBRE_COMPLETO || '-'}</td>
            <td>${cuenta.vehiculo   || cuenta.VEHICULO || '-'}</td>
            <td style="text-align:center;">${cuenta.numero_cuota || cuenta.NUMERO_CUOTA || '-'}</td>
            <td style="text-align:center;">${formatFecha(cuenta.fecha_vencimiento || cuenta.FECHA_VENCIMIENTO)}</td>
            <td style="text-align:right;">${formatoNumero(cuenta.monto_cuota     || cuenta.MONTO_CUOTA     || 0)}</td>
            <td style="text-align:right;">${formatoNumero(cuenta.saldo_pendiente || cuenta.SALDO_PENDIENTE || 0)}</td>
            <td style="text-align:center;">${dias > 0 ? dias : '-'}</td>
            <td style="text-align:center;"><span class="${clase}">${texto}</span></td>
            <td style="text-align:center;">
                ${cuenta.estado !== 'pagado' && (cuenta.ESTADO || '').toLowerCase() !== 'pagado'
                    ? `<button class="btn-cobrar" onclick="abrirModalPago(${cuenta.id || cuenta.ID_ANTICIPO || cuenta.id_cuenta})">
                           <i class="fas fa-dollar-sign"></i> Cobrar
                       </button>`
                    : `<button class="btn-ver-detalle" onclick="verDetallePago(${cuenta.id || cuenta.ID_ANTICIPO || cuenta.id_cuenta})">
                           <i class="fas fa-eye"></i> Ver
                       </button>`
                }
            </td>`;
        tbody.appendChild(tr);
    });
}

function formatFecha(f) {
    if (!f) return '-';
    const d = new Date(f + (f.includes('T') ? '' : 'T12:00:00'));
    return d.toLocaleDateString('es-CR');
}

// ================================================================
//  FILTROS
// ================================================================
function aplicarFiltros() {
    // Si el servidor soporta filtros por query params, recargamos con ellos
    cargarCuentasPorCobrar();
}

function limpiarFiltros() {
    document.getElementById('filtroPlan').value    = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroEstado').value  = '';
    cargarCuentasPorCobrar();
}

// ================================================================
//  MODAL DE PAGO
// ================================================================
function abrirModalPago(cuentaId) {
    // Buscar la cuenta en el array local (ya cargado desde API)
    cuentaSeleccionada = cuentasPorCobrar.find(c =>
        (c.id || c.ID_ANTICIPO || c.id_cuenta) == cuentaId
    );
    if (!cuentaSeleccionada) return;

    const montoCuota    = cuentaSeleccionada.monto_cuota    || cuentaSeleccionada.MONTO_CUOTA    || 0;
    const saldoPendiente= cuentaSeleccionada.saldo_pendiente|| cuentaSeleccionada.SALDO_PENDIENTE|| 0;
    const planVenta     = cuentaSeleccionada.plan_venta     || cuentaSeleccionada.CODIGO_VENTA   || '-';
    const cliente       = cuentaSeleccionada.cliente        || cuentaSeleccionada.NOMBRE_COMPLETO|| '-';
    const numCuota      = cuentaSeleccionada.numero_cuota   || cuentaSeleccionada.NUMERO_CUOTA   || '-';
    const fecVenc       = formatFecha(cuentaSeleccionada.fecha_vencimiento || cuentaSeleccionada.FECHA_VENCIMIENTO);

    document.getElementById('detalleCuotaPago').innerHTML = `
        <strong>Plan:</strong> ${planVenta}&nbsp;&nbsp;
        <strong>Cliente:</strong> ${cliente}<br>
        <strong>Cuota #${numCuota}</strong>&nbsp;&nbsp;
        <strong>Monto:</strong> ${formatoNumero(montoCuota)}&nbsp;&nbsp;
        <strong>Vence:</strong> ${fecVenc}
    `;

    document.getElementById('pagoMonto').value       = Math.round(saldoPendiente);
    document.getElementById('pagoFecha').value       = new Date().toISOString().split('T')[0];
    document.getElementById('pagoDocumento').value   = '';
    document.getElementById('pagoRealizadoPor').value= '';
    document.getElementById('pagoForma').value       = 'Efectivo';

    document.getElementById('modalPagoCuota').style.display = 'flex';
}

function cerrarModalPago() {
    document.getElementById('modalPagoCuota').style.display = 'none';
    cuentaSeleccionada = null;
}

// ================================================================
//  PROCESAR PAGO → API  →  RECIBO
// ================================================================
async function procesarPagoCuota() {
    if (!cuentaSeleccionada) return;

    const formaPago    = document.getElementById('pagoForma').value;
    const documento    = document.getElementById('pagoDocumento').value.trim();
    const monto        = parseFloat(document.getElementById('pagoMonto').value);
    const fechaPago    = document.getElementById('pagoFecha').value;
    const realizadoPor = document.getElementById('pagoRealizadoPor').value.trim();

    if (!formaPago || !documento || !monto || !fechaPago || !realizadoPor) {
        mostrarToast('Complete todos los campos', 'warning'); return;
    }
    if (monto <= 0) {
        mostrarToast('El monto debe ser mayor a cero', 'warning'); return;
    }

    const saldoPendiente = cuentaSeleccionada.saldo_pendiente || cuentaSeleccionada.SALDO_PENDIENTE || 0;
    if (monto > saldoPendiente) {
        mostrarToast('El monto no puede superar el saldo pendiente', 'warning'); return;
    }

    const numeroRecibo = generarNumeroRecibo();

    // Payload para la API
    const payload = {
        id_cuenta:      cuentaSeleccionada.id || cuentaSeleccionada.id_cuenta,
        id_anticipo:    cuentaSeleccionada.ID_ANTICIPO || cuentaSeleccionada.id_anticipo || null,
        id_venta:       cuentaSeleccionada.id_venta    || cuentaSeleccionada.ID_VENTA    || null,
        numero_cuota:   cuentaSeleccionada.numero_cuota|| cuentaSeleccionada.NUMERO_CUOTA,
        numero_recibo:  numeroRecibo,
        forma_pago:     formaPago,
        num_documento:  documento,
        monto_colones:  Math.round(monto),
        tipo_cambio:    1,
        monto_dolares:  0,
        realizado_por:  realizadoPor,
        fecha_pago:     fechaPago,
        saldo_pendiente: Math.round(saldoPendiente - monto),
    };

    // Datos extra para la factura (calculados aquí)
    const tasaMensual    = parseFloat(cuentaSeleccionada.interes_nominal || cuentaSeleccionada.INTERES_NOMINAL || 0) / 100;
    const montoCuota     = cuentaSeleccionada.monto_cuota || cuentaSeleccionada.MONTO_CUOTA || monto;
    const pagoIntereses  = Math.round(saldoPendiente * tasaMensual);
    const amortizacion   = Math.round(monto - pagoIntereses);
    const saldoNuevo     = Math.round(saldoPendiente - monto);

    try {
        // Llamada a la API para guardar el pago
        await apiFetch(API_CXC.pago, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        mostrarToast('Pago registrado exitosamente', 'success');

        // Armar datos para la factura
        const datosFactura = {
            numero_recibo:    numeroRecibo,
            plan_venta:       cuentaSeleccionada.plan_venta  || cuentaSeleccionada.CODIGO_VENTA || '-',
            numero_cuota:     cuentaSeleccionada.numero_cuota|| cuentaSeleccionada.NUMERO_CUOTA || '-',
            cliente:          cuentaSeleccionada.cliente     || cuentaSeleccionada.NOMBRE_COMPLETO || '-',
            cedula:           cuentaSeleccionada.cedula      || cuentaSeleccionada.IDENTIFICACION || '-',
            telefono:         cuentaSeleccionada.telefono    || cuentaSeleccionada.TELEFONO_PRINCIPAL || 'N/A',
            direccion:        cuentaSeleccionada.direccion   || cuentaSeleccionada.DIRECCION || 'N/A',
            vehiculo:         cuentaSeleccionada.vehiculo    || cuentaSeleccionada.VEHICULO || '-',
            monto_pagado:     monto,
            saldo_anterior:   saldoPendiente,
            interes_nominal:  cuentaSeleccionada.interes_nominal  || cuentaSeleccionada.INTERES_NOMINAL  || '0.00',
            interes_moratorio:cuentaSeleccionada.interes_moratorio|| cuentaSeleccionada.INTERES_MORATORIO|| '0.00',
            interes_adicional:'0.00',
            pago_intereses:   pagoIntereses,
            amortizacion:     amortizacion,
            saldo_nuevo:      saldoNuevo,
            saldo_actual:     saldoNuevo,
            realizado_por:    realizadoPor,
            fecha:            fechaPago,
        };

        generarFactura(datosFactura);
        cerrarModalPago();
        document.getElementById('modalFacturaPago').style.display = 'flex';

        // Recargar tabla con datos frescos de la API
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
    const cuenta = cuentasPorCobrar.find(c =>
        (c.id || c.ID_ANTICIPO || c.id_cuenta) == cuentaId
    );
    if (!cuenta) return;

    try {
        // Buscar anticipo asociado a esta cuenta/cuota en la API
        const idVenta   = cuenta.id_venta   || cuenta.ID_VENTA;
        const numCuota  = cuenta.numero_cuota|| cuenta.NUMERO_CUOTA;
        const anticipos = await apiFetch(`${API_CXC.anticipos}?id_venta=${idVenta}`);

        // Buscar el anticipo que corresponde a esta cuota por número de documento o número de cuota
        const anticipo = anticipos.find(a =>
            (a.NUM_DOCUMENTO || a.num_documento || '').includes(`CUOTA-${numCuota}`) ||
            (a.cuota_numero) == numCuota
        ) || anticipos[anticipos.length - 1]; // fallback: el más reciente

        if (!anticipo) {
            mostrarToast('No se encontró el recibo asociado a este pago', 'warning');
            return;
        }

        const montoPagado   = anticipo.MONTO_COLONES || anticipo.monto_colones || 0;
        const saldoPendiente= cuenta.saldo_pendiente || cuenta.SALDO_PENDIENTE || 0;
        const montoCuota    = cuenta.monto_cuota     || cuenta.MONTO_CUOTA     || 0;
        const tasaMensual   = parseFloat(cuenta.interes_nominal || cuenta.INTERES_NOMINAL || 0) / 100;
        const pagoIntereses = Math.round(montoPagado * tasaMensual);

        const datosFactura = {
            numero_recibo:    anticipo.NUM_DOCUMENTO || anticipo.numero_recibo || 'N/D',
            plan_venta:       cuenta.plan_venta     || cuenta.CODIGO_VENTA    || '-',
            numero_cuota:     numCuota,
            cliente:          cuenta.cliente        || cuenta.NOMBRE_COMPLETO || '-',
            cedula:           cuenta.cedula         || cuenta.IDENTIFICACION  || '-',
            telefono:         cuenta.telefono       || cuenta.TELEFONO_PRINCIPAL || 'N/A',
            direccion:        cuenta.direccion      || cuenta.DIRECCION       || 'N/A',
            vehiculo:         cuenta.vehiculo       || cuenta.VEHICULO        || '-',
            monto_pagado:     montoPagado,
            saldo_anterior:   montoCuota,
            interes_nominal:  cuenta.interes_nominal  || cuenta.INTERES_NOMINAL  || '0.00',
            interes_moratorio:cuenta.interes_moratorio|| cuenta.INTERES_MORATORIO|| '0.00',
            interes_adicional:'0.00',
            pago_intereses:   pagoIntereses,
            amortizacion:     Math.round(montoPagado - pagoIntereses),
            saldo_nuevo:      saldoPendiente,
            saldo_actual:     saldoPendiente,
            realizado_por:    anticipo.REALIZADO_POR || anticipo.realizado_por || '-',
            fecha:            anticipo.FECHA_ANTICIPO|| anticipo.fecha || '',
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
                    <td class="label">PAGO A INTERESES:</td>
                    <td style="text-align:right;">${formatoNumero(d.pago_intereses)}</td>
                    <td class="label">INTERÉS MORATORIO:</td>
                    <td style="text-align:right;">${d.interes_moratorio}%</td>
                </tr>
                <tr>
                    <td class="label">AMORTIZACIÓN:</td>
                    <td style="text-align:right;">${formatoNumero(d.amortizacion)}</td>
                    <td class="label">INTERÉS ADICIONAL:</td>
                    <td style="text-align:right;">${d.interes_adicional || '0.00'}%</td>
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