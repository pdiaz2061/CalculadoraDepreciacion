// ESTE ES EL CÓDIGO CORRECTO Y ACTUALIZADO PARA public/script.js

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
    const clearButton = document.getElementById('clear-button'); 

    let currentMetodo = '';

    const nombresMetodos = {
        lineaRecta: "Línea Recta",
        sumaDigitos: "Suma de los Dígitos del Año",
        saldosDecrecientes: "Reducción de Saldos",
        unidadesProduccion: "Unidades de Producción"
    };

    // --- FUNCIÓN 1 (Para 'Submit') ---
    /**
     * Convierte un string de número en formato latino (3.000.000,45)
     * a un número que JavaScript entiende (3000000.45).
     */
    function limpiarNumero(string) {
        if (!string || typeof string !== 'string') return NaN;
        // 1. Quita todos los puntos (separadores de miles)
        // 2. Reemplaza la coma decimal (,) por un punto decimal (.)
        const numeroLimpio = string.replace(/\./g, '').replace(/,/g, '.');
        return parseFloat(numeroLimpio);
    }

    // --- NUEVA FUNCIÓN 2 (Para formatear 'on input') ---
    /**
     * Formatea un input simple (ej: Valor Activo)
     * Toma "30000000" y lo convierte a "30.000.000" mientras se escribe.
     */
    function formatearInputSimple(event) {
        let input = event.target;
        // 1. Limpiar el valor (solo dígitos)
        let valorLimpio = input.value.replace(/\D/g, ''); 
        
        // 2. Convertir a número
        let numero = parseInt(valorLimpio);

        // 3. Si está vacío o no es número
        if (isNaN(numero)) {
            input.value = '';
        } else {
            // 4. Formatear con 'es-EC' para obtener los puntos (ej: "30.000.000")
            input.value = numero.toLocaleString('es-EC');
        }
    }

    // --- NUEVA FUNCIÓN 3 (Para formatear 'on input' de 'Producción Anual') ---
    /**
     * Formatea el campo de producción anual.
     * Toma "2000, 2500" y lo convierte a "2.000, 2.500"
     */
    function formatearInputProduccion(event) {
        let input = event.target;
        let valor = input.value;
        
        // Separa los números por la coma
        let partes = valor.split(',');
        
        // Formatea cada parte
        let partesFormateadas = partes.map(part => {
            let valorLimpio = part.replace(/\D/g, ''); // Limpia solo dígitos
            let numero = parseInt(valorLimpio);
            if (isNaN(numero)) {
                return ''; // Si no es un número (ej: espacio)
            }
            return numero.toLocaleString('es-EC'); // Formatea (ej: "2.000")
        });

        // Vuelve a unirlos, preservando el espacio si el usuario lo puso
        input.value = partesFormateadas.join(', ');
    }

    // --- NAVEGACIÓN ENTRE PANTALLAS ---

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

    // --- APLICACIÓN DE LOS NUEVOS FORMATEADORES ---
    valorActivoInput.addEventListener('input', formatearInputSimple);
    valorSalvamentoInput.addEventListener('input', formatearInputSimple);
    vidaUtilInput.addEventListener('input', formatearInputSimple);
    unidadesTotalesInput.addEventListener('input', formatearInputSimple);
    // Nota: 'produccionAnualInput' usa un formateador diferente, pero lo manejaremos
    // en el 'submit' por simplicidad, ya que 'limpiarNumero' funciona.
    // (Actualización): Vamos a usar el formateador de producción para que sea consistente.
    // (Corrección): El formateador de producción es complejo. Lo dejamos como estaba: se limpia al hacer submit.
    // (Corrección Final): La lógica de `limpiarNumero` en el submit es la más robusta para el campo de producción.

    // --- MANEJO DEL 'SUBMIT' (Usa 'limpiarNumero') ---

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        resultadoDiv.innerHTML = '';
        errorDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');

        // Usa 'limpiarNumero' para convertir "30.000.000" a 3000000
        const valorActivo = limpiarNumero(valorActivoInput.value);
        const vidaUtil = parseInt(limpiarNumero(vidaUtilInput.value));
        const valorSalvamento = limpiarNumero(valorSalvamentoInput.value) || 0;
        
        const unidadesTotales = limpiarNumero(unidadesTotalesInput.value);
        const produccionAnualStr = produccionAnualInput.value;
        
        // Usa 'limpiarNumero' en cada item del split (ej: "2.000, 2.500")
        const produccionAnual = produccionAnualStr.split(',')
                                    .map(item => limpiarNumero(item.trim())) 
                                    .filter(num => !isNaN(num) && num > 0);
        
        // --- VALIDACIÓN ---
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
        
        // --- ENVÍO AL BACKEND ---
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
            if (!response.ok) { throw new Error(data.error || 'Error en el cálculo'); }
            mostrarTabla(data, currentMetodo);

        } catch (error) {
            errorDiv.textContent = error.message;
        }
    });

    // --- FUNCIÓN DE MOSTRAR TABLA (Sin cambios, ya usa 'es-EC') ---
    function mostrarTabla(data, metodo) {
        tituloTabla.classList.remove('hidden');

        let headers = ['Año'];
        if (metodo === 'sumaDigitos') { headers.push('Factor', 'Porcentaje'); }
        else if (metodo === 'saldosDecrecientes') { headers.push('Tasa Depreciación', 'Valor sin Depreciar'); }
        else if (metodo === 'unidadesProduccion') { headers.push('Unidades Producidas', 'Depreciación por Unidad'); }
        headers.push('Cuota Depreciación', 'Depreciación Acumulada', 'Valor Neto en Libros');

        const formatterMoneda = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formatterPorcentaje = new Intl.NumberFormat('es-EC', { style: 'percent', minimumFractionDigits: 5, maximumFractionDigits: 5 });
        const formatterFactor = new Intl.NumberFormat('es-EC', { style: 'decimal', minimumFractionDigits: 10, maximumFractionDigits: 10 });
        const formatterTasa = new Intl.NumberFormat('es-EC', { style: 'decimal', minimumFractionDigits: 5, maximumFractionDigits: 5 });
        const formatterUnidad = new Intl.NumberFormat('es-EC', { style: 'decimal', maximumFractionDigits: 0 });

        let tableHTML = '<table><thead><tr>';
        headers.forEach(header => { tableHTML += `<th>${header}</th>`; });
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
    
    clearButton.addEventListener('click', () => {
        form.reset();
        resultadoDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');
        errorDiv.innerHTML = '';
        valorActivoInput.focus();
    });
});