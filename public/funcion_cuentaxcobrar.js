// URLs base de las APIs
const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
        return `${protocol}//${hostname}/api`;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    return '/api';
})();

const API_CXC = {
    cuentas:      `${API_BASE_URL}/cuentas-cobrar`,
    anticipos:    `${API_BASE_URL}/anticipos`,
    detallePagos: `${API_BASE_URL}/detalle-pagos`,
};

let cuentasPorCobrar   = [];
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

function formatFecha(f) {
    if (!f) return '-';
    try {
        const parte = typeof f === 'string' && f.includes('T') ? f.split('T')[0] : String(f);
        const [year, month, day] = parte.split('-');
        if (!year || !month || !day) return '-';
        return `${day}/${month}/${year}`;
    } catch { return '-'; }
}

function mostrarToast(msg, tipo = 'info') {
    const t = document.createElement('div');
    t.className = `toast-notif ${tipo}`;
    const iconos = { success:'check-circle', error:'times-circle', warning:'exclamation-triangle', info:'info-circle' };
    t.innerHTML = `<i class="fas fa-${iconos[tipo] || 'info-circle'}"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

async function apiFetch(url, opciones = {}) {
    const resp = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...opciones,
        headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) }
    });
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(err.error || `Error ${resp.status}`);
    }
    return resp.json();
}

function generarNumeroRecibo() {
    const d   = new Date();
    const aa  = d.getFullYear().toString().slice(-2);
    const mm  = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd  = d.getDate().toString().padStart(2, '0');
    const rnd = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RCP-${aa}${mm}${dd}-${rnd}`;
}

// ================================================================
//  CALCULAR ESTADO
//  diffDays > 0  → HOY es DESPUÉS del vencimiento  → ATRASADO
//  diffDays <= 0 → HOY es ANTES o igual             → PENDIENTE
// ================================================================
function calcularEstado(cuenta) {
    if (cuenta.estado === 'pagado') {
        return { clase: 'estado-pagado', texto: 'Pagado', dias: 0 };
    }

    const fechaStr = cuenta.fecha_vencimiento;
    if (!fechaStr) return { clase: 'estado-pendiente', texto: 'Pendiente', dias: 0 };

    try {
        const parte = typeof fechaStr === 'string' && fechaStr.includes('T')
            ? fechaStr.split('T')[0] : fechaStr;
        const [year, month, day] = parte.split('-').map(Number);

        const venc = new Date(year, month - 1, day);
        venc.setHours(0, 0, 0, 0);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // diffDays POSITIVO = hoy es POSTERIOR al vencimiento
        const diffDays = Math.floor((hoy - venc) / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            return { clase: 'estado-atrasado', texto: 'Atrasado', dias: diffDays };
        }
        return { clase: 'estado-pendiente', texto: 'Pendiente', dias: 0 };
    } catch {
        return { clase: 'estado-pendiente', texto: 'Pendiente', dias: 0 };
    }
}

// ================================================================
//  CARGA DE DATOS
// ================================================================
async function cargarCuentasPorCobrar() {
    const tbody = document.getElementById('tablaCuentasCuerpo');
    tbody.innerHTML = `<tr class="loading-row"><td colspan="10">
        <span class="spinner-inline"></span> Cargando cuentas...
    </td></tr>`;

    try {
        const plan    = document.getElementById('filtroPlan')?.value.trim()    || '';
        const cliente = document.getElementById('filtroCliente')?.value.trim() || '';
        const estado  = document.getElementById('filtroEstado')?.value          || '';

        const params = new URLSearchParams();
        if (plan)    params.append('plan_venta', plan);
        if (cliente) params.append('cliente', cliente);
        if (estado)  params.append('estado', estado);

        cuentasPorCobrar = await apiFetch(`${API_CXC.cuentas}?${params.toString()}`);
        renderizarTabla(cuentasPorCobrar);

    } catch (e) {
        console.error('Error cargando cuentas:', e);
        mostrarToast('Error al cargar cuentas: ' + e.message, 'error');
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:#e74c3c;">
            <i class="fas fa-exclamation-triangle"></i> No se pudieron cargar los datos.
        </td></tr>`;
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
        const estaPagado = cuenta.estado === 'pagado';

        // Badge que distingue CONTADO vs CRÉDITO
        const tipoBadge = cuenta.tipo_registro === 'detalle_pago'
            ? `<span class="badge-contado">CONTADO</span>`
            : `<span class="badge-credito">CRÉDITO</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cuenta.plan_venta || '-'} ${tipoBadge}</td>
            <td>
                <div style="font-weight:600;">${cuenta.cliente || '-'}</div>
                <div style="font-size:11px;color:#7f8c8d;">${cuenta.cedula || ''}</div>
                ${cuenta.telefono ? `<div style="font-size:11px;color:#7f8c8d;"><i class="fas fa-phone" style="font-size:10px;"></i> ${cuenta.telefono}</div>` : ''}
            </td>
            <td>
                <div>${cuenta.vehiculo || '-'}</div>
                ${cuenta.placa ? `<div style="font-size:11px;color:#7f8c8d;">Placa: ${cuenta.placa}</div>` : ''}
            </td>
            <td style="text-align:center;">${cuenta.numero_cuota || '-'}</td>
            <td style="text-align:center;">${formatFecha(cuenta.fecha_vencimiento)}</td>
            <td style="text-align:right;">${formatoNumero(cuenta.monto_cuota || 0)}</td>
            <td style="text-align:right;">${formatoNumero(cuenta.saldo_pendiente || 0)}</td>
            <td style="text-align:center;">${dias > 0 ? `<span style="color:#e74c3c;font-weight:700;">${dias}</span>` : '-'}</td>
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

// ================================================================
//  FILTROS
// ================================================================
function aplicarFiltros() { cargarCuentasPorCobrar(); }

function limpiarFiltros() {
    document.getElementById('filtroPlan').value    = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroEstado').value  = '';
    cargarCuentasPorCobrar();
}

// ================================================================
//  ABRIR MODAL DE PAGO  — todos los datos vienen del objeto cuenta
// ================================================================
function abrirModalPago(cuentaId) {
    cuentaSeleccionada = cuentasPorCobrar.find(c => c.id == cuentaId);
    if (!cuentaSeleccionada) {
        mostrarToast('No se encontró la cuenta seleccionada', 'error');
        return;
    }

    // ── Datos básicos ───────────────────────────────────────────────
    const planVenta      = cuentaSeleccionada.plan_venta      || '-';
    const cliente        = cuentaSeleccionada.cliente         || '-';
    const cedula         = cuentaSeleccionada.cedula          || '-';
    const telefono       = cuentaSeleccionada.telefono        || 'N/A';
    const vehiculo       = cuentaSeleccionada.vehiculo        || '-';
    const placa          = cuentaSeleccionada.placa           || '-';
    const numeroCuota    = cuentaSeleccionada.numero_cuota    || '1';
    const montoCuota     = parseFloat(cuentaSeleccionada.monto_cuota)     || 0;
    const saldoPendiente = parseFloat(cuentaSeleccionada.saldo_pendiente) || montoCuota;
    const tipoReg        = cuentaSeleccionada.tipo_registro   || 'anticipo';
    const observaciones  = cuentaSeleccionada.observaciones   || '';

    // ── Desglose Capital / Intereses ────────────────────────────────
    let pagoIntereses = 0;
    let capital       = 0;
    let amortizacion  = 0;

    if (tipoReg === 'anticipo' && observaciones) {
        // Formato: "Capital: ₡ 4.762,00 | Intereses: ₡ 1.000,00"
        const capMatch = observaciones.match(/Capital:\s*[₡]?\s*([\d.,]+)/);
        const intMatch = observaciones.match(/Intereses:\s*[₡]?\s*([\d.,]+)/);
        if (capMatch) capital       = parseFloat(capMatch[1].replace(/\./g, '').replace(',', '.'));
        if (intMatch) pagoIntereses = parseFloat(intMatch[1].replace(/\./g, '').replace(',', '.'));
        amortizacion = Math.round(montoCuota - pagoIntereses);
    } else {
        // Contado: todo es capital
        capital      = saldoPendiente;
        amortizacion = saldoPendiente;
    }

    // Guardar en cuenta seleccionada para usar al procesar
    cuentaSeleccionada._pagoIntereses = pagoIntereses;
    cuentaSeleccionada._amortizacion  = amortizacion;
    cuentaSeleccionada._capital       = capital;

    // ── Etiqueta de tipo ────────────────────────────────────────────
    const tipoLabel = tipoReg === 'detalle_pago'
        ? `<span class="badge-contado">PAGO CONTADO</span>`
        : `<span class="badge-credito">CUOTA CRÉDITO</span>`;

    // ── HTML del detalle ────────────────────────────────────────────
    document.getElementById('detalleCuotaPago').innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;
                    background:white;padding:15px;border-radius:8px;font-size:13px;">
            <div><strong>Plan:</strong> ${planVenta} ${tipoLabel}</div>
            <div><strong>Cliente:</strong> ${cliente}</div>
            <div><strong>Cédula:</strong> ${cedula}</div>
            <div><strong>Teléfono:</strong> ${telefono}</div>
            <div><strong>Vehículo:</strong> ${vehiculo}</div>
            <div><strong>Placa:</strong> ${placa}</div>
            <div><strong>Cuota #:</strong> ${numeroCuota}</div>
            <div><strong>Monto Cuota:</strong> ${formatoNumero(montoCuota)}</div>
            <div><strong>Vence:</strong> ${formatFecha(cuentaSeleccionada.fecha_vencimiento)}</div>
            <div><strong>Saldo Pendiente:</strong> <span style="color:#e74c3c;font-weight:700;">${formatoNumero(saldoPendiente)}</span></div>
            <div><strong>Capital:</strong> ${formatoNumero(capital)}</div>
            <div><strong>Intereses:</strong> ${formatoNumero(pagoIntereses)}</div>
        </div>`;

    // ── Valores por defecto del formulario ──────────────────────────
    document.getElementById('pagoMonto').value        = Math.round(saldoPendiente);
    document.getElementById('pagoFecha').value        = new Date().toISOString().split('T')[0];
    document.getElementById('pagoDocumento').value    = '';
    document.getElementById('pagoRealizadoPor').value = '';
    document.getElementById('pagoForma').value        = 'Efectivo';
    document.getElementById('efectivo').value         = '0.00';
    document.getElementById('transferencia').value    = '0.00';
    document.getElementById('num_transferencia').value= '';
    document.getElementById('nom_deposita').value     = '';
    document.getElementById('banco').value            = '';
    document.getElementById('tarjeta').value          = '0.00';
    document.getElementById('num_tarjeta').value      = '';
    document.getElementById('tipo_tarjeta').value     = '';

    document.getElementById('modalPagoCuota').style.display = 'flex';
}

function cerrarModalPago() {
    document.getElementById('modalPagoCuota').style.display = 'none';
    cuentaSeleccionada = null;
}

// ================================================================
//  PROCESAR PAGO
// ================================================================
async function procesarPagoCuota() {
    if (!cuentaSeleccionada) return;

    const formaPago    = document.getElementById('pagoForma').value;
    const documento    = document.getElementById('pagoDocumento').value.trim();
    const monto        = parseFloat(document.getElementById('pagoMonto').value);
    const fechaPago    = document.getElementById('pagoFecha').value;
    const realizadoPor = document.getElementById('pagoRealizadoPor').value.trim();

    if (!formaPago || !documento || !monto || !fechaPago || !realizadoPor) {
        mostrarToast('Complete todos los campos obligatorios', 'warning'); return;
    }
    if (monto <= 0) {
        mostrarToast('El monto debe ser mayor a cero', 'warning'); return;
    }

    const saldoPendiente = parseFloat(cuentaSeleccionada.saldo_pendiente || cuentaSeleccionada.monto_cuota || 0);
    const numeroRecibo   = generarNumeroRecibo();
    const tipoReg        = cuentaSeleccionada.tipo_registro || 'anticipo';

    try {
        if (tipoReg === 'detalle_pago') {
            // ── Pago de contado ──────────────────────────────────────────
            await apiFetch(`${API_CXC.detallePagos}/${cuentaSeleccionada.id}/pagar`, {
                method: 'PUT',
                body: JSON.stringify({
                    estado_pago:   'COMPLETADO',
                    fecha_pago:    fechaPago,
                    realizado_por: realizadoPor,
                    num_documento: documento
                })
            });
        } else {
            // ── Cuota de crédito ─────────────────────────────────────────
            const nuevaObs = cuentaSeleccionada.observaciones ||
                `Cuota ${cuentaSeleccionada.numero_cuota} | Pagado: ${fechaPago} | Recibo: ${numeroRecibo}`;

            await apiFetch(`${API_CXC.anticipos}/${cuentaSeleccionada.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    forma_pago:      formaPago,
                    num_documento:   documento,
                    monto_colones:   Math.round(monto),
                    monto_dolares:   0,
                    moneda:          'CRC',
                    tipo_cambio:     1,
                    realizado_por:   realizadoPor,
                    fecha_anticipo:  fechaPago,
                    saldo_pendiente: Math.round(Math.max(0, saldoPendiente - monto)),
                    observaciones:   nuevaObs,
                    estado_anticipo: (saldoPendiente - monto) <= 0 ? 'COMPLETADO' : 'PARCIAL'
                })
            });
        }

        mostrarToast('Pago registrado exitosamente', 'success');

        generarFactura({
            numero_recibo:     numeroRecibo,
            plan_venta:        cuentaSeleccionada.plan_venta        || '-',
            numero_cuota:      cuentaSeleccionada.numero_cuota      || '1',
            tipo_pago:         tipoReg === 'detalle_pago' ? 'CONTADO' : 'CRÉDITO',
            cliente:           cuentaSeleccionada.cliente           || '-',
            cedula:            cuentaSeleccionada.cedula            || '-',
            telefono:          cuentaSeleccionada.telefono          || 'N/A',
            vehiculo:          cuentaSeleccionada.vehiculo          || '-',
            placa:             cuentaSeleccionada.placa             || '-',
            monto_pagado:      monto,
            saldo_anterior:    saldoPendiente,
            interes_nominal:   cuentaSeleccionada.interes_nominal   || '0.00',
            interes_moratorio: cuentaSeleccionada.interes_moratorio || '0.00',
            interes_adicional: '0.00',
            pago_intereses:    cuentaSeleccionada._pagoIntereses    || 0,
            amortizacion:      cuentaSeleccionada._amortizacion     || 0,
            capital:           cuentaSeleccionada._capital          || 0,
            saldo_nuevo:       Math.round(Math.max(0, saldoPendiente - monto)),
            saldo_actual:      Math.round(Math.max(0, saldoPendiente - monto)),
            realizado_por:     realizadoPor,
            fecha:             fechaPago,
        });

        cerrarModalPago();
        document.getElementById('modalFacturaPago').style.display = 'flex';
        await cargarCuentasPorCobrar();

    } catch (e) {
        console.error('Error procesando pago:', e);
        mostrarToast('Error al registrar el pago: ' + e.message, 'error');
    }
}

// ================================================================
//  VER DETALLE (pagados)
// ================================================================
function verDetallePago(cuentaId) {
    const cuenta = cuentasPorCobrar.find(c => c.id == cuentaId);
    if (!cuenta) return;

    let pagoIntereses = 0, capital = 0;
    const montoCuota = parseFloat(cuenta.monto_cuota) || 0;

    if (cuenta.tipo_registro === 'anticipo' && cuenta.observaciones) {
        const capMatch = cuenta.observaciones.match(/Capital:\s*[₡]?\s*([\d.,]+)/);
        const intMatch = cuenta.observaciones.match(/Intereses:\s*[₡]?\s*([\d.,]+)/);
        if (capMatch) capital       = parseFloat(capMatch[1].replace(/\./g, '').replace(',', '.'));
        if (intMatch) pagoIntereses = parseFloat(intMatch[1].replace(/\./g, '').replace(',', '.'));
    } else {
        capital = montoCuota;
    }

    generarFactura({
        numero_recibo:     `REC-${cuenta.id}`,
        plan_venta:        cuenta.plan_venta        || '-',
        numero_cuota:      cuenta.numero_cuota      || '-',
        tipo_pago:         cuenta.tipo_registro === 'detalle_pago' ? 'CONTADO' : 'CRÉDITO',
        cliente:           cuenta.cliente           || '-',
        cedula:            cuenta.cedula            || '-',
        telefono:          cuenta.telefono          || 'N/A',
        vehiculo:          cuenta.vehiculo          || '-',
        placa:             cuenta.placa             || '-',
        monto_pagado:      montoCuota,
        saldo_anterior:    parseFloat(cuenta.saldo_pendiente) || 0,
        interes_nominal:   cuenta.interes_nominal   || '0.00',
        interes_moratorio: cuenta.interes_moratorio || '0.00',
        interes_adicional: '0.00',
        pago_intereses:    pagoIntereses,
        amortizacion:      Math.round(montoCuota - pagoIntereses),
        capital:           capital,
        saldo_nuevo:       parseFloat(cuenta.saldo_pendiente) || 0,
        saldo_actual:      parseFloat(cuenta.saldo_pendiente) || 0,
        realizado_por:     'Sistema',
        fecha:             cuenta.fecha_vencimiento || new Date().toISOString(),
    });

    document.getElementById('modalFacturaPago').style.display = 'flex';
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
    const estilos = Array.from(document.querySelectorAll('style')).map(s => s.innerHTML).join('\n');
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
    const tipoBadge = d.tipo_pago === 'CONTADO'
        ? `<span class="badge-contado">CONTADO</span>`
        : `<span class="badge-credito">CRÉDITO</span>`;

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
                    <strong>CUOTA N°:</strong> ${d.numero_cuota} ${tipoBadge}<br>
                    <strong>CAJERO:</strong> ${d.realizado_por}
                </div>
            </div>

            <div class="factura-cliente">
                <strong>CLIENTE:</strong> ${d.cliente}<br>
                <strong>CÉDULA:</strong> ${d.cedula}<br>
                <strong>TELÉFONO:</strong> ${d.telefono}<br>
                <strong>VEHÍCULO:</strong> ${d.vehiculo}
                ${d.placa !== '-' ? ` &nbsp;|&nbsp; <strong>PLACA:</strong> ${d.placa}` : ''}
            </div>

            <table class="factura-detalle">
                <thead>
                    <tr>
                        <th>DESCRIPCIÓN</th>
                        <th style="text-align:right;">MONTO</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Pago de ${d.tipo_pago === 'CONTADO' ? 'Venta de Contado' : `Cuota #${d.numero_cuota}`} — ${d.vehiculo}</td>
                        <td style="text-align:right;">${formatoNumero(d.monto_pagado)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="factura-monto-letras">SON: ${numeroALetras(d.monto_pagado)}</div>

            <table class="factura-tabla-intereses">
                <tr>
                    <td class="label">SALDO ANTERIOR:</td>
                    <td style="text-align:right;">${formatoNumero(d.saldo_anterior)}</td>
                    <td class="label">INTERÉS NOMINAL:</td>
                    <td style="text-align:right;">${d.interes_nominal}%</td>
                </tr>
                <tr>
                    <td class="label">CAPITAL:</td>
                    <td style="text-align:right;">${formatoNumero(d.capital)}</td>
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
                    <td></td>
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
    if (!cuentasPorCobrar.length) {
        mostrarToast('No hay datos para exportar', 'warning'); return;
    }
    let csv = "Tipo,Plan,Cliente,Cédula,Teléfono,Vehículo,Placa,Cuota,Fecha Vencimiento,Monto Cuota,Saldo Pendiente,Estado\n";
    cuentasPorCobrar.forEach(c => {
        csv += [
            c.tipo_registro === 'detalle_pago' ? 'CONTADO' : 'CRÉDITO',
            c.plan_venta    || '',
            `"${c.cliente   || ''}"`,
            c.cedula        || '',
            c.telefono      || '',
            `"${c.vehiculo  || ''}"`,
            c.placa         || '',
            c.numero_cuota  || '',
            c.fecha_vencimiento || '',
            c.monto_cuota   || 0,
            c.saldo_pendiente || 0,
            c.estado        || '',
        ].join(',') + '\n';
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `cuentas_cobrar_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('CSV exportado correctamente', 'success');
}

// ================================================================
//  NÚMERO A LETRAS
// ================================================================
function numeroALetras(numero) {
    const unidades   = ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE'];
    const especiales = ['DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
    const decenas    = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
    const centenas   = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];

    if (numero === 0) return 'CERO';
    let entero  = Math.floor(numero);
    let decimal = Math.round((numero - entero) * 100);
    const decStr = decimal < 10 ? '0' + decimal : String(decimal);

    function grupo(n) {
        if (n === 0) return '';
        if (n === 100) return 'CIEN ';
        let r = '';
        if (n >= 100) { r += centenas[Math.floor(n / 100)] + ' '; n %= 100; }
        if (n >= 10 && n <= 19) { r += especiales[n - 10] + ' '; }
        else {
            if (n >= 10) { r += decenas[Math.floor(n / 10)] + ' '; n %= 10; }
            if (n > 0)   { r += unidades[n] + ' '; }
        }
        return r;
    }

    let r = '';
    if (entero >= 1000000) { const m = Math.floor(entero / 1000000); r += m === 1 ? 'UN MILLÓN ' : grupo(m) + 'MILLONES '; entero %= 1000000; }
    if (entero >= 1000)    { const m = Math.floor(entero / 1000);    r += m === 1 ? 'MIL '       : grupo(m) + 'MIL ';     entero %= 1000; }
    if (entero > 0) r += grupo(entero);
    return r.trim() + ' CON ' + decStr + '/100 COLONES';
}

// ================================================================
//  INICIALIZACIÓN
// ================================================================
document.addEventListener('DOMContentLoaded', function () {
    cargarCuentasPorCobrar();

    const menuToggle = document.getElementById('menuToggle');
    const sidebar    = document.getElementById('sidebar');
    const overlay    = document.getElementById('overlay');
    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); });
        overlay.addEventListener('click', ()   => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { cerrarModalPago(); cerrarModalFactura(); }
    });

    ['modalPagoCuota', 'modalFacturaPago'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', e => { if (e.target === el) el.style.display = 'none'; });
    });

    ['filtroPlan', 'filtroCliente'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') aplicarFiltros(); });
    });
    document.getElementById('filtroEstado')?.addEventListener('change', aplicarFiltros);
});
