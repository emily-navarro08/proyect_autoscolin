// ===== FUNCIÓN PARA GENERAR PDF CON LA MISMA ESTRUCTURA DEL MODAL =====
async function generarPDFVehiculo(id) {
    try {
        // Mostrar indicador de carga
        mostrarAlerta('info', 'Generando PDF...');
        
        // Cargar datos completos del vehículo
        const response = await fetch(`/api/vehiculos/${id}/completo`);
        const data = await response.json();
        
        const vehiculo = data.vehiculo;
        const costos = data.costos && data.costos.length > 0 ? data.costos[0] : {};
        const extras = data.extras || [];
        
        // Crear nuevo documento PDF en horizontal
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Función para formatear números sin separadores de miles para evitar problemas
        const formatMoney = (valor) => {
            if (!valor || isNaN(valor)) return '0.00';
            // Usar punto como separador decimal y sin separadores de miles
            return new Intl.NumberFormat('es-CR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: false // Esto evita los separadores de miles
            }).format(valor).replace(/\./g, ','); // Cambiar punto decimal por coma
        };

        // Función para formatear números grandes con separadores (para mejor lectura)
        const formatMoneyReadable = (valor) => {
            if (!valor || isNaN(valor)) return '0,00';
            return new Intl.NumberFormat('es-CR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: true
            }).format(valor);
        };

        // Función para asegurar string
        const toStr = (val) => {
            if (val === null || val === undefined) return '';
            return String(val);
        };

        // Configurar fuente
        doc.setFont('helvetica');
        
        // ===== ENCABEZADO =====
        doc.setFillColor(44, 62, 80);
        doc.rect(0, 0, 297, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('AUTOS COLÍN', 148.5, 12, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('FICHA COMPLETA DE VEHÍCULO', 148.5, 20, { align: 'center' });
        
        let yPos = 35;
        
        // ===== HEADER INFO GRID =====
        doc.setTextColor(44, 62, 80);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('INVENTARIO DE VEHÍCULO', 10, yPos);
        yPos += 6;
        
        // Grid de información superior
        doc.setFontSize(10);
        
        // Primera fila
        doc.setFont('helvetica', 'bold');
        doc.text('PLACA:', 10, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(toStr(vehiculo.PLACA || 'S/N'), 30, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.text('DESCRIPCIÓN:', 70, yPos);
        doc.setFont('helvetica', 'normal');
        const descripcion = `${vehiculo.marca_nombre || ''} ${vehiculo.ESTILO || ''} ${vehiculo.MODELO || ''}`;
        doc.text(toStr(descripcion), 110, yPos);
        
        yPos += 5;
        
        // Segunda fila
        doc.setFont('helvetica', 'bold');
        doc.text('COSTO $:', 10, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`$${formatMoneyReadable(costos.COSTO || 0)}`, 30, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.text('COSTO CRC:', 70, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`CRC${formatMoneyReadable((costos.COSTO || 0) * (costos.TIPO_CAMBIO_COMPRA || 515))}`, 110, yPos);
        
        yPos += 10;
        
        // Tipo de cambio
        doc.setFillColor(240, 240, 240);
        doc.rect(10, yPos-4, 277, 10, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.text('Tipo de cambio:', 12, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`CRC${formatMoneyReadable(costos.TIPO_CAMBIO_COMPRA || 515)}`, 45, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Tipo de cambio Prov.:', 120, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`CRC${formatMoneyReadable(costos.TIPO_CAMBIO_COMPRA || 515)}`, 165, yPos);
        
        yPos += 10;
        
        // ===== LÍNEA DIVISORIA =====
        doc.setDrawColor(200, 200, 200);
        doc.line(10, yPos-2, 287, yPos-2);
        
        // ===== TRES COLUMNAS =====
        const col1X = 15;
        const col2X = 110;
        const col3X = 205;
        
        // COLUMNA 1: PRECIOS Y COSTOS
        let col1Y = yPos + 5;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('PRECIOS Y COSTOS', col1X, col1Y);
        col1Y += 10;
        
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        // Precio Compra
        doc.setFont('helvetica', 'bold');
        doc.text('Precio Compra:', col1X, col1Y);
        doc.setFont('helvetica', 'normal');
        doc.text(`$${formatMoneyReadable(costos.PRECIO_COMPRA || 0)}`, col1X + 30, col1Y);
        doc.text(`CRC${formatMoneyReadable((costos.PRECIO_COMPRA || 0) * (costos.TIPO_CAMBIO_COMPRA || 515))}`, col1X + 55, col1Y);
        col1Y += 6;
        
        // Precio Traspaso
        doc.setFont('helvetica', 'bold');
        doc.text('Precio Traspaso:', col1X, col1Y);
        doc.setFont('helvetica', 'normal');
        doc.text(`$${formatMoneyReadable(costos.PRECIO_TRANSPASO || 0)}`, col1X + 30, col1Y);
        doc.text(`CRC${formatMoneyReadable((costos.PRECIO_TRANSPASO || 0) * (costos.TIPO_CAMBIO_COMPRA || 515))}`, col1X + 55, col1Y);
        col1Y += 6;
        
        // Costo
        doc.setFont('helvetica', 'bold');
        doc.text('Costo:', col1X, col1Y);
        doc.setFont('helvetica', 'normal');
        doc.text(`$${formatMoneyReadable(costos.COSTO || 0)}`, col1X + 30, col1Y);
        doc.text(`CRC${formatMoneyReadable((costos.COSTO || 0) * (costos.TIPO_CAMBIO_COMPRA || 515))}`, col1X + 55, col1Y);
        col1Y += 6;
        
        // Prima
        doc.setFont('helvetica', 'bold');
        doc.text('Prima:', col1X, col1Y);
        doc.setFont('helvetica', 'normal');
        doc.text(`$${formatMoneyReadable(costos.PRIMA || 0)}`, col1X + 30, col1Y);
        doc.text(`CRC${formatMoneyReadable((costos.PRIMA || 0) * (costos.TIPO_CAMBIO_COMPRA || 515))}`, col1X + 55, col1Y);
        col1Y += 6;
        
        // Comisión
        doc.setFont('helvetica', 'bold');
        doc.text('Comisión:', col1X, col1Y);
        doc.setFont('helvetica', 'normal');
        doc.text(`$${formatMoneyReadable(costos.COMISION || 0)}`, col1X + 30, col1Y);
        doc.text(`CRC${formatMoneyReadable((costos.COMISION || 0) * (costos.TIPO_CAMBIO_COMPRA || 515))}`, col1X + 55, col1Y);
        col1Y += 6;
        
        // Detalles Adicionales (Extras)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Detalles Adicionales', col1X, col1Y);
        col1Y += 6;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        if (extras && extras.length > 0) {
            extras.forEach((extra, index) => {
                if (col1Y > 180) { 
                    doc.addPage();
                    col1Y = 20;
                }
                doc.setFont('helvetica', 'bold');
                doc.text(`${extra.EXTRAS_DETALLE || 'Extra'}:`, col1X, col1Y);
                doc.setFont('helvetica', 'normal');
                doc.text(`$${formatMoneyReadable(extra.PRECIO || 0)}`, col1X + 30, col1Y);
                doc.text(`CRC${formatMoneyReadable((extra.PRECIO || 0) * (costos.TIPO_CAMBIO_COMPRA || 515))}`, col1X + 55, col1Y);
                col1Y += 3.5;
            });
        } else {
            doc.text('No hay detalles adicionales', col1X, col1Y);
            col1Y += 3.5;
        }
        col1Y += 3;
        
        // Total Inversión
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Total Inversión:', col1X, col1Y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`$${formatMoneyReadable(costos.TOTAL_INVERSION || 0)}`, col1X + 30, col1Y);
        doc.text(`CRC${formatMoneyReadable((costos.TOTAL_INVERSION || 0) * (costos.TIPO_CAMBIO_COMPRA || 515))}`, col1X + 55, col1Y);
        col1Y += 6;
        
        // Precio Costo
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Precio Costo:', col1X, col1Y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`$${formatMoneyReadable(costos.PRECIO_COSTO || 0)}`, col1X + 30, col1Y);
        doc.text(`CRC${formatMoneyReadable((costos.PRECIO_COSTO || 0) * (costos.TIPO_CAMBIO_COMPRA || 515))}`, col1X + 55, col1Y);
        col1Y += 6;
        
        // Extras y Observaciones
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Información Adicional', col1X, col1Y);
        col1Y += 6;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Extras:', col1X, col1Y);
        doc.setFont('helvetica', 'normal');
        const extras_text = doc.splitTextToSize(toStr(vehiculo.EXTRAS || 'No hay extras'), 70);
        doc.text(extras_text, col1X + 20, col1Y);
        col1Y += (extras_text.length * 3.5) + 2;
        
        if (col1Y > 190) { 
            doc.addPage();
            col1Y = 20; 
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones:', col1X, col1Y);
        doc.setFont('helvetica', 'normal');
        const obs_text = doc.splitTextToSize(toStr(vehiculo.OBSERVACIONES || 'Sin observaciones'), 70);
        doc.text(obs_text, col1X + 25, col1Y);
        col1Y += (obs_text.length * 3.5) + 5;
        
        // ===== COLUMNA 2: DETALLES DEL VEHÍCULO =====
        let col2Y = yPos + 5;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('DETALLES DEL VEHÍCULO', col2X, col2Y);
        col2Y += 10;
        
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        // Saldo
        doc.setFont('helvetica', 'bold');
        doc.text('Saldo:', col2X, col2Y);
        doc.setFont('helvetica', 'normal');
        doc.text(`$${formatMoneyReadable(costos.SALDO || 0)}`, col2X + 20, col2Y);
        doc.text(`CRC${formatMoneyReadable((costos.SALDO || 0) * (costos.TIPO_CAMBIO_COMPRA || 515))}`, col2X + 45, col2Y);
        col2Y += 4;
        
        // Proveedor
        doc.setFont('helvetica', 'bold');
        doc.text('Proveedor:', col2X, col2Y);
        doc.setFont('helvetica', 'normal');
        const proveedor = proveedores.find(p => p.ID_PERSONA == vehiculo.ID_PROVEEDOR);
        doc.text(toStr(proveedor?.NOMBRE_COMPLETO || 'No seleccionado'), col2X + 25, col2Y);
        col2Y += 6;
        
        // Especificaciones Técnicas
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Especificaciones Técnicas', col2X, col2Y);
        col2Y += 4;
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        
        const specs = [
            ['Marca:', vehiculo.marca_nombre || '-', 'Kilom. Anterior:', `${vehiculo.KILOMETRAJE_ANTERIOR || 0} km`],
            ['Estilo:', vehiculo.ESTILO || '-', 'Kilom. Actual:', `${vehiculo.KILOMETRAJE_ACTUAL || 0} km`],
            ['Tracción:', vehiculo.TRACCION || '-', 'Color:', vehiculo.color_nombre || '-'],
            ['Modelo:', vehiculo.MODELO || '-', 'Transmisión:', vehiculo.transmision_nombre || '-'],
            ['PV#:', vehiculo.PV || '-', 'Combustible:', vehiculo.combustible_nombre || '-'],
            ['# Motor:', vehiculo.MOTOR || '-', 'C.C.:', vehiculo.C_C || '-'],
            ['# Chasis:', vehiculo.CHASIS || '-', 'Cilindros:', vehiculo.CILINDROS || '-'],
            ['Carrocería:', vehiculo.CARROCERIA || '-'],
            ['Estado:', vehiculo.ESTADO || '-'],
            ['Fec. Ingreso:', vehiculo.FECHA_INGRESO ? new Date(vehiculo.FECHA_INGRESO).toLocaleDateString('es-CR') : '-', '', '']
        ];
        
        specs.forEach(spec => {
            if (col2Y > 190) { 
                doc.addPage();
                col2Y = 20; 
            }
            doc.setFont('helvetica', 'bold');
            doc.text(spec[0], col2X, col2Y);
            doc.setFont('helvetica', 'normal');
            doc.text(toStr(spec[1]), col2X + 20, col2Y);
            
            if (spec[2]) {
                doc.setFont('helvetica', 'bold');
                doc.text(spec[2], col2X + 40, col2Y);
                doc.setFont('helvetica', 'normal');
                doc.text(toStr(spec[3]), col2X + 70, col2Y);
            }
            col2Y += 4;
        });
        col2Y += 6;
        
        // Información de Transacción
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Información de Transacción', col2X, col2Y);
        col2Y += 4;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        const transaccion = [
            ['Fec. Cancelación:', vehiculo.FECHA_CANCELACION ? new Date(vehiculo.FECHA_CANCELACION).toLocaleDateString('es-CR') : '-'],
            ['Monto Traspaso:', `CRC${formatMoneyReadable(costos.MONTO_TRASPASO || 0)}`],
            ['P-Precio:', `CRC${formatMoneyReadable(costos.PRECIO_PUBLICO || 0)}`],
            ['P.C/Descuento:', `CRC${formatMoneyReadable(costos.PRECIO_DESCUENTO || 0)}`],
            ['Prima Financ.:', `CRC${formatMoneyReadable(costos.PRIMA_FINANCIAMIENTO || 0)}`],
            ['Cuota Financ.:', `CRC${formatMoneyReadable(costos.CUOTA_FINANCIAMIENTO || 0)}`]
        ];
        
        transaccion.forEach(item => {
            if (col2Y > 200) { 
                doc.addPage();
                col2Y = 20; 
            }
            doc.setFont('helvetica', 'bold');
            doc.text(item[0], col2X, col2Y);
            doc.setFont('helvetica', 'normal');
            doc.text(toStr(item[1]), col2X + 30, col2Y);
            col2Y += 4;
        });
        
        // ===== COLUMNA 3: DATOS DEL PROVEEDOR =====
        let col3Y = yPos + 5;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('DATOS DEL PROVEEDOR', col3X, col3Y);
        col3Y += 10;
        
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        if (proveedor) {
            const proveedorData = [
                ['Nombre:', proveedor.NOMBRE_COMPLETO || '-'],
                ['Cédula:', proveedor.IDENTIFICACION || '-'],
                ['Estado Civil:', proveedor.estado_civil_nombre || '-'],
                ['Ocupación:', proveedor.OCUPACION || '-'],
                ['Dirección:', proveedor.DIRECCION || '-'],
                ['Teléfono Principal:', proveedor.TELEFONO_PRINCIPAL || '-'],
                ['Teléfono Secundario:', proveedor.TELEFONO_SECUNDARIO || '-'],
                ['Correo Electrónico:', proveedor.EMAIL || '-']
            ];
            
            proveedorData.forEach(item => {
                if (col3Y > 200) { 
                    doc.addPage();
                    col3Y = 20; 
                }
                doc.setFont('helvetica', 'bold');
                doc.text(item[0], col3X, col3Y);
                doc.setFont('helvetica', 'normal');
                
                if (item[0] === 'Dirección:') {
                    const direccion = doc.splitTextToSize(toStr(item[1]), 70);
                    doc.text(direccion, col3X + 25, col3Y);
                    col3Y += (direccion.length * 3.5);
                } else {
                    doc.text(toStr(item[1]), col3X + 30, col3Y);
                    col3Y += 4;
                }
            });
        } else {
            doc.text('No hay proveedor seleccionado', col3X, col3Y);
        }
        
        // ===== PIE DE PÁGINA =====
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(128, 128, 128);
            doc.text(`Generado el ${new Date().toLocaleDateString('es-CR')} - Autos Colín`, 148.5, 200, { align: 'center' });
            doc.text(`Página ${i} de ${pageCount}`, 280, 200, { align: 'right' });
        }
        
        // Guardar PDF
        const nombreArchivo = `vehiculo_${vehiculo.PLACA || vehiculo.CHASIS || 'sin_placa'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);
        
        mostrarAlerta('success', 'PDF generado exitosamente');
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        mostrarAlerta('error', 'Error al generar el PDF: ' + error.message);
    }
}