document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos de la interfaz ---
    const metodoSelector = document.getElementById('metodo-selector'); // La sección con las 4 tarjetas
    const calculadoraSection = document.getElementById('calculadora-section'); // La sección de la calculadora
    const backButton = document.getElementById('back-button'); // Botón para volver

    const metodoTitulo = document.getElementById('metodo-titulo'); // Título del método en la calculadora
    const metodoSeleccionadoHidden = document.getElementById('metodo-seleccionado-hidden'); // Campo oculto para el método

    const form = document.getElementById('calculadora-form');
    const valorActivoInput = document.getElementById('valorActivo');
    const vidaUtilInput = document.getElementById('vidaUtil');
    const valorSalvamentoInput = document.getElementById('valorSalvamento');
    const groupValorSalvamento = document.getElementById('group-valorSalvamento'); // El div que contiene el input de salvamento

    const camposUnidades = document.getElementById('campos-unidades');
    const unidadesTotalesInput = document.getElementById('unidadesTotales');
    const produccionAnualInput = document.getElementById('produccionAnual');
    
    const resultadoDiv = document.getElementById('resultado-tabla');
    const tituloTabla = document.getElementById('titulo-tabla');
    const errorDiv = document.getElementById('error-mensaje');

    let currentMetodo = ''; // Para guardar el método actualmente seleccionado

    // --- Mapeo de métodos para nombres amigables ---
    const nombresMetodos = {
        lineaRecta: "Línea Recta",
        sumaDigitos: "Suma de los Dígitos del Año",
        saldosDecrecientes: "Reducción de Saldos",
        unidadesProduccion: "Unidades de Producción"
    };

    // --- Event Listener para la selección de método ---
    metodoSelector.addEventListener('click', (event) => {
        const card = event.target.closest('.card'); // Encuentra la tarjeta clicada
        if (card) {
            currentMetodo = card.dataset.metodo; // Obtiene el valor de 'data-metodo'
            metodoSeleccionadoHidden.value = currentMetodo; // Guarda el método en el input oculto
            metodoTitulo.textContent = `Calcular por ${nombresMetodos[currentMetodo]}`; // Actualiza el título
            
            mostrarCalculadora(currentMetodo); // Muestra la calculadora
        }
    });

    // --- Event Listener para el botón de volver ---
    backButton.addEventListener('click', () => {
        // Limpiar formulario y resultados al volver
        form.reset();
        resultadoDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');
        errorDiv.innerHTML = '';
        
        calculadoraSection.classList.add('hidden'); // Oculta la calculadora
        metodoSelector.classList.remove('hidden'); // Muestra la selección de métodos
    });


    // --- Función para mostrar/ocultar campos específicos del formulario ---
    function mostrarCalculadora(metodo) {
        metodoSelector.classList.add('hidden'); // Oculta las tarjetas
        calculadoraSection.classList.remove('hidden'); // Muestra la sección de la calculadora

        // Resetear visibilidad de campos
        groupValorSalvamento.classList.add('hidden');
        valorSalvamentoInput.removeAttribute('required');
        camposUnidades.classList.add('hidden');
        unidadesTotalesInput.removeAttribute('required');
        produccionAnualInput.removeAttribute('required');

        // Configurar campos según el método
        if (metodo === 'saldosDecrecientes') {
            groupValorSalvamento.classList.remove('hidden');
            valorSalvamentoInput.setAttribute('required', 'true');
        } else if (metodo === 'unidadesProduccion') {
            camposUnidades.classList.remove('hidden');
            unidadesTotalesInput.setAttribute('required', 'true');
            produccionAnualInput.setAttribute('required', 'true');
        }
    }


    // --- Manejar el envío del formulario (casi igual que antes) ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evita que la página se recargue

        // Limpiar resultados anteriores
        resultadoDiv.innerHTML = '';
        errorDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');

        // Obtener valores
        const valorActivo = parseFloat(valorActivoInput.value);
        const vidaUtil = parseInt(vidaUtilInput.value);
        const valorSalvamento = parseFloat(valorSalvamentoInput.value) || 0; // Si no hay, es 0
        
        // Valores específicos de Unidades de Producción
        const unidadesTotales = parseFloat(unidadesTotalesInput.value);
        const produccionAnualStr = produccionAnualInput.value;
        
        // Convertir el string '2000, 2500' en un array de números [2000, 2500]
        const produccionAnual = produccionAnualStr.split(',')
                                    .map(item => parseFloat(item.trim()))
                                    .filter(num => !isNaN(num) && num > 0);
        
        // Validar campos requeridos específicos para cada método
        if (currentMetodo === 'saldosDecrecientes' && (isNaN(valorSalvamento) || valorSalvamento <= 0)) {
            errorDiv.textContent = 'El Valor de Salvamento es requerido y debe ser mayor a 0 para Reducción de Saldos.';
            return;
        }
        if (currentMetodo === 'unidadesProduccion') {
            if (isNaN(unidadesTotales) || unidadesTotales <= 0) {
                errorDiv.textContent = 'La Capacidad Total es requerida y debe ser mayor a 0 para Unidades de Producción.';
                return;
            }
            if (produccionAnual.length === 0) {
                errorDiv.textContent = 'La Producción por Año es requerida y debe ser una lista de números válidos.';
                return;
            }
        }


        // Enviar datos al backend
        try {
            const response = await fetch('/calcular', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    metodo: currentMetodo, // Usamos el método guardado
                    valorActivo,
                    vidaUtil,
                    valorSalvamento,
                    produccionAnual,
                    unidadesTotales
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }

            mostrarTabla(data, currentMetodo); // Pasamos el método actual a la función

        } catch (error) {
            errorDiv.textContent = error.message;
        }
    });

    // --- Función para dibujar la tabla en el HTML (igual que antes) ---
    function mostrarTabla(data, metodo) {
        tituloTabla.classList.remove('hidden');

        let headers = ['Año'];
        
        if (metodo === 'sumaDigitos') {
            headers.push('Factor', 'Porcentaje');
        } else if (metodo === 'saldosDecrecientes') {
            headers.push('Tasa Depreciación', 'Valor sin Depreciar');
        } else if (metodo === 'unidadesProduccion') {
            headers.push('Unidades Producidas', 'Depreciación por Unidad');
        }
        
        headers.push('Cuota Depreciación', 'Depreciación Acumulada', 'Valor Neto en Libros');

        const formatterMoneda = new Intl.NumberFormat('es-EC', {
            style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
        });
        const formatterPorcentaje = new Intl.NumberFormat('es-EC', {
            style: 'percent', minimumFractionDigits: 5, maximumFractionDigits: 5
        });
        const formatterFactor = new Intl.NumberFormat('es-EC', {
            style: 'decimal', minimumFractionDigits: 10, maximumFractionDigits: 10
        });
        const formatterTasa = new Intl.NumberFormat('es-EC', {
            style: 'decimal', minimumFractionDigits: 5, maximumFractionDigits: 5
        });
        const formatterUnidad = new Intl.NumberFormat('es-EC', {
            style: 'decimal', maximumFractionDigits: 0
        });

        let tableHTML = '<table><thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        data.forEach(row => {
            tableHTML += '<tr>';
            tableHTML += `<td>${row.ano}</td>`;

            if (metodo === 'sumaDigitos') {
                tableHTML += `<td>${formatterFactor.format(row.factor)}</td>`;
                tableHTML += `<td>${formatterPorcentaje.format(row.porcentaje)}</td>`;
            } else if (metodo === 'saldosDecrecientes') {
                tableHTML += `<td>${formatterTasa.format(row.tasa)}</td>`;
                tableHTML += `<td>${formatterMoneda.format(row.valorSinDepreciar)}</td>`;
            } else if (metodo === 'unidadesProduccion') {
                tableHTML += `<td>${formatterUnidad.format(row.unidades)}</td>`;
                tableHTML += `<td>${formatterMoneda.format(row.costoPorUnidad)}</td>`;
            }

            tableHTML += `<td>${formatterMoneda.format(row.cuota)}</td>`;
            tableHTML += `<td>${formatterMoneda.format(row.acumulada)}</td>`;
            
            const valorNetoFormateado = (row.valorNeto < 0.001 && row.valorNeto > -0.001) ? 0.00 : row.valorNeto;
            tableHTML += `<td>${formatterMoneda.format(valorNetoFormateado)}</td>`;
            
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        resultadoDiv.innerHTML = tableHTML;
    }
});