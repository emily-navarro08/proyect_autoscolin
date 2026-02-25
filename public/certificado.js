// certificado.js

// Configuración de API
const API_BASE_URL = '/api';

// Elementos DOM
const searchCedula = document.getElementById('searchCedula');
const searchBtn = document.getElementById('searchBtn');
const garantiaForm = document.getElementById('garantiaForm');
const clearBtn = document.getElementById('clearBtn');
const printBtn = document.getElementById('printBtn');
const certificatePreview = document.getElementById('certificatePreview');
const messageAlert = document.getElementById('messageAlert');

// Variables globales
let datosClienteActual = null;
let datosVehiculoActual = null;
let certificadoGenerado = false;
let vehiculosCliente = [];

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

// Función para crear el selector de vehículos
function crearSelectorVehiculos(vehiculos) {
    // Guardar la lista de vehículos globalmente
    vehiculosCliente = vehiculos;
    
    // Verificar si ya existe el selector, si no, crearlo
    let selectorContainer = document.getElementById('vehiculosSelectorContainer');
    
    if (!selectorContainer) {
        // Crear el contenedor del selector
        selectorContainer = document.createElement('div');
        selectorContainer.id = 'vehiculosSelectorContainer';
        selectorContainer.className = 'vehiculos-selector';
        selectorContainer.style.cssText = `
            background: #f8f7ff;
            border: 1px solid #e5e0ff;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            animation: slideDown 0.3s ease;
        `;
        
        // Agregar estilos para la animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
        
        // Crear el título
        const titulo = document.createElement('h4');
        titulo.innerHTML = '<i class="fas fa-car" style="color: #7c3aed;"></i> Seleccione el vehículo para el certificado:';
        titulo.style.cssText = `
            margin: 0 0 15px 0;
            color: #1a5276;
            font-size: 1.1rem;
        `;
        
        // Crear el select
        const select = document.createElement('select');
        select.id = 'vehiculosCliente';
        select.className = 'form-control';
        select.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e0ff;
            border-radius: 8px;
            font-size: 1rem;
            margin-bottom: 15px;
            background: white;
            cursor: pointer;
        `;
        
        // Crear el botón de carga
        const cargarBtn = document.createElement('button');
        cargarBtn.id = 'cargarVehiculoBtn';
        cargarBtn.className = 'btn btn-search';
        cargarBtn.innerHTML = '<i class="fas fa-check"></i> Cargar datos del vehículo seleccionado';
        cargarBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            font-size: 1rem;
        `;
        
        // Agregar elementos al contenedor
        selectorContainer.appendChild(titulo);
        selectorContainer.appendChild(select);
        selectorContainer.appendChild(cargarBtn);
        
        // Insertar el selector después del contenedor de búsqueda
        const searchContainer = document.querySelector('.search-container');
        searchContainer.parentNode.insertBefore(selectorContainer, searchContainer.nextSibling);
        
        // Agregar event listener al botón
        cargarBtn.addEventListener('click', cargarVehiculoSeleccionado);
    }
    
    // Obtener el select y llenarlo con los vehículos
    const selectVehiculos = document.getElementById('vehiculosCliente');
    selectVehiculos.innerHTML = '<option value="">-- Seleccione un vehículo --</option>';
    
    vehiculos.forEach((vehiculo, index) => {
        const option = document.createElement('option');
        option.value = index; // Usamos el índice como valor
        option.textContent = `${vehiculo.PLACA} - ${vehiculo.marca_nombre || 'Sin marca'} ${vehiculo.MODELO || ''} (${vehiculo.ESTILO || 'Sin estilo'})`;
        
        // Agregar data-atributos con la información del vehículo
        option.dataset.placa = vehiculo.PLACA || '';
        option.dataset.marca = vehiculo.marca_nombre || '';
        option.dataset.modelo = vehiculo.MODELO || '';
        option.dataset.estilo = vehiculo.ESTILO || '';
        option.dataset.color = vehiculo.color_nombre || '';
        option.dataset.motor = vehiculo.MOTOR || '';
        option.dataset.chasis = vehiculo.CHASIS || '';
        option.dataset.transmision = vehiculo.transmision_nombre || '';
        option.dataset.combustible = vehiculo.combustible_nombre || '';
        option.dataset.carroceria = vehiculo.CARROCERIA || '';
        option.dataset.kilometraje = vehiculo.KILOMETRAJE_ACTUAL || '';
        option.dataset.cc = vehiculo.C_C || '';
        option.dataset.cilindros = vehiculo.CILINDROS || '';
        option.dataset.traccion = vehiculo.TRACCION || '';
        
        selectVehiculos.appendChild(option);
    });
    
    // Mostrar el selector
    selectorContainer.style.display = 'block';
    
    // Si solo hay un vehículo, seleccionarlo automáticamente
    if (vehiculos.length === 1) {
        selectVehiculos.value = '0';
        cargarVehiculoSeleccionado();
    }
}

