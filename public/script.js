document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos de la interfaz ---
    const metodoSelector = document.getElementById('metodo-selector');
    const calculadoraSection = document.getElementById('calculadora-section');
    const backButton = document.getElementById('back-button');

    const metodoTitulo = document.getElementById('metodo-titulo');
    const metodoSeleccionadoHidden = document.getElementById('metodo-seleccionado-hidden');
    const footerNav = document.querySelector('.footer-nav'); 
    const form = document.getElementById('calculadora-form');
    // --- ELEMENTOS DE IVA ---
    const ivaToggle = document.getElementById('iva-toggle-checkbox');
    const valorSinIVAInput = document.getElementById('valorSinIVA');
    const valorConIVAInput = document.getElementById('valorConIVA');
    const porcentajeIVAInput = document.getElementById('porcentajeIVA');
    const montoIVADisplay = document.getElementById('montoIVA-display');
    const vidaUtilInput = document.getElementById('vidaUtil');
    // --- ELEMENTOS DE SALVAMENTO ---
    const groupValorSalvamento = document.getElementById('group-valorSalvamento');
    const valorSalvamentoInput = document.getElementById('valorSalvamento');
    // --- ELEMENTOS DE UNIDADES DE PRODUCCIÓN ---
    const camposUnidades = document.getElementById('campos-unidades');
    const unidadesTotalesInput = document.getElementById('unidadesTotales');
    const numPeriodosInput = document.getElementById('numPeriodos');
    const dynamicFieldsContainer = document.getElementById('dynamic-production-fields');
    const resultadoDiv = document.getElementById('resultado-tabla');
    const tituloTabla = document.getElementById('titulo-tabla');
    const errorDiv = document.getElementById('error-mensaje');
    const clearButton = document.getElementById('clear-button');
    const exportExcelButton = document.getElementById('export-excel-button');
    let currentMetodo = '';
    let rawTableData = []; 
    
    const nombresMetodos = {
        lineaRecta: "Línea Recta",
        sumaDigitos: "Suma de los Dígitos del Año",
        saldosDecrecientes: "Reducción de Saldos",
        unidadesProduccion: "Unidades de Producción"
    };

    // --- FUNCIONES DE FORMATO Y CONVERSIÓN ---

    function limpiarNumero(string) {
        if (!string || typeof string !== 'string') return NaN;
        const numeroLimpio = string.replace(/\./g, '').replace(/,/g, '.');
        return parseFloat(numeroLimpio);
    }
    
    const formatterInput = new Intl.NumberFormat('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const formatterMoneda = new Intl.NumberFormat('es-EC', {
        style: 'currency', currency: 'USD',
    });

    function formatearInputSimple(event) {
        let input = event.target;
        let valorLimpioEntero = input.value.replace(/\D/g, ''); 
        let numeroEntero = parseInt(valorLimpioEntero);
        if (isNaN(numeroEntero)) {
            input.value = '';
        } else {
            input.value = numeroEntero.toLocaleString('es-EC');
        }
    }
    
    function formatearInputDecimal(event) {
        let input = event.target;
        let valor = input.value;
        let valorLimpio = valor.replace(/\./g, '').replace(/,/g, '.');
        valorLimpio = valorLimpio.replace(/[^\d.]/g, '');
        let partes = valorLimpio.split('.');
        if (partes.length > 2) {
            valorLimpio = partes[0] + '.' + partes.slice(1).join('');
        }
        input.value = valorLimpio;
    }


    function convertirAAnos(valor, unidad) {
        if (isNaN(valor)) return 0;
        if (unidad === 'meses') { return valor / 12; }
        else if (unidad === 'dias') { return valor / 365; }
        else { return valor; } // 'anos'
    }

    // --- LÓGICA DE CÁLCULO DE IVA ---
    function calcularIVA() {
        const pct = limpiarNumero(porcentajeIVAInput.value) / 100 || 0;
        if (ivaToggle.checked) {
            const total = limpiarNumero(valorConIVAInput.value);
            if (isNaN(total)) {
                valorSinIVAInput.value = '';
                montoIVADisplay.textContent = '';
                return;
            }
            const divisor = 1 + pct;
            if (divisor === 0) return;
            const base = total / divisor;
            const iva = total - base;
            valorSinIVAInput.value = formatterInput.format(base);
            montoIVADisplay.textContent = `Monto IVA: ${formatterMoneda.format(iva)}`;
        } else {
            const base = limpiarNumero(valorSinIVAInput.value);
            if (isNaN(base)) {
                valorConIVAInput.value = '';
                montoIVADisplay.textContent = '';
                return;
            }
            const total = base * (1 + pct);
            const iva = base * pct;
            valorConIVAInput.value = formatterInput.format(total);
            montoIVADisplay.textContent = `Monto IVA: ${formatterMoneda.format(iva)}`;
        }
    }

    // --- LÓGICA DE CAMPOS DINÁMICOS ---
    
    function generarCamposProduccion() {
        dynamicFieldsContainer.innerHTML = '';
        errorDiv.textContent = '';
        const numPeriodos = parseInt(limpiarNumero(numPeriodosInput.value));

        if (isNaN(numPeriodos) || numPeriodos <= 0) {
            return;
        }
        if (numPeriodos > 180) {
            errorDiv.textContent = 'El número de períodos es muy alto. Límite: 180.';
            return;
        }

        for (let i = 1; i <= numPeriodos; i++) {
            const newField = document.createElement('div');
            newField.classList.add('dynamic-field-group'); 
            newField.innerHTML = `
                <label for="periodo-${i}">Producción Período ${i}:</label>
                <input type="text" id="periodo-${i}" class="produccion-periodo-input" inputmode="numeric">
                <button type="button" class="autofill-row-button" data-periodo-index="${i}">↓</button>
            `;
            dynamicFieldsContainer.appendChild(newField);
            
            const newInput = newField.querySelector('input');
            const newButton = newField.querySelector('button');
            newInput.addEventListener('input', formatearInputSimple);
            newButton.addEventListener('click', handleAutofillClick);
        }
    }

    function handleAutofillClick(event) {
        const clickedButton = event.target;
        const indexStr = clickedButton.dataset.periodoIndex;
        const startIndex = parseInt(indexStr) - 1; 
        const allInputs = document.querySelectorAll('.produccion-periodo-input');
        const valorParaCopiar = allInputs[startIndex].value;
        
        if (valorParaCopiar === '') {
            errorDiv.textContent = `Por favor, llene el "Período ${indexStr}" antes de autocompletar.`;
            return;
        }
        errorDiv.textContent = '';
        for (let i = startIndex + 1; i < allInputs.length; i++) {
            allInputs[i].value = valorParaCopiar;
        }
    }

    // --- FUNCIÓN DE EXPORTAR A EXCEL ---
    function exportarAExcel() {
        if (rawTableData.length === 0) {
            errorDiv.textContent = 'No hay datos para exportar.';
            return;
        }

        const unidadVidaUtil = document.querySelector('input[name="unidadVidaUtil"]:checked').value;
        let unidadHeader = 'Período';
        if (currentMetodo !== 'unidadesProduccion') {
             if (unidadVidaUtil === 'anos') { unidadHeader = 'Año'; }
             else if (unidadVidaUtil === 'meses') { unidadHeader = 'Mes'; }
             else if (unidadVidaUtil === 'dias') { unidadHeader = 'Día'; }
        }

        let headers = [unidadHeader];
        if (currentMetodo === 'sumaDigitos') { headers.push('Factor', 'Porcentaje'); }
        else if (currentMetodo === 'saldosDecrecientes') { headers.push('Tasa Depreciación', 'Valor sin Depreciar'); }
        else if (currentMetodo === 'unidadesProduccion') { headers.push('Unidades Producidas', 'Depreciación por Unidad'); }
        headers.push('Cuota Depreciación', 'Depreciación Acumulada', 'Valor Neto en Libros');
        
        const dataParaExportar = rawTableData.map(row => {
            let newRow = {};
            newRow[unidadHeader] = row.ano;
            
            if (currentMetodo === 'sumaDigitos') {
                newRow['Factor'] = row.factor;
                newRow['Porcentaje'] = row.porcentaje;
            } else if (currentMetodo === 'saldosDecrecientes') {
                newRow['Tasa Depreciación'] = row.tasa;
                newRow['Valor sin Depreciar'] = row.valorSinDepreciar;
            } else if (currentMetodo === 'unidadesProduccion') {
                newRow['Unidades Producidas'] = row.unidades;
                newRow['Depreciación por Unidad'] = row.costoPorUnidad;
            }
            
            newRow['Cuota Depreciación'] = row.cuota;
            newRow['Depreciación Acumulada'] = row.acumulada;
            newRow['Valor Neto en Libros'] = row.valorNeto;
            
            return newRow;
        });

        const ws = XLSX.utils.json_to_sheet(dataParaExportar, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Depreciacion");
        XLSX.writeFile(wb, "Calculo_Depreciacion.xlsx");
    }
    exportExcelButton.addEventListener('click', exportarAExcel);


    // --- NAVEGACIÓN ---
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
        // Reset manual
        ivaToggle.checked = false;
        valorSinIVAInput.readOnly = false;
        valorConIVAInput.readOnly = true;
        valorSinIVAInput.value = '';
        valorConIVAInput.value = '';
        montoIVADisplay.textContent = '';
        porcentajeIVAInput.value = '15';
        dynamicFieldsContainer.innerHTML = '';
        document.getElementById('salvamento-val').checked = true;
        
        resultadoDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');
        errorDiv.innerHTML = '';
        exportExcelButton.classList.add('hidden');
        rawTableData = [];
        
        calculadoraSection.classList.add('hidden');
        metodoSelector.classList.remove('hidden');
        
        footerNav.classList.remove('hidden'); // <-- MUESTRA LOS BOTONES
    });
    
    // --- LÓGICA DE MOSTRAR CALCULADORA (MODIFICADO) ---
    function mostrarCalculadora(metodo) {
        metodoSelector.classList.add('hidden');
        calculadoraSection.classList.remove('hidden');
        
        footerNav.classList.add('hidden'); // <-- OCULTA LOS BOTONES
        
        if (metodo === 'unidadesProduccion') {
            camposUnidades.classList.remove('hidden');
            unidadesTotalesInput.setAttribute('required', 'true');
            numPeriodosInput.setAttribute('required', 'true');
        } else {
            camposUnidades.classList.add('hidden');
            unidadesTotalesInput.removeAttribute('required');
            numPeriodosInput.removeAttribute('required');
        }
        
        if (metodo === 'saldosDecrecientes') {
            groupValorSalvamento.classList.remove('hidden'); 
            valorSalvamentoInput.setAttribute('required', 'true');
        } else {
            groupValorSalvamento.classList.add('hidden'); 
            valorSalvamentoInput.removeAttribute('required');
        }
    }

    // --- EVENT LISTENERS (FORMATEO Y CÁLCULO) ---
    
    vidaUtilInput.addEventListener('input', formatearInputSimple);
    unidadesTotalesInput.addEventListener('input', formatearInputSimple);
    numPeriodosInput.addEventListener('input', formatearInputSimple); 
    numPeriodosInput.addEventListener('input', generarCamposProduccion); 
    
    valorSalvamentoInput.addEventListener('input', formatearInputDecimal);
    porcentajeIVAInput.addEventListener('input', formatearInputDecimal);
    
    ivaToggle.addEventListener('change', () => {
        if (ivaToggle.checked) {
            valorConIVAInput.readOnly = false;
            valorConIVAInput.required = true;
            valorSinIVAInput.readOnly = true;
            valorSinIVAInput.required = false;
            valorConIVAInput.focus();
        } else {
            valorSinIVAInput.readOnly = false;
            valorSinIVAInput.required = true;
            valorConIVAInput.readOnly = true;
            valorConIVAInput.required = false;
            valorSinIVAInput.focus();
        }
    });
    valorSinIVAInput.addEventListener('input', calcularIVA);
    valorConIVAInput.addEventListener('input', calcularIVA);
    porcentajeIVAInput.addEventListener('input', calcularIVA);

    // --- MANEJO DEL 'SUBMIT' ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        resultadoDiv.innerHTML = '';
        errorDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');
        exportExcelButton.classList.add('hidden');
        rawTableData = [];

        // RECOLECCIÓN DE DATOS
        let valorActivo;
        if (ivaToggle.checked) {
            valorActivo = limpiarNumero(valorConIVAInput.value);
        } else {
            valorActivo = limpiarNumero(valorSinIVAInput.value);
        }
        
        const valorVidaUtil = limpiarNumero(vidaUtilInput.value);
        const unidadVidaUtil = document.querySelector('input[name="unidadVidaUtil"]:checked').value;
        
        const salvamentoInputVal = limpiarNumero(valorSalvamentoInput.value) || 0;
        const salvamentoUnidad = document.querySelector('input[name="salvamento-unit"]:checked').value;
        let valorSalvamentoFinal = 0;
        
        if (salvamentoUnidad === 'pct') {
            const valorBaseParaPct = valorActivo; 
            if (isNaN(valorBaseParaPct) || valorBaseParaPct <= 0) {
                errorDiv.textContent = 'No se puede calcular el % de salvamento sin un Valor de Activo válido.';
                return;
            }
            valorSalvamentoFinal = valorBaseParaPct * (salvamentoInputVal / 100);
        } else {
            valorSalvamentoFinal = salvamentoInputVal;
        }
        
        const unidadesTotales = limpiarNumero(unidadesTotalesInput.value);
        const produccionAnualInputs = document.querySelectorAll('.produccion-periodo-input');
        const produccionAnual = [];
        produccionAnualInputs.forEach(input => {
            const valor = limpiarNumero(input.value);
            if (!isNaN(valor)) {
                produccionAnual.push(valor);
            }
        });
        
        // VALIDACIONES
        const vidaEnAnos = convertirAAnos(valorVidaUtil, unidadVidaUtil);
        if (vidaEnAnos > 15) {
            errorDiv.textContent = 'Tiempo excedido. El máximo permitido es 15 años (o su equivalente).';
            return;
        }
        if (isNaN(valorActivo) || valorActivo <= 0) {
             errorDiv.textContent = 'El Valor de Activo seleccionado debe ser un número válido mayor a 0.';
             return;
        }
        if (isNaN(valorVidaUtil) || valorVidaUtil <= 0) {
             errorDiv.textContent = 'Por favor, introduce una Vida Útil válida.';
             return;
        }
        
        if (currentMetodo === 'saldosDecrecientes' && (isNaN(valorSalvamentoFinal) || valorSalvamentoFinal <= 0)) {
            errorDiv.textContent = 'Saldos Decrecientes requiere un Valor de Salvamento mayor a 0 (calculado en $).';
            return;
        }
        if (currentMetodo === 'unidadesProduccion') {
            if (isNaN(unidadesTotales) || unidadesTotales <= 0) {
                errorDiv.textContent = 'La Capacidad Total es requerida y debe ser mayor a 0.';
                return;
            }
            if (produccionAnual.length === 0 || produccionAnual.length !== limpiarNumero(numPeriodosInput.value)) {
                errorDiv.textContent = 'Por favor, ingrese un valor para todos los períodos de producción generados.';
                return;
            }
        }

        // ENVÍO AL BACKEND
        try {
            const response = await fetch('/calcular', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metodo: currentMetodo,
                    valorActivo: valorActivo,
                    vidaUtil: valorVidaUtil,
                    valorSalvamento: valorSalvamentoFinal,
                    produccionAnual: produccionAnual,
                    unidadesTotales: unidadesTotales
                }),
            });

            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || 'Error en el cálculo'); }
            
            rawTableData = data; 
            mostrarTabla(data, currentMetodo, unidadVidaUtil);

        } catch (error) {
            errorDiv.textContent = error.message;
        }
    });

    // --- FUNCIÓN DE MOSTRAR TABLA ---
    function mostrarTabla(data, metodo, unidad) {
        tituloTabla.classList.remove('hidden');
        exportExcelButton.classList.remove('hidden');
        
        let unidadHeader = 'Período';
        if (unidad === 'anos') { unidadHeader = 'Año'; }
        else if (unidad === 'meses') { unidadHeader = 'Mes'; }
        else if (unidad === 'dias') { unidadHeader = 'Día'; }
        if (metodo === 'unidadesProduccion') { unidadHeader = 'Período'; }

        let headers = [unidadHeader];
        
        if (metodo === 'sumaDigitos') { headers.push('Factor', 'Porcentaje'); }
        else if (metodo === 'saldosDecrecientes') { headers.push('Tasa Depreciación', 'Valor sin Depreciar'); }
        else if (metodo === 'unidadesProduccion') { headers.push('Unidades Producidas', 'Depreciación por Unidad'); }
        headers.push('Cuota Depreciación', 'Depreciación Acumulada', 'Valor Neto en Libros');

        const formatterMoneda = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formatterPorcentaje = new Intl.NumberFormat('es-EC', { style: 'percent', minimumFractionDigits: 5, maximumFractionDigits: 5 });
        const formatterFactor = new Intl.NumberFormat('es-EC', { style: 'decimal', minimumFractionDigits: 10, maximumFractionDigits: 10 });
        const formatterTasa = new Intl.NumberFormat('es-EC', { style: 'decimal', minimumFractionDigits: 5, maximumFractionDigits: 5 });
        const formatterUnidad = new Intl.NumberFormat('es-EC', { style: 'decimal', maximumFractionDigits: 0 });
        const formatterCostoUnidad = new Intl.NumberFormat('es-EC', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        });

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
                tableHTML += `<td>${formatterCostoUnidad.format(row.costoPorUnidad)}</td>`; 
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
    
    // --- BOTÓN DE LIMPIAR ---
    clearButton.addEventListener('click', () => {
        form.reset();
        
        // Limpieza manual del IVA
        ivaToggle.checked = false;
        valorSinIVAInput.readOnly = false;
        valorConIVAInput.readOnly = true;
        valorSinIVAInput.value = '';
        valorConIVAInput.value = '';
        montoIVADisplay.textContent = '';
        porcentajeIVAInput.value = '15';
        
        // Limpieza de campos dinámicos
        dynamicFieldsContainer.innerHTML = '';
        
        // Limpieza de salvamento
        document.getElementById('salvamento-val').checked = true;
        valorSalvamentoInput.value = '0';
        
        resultadoDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');
        errorDiv.innerHTML = '';
        exportExcelButton.classList.add('hidden');
        rawTableData = [];
        
        valorSinIVAInput.focus();
    });
});
