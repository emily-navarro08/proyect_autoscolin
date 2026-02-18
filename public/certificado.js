// Configuración de API
const API_BASE_URL = 'http://localhost:3000/api';

// Elementos DOM
const searchCedula = document.getElementById('searchCedula');
const searchBtn = document.getElementById('searchBtn');
const garantiaForm = document.getElementById('garantiaForm');
const clearBtn = document.getElementById('clearBtn');
const printBtn = document.getElementById('printBtn');
const downloadBtn = document.getElementById('downloadBtn');
const certificatePreview = document.getElementById('certificatePreview');
const messageAlert = document.getElementById('messageAlert');

// Variables globales
let datosClienteActual = null;
let datosVehiculoActual = null;
let certificadoGenerado = false;

// Función para mostrar mensajes
function showMessage(message, type = 'success') {
    messageAlert.textContent = message;
    messageAlert.className = `alert alert-${type}`;
    messageAlert.style.display = 'block';
    
    setTimeout(() => {
        messageAlert.style.display = 'none';
    }, 5000);
}

// Función para buscar cliente por cédula usando API
async function buscarClientePorCedula(cedula) {
    try {
        showMessage('Buscando cliente...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/certificados/clientes/${cedula}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Cliente no encontrado');
            }
            throw new Error('Error al buscar cliente');
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Función para obtener vehículo por placa usando API
async function obtenerVehiculoPorPlaca(placa) {
    try {
        const response = await fetch(`${API_BASE_URL}/certificados/vehiculos/placa/${placa}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Vehículo no encontrado');
            }
            throw new Error('Error al obtener vehículo');
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Función para cargar datos del cliente y vehículo
async function cargarDatosCliente(clienteData) {
    try {
        datosClienteActual = clienteData.cliente;
        
        // Cargar datos del cliente en el formulario
        document.getElementById('nombreCliente').value = datosClienteActual.NOMBRE_COMPLETO || '';
        document.getElementById('cedula').value = datosClienteActual.IDENTIFICACION || '';
        
        // Si el cliente tiene vehículos, cargar el primero
        if (clienteData.vehiculos && clienteData.vehiculos.length > 0) {
            const vehiculo = clienteData.vehiculos[0];
            datosVehiculoActual = vehiculo;
            cargarDatosVehiculo(vehiculo);
        }
        
        showMessage(`Cliente ${datosClienteActual.NOMBRE_COMPLETO} encontrado.`, 'success');
        
    } catch (error) {
        console.error('Error al cargar datos del cliente:', error);
        showMessage('Error al cargar datos del cliente', 'error');
    }
}

// Función para cargar datos del vehículo
function cargarDatosVehiculo(vehiculo) {
    document.getElementById('marca').value = vehiculo.marca_nombre || '';
    document.getElementById('modelo').value = vehiculo.MODELO || '';
    document.getElementById('estilo').value = vehiculo.ESTILO || '';
    document.getElementById('color').value = vehiculo.color_nombre || '';
    document.getElementById('motor').value = vehiculo.MOTOR || '';
    document.getElementById('chasis').value = vehiculo.CHASIS || '';
    document.getElementById('transmision').value = vehiculo.transmision_nombre || '';
    document.getElementById('combustible').value = vehiculo.combustible_nombre || '';
    document.getElementById('carroceria').value = vehiculo.CARROCERIA || '';
    document.getElementById('kilometraje').value = vehiculo.KILOMETRAJE_ACTUAL || '';
    document.getElementById('placa').value = vehiculo.PLACA || '';
    document.getElementById('cc').value = vehiculo.C_C || '';
    document.getElementById('cilindrados').value = vehiculo.CILINDROS || '';
    document.getElementById('traccion').value = vehiculo.TRACCION || '';
    
    datosVehiculoActual = vehiculo;
}

// Evento para buscar cliente
searchBtn.addEventListener('click', async () => {
    const cedula = searchCedula.value.trim();
    
    if (!cedula) {
        showMessage('Por favor ingrese un número de cédula para buscar.', 'error');
        return;
    }
    
    try {
        const clienteData = await buscarClientePorCedula(cedula);
        await cargarDatosCliente(clienteData);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Evento para limpiar formulario
clearBtn.addEventListener('click', () => {
    garantiaForm.reset();
    datosClienteActual = null;
    datosVehiculoActual = null;
    certificadoGenerado = false;
    
    certificatePreview.innerHTML = `
        <div class="certificate-header">
            <h2>CERTIFICADO DE GARANTÍA</h2>
            <div class="company-name">AUTOS COLIN S.R.L.</div>
        </div>
        
        <table class="data-table">
            <tr>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Placa</th>
            </tr>
            <tr>
                <td id="previewMarca">-</td>
                <td id="previewModelo">-</td>
                <td id="previewPlaca">-</td>
            </tr>
        </table>
        
        <div class="client-info">
            <p><strong>Cliente:</strong> <span id="previewCliente">[Nombre del cliente]</span></p>
            <p><strong>Cédula:</strong> <span id="previewCedula">[Número de cédula]</span></p>
        </div>
        
        <div class="date">
            <p>Fecha: ____________________</p>
        </div>
    `;
    
    printBtn.disabled = true;
    downloadBtn.disabled = true;
    showMessage('Formulario limpiado correctamente.', 'success');
});

// Función para generar el certificado HTML
function generarCertificadoHTML(datos) {
    const {
        nombreCliente,
        cedula,
        marca,
        modelo,
        estilo,
        traccion,
        color,
        motor,
        chasis,
        transmision,
        combustible,
        carroceria,
        kilometraje,
        placa,
        cc,
        cilindrados
    } = datos;
    
    // Obtener fecha actual
    const fechaActual = new Date();
    const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = fechaActual.toLocaleDateString('es-ES', opcionesFecha);
    
    return `
    <div class="page-container">

        <div class="certificate-header">
            <h2 class="underline">CERTIFICADO DE GARANTIA</h2>
        </div>
        
        <p>Este documento constituye el Certificado de Garantía de 
        <span class="company-name">AUTOS COLIN SOCIEDAD DE RESPONSABILIDAD LIMITADA,</span> 
        para su vehículo usado, ésta corresponde a inconvenientes que afecten el buen funcionamiento del vehículo, velando porque su utilización y desempeño sea idóneo conforme a las funciones para las que fue creado y en consecuencia, se den de conformidad con su naturaleza particular. Debe tomar en consideración que es un vehículo usado en buen estado de conservación y funcionamiento y que tiene algún grado de desgaste debido al tiempo de uso que ha tenido. Sin que represente una evasión de responsabilidad por parte del vendedor, se realizará una prueba de manejo con el cliente el cual comprobará el buen funcionamiento del vehículo y al cual se le informa las condiciones de la garantía, precio del vehículo y realiza las consultas del mismo, revisando y probando el bien. De conformidad con el artículo 43 de la ley de promoción de la competencia y defensa efectiva del consumidor, por lo que: <span class="company-name">AUTOS COLIN SOCIEDAD DE RESPONSABILIDAD LIMITADA,</span> otorga el presente certificado de garantía a:</p>
        
        <div class="client-info">
            <p><strong>Nombre del Cliente:</strong> ${nombreCliente}</p>
            <p><strong>Cédula:</strong> ${cedula}</p>
        </div>
        
        <p>Por la compra del vehículo usado con las siguientes características:</p>
        
        <table class="data-table">
            <thead>
                <tr>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Estilo</th>
                    <th>Color</th>
                    <th>Placa</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${marca}</td>
                    <td>${modelo}</td>
                    <td>${estilo || '-'}</td>
                    <td>${color || '-'}</td>
                    <td>${placa}</td>
                </tr>
            </tbody>
        </table>
        
        <table class="data-table">
            <thead>
                <tr>
                    <th>Motor</th>
                    <th>Chasis</th>
                    <th>Transmisión</th>
                    <th>Combustible</th>
                    <th>Carrocería</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${motor || '-'}</td>
                    <td>${chasis || '-'}</td>
                    <td>${transmision || '-'}</td>
                    <td>${combustible || '-'}</td>
                    <td>${carroceria || '-'}</td>
                </tr>
            </tbody>
        </table>
        
        <table class="data-table">
            <thead>
                <tr>
                    <th>Kilometraje</th>
                    <th>Tracción</th>
                    <th>C.C.</th>
                    <th>Cilindrados</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${kilometraje || '-'}</td>
                    <td>${traccion || '-'}</td>
                    <td>${cc || '-'}</td>
                    <td>${cilindrados || '-'}</td>
                </tr>
            </tbody>
        </table>
        
        <p>Todo bien que se venda o servicio que se preste, debe ser implícitamente garantizado en cuanto al cumplimiento de estándares de calidad y los requerimientos técnicos que por razones de salud, medio ambiente y seguridad establezca.</p>
        
        <br><p><strong>ALCANCE:</strong></p>
        <p>De conformidad con lo que indica el artículo 107 del DE-37899-MEIC inciso a), esta garantía cubre a nivel nacional de Costa Rica, sobre el vehículo ya descrito, y por el tiempo establecido de treinta días hábiles a partir de la fecha de entrega del mismo, indiferentemente del titular.</p><br>
        
        <br><p><strong>DURACIÓN:</strong></p>
        <p>La garantía tiene un plazo de treinta días hábiles a partir de la fecha de entrega del vehículo.</p>
        
        <p>Se le entregará al cliente una copia del documento de verificación de funcionamiento del vehículo, para que tenga conocimiento del mismo.</p>
        
        <p>La sociedad responsable de brindar la garantía es AUTOS COLIN SOCIEDAD DE RESPONSABILIDAD LIMITADA, cédula jurídica 3 102722004.</p>
        
        <p>Las reparaciones y cambio de piezas que se realicen por garantía no tiene por efecto la prolongación de la garantía total, solamente sobre la reparación realizada.</p>
        
        <p>AUTOS COLIN SOCIEDAD DE RESPONSABILIDAD LIMITADA no tiene la obligación de prestar ninguno de sus vehículos, en el tiempo que se realice una reparación por garantía, salvo que por la situación el tiempo sea mayor a los 15 días naturales.</p>
        
        <p>AUTOS COLIN SOCIEDAD DE RESPONSABILIDAD LIMITADA no presta servicio de Grúa, si el mismo se requiere tendrá que ser pagado por el cliente.</p>
        
        <p>En cumplimiento a lo que indica el artículo 108, son derechos del titular durante la vigencia de la garantía los siguientes:</p>
        
        <p>A) La garantía comprenderá los vicios o defectos que afecten la identidad entre lo ofrecido y lo entregado, y su correcto funcionamiento, salvo que estos se hayan informado previamente y consten por escrito, en la factura o en un documento aparte, en el momento de la contratación y el consumidor los acepte.</p>
        
        <p>B) Durante el período de vigencia de la garantía, su titular tendrá derecho como mínimo, y según corresponda a:</p>
        
        <p>Durante el tiempo en que dure esta garantía, el derecho y según corresponda a lo siguiente:</p>
        
        <ol>
            <li>La devolución del precio pagado.</li>
            <li>Al cambio del bien por otro de la misma especie, similares características o especificaciones técnicas, las cuales en ningún caso podrán ser inferiores a las del producto que dio lugar a la garantía.</li>
            <li>A la reparación gratuita del bien.</li>
        </ol>
        
        <p>C) Se entiende por consumidor al titular del bien y los sucesivos adquirentes del derecho.</p>
        
        <p>D) Cuando la garantía se satisfaga mediante la devolución del dinero, tendrá derecho al reintegro del valor efectivamente recibido por el comerciante. En el caso que corresponda, se deberán reintegrar las comisiones, los gastos de la operación, gastos asociados y los intereses.</p>
        
        <p>E) En caso de que opere la sustitución del bien, se entenderá renovada la garantía por el plazo inicialmente otorgado y correrá a partir de la entrega del bien.</p>
        
        <p>Cuando la garantía se aplique mediante la devolución del precio pagado, la sustitución o reposición del bien por otro de idénticas características, el consumidor deberá restituir el bien al comerciante con todos sus accesorios cuando así corresponda, y sin más deterioro que el normalmente previsto por el uso o disfrute.</p>
        
        <p>Si se trata de la prestación de un servicio, la garantía dará derecho al consumidor de exigir que el resultado coincida con lo ofertado. De no ser así, el consumidor podrá exigir la devolución de lo pagado o si lo prefiera, nuevamente la prestación del servicio, total o parcial, según los términos pactados. Los gastos que se ocasionen correrán por cuenta del obligado a prestar la garantía. Cuando el servicio sea de nuevo prestado como parte del cumplimiento de la garantía, esta iniciará de nuevo.</p>
        
        <p>El comerciante o proveedor que ofrece un bien o servicio queda obligado jurídicamente no sólo a lo establecido en el documento o contrato de garantía, sino también en la oferta, promoción o publicidad que realice de conformidad con los artículos 34 y 37 de la Ley, y lo dispuesto en el presente reglamento."</p>
        
        <br><p><strong>PROCEDIMIENTO PARA HACERLA EFECTIVA:</strong></p><br>
        <p>De conformidad con lo que indica el artículo 107 del DE-37899-MEIC inciso e) , para hacer efectiva esta garantía el consumidor debe presentarse ante el comerciante con el citado vehículo en el establecimiento de venta para que el comerciante realice un diagnostico del bien, el estado del mismo así como del daño. Si por algún motivo el establecimiento se encontrara cerrado, imposibilitando que le consumidor haga su reclamo, se entenderá que puede hacerlo en el momento que el comercio re establezca sus funciones, o bien se establezcan mecanismos alternos que le faciliten al comprador hacer su reclamo.</p>
        
        <div class="signature-section">
            <p>Costa Rica, Cartago, ${fechaFormateada}</p>
        </div>
        
        <div style="margin-top: 50px; text-align: center;">
            <p>___________________________</p>
            <p>AUTOS COLIN S.R.L.</p>
        </div>
    </div>
    `;
}

// Función para generar el certificado
async function generarCertificado() {
    try {
        // Obtener valores del formulario
        const nombreCliente = document.getElementById('nombreCliente').value;
        const cedula = document.getElementById('cedula').value;
        const marca = document.getElementById('marca').value;
        const modelo = document.getElementById('modelo').value;
        const estilo = document.getElementById('estilo').value;
        const traccion = document.getElementById('traccion').value;
        const color = document.getElementById('color').value;
        const motor = document.getElementById('motor').value;
        const chasis = document.getElementById('chasis').value;
        const transmision = document.getElementById('transmision').value;
        const combustible = document.getElementById('combustible').value;
        const carroceria = document.getElementById('carroceria').value;
        const kilometraje = document.getElementById('kilometraje').value;
        const placa = document.getElementById('placa').value;
        const cc = document.getElementById('cc').value;
        const cilindrados = document.getElementById('cilindrados').value;
        
        // Validar campos requeridos
        if (!nombreCliente || !cedula || !marca || !modelo || !placa) {
            showMessage('Por favor complete todos los campos requeridos (*) para generar el certificado.', 'error');
            return;
        }
        
        const datosCertificado = {
            nombreCliente,
            cedula,
            marca,
            modelo,
            estilo,
            traccion,
            color,
            motor,
            chasis,
            transmision,
            combustible,
            carroceria,
            kilometraje,
            placa,
            cc,
            cilindrados
        };
        
        // Generar HTML del certificado
        const certificadoHTML = generarCertificadoHTML(datosCertificado);
        certificatePreview.innerHTML = certificadoHTML;
        
        certificadoGenerado = true;
        printBtn.disabled = false;
        downloadBtn.disabled = false;
        
        showMessage('Certificado generado correctamente.', 'success');
        
    } catch (error) {
        console.error('Error al generar certificado:', error);
        showMessage('Error al generar certificado', 'error');
    }
}

// Evento para enviar el formulario
garantiaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await generarCertificado();
});

// Evento para imprimir el certificado
printBtn.addEventListener('click', () => {
    if (!certificadoGenerado) {
        showMessage('Primero debe generar un certificado', 'error');
        return;
    }
    
    const ventanaImpresion = window.open('', '_blank');
    const contenido = certificatePreview.innerHTML;
    
    ventanaImpresion.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Certificado de Garantía - Autos Colin SRL</title>
            <style>
                @media print {
                    @page {
                        size: letter;
                        margin: 15mm;
                    }
                    @page :first {
                        margin-top: 30mm;
                    }
                }
                body { 
                    font-family: 'Times New Roman', Times, serif; 
                    line-height: 1.5; 
                    color: #000; 
                    margin: 0;
                    padding: 0;
                    background-image: url('/img/icon-192.png');
                    background-repeat: no-repeat;
                    background-position: center top 20px;
                    background-size: 120px 120px;
                    padding-top: 140px;
                }
                .certificate-header {
                    text-align: center; 
                    margin-bottom: 20px;
                }

                .page-container {
                    max-width: 170mm;
                    margin: 0 auto;
                    padding: 0;
                    position: relative;
                }
                    
                .underline { text-decoration: underline; }
                .company-name { font-weight: bold; }
                .data-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0; 
                    page-break-inside: avoid;
                }
                .data-table td, .data-table th { 
                    border: 1px solid #000; 
                    padding: 8px; 
                    text-align: center; 
                }
                .data-table th { background-color: #f0f0f0; }
                .client-info { 
                    margin: 15px 0; 
                    padding: 10px; 
                    border: 1px dashed #ccc; 
                    page-break-inside: avoid;
                }
                .signature-section { 
                    margin-top: 30px; 
                    text-align: right; 
                    padding-top: 20px; 
                    border-top: 1px solid #000; 
                }
                .page-break {
                    page-break-before: always;
                }
                @media print {
                    body { font-size: 12pt; }
                    .no-print { display: none; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            ${contenido}
            <div class="no-print" style="text-align: center; margin-top: 30px; padding: 20px;">
                <button onclick="window.print()" style="padding: 12px 24px; background-color: #1a5276; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-print"></i> Imprimir Certificado
                </button>
                <button onclick="window.close()" style="padding: 12px 24px; background-color: #7b7d7d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-left: 10px;">
                    <i class="fas fa-times"></i> Cerrar
                </button>
                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                    <strong>Para guardar como PDF:</strong> En la ventana de impresión, seleccione "Guardar como PDF" como destino
                </p>
            </div>

            <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"><\/script>
        </body>
        </html>
    `);
    
    ventanaImpresion.document.close();
});

// Evento para descargar como PDF usando jsPDF y html2canvas
downloadBtn.addEventListener('click', async () => {
    if (!certificadoGenerado) {
        showMessage('Primero debe generar un certificado', 'error');
        return;
    }
    
    try {
        showMessage('Generando PDF...', 'info');
        
        // Verificar si las librerías están cargadas
        if (typeof html2canvas === 'undefined' || typeof jsPDF === 'undefined') {
            // Cargar librerías dinámicamente
            await cargarLibreriasPDF();
        }
        
        await generarPDF();
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showMessage('Error al generar PDF. Asegúrese de tener conexión a internet.', 'error');
    }
});

// Función para cargar librerías de PDF
function cargarLibreriasPDF() {
    return new Promise((resolve, reject) => {
        // Verificar si ya están cargadas
        if (typeof html2canvas !== 'undefined' && typeof jsPDF !== 'undefined') {
            resolve();
            return;
        }
        
        // Cargar html2canvas
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script1.onload = () => {
            // Cargar jsPDF
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script2.onload = () => {
                resolve();
            };
            script2.onerror = () => reject(new Error('Error al cargar jsPDF'));
            document.head.appendChild(script2);
        };
        script1.onerror = () => reject(new Error('Error al cargar html2canvas'));
        document.head.appendChild(script1);
    });
}