// Función para cargar el vehículo seleccionado
function cargarVehiculoSeleccionado() {
    const selectVehiculos = document.getElementById('vehiculosCliente');
    const selectedOption = selectVehiculos.options[selectVehiculos.selectedIndex];
    
    if (!selectedOption || !selectedOption.value) {
        showMessage('Por favor seleccione un vehículo', 'warning');
        return;
    }
    
    // Obtener los datos del vehículo desde los data-atributos
    const vehiculo = {
        PLACA: selectedOption.dataset.placa,
        marca_nombre: selectedOption.dataset.marca,
        MODELO: selectedOption.dataset.modelo,
        ESTILO: selectedOption.dataset.estilo,
        color_nombre: selectedOption.dataset.color,
        MOTOR: selectedOption.dataset.motor,
        CHASIS: selectedOption.dataset.chasis,
        transmision_nombre: selectedOption.dataset.transmision,
        combustible_nombre: selectedOption.dataset.combustible,
        CARROCERIA: selectedOption.dataset.carroceria,
        KILOMETRAJE_ACTUAL: selectedOption.dataset.kilometraje,
        C_C: selectedOption.dataset.cc,
        CILINDROS: selectedOption.dataset.cilindros,
        TRACCION: selectedOption.dataset.traccion
    };
    
    cargarDatosVehiculo(vehiculo);
    showMessage(`Vehículo ${vehiculo.PLACA} cargado correctamente`, 'success');
}

// Función para cargar datos del cliente
async function cargarDatosCliente(clienteData) {
    try {
        datosClienteActual = clienteData.cliente;
        
        // Cargar datos del cliente en el formulario
        document.getElementById('nombreCliente').value = datosClienteActual.NOMBRE_COMPLETO || '';
        document.getElementById('cedula').value = datosClienteActual.IDENTIFICACION || '';
        
        // Si el cliente tiene vehículos, mostrar el selector
        if (clienteData.vehiculos && clienteData.vehiculos.length > 0) {
            crearSelectorVehiculos(clienteData.vehiculos);
            showMessage(`Cliente ${datosClienteActual.NOMBRE_COMPLETO} encontrado. ${clienteData.vehiculos.length} vehículo(s) disponible(s).`, 'success');
        } else {
            // Ocultar selector si existe
            const selectorContainer = document.getElementById('vehiculosSelectorContainer');
            if (selectorContainer) {
                selectorContainer.style.display = 'none';
            }
            showMessage(`Cliente encontrado pero no tiene vehículos registrados.`, 'warning');
        }
        
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
    
    // Actualizar vista previa
    actualizarVistaPrevia();
}

// Función para actualizar la vista previa
function actualizarVistaPrevia() {
    document.getElementById('previewMarca').textContent = document.getElementById('marca').value || '-';
    document.getElementById('previewModelo').textContent = document.getElementById('modelo').value || '-';
    document.getElementById('previewPlaca').textContent = document.getElementById('placa').value || '-';
    document.getElementById('previewCliente').textContent = document.getElementById('nombreCliente').value || '[Nombre del cliente]';
    document.getElementById('previewCedula').textContent = document.getElementById('cedula').value || '[Número de cédula]';
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
        // Ocultar selector de vehículos si hay error
        const selectorContainer = document.getElementById('vehiculosSelectorContainer');
        if (selectorContainer) {
            selectorContainer.style.display = 'none';
        }
    }
});

// Evento para limpiar formulario
clearBtn.addEventListener('click', () => {
    garantiaForm.reset();
    datosClienteActual = null;
    datosVehiculoActual = null;
    certificadoGenerado = false;
    vehiculosCliente = [];
    
    // Ocultar y eliminar el selector de vehículos
    const selectorContainer = document.getElementById('vehiculosSelectorContainer');
    if (selectorContainer) {
        selectorContainer.remove();
    }
    
    // Limpiar vista previa
    document.getElementById('previewMarca').textContent = '-';
    document.getElementById('previewModelo').textContent = '-';
    document.getElementById('previewPlaca').textContent = '-';
    document.getElementById('previewCliente').textContent = '[Nombre del cliente]';
    document.getElementById('previewCedula').textContent = '[Número de cédula]';
    
    printBtn.disabled = true;
    certificadoGenerado = false;
    
    showMessage('Formulario limpiado correctamente.', 'success');
});

// Función para generar el certificado HTML completo
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
    <div class="certificate">
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

// Evento para enviar el formulario
garantiaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // Obtener valores del formulario
        const nombreCliente = document.getElementById('nombreCliente').value;
        const cedula = document.getElementById('cedula').value;
        const marca = document.getElementById('marca').value;
        const modelo = document.getElementById('modelo').value;
        const placa = document.getElementById('placa').value;
        
        // Validar campos requeridos
        if (!nombreCliente || !cedula || !marca || !modelo || !placa) {
            showMessage('Por favor complete todos los campos requeridos (*)', 'error');
            return;
        }
        
        const datosCertificado = {
            nombreCliente,
            cedula,
            marca,
            modelo,
            estilo: document.getElementById('estilo').value,
            traccion: document.getElementById('traccion').value,
            color: document.getElementById('color').value,
            motor: document.getElementById('motor').value,
            chasis: document.getElementById('chasis').value,
            transmision: document.getElementById('transmision').value,
            combustible: document.getElementById('combustible').value,
            carroceria: document.getElementById('carroceria').value,
            kilometraje: document.getElementById('kilometraje').value,
            placa,
            cc: document.getElementById('cc').value,
            cilindrados: document.getElementById('cilindrados').value
        };
        
        // Generar HTML del certificado
        const certificadoHTML = generarCertificadoHTML(datosCertificado);
        certificatePreview.innerHTML = certificadoHTML;
        
        certificadoGenerado = true;
        printBtn.disabled = false;
        
        showMessage('Certificado generado correctamente.', 'success');
        
    } catch (error) {
        console.error('Error al generar certificado:', error);
        showMessage('Error al generar certificado', 'error');
    }
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
                }
                body { 
                    font-family: 'Times New Roman', Times, serif; 
                    line-height: 1.5; 
                    color: #000; 
                    margin: 0;
                    padding: 20px;
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
                .certificate-header h2 {
                    text-decoration: underline;
                }
                .company-name { font-weight: bold; }
                .data-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0; 
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
                }
                .signature-section { 
                    margin-top: 40px; 
                    text-align: center; 
                    padding-top: 20px; 
                    border-top: 1px solid #000; 
                }
                @media print {
                    body { font-size: 12pt; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${contenido}
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print();window.close()" style="padding: 10px 20px; background: #1a5276; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Imprimir
                </button>
            </div>
        </body>
        </html>
    `);
    
    ventanaImpresion.document.close();
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sistema de certificados cargado');
    
    // Permitir buscar con Enter
    searchCedula.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

});
