document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos de la interfaz ---
    const metodoSelector = document.getElementById('metodo-selector');
    const calculadoraSection = document.getElementById('calculadora-section');
    const backButton = document.getElementById('back-button');

    const metodoTitulo = document.getElementById('metodo-titulo');
    const metodoSeleccionadoHidden = document.getElementById('metodo-seleccionado-hidden');

    const form = document.getElementById('calculadora-form');
    const valorActivoInput = document.getElementById('valorActivo');
    const vidaUtilInput = document.getElementById('vidaUtil');
    const valorSalvamentoInput = document.getElementById('valorSalvamento');
    const groupValorSalvamento = document.getElementById('group-valorSalvamento');

    const camposUnidades = document.getElementById('campos-unidades');
    const unidadesTotalesInput = document.getElementById('unidadesTotales');
    const produccionAnualInput = document.getElementById('produccionAnual');
    
    const resultadoDiv = document.getElementById('resultado-tabla');
    const tituloTabla = document.getElementById('titulo-tabla');
    const errorDiv = document.getElementById('error-mensaje');

    let currentMetodo = '';

    const nombresMetodos = {
        lineaRecta: "Línea Recta",
        sumaDigitos: "Suma de los Dígitos del Año",
        saldosDecrecientes: "Reducción de Saldos",
        unidadesProduccion: "Unidades de Producción"
    };
    function limpiarNumero(string) {
        if (!string || typeof string !== 'string') return NaN;
        const numeroLimpio = string.replace(/\./g, '').replace(/,/g, '.');
        return parseFloat(numeroLimpio);
    }

    metodoSelector.addEventListener('click', (event) => {
        const card = event.target.closest('.card');
        if (card) {
            currentMetodo = card.dataset.metodo;
            metodoSeleccionadoHidden.value = currentMetodo;
            metodoTitulo.textContent = `Calcular por ${nombresMetodos[currentMetodo]}`;
            mostrarCalculadora(currentMetodo);
        }
    });

    backButton.addEventListener('click', () => {
        form.reset();
        resultadoDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');
        errorDiv.innerHTML = '';
        calculadoraSection.classList.add('hidden');
        metodoSelector.classList.remove('hidden');
    });

    function mostrarCalculadora(metodo) {
        metodoSelector.classList.add('hidden');
        calculadoraSection.classList.remove('hidden');

        groupValorSalvamento.classList.add('hidden');
        valorSalvamentoInput.removeAttribute('required');
        camposUnidades.classList.add('hidden');
        unidadesTotalesInput.removeAttribute('required');
        produccionAnualInput.removeAttribute('required');

        if (metodo === 'saldosDecrecientes') {
            groupValorSalvamento.classList.remove('hidden');
            valorSalvamentoInput.setAttribute('required', 'true');
        } else if (metodo === 'unidadesProduccion') {
            camposUnidades.classList.remove('hidden');
            unidadesTotalesInput.setAttribute('required', 'true');
            produccionAnualInput.setAttribute('required', 'true');
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        resultadoDiv.innerHTML = '';
        errorDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');

        const valorActivo = limpiarNumero(valorActivoInput.value);
        const vidaUtil = parseInt(limpiarNumero(vidaUtilInput.value)); // Vida útil es un entero
        const valorSalvamento = limpiarNumero(valorSalvamentoInput.value) || 0;
        
        const unidadesTotales = limpiarNumero(unidadesTotalesInput.value);
        const produccionAnualStr = produccionAnualInput.value;
        
        const produccionAnual = produccionAnualStr.split(',')
                                    .map(item => limpiarNumero(item.trim())) 
                                    .filter(num => !isNaN(num) && num > 0);
        
        if (isNaN(valorActivo) || valorActivo <= 0) {
             errorDiv.textContent = 'Por favor, introduce un Valor de Activo válido.';
             return;
        }
        if (isNaN(vidaUtil) || vidaUtil <= 0) {
             errorDiv.textContent = 'Por favor, introduce una Vida Útil válida.';
             return;
        }

        if (currentMetodo === 'saldosDecrecientes' && (isNaN(valorSalvamento) || valorSalvamento <= 0)) {
            errorDiv.textContent = 'El Valor de Salvamento es requerido y debe ser mayor a 0 para Reducción de Saldos.';
            return;
        }
        if (currentMetodo === 'unidadesProduccion') {
            if (isNaN(unidadesTotales) || unidadesTotales <= 0) {
                errorDiv.textContent = 'La Capacidad Total es requerida y debe ser mayor a 0.';
                return;
            }
            if (produccionAnual.length === 0) {
                errorDiv.textContent = 'La Producción por Año es requerida. Ej: 2.000, 2.500';
                return;
            }
        }
        
        try {
            const response = await fetch('/calcular', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    metodo: currentMetodo,
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

            mostrarTabla(data, currentMetodo);

        } catch (error) {
            errorDiv.textContent = error.message;
        }
    });

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

        // Formateadores para 'es-EC' (Puntos para miles, coma para decimal)
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
                tableHTML += `<td>${formatterUnidad.format(row.costoPorUnidad)}</td>`; 
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