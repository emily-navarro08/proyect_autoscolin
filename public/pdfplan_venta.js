// Función auxiliar para verificar espacio en página
function verificarEspacio(doc, yPos, espacioNecesario, margenInferior = 30) {
    if (yPos + espacioNecesario > 280) { // 280 es cerca del final de la página
        doc.addPage();
        return 20; // Reiniciar Y en nueva página
    }
    return yPos;
}

//  FUNCIÓN PARA GENERAR PDF CON DATOS DEL PLAN SELECCIONADO
async function generarPDFPlanVenta() {
    mostrarLoading(true);
    
    try {
        // Verificar que hay un plan seleccionado
        if (!selectedVentaId) {
            mostrarNotificacion('Debe seleccionar un plan de venta primero', 'warning');
            mostrarLoading(false);
            return;
        }

        // Obtener datos actualizados del plan desde la API
        const data = await apiFetch(`${API_ENDPOINTS.ventas}/${selectedVentaId}/completo`);
        
        console.log('Datos del plan para PDF:', data); // Para debugging
        
        // Crear nuevo documento PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Configurar fuente
        doc.setFont('helvetica');
        
        // ===== TÍTULO PRINCIPAL CENTRADO =====
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102); // Azul oscuro
        doc.text('PLAN DE VENTA', 105, 20, { align: 'center' });
        
        // Línea decorativa debajo del título
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.8);
        doc.line(70, 23, 140, 23);
        
        // ===== ENCABEZADO CON ASESOR, APROBADOR, FECHA =====
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Obtener datos de vendedor y aprobador de la API
        const vendedor = data.VENDEDOR || {};
        const aprobador = data.APROBADOR || {};
        const fechaImpresion = new Date().toLocaleDateString('es-CR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).replace(/\//g, '-');
        
        const vendedorNombre = vendedor.NOMBRE_COMPLETO || 'No asignado';
        const aprobadorNombre = aprobador.NOMBRE_COMPLETO ? `${aprobador.NOMBRE_COMPLETO}` : 'No asignado';
        const notario = data.NOMBRE_NOTARIO || 'No asignado';
        
        // Obtener moneda y tipo de cambio de COSTOS
        const costos = data.COSTOS || {};
        const moneda = costos.MONEDA === 'CRC' ? 'COLONES' : 'DÓLARES';
        const tipoCambio = costos.TIPO_CAMBIO_COMPRA || '1.00';
        const codigoVenta = data.CODIGO_VENTA || 'N/A';
        
        const inicioY = 30;

        // Línea 1: Código de Venta y Fecha
        doc.setFont('helvetica', 'bold');
        doc.text(`Código: ${codigoVenta}`, 15, inicioY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha de Impresión: ${fechaImpresion}`, 120, inicioY);
        
        // Línea 2: Asesor de Ventas y Moneda
        doc.setFont('helvetica', 'bold');
        doc.text('Asesor:', 15, inicioY + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(vendedorNombre, 35, inicioY + 5);
        doc.setFont('helvetica', 'bold');
        doc.text('Moneda:', 120, inicioY + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(moneda, 150, inicioY + 5);
        
        // Línea 3: Aprobado por y Tipo de Cambio
        doc.setFont('helvetica', 'bold');
        doc.text('Aprobado:', 15, inicioY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(aprobadorNombre, 35, inicioY + 10);
        doc.setFont('helvetica', 'bold');
        doc.text('T.Cambio:', 120, inicioY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(tipoCambio, 150, inicioY + 10);
        
        // Línea 4: Abogado/Notario
        doc.setFont('helvetica', 'bold');
        doc.text('Notario:', 15, inicioY + 15);
        doc.setFont('helvetica', 'normal');
        doc.text(notario, 35, inicioY + 15);
        
        // Línea separadora gruesa
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(15, inicioY + 18, 195, inicioY + 18);
        
        // ===== 1. DATOS DEL CLIENTE PARA FACTURAR =====
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('1. DATOS DEL CLIENTE PARA FACTURAR', 15, 55);
        doc.setTextColor(0, 0, 0);
        
        // Extraer datos del cliente de facturación desde la API
        const clienteFact = data.CLIENTE_FACTURACION || {};
        const factNombre = clienteFact.NOMBRE_COMPLETO || '';
        const factCodigo = clienteFact.ID_PERSONA || '';
        const factCedula = clienteFact.IDENTIFICACION || '';
        const factTipoCliente = clienteFact.TIPO_DOCUMENTO === 'CEDULA' ? 'Persona Física' : 'Persona Jurídica';
        
        // Obtener estado civil del catálogo (si está disponible)
        let factEstadoCivil = '';
        if (clienteFact.ID_ESTADO_CIVIL && catalogoEstadosCivil.length > 0) {
            const ec = catalogoEstadosCivil.find(e => e.ID_ESTADO_CIVIL === clienteFact.ID_ESTADO_CIVIL);
            factEstadoCivil = ec ? ec.NOMBRE : '';
        }
        
        const factProfesion = clienteFact.OCUPACION || '';
        const factNacionalidad = clienteFact.NACIONALIDAD || '';
        const factMovil = clienteFact.TELEFONO_SECUNDARIO || '';
        const factTelefono = clienteFact.TELEFONO_PRINCIPAL || '';
        const factEmail = clienteFact.EMAIL || '';
        const factDireccion = clienteFact.DIRECCION || '';
        
        // Dibujar tabla de cliente facturar
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        let yPos = 60;
        const col1X = 20;
        const col2X = 50;
        const col3X = 120;
        const col4X = 140;
        
        // Fila 1 - Cliente y Código
        doc.setFont('helvetica', 'bold');
        doc.text('Cliente:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        const yDespuesCliente = textoAjustado(doc, factNombre, col2X, yPos, 35, 5);

        doc.setFont('helvetica', 'bold');
        doc.text('Código:', col3X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(factCodigo.toString(), col4X, yPos);

        yPos = Math.max(yDespuesCliente, yPos) + 6;
        
        // Fila 2 - Cédula y Tipo Cliente
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Cédula:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(factCedula, col2X, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Tipo Cliente:', col3X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(factTipoCliente, col4X, yPos);
        
        // Fila 3 - Estado Civil y Profesión
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Estado Civil:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(factEstadoCivil, col2X, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Profesión:', col3X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(factProfesion, col4X, yPos);
        
        // Fila 4 - Nacionalidad y Móvil
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Nacionalidad:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(factNacionalidad, col2X, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Teléfono 2:', col3X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(factMovil, col4X, yPos);
        
        // Fila 5 - Teléfono y Email
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Teléfono:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(factTelefono, col2X, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Email:', col3X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(factEmail, col4X, yPos);
        
        // Fila 6 - Dirección
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Dirección:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        const nuevoY = textoAjustado(doc, factDireccion, col2X, yPos, 70);
        if (nuevoY > yPos) {
            yPos = nuevoY;
        }
        
        // Línea separadora
        yPos += 6;
        doc.setDrawColor(220, 220, 220);
        doc.line(15, yPos, 195, yPos);
        
        // ===== 2. DATOS DEL CLIENTE PARA INSCRIBIR =====
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('2. DATOS DEL CLIENTE A TRASPASAR', 15, yPos);
        doc.setTextColor(0, 0, 0);
        
        // Extraer datos del cliente de inscripción desde la API
        const clienteIns = data.CLIENTE_INSCRIPCION || {};
        const insNombre = clienteIns.NOMBRE_COMPLETO || '';
        const insCodigo = clienteIns.ID_PERSONA || '';
        const insCedula = clienteIns.IDENTIFICACION || '';
        const insTipoCliente = clienteIns.TIPO_DOCUMENTO === 'CEDULA' ? 'Persona Física' : 'Persona Jurídica';
        
        // Estado civil del cliente de inscripción
        let insEstadoCivil = '';
        if (clienteIns.ID_ESTADO_CIVIL && catalogoEstadosCivil.length > 0) {
            const ec = catalogoEstadosCivil.find(e => e.ID_ESTADO_CIVIL === clienteIns.ID_ESTADO_CIVIL);
            insEstadoCivil = ec ? ec.NOMBRE : '';
        }
        
        const insProfesion = clienteIns.OCUPACION || '';
        const insNacionalidad = clienteIns.NACIONALIDAD || '';
        const insMovil = clienteIns.TELEFONO_SECUNDARIO || '';
        const insTelefono = clienteIns.TELEFONO_PRINCIPAL || '';
        const insEmail = clienteIns.EMAIL || '';
        const insDireccion = clienteIns.DIRECCION || '';
        
        yPos += 6;
        doc.setFontSize(9);
        
        // Fila 1 - Cliente y Código
        doc.setFont('helvetica', 'bold');
        doc.text('Cliente:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        const DespuesCliente = textoAjustado(doc, insNombre, col2X, yPos, 35, 5);

        doc.setFont('helvetica', 'bold');
        doc.text('Código:', col3X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(insCodigo.toString(), col4X, yPos);

        yPos = Math.max(DespuesCliente, yPos) + 6;
        
        // Fila 2 - Cédula y Tipo Cliente
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Cédula:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(insCedula, col2X, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Tipo Cliente:', col3X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(insTipoCliente, col4X, yPos);
        
        // Fila 3 - Estado Civil y Profesión
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Estado Civil:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(insEstadoCivil, col2X, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Profesión:', col3X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(insProfesion, col4X, yPos);
        
        // Fila 4 - Nacionalidad y Móvil
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Nacionalidad:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(insNacionalidad, col2X, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Teléfono 2:', col3X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(insMovil, col4X, yPos);
        
        // Fila 5 - Teléfono y Email
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Teléfono:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(insTelefono, col2X, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Email:', col3X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(insEmail, col4X, yPos);
        
        // Fila 6 - Dirección
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Dirección:', col1X, yPos);
        let insDireccionTexto = insDireccion;
        if (insDireccionTexto.length > 70) {
            insDireccionTexto = insDireccionTexto.substring(0, 67) + '...';
        }
        doc.setFont('helvetica', 'normal');
        doc.text(insDireccionTexto, col2X, yPos);
        
        // Línea separadora
        yPos += 6;
        doc.line(15, yPos, 195, yPos);
        
        // ===== 3. VEHÍCULO VENDIDO =====
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('3. VEHÍCULO VENDIDO', 15, yPos);
        doc.setTextColor(0, 0, 0);
        
        // Datos del vehículo desde la API
        yPos += 6;
        doc.setFontSize(9);
        
        const vehiculo = data.VEHICULO || {};
        
        const placa = vehiculo.PLACA || '';
        const marca = vehiculo.marca_nombre || '';
        const color = vehiculo.color_nombre || '';
        const modelo = vehiculo.MODELO || '';
        const combustible = vehiculo.combustible_nombre || '';
        const cc = vehiculo.C_C || '';
        const cilindros = vehiculo.CILINDROS || '';
        const carroceria = vehiculo.CARROCERIA || '';
        const motor = vehiculo.MOTOR || '';
        const chasis = vehiculo.CHASIS || '';
        
        // Obtener precios de costos
        const precioVenta = costos.PRECIO_PUBLICO || '0.00';
        const montoVenta = costos.PRECIO_PUBLICO || '0.00';
        const montoTraspaso = costos.MONTO_TRASPASO || '0.00';
        
        // Primera fila - Datos principales
        doc.setFont('helvetica', 'bold');
        doc.text('Placa:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(placa, 40, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Marca:', 80, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(marca, 110, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Modelo:', 140, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(modelo.toString(), 165, yPos);
        
        // Segunda fila
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Color:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(color, 40, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Combustible:', 80, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(combustible, 110, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('C.C:', 140, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(cc.toString(), 160, yPos);
        
        // Tercera fila
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Cilindros:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(cilindros.toString(), 40, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Carrocería:', 80, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(carroceria, 110, yPos);
        
        // Cuarta fila
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Motor:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(motor, 40, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Chasis:', 80, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(chasis, 110, yPos);
        
        // Quinta fila - Precios
        yPos += 12;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(15, yPos-2, 195, yPos-2);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('DETALLE DE PRECIOS:', 20, yPos+4);
        doc.setTextColor(0, 0, 0);

        yPos += 10;

        // Precio de Venta
        doc.setFont('helvetica', 'bold');
        doc.text('Precio de Venta:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(precioVenta)}`, 60, yPos);
        yPos += 8;

        // Monto Traspaso
        doc.setFont('helvetica', 'bold');
        doc.text('Monto Traspaso:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(montoTraspaso)}`, 60, yPos);
        yPos += 8;

        // TOTAL VEHÍCULO
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL VEHÍCULO:', 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 102, 0);
        doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(montoVenta)}`, 60, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 12;

        // ===== SECCIÓN PAGADO POR =====
        yPos += 4; // Espacio antes del recuadro

        // Dibujar rectángulo
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.5);
        doc.rect(20, yPos-2, 160, 12); // Rectángulo más compacto

        // Título "PAGADO POR" centrado verticalmente
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('PAGADO POR:', 25, yPos+4); // Ajustado para centrar verticalmente
        doc.setTextColor(0, 0, 0);

        // Checkbox 1: Cliente - centrado verticalmente
        const checkboxY = yPos+2; // Posición Y para centrar checkbox

        // Cuadro del cliente
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(60, checkboxY-2, 4, 4); // Movido más a la derecha

        const traspasoPagado = data.COSTOS?.TRASPASO_PAGADO ?? 0;
        const clienteMarcado = traspasoPagado === 0;
        if (clienteMarcado) {
            doc.setLineWidth(0.5);
            doc.line(60, checkboxY-2, 64, checkboxY+2);
            doc.line(64, checkboxY-2, 60, checkboxY+2);
        }

        doc.setFont('helvetica', 'normal');
        doc.text('Cliente', 66, checkboxY+1);

        // Checkbox 2: Autos Colin
        doc.rect(100, checkboxY-2, 4, 4);

        const autosColinMarcado = traspasoPagado === 1;
        if (autosColinMarcado) {
            doc.setLineWidth(0.5);
            doc.line(100, checkboxY-2, 104, checkboxY+2);
            doc.line(104, checkboxY-2, 100, checkboxY+2);
        }

        doc.setFont('helvetica', 'normal');
        doc.text('Autos Colin', 106, checkboxY+1);

        yPos += 15; // Espacio después de los checkboxes

        // Línea separadora
        doc.setDrawColor(220, 220, 220);
        doc.line(15, yPos, 195, yPos);
        yPos = verificarEspacio(doc, yPos, 40)
        
        // ===== 4. VEHÍCULO A RECIBIR =====
        yPos += 8;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('4. VEHÍCULO A RECIBIR', 15, yPos);
        doc.setTextColor(0, 0, 0);
        
        yPos += 6;
        doc.setFontSize(9);
        
        const vehiculoRecibido = data.VEHICULO_RECIBIDO || {};
        const recPlaca = vehiculoRecibido.PLACA || '';
        const recModelo = vehiculoRecibido.MODELO || '';
        const recMonto = vehiculoRecibido.monto_recibido || '0.00';
        
        if (recPlaca) {
            // Cabecera tabla vehículo a recibir
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(20, yPos-4, 160, 6, 'F');
            doc.text('PLACA', 30, yPos);
            doc.text('AÑO', 70, yPos);
            doc.text('MONTO RECIBO', 110, yPos);
            
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            doc.text(recPlaca, 30, yPos);
            doc.text(recModelo.toString(), 70, yPos);
            doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(recMonto)}`, 110, yPos);
        } else {
            doc.setFont('helvetica', 'italic');
            doc.text('No hay vehículo a recibir', 30, yPos);
        }
        
        // Línea separadora
        yPos += 8;
        doc.line(15, yPos, 195, yPos);
        
        // ===== 5. ANTICIPOS =====
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('5. ANTICIPOS', 15, yPos);
        doc.setTextColor(0, 0, 0);
        
        yPos += 6;
        doc.setFontSize(9);
        
        // Mostrar anticipos desde la API
        const anticipos = data.ANTICIPOS || [];
        if (anticipos && anticipos.length > 0) {
            // Cabecera tabla anticipos
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(20, yPos-4, 130, 6, 'F');
            doc.text('DOCUMENTO', 30, yPos);
            doc.text('MONTO', 100, yPos);
            
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            
            anticipos.forEach((anticipo, index) => {
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 30;
                }
                const docNum = anticipo.NUM_DOCUMENTO || '';
                const monto = anticipo.MONTO_COLONES || 0;
                doc.text(docNum, 30, yPos);
                doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(monto)}`, 100, yPos);
                yPos += 6;
            });
        } else {
            doc.setFont('helvetica', 'italic');
            doc.text('No hay anticipos registrados', 30, yPos);
            yPos += 10;
        }
        
        // Línea separadora
        yPos += 4;
        doc.line(15, yPos, 195, yPos);
        yPos += 4;
        
        // ===== 6. FORMA DE PAGO =====
        if (yPos > 240) { // Si estamos muy cerca del final
            doc.addPage();
            yPos = 20;
        } else {
            yPos += 8; // Espacio normal
        }

        yPos += 8;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('6. FORMA DE PAGO', 15, yPos);
        doc.setTextColor(0, 0, 0);
        
        yPos += 6;
        doc.setFontSize(9);
        
        const financiamiento = data.FINANCIAMIENTO || {};
        const detallePagos = data.DETALLE_PAGOS || [];
        
        // Determinar tipo de venta
        const tipoVenta = data.FINANCIAMIENTO ? 'CRÉDITO' : 'CONTADO';
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Tipo de Venta: ${tipoVenta}`, 20, yPos);
        yPos += 6;
        
        if (tipoVenta === 'CRÉDITO') {
            // Datos del crédito
            doc.setFont('helvetica', 'bold');
            doc.text('DATOS DEL CRÉDITO:', 20, yPos);
            yPos += 6;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Entidad:', 30, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(financiamiento.ENTIDAD_FINANCIERA || '', 60, yPos);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Plazo (meses):', 120, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text((financiamiento.PLAZO_MESES || '').toString(), 165, yPos);
            
            yPos += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Valor Consumo:', 30, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(financiamiento.VALOR_CONSUMO || 0)}`, 60, yPos);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Prima:', 120, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(financiamiento.PRIMA || 0)}`, 140, yPos);
            
            yPos += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Monto Financiar:', 30, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(financiamiento.MONTO_FINANCIAR || 0)}`, 60, yPos);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Cuota Mensual:', 120, yPos);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 0);
            doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(financiamiento.CUOTA_MENSUAL || 0)}`, 160, yPos);
            doc.setTextColor(0, 0, 0);
            
            yPos += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Interés Nominal:', 30, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(`${financiamiento.TASA_NOMINAL || 0}%`, 60, yPos);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Interés Moratorio:', 120, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(`${financiamiento.INTERES_MORATORIO || 0}%`, 160, yPos);
            
            yPos += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Fecha Primer Pago:', 30, yPos);
            doc.setFont('helvetica', 'normal');
            
            let primerPago = '';
            if (financiamiento.FECHA_PRIMERPAGO) {
                const fecha = new Date(financiamiento.FECHA_PRIMERPAGO);
                primerPago = fecha.toLocaleDateString('es-CR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
            doc.text(primerPago, 60, yPos);
            
            yPos += 8;
            doc.setFont('helvetica', 'bold');
            doc.text('Total a Pagar:', 30, yPos);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 0);
            doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(financiamiento.PRESTAMO_TOTAL || 0)}`, 60, yPos);
            doc.setTextColor(0, 0, 0);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Total Intereses:', 120, yPos);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(200, 0, 0);
            doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(financiamiento.INTERESES_TOTAL || 0)}`, 160, yPos);
            doc.setTextColor(0, 0, 0);
            
        } else {
            // Datos de contado
            doc.setFont('helvetica', 'bold');
            doc.text('PAGO DE CONTADO:', 20, yPos);
            yPos += 6;
            
            const entidad = detallePagos[0]?.FORMA_PAGO || 'EFECTIVO';
            let montoPago = montoVenta;
            if (detallePagos.length > 0) {
                montoPago = detallePagos[0].TRANSFERENCIA || detallePagos[0].EFECTIVO || detallePagos[0].TARJETA || montoVenta;
            } else {
                montoPago = montoVenta;
            }
            
            doc.setFont('helvetica', 'bold');
            doc.text('Forma de Pago:', 30, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(entidad, 60, yPos);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Monto:', 120, yPos);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 0);
            doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(montoPago)}`, 140, yPos);
            doc.setTextColor(0, 0, 0);
        }
        
        // ===== RESUMEN FINAL =====
        yPos += 15;
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.8);
        doc.line(15, yPos-2, 195, yPos-2);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('RESUMEN FINAL', 105, yPos+10, { align: 'center' });
        
        yPos += 20;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Vehículo:', 50, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 102, 0);
        doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(montoVenta)}`, 100, yPos);
        doc.setTextColor(0, 0, 0);
        
        if (tipoVenta === 'CRÉDITO') {
            yPos += 7;
            doc.setFont('helvetica', 'bold');
            doc.text('Total a Pagar (Crédito):', 50, yPos);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 0);
            doc.text(`${moneda === 'COLONES' ? 'CRC' : '$'} ${formatNumber(financiamiento.PRESTAMO_TOTAL || 0)}`, 100, yPos);
        }
        
        yPos += 20;

        // ===== PIE DE PÁGINA =====
        yPos = 280;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text('Documento generado el ' + new Date().toLocaleDateString('es-CR') + ' a las ' + 
                new Date().toLocaleTimeString('es-CR'), 105, yPos, { align: 'center' });
        doc.text('AUTOS COLIN S.R.L - Todos los derechos reservados', 105, yPos + 4, { align: 'center' });
        
        // Guardar el PDF
        const nombreArchivo = `PLAN_VENTA_${data.CODIGO_VENTA || 'NUEVO'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);
        
        mostrarNotificacion('PDF generado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Función mejorada para texto con ajuste de línea (versión universal)
function textoAjustado(doc, texto, x, y, maxLength = 40, lineHeight = 5) {
    if (!texto || texto === '') {
        doc.text('', x, y);
        return y;
    }
    
    // Convertir a string y limpiar
    texto = String(texto).trim();
    
    if (texto.length <= maxLength) {
        doc.text(texto, x, y);
        return y;
    }
    
    const palabras = texto.split(' ');
    let linea = '';
    let lineas = [];
    let lineaActual = '';
    
    for (let palabra of palabras) {
        let prueba = lineaActual ? `${lineaActual} ${palabra}` : palabra;
        
        if (prueba.length <= maxLength) {
            lineaActual = prueba;
        } else {
            if (lineaActual) lineas.push(lineaActual);
            lineaActual = palabra;
        }
    }
    if (lineaActual) lineas.push(lineaActual);
    
    // Imprimir líneas
    lineas.forEach((linea, index) => {
        doc.text(linea, x, y + (index * lineHeight));
    });
    
    return y + ((lineas.length - 1) * lineHeight);
}

// Función específica para pares clave-valor
function escribirParConAjuste(doc, clave, valor, xClave, xValor, y, maxLength = 40) {
    // Escribir la clave (negrita)
    doc.setFont('helvetica', 'bold');
    doc.text(clave, xClave, y);
    
    // Escribir el valor con ajuste
    doc.setFont('helvetica', 'normal');
    const nuevaY = textoAjustado(doc, valor, xValor, y, maxLength, 5);
    
    return nuevaY;
}

//  FUNCIÓN AUXILIAR PARA FORMATEAR NÚMEROS
function formatNumber(num) {
    if (num === undefined || num === null || num === '') return '0.00';
    
    // Si es string, convertir a número
    let valor = parseFloat(num) || 0;
    
    // Formatear con separadores de miles y 2 decimales
    return valor.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

//  AGREGAR BOTONES PARA GENERAR PDF EN LA INTERFAZ
function agregarBotonesPDF() {
    // Ejecutar inmediatamente y también después de un tiempo
    function agregar() {
        console.log('Intentando agregar botones de PDF...');
        
        // 1. BOTÓN EN LA SECCIÓN DE ÍNDICE
        const accionesIndice = document.querySelector('#indice .acciones');
        if (accionesIndice && !document.getElementById('btn-pdf-indice')) {
            const btnPDFIndice = document.createElement('button');
            btnPDFIndice.id = 'btn-pdf-indice';
            btnPDFIndice.innerHTML = '<i class="fas fa-file-pdf"></i> Generar PDF del Plan';
            btnPDFIndice.onclick = generarPDFPlanVenta;
            btnPDFIndice.style.background = '#dc2626';
            btnPDFIndice.style.color = 'white';
            btnPDFIndice.style.marginLeft = '10px';
            btnPDFIndice.style.padding = '8px 15px';
            btnPDFIndice.style.border = 'none';
            btnPDFIndice.style.borderRadius = '5px';
            btnPDFIndice.style.cursor = 'pointer';
            btnPDFIndice.style.fontSize = '14px';
            btnPDFIndice.style.fontWeight = '500';
            accionesIndice.appendChild(btnPDFIndice);
            console.log('Botón PDF agregado en índice');
        }
        
        // 2. BOTÓN EN LA SECCIÓN DE PAGO
        const accionesPago = document.querySelector('#pago .acciones');
        if (accionesPago && !document.getElementById('btn-pdf-pago')) {
            const btnPDFPago = document.createElement('button');
            btnPDFPago.id = 'btn-pdf-pago';
            btnPDFPago.innerHTML = '<i class="fas fa-file-pdf"></i> Generar PDF';
            btnPDFPago.onclick = generarPDFPlanVenta;
            btnPDFPago.style.background = '#dc2626';
            btnPDFPago.style.color = 'white';
            btnPDFPago.style.marginLeft = '10px';
            btnPDFPago.style.padding = '8px 15px';
            btnPDFPago.style.border = 'none';
            btnPDFPago.style.borderRadius = '5px';
            btnPDFPago.style.cursor = 'pointer';
            btnPDFPago.style.fontSize = '14px';
            btnPDFPago.style.fontWeight = '500';
            accionesPago.appendChild(btnPDFPago);
            console.log('Botón PDF agregado en pago');
        }
        
        actualizarEstadoBotonesPDF();
    }
    
    // Intentar agregar inmediatamente
    agregar();
    
    // Intentar nuevamente después de 1, 2 y 3 segundos
    setTimeout(agregar, 1000);
    setTimeout(agregar, 2000);
    setTimeout(agregar, 3000);
}

// Función para actualizar el estado de los botones (habilitado/deshabilitado)
window.cargarPlanesDesdeAPI = cargarPlanesDesdeAPI;
window.seleccionarPlan = seleccionarPlan;
window.selectedVentaId = selectedVentaId;
window.actualizarEstadoBotonesPDF = function() {
    const btnPDFIndice = document.getElementById('btn-pdf-indice');
    const btnPDFPago = document.getElementById('btn-pdf-pago');
    
    const hayPlanSeleccionado = selectedVentaId ? true : false;
    
    [btnPDFIndice, btnPDFPago].forEach(btn => {
        if (btn) {
            if (hayPlanSeleccionado) {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.title = 'Generar PDF del plan seleccionado';
            } else {
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';
                btn.title = 'Seleccione un plan primero';
            }
        }
    });
};

// Interceptar la función seleccionarPlan original sin sobrescribirla
document.addEventListener('click', function(e) {
    // Detectar cuando se hace clic en una fila de la tabla de planes
    const fila = e.target.closest('#tbody-planes tr');
    if (fila) {
        // Esperar un momento para que se actualice selectedVentaId
        setTimeout(actualizarEstadoBotonesPDF, 100);
    }
});

// También detectar cuando se hace clic en el botón "Nuevo"
document.addEventListener('click', function(e) {
    if (e.target.closest('button') && e.target.textContent.includes('Nuevo')) {
        setTimeout(actualizarEstadoBotonesPDF, 100);
    }
});

// Llamar a la función después de que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Agregar botones de PDF
    agregarBotonesPDF();
    
    // Actualizar estado inicial
    setTimeout(actualizarEstadoBotonesPDF, 1500);
});

// También actualizar cuando se carga un nuevo conjunto de planes
const originalCargarPlanes = cargarPlanesDesdeAPI;
cargarPlanesDesdeAPI = async function() {
    await originalCargarPlanes.apply(this, arguments);
    setTimeout(actualizarEstadoBotonesPDF, 500);

};