// Función para generar PDF con logo - usando html2pdf para mejor compatibilidad
async function generarPDF() {
    try {
        const elemento = certificatePreview;
        
        // Usar html2pdf.js si está disponible (es la mejor opción)
        if (window.html2pdf) {
            const opt = {
                margin: [15, 15, 15, 15],
                filename: `Certificado_Garantia_${document.getElementById('cedula').value}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                },
                jsPDF: { 
                    orientation: 'portrait', 
                    unit: 'mm', 
                    format: 'letter',
                    compress: true
                },
                pagebreak: { 
                    mode: ['css', 'legacy'],
                    before: '.page-break',
                    avoid: ['tr', 'td', 'th', '.data-table', 'table']
                }
            };
            
            // Generar el PDF
            await html2pdf().set(opt).from(elemento).save();
            showMessage('PDF descargado correctamente', 'success');
            return;
        }
        
        // Fallback a html2canvas + jsPDF si html2pdf no está disponible
        if (typeof html2canvas === 'undefined') {
            throw new Error('Las librerías de PDF no están disponibles');
        }
        
        const jsPDFClass = window.jspdf?.jsPDF || window.jsPDF;
        if (!jsPDFClass) {
            throw new Error('jsPDF no está disponible');
        }
        
        // Crear contenedor temporal con ancho fijo para mejor renderizado
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '210mm'; 
        tempContainer.style.padding = '20px';
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        
        const clone = elemento.cloneNode(true);
        tempContainer.appendChild(clone);
        document.body.appendChild(tempContainer);
        
        try {
            // Convertir a canvas con mejor configuración
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: tempContainer.scrollWidth,
                windowHeight: tempContainer.scrollHeight
            });
            
            // Configurar PDF
            const pdf = new jsPDFClass({
                orientation: 'portrait',
                unit: 'mm',
                format: 'letter',
                compress: true
            });
            
            // Dimensiones de la página letter en mm
            const pageWidth = 215.9; // letter width in mm
            const pageHeight = 279.4; // letter height in mm
            const margin = 10;
            const contentWidth = pageWidth - (margin * 2);
            
            // Calcular altura de la imagen basada en el ancho
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Convertir canvas a imagen
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            let heightLeft = imgHeight;
            let position = 0;
            let isFirstPage = true;
            
            // Agregar páginas mientras haya contenido
            while (heightLeft >= 0) {
                if (!isFirstPage) {
                    pdf.addPage();
                }
                
                // Calcular la altura visible en esta página
                const visibleHeight = isFirstPage ? 
                    (pageHeight - (margin * 2)) : 
                    (pageHeight - (margin * 2));
                
                pdf.addImage(
                    imgData, 
                    'JPEG', 
                    margin, 
                    margin - position, 
                    imgWidth, 
                    imgHeight
                );
                
                heightLeft -= visibleHeight;
                position += visibleHeight;
                isFirstPage = false;
            }
            
            // Guardar el PDF
            const nombreArchivo = `Certificado_Garantia_${document.getElementById('cedula').value}.pdf`;
            pdf.save(nombreArchivo);
            
            showMessage('PDF descargado correctamente', 'success');
            
        } finally {
            document.body.removeChild(tempContainer);
        }
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showMessage(`Error al generar PDF: ${error.message}`, 'error');
        throw error;
    }
}

// Función para buscar vehículo por placa
async function buscarVehiculoPorPlaca() {
    const placaInput = document.getElementById('placa');
    const placa = placaInput.value.trim();
    
    if (!placa) return;
    
    try {
        showMessage('Buscando vehículo...', 'info');
        const vehiculo = await obtenerVehiculoPorPlaca(placa);
        
        if (vehiculo) {
            cargarDatosVehiculo(vehiculo);
            showMessage('Vehículo encontrado y datos cargados', 'success');
        }
        
    } catch (error) {
        console.error('Error al buscar vehículo:', error);
    }
}

// Escuchar cambios en el campo de placa
document.getElementById('placa').addEventListener('blur', buscarVehiculoPorPlaca);

// Inicialización
window.addEventListener('DOMContentLoaded', () => {
    console.log('Sistema de certificados cargado');
});