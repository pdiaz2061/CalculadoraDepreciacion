document.addEventListener('DOMContentLoaded', () => {
    const metodoSelector = document.getElementById('metodo-selector');
    const calculadoraSection = document.getElementById('calculadora-section');
    const backButton = document.getElementById('back-button');

    const metodoTitulo = document.getElementById('metodo-titulo');
    const metodoSeleccionadoHidden = document.getElementById('metodo-seleccionado-hidden');

    const footerNav = document.querySelector('.footer-nav');
    
    const validationHelper = document.getElementById('validation-helper');
    const defaultHelperText = validationHelper.textContent;
    let warningTimeout;

    const form = document.getElementById('calculadora-form');
    
    const ivaToggle = document.getElementById('iva-toggle-checkbox');
    const valorSinIVAInput = document.getElementById('valorSinIVA');
    const valorConIVAInput = document.getElementById('valorConIVA');
    const porcentajeIVAInput = document.getElementById('porcentajeIVA');
    const montoIVADisplay = document.getElementById('montoIVA-display');

    const vidaUtilInput = document.getElementById('vidaUtil');
    
    const groupValorSalvamento = document.getElementById('group-valorSalvamento');
    const valorSalvamentoInput = document.getElementById('valorSalvamento');

    const camposUnidades = document.getElementById('campos-unidades');
    const unidadesTotalesInput = document.getElementById('unidadesTotales');
    const numPeriodosInput = document.getElementById('numPeriodos');
    const dynamicFieldsContainer = document.getElementById('dynamic-production-fields');
    const capacidadUnitSelect = document.getElementById('capacidad-unit-select');
    
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

    function flashWarning(message) {
        clearTimeout(warningTimeout);
        validationHelper.textContent = message;
        validationHelper.classList.add('warning');
        warningTimeout = setTimeout(() => {
            validationHelper.textContent = defaultHelperText;
            validationHelper.classList.remove('warning');
        }, 2000);
    }

    function formatearInputEntero(event) {
        let input = event.target;
        let valorOriginal = input.value;
        let cursorStart = input.selectionStart;

        if (/[a-zA-ZñÑ,.]/.test(valorOriginal)) {
            flashWarning("¡Solo se permiten números enteros!");
        }

        let valorLimpio = valorOriginal.replace(/[^\d]/g, '');
        let numero = parseInt(valorLimpio);
        let valorNuevo;
        if (!isNaN(numero)) {
            valorNuevo = numero.toLocaleString('es-EC');
        } else {
            valorNuevo = '';
        }
        
        if (valorOriginal !== valorNuevo) {
            input.value = valorNuevo;
            let newCursorPos = cursorStart - (valorOriginal.length - valorNuevo.length) + 1;
            if (newCursorPos < 0) newCursorPos = 0;
            try { input.selectionStart = input.selectionEnd = newCursorPos; } catch(e) {}
        }
    }
    
    function formatearInputDecimal(event) {
        let input = event.target;
        let valorOriginal = input.value;
        let cursorStart = input.selectionStart;

        if (/[a-zA-ZñÑ]/.test(valorOriginal)) {
            flashWarning("¡Solo se permiten números!");
        }

        let valorLimpio = valorOriginal.replace(/[^\d,]/g, '');
        let partesComa = valorLimpio.split(',');
        if (partesComa.length > 2) {
            valorLimpio = partesComa[0] + ',' + partesComa.slice(1).join('');
        }
        
        let parteEntera = partesComa[0];
        let parteDecimal = partesComa[1];
        
        parteEntera = parteEntera.replace(/\./g, '');
        
        let numeroEntero = parseInt(parteEntera);
        if (!isNaN(numeroEntero)) {
            parteEntera = numeroEntero.toLocaleString('es-EC');
        } else {
            parteEntera = '';
        }
        
        let valorNuevo = parteEntera;
        if (partesComa.length > 1) {
            valorNuevo += ',' + parteDecimal.replace(/[^\d]/g, '');
        }

        if (valorOriginal !== valorNuevo) {
            input.value = valorNuevo;
            let newCursorPos = cursorStart - (valorOriginal.length - valorNuevo.length) + 1;
            if (newCursorPos < 0) newCursorPos = 0;
            try { input.selectionStart = input.selectionEnd = newCursorPos; } catch(e) {}
        }
    }


    function convertirAAnos(valor, unidad) {
        if (isNaN(valor)) return 0;
        if (unidad === 'meses') { return valor / 12; }
        else if (unidad === 'dias') { return valor / 365; }
        else { return valor; }
    }

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
    
    function getCapacidadUnitName() {
        return capacidadUnitSelect.value;
    }

    function generarCamposProduccion() {
        dynamicFieldsContainer.innerHTML = '';
        errorDiv.textContent = '';
        const numPeriodos = Math.floor(limpiarNumero(numPeriodosInput.value));

        if (isNaN(numPeriodos) || numPeriodos <= 0) {
            return;
        }
        if (numPeriodos > 180) {
            errorDiv.textContent = 'El número de períodos es muy alto. Límite: 180.';
            return;
        }
        
        const capUnit = getCapacidadUnitName();

        for (let i = 1; i <= numPeriodos; i++) {
            const newField = document.createElement('div');
            newField.classList.add('dynamic-field-group'); 
            newField.innerHTML = `
                <label for="periodo-${i}">Producción Período ${i} (${capUnit}):</label>
                <input type="text" id="periodo-${i}" class="produccion-periodo-input" inputmode="decimal">
                <button type="button" class="autofill-row-button" data-periodo-index="${i}">↓</button>
            `;
            dynamicFieldsContainer.appendChild(newField);
            
            const newInput = newField.querySelector('input');
            const newButton = newField.querySelector('button');
            
            newInput.addEventListener('input', formatearInputDecimal);
            
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
        else if (currentMetodo === 'unidadesProduccion') {
            const capUnit = getCapacidadUnitName();
            headers.push(`Producción (${capUnit})`, `Deprec. por ${capUnit}`);
        }
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
                const capUnit = getCapacidadUnitName();
                newRow[`Producción (${capUnit})`] = row.unidades;
                newRow[`Deprec. por ${capUnit}`] = row.costoPorUnidad;
            }
            
            newRow['Cuota Depreciación'] = row.cuota;
            newRow['Depreciación Acumulada'] = row.acumulada;
            newRow['Valor Neto en Libros'] = row.valorNeto;
            
            return newRow;
        });

        const ws = XLSX.utils.json_to_sheet(dataParaExportar, { header: headers });
        
        if (currentMetodo === 'unidadesProduccion' || currentMetodo === 'lineaRecta' || currentMetodo === 'sumaDigitos') {
            const totalUnidades = rawTableData.reduce((sum, row) => sum + (row.unidades || 0), 0);
            const totalCuota = rawTableData.reduce((sum, row) => sum + row.cuota, 0);
            
            let footer = [];
            if (currentMetodo === 'unidadesProduccion') {
                footer = [ "Total", totalUnidades, "", totalCuota, "", "" ];
            } else {
                let emptyCols = headers.length - 3;
                footer = ["Total"];
                for(let i = 1; i < emptyCols; i++) footer.push("");
                footer.push(totalCuota, "", "");
            }
            XLSX.utils.sheet_add_aoa(ws, [footer], { origin: -1 });
        }
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Depreciacion");
        XLSX.writeFile(wb, "Calculo_Depreciacion.xlsx");
    }
    exportExcelButton.addEventListener('click', exportarAExcel);

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
        
        ivaToggle.checked = false;
        valorSinIVAInput.readOnly = false;
        valorConIVAInput.readOnly = true;
        valorSinIVAInput.value = '';
        valorConIVAInput.value = '';
        montoIVADisplay.textContent = '';
        porcentajeIVAInput.value = '15';
        dynamicFieldsContainer.innerHTML = '';
        document.getElementById('salvamento-val').checked = true;
        
        capacidadUnitSelect.value = 'Kg';
        
        resultadoDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');
        errorDiv.innerHTML = '';
        exportExcelButton.classList.add('hidden');
        rawTableData = [];
        
        calculadoraSection.classList.add('hidden');
        metodoSelector.classList.remove('hidden');
        footerNav.classList.remove('hidden');
    });
    
    function mostrarCalculadora(metodo) {
        metodoSelector.classList.add('hidden');
        calculadoraSection.classList.remove('hidden');
        footerNav.classList.add('hidden');
        
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

    valorSinIVAInput.addEventListener('input', formatearInputDecimal);
    valorConIVAInput.addEventListener('input', formatearInputDecimal);
    vidaUtilInput.addEventListener('input', formatearInputDecimal);
    unidadesTotalesInput.addEventListener('input', formatearInputDecimal);
    valorSalvamentoInput.addEventListener('input', formatearInputDecimal);
    porcentajeIVAInput.addEventListener('input', formatearInputDecimal);
    
    numPeriodosInput.addEventListener('input', formatearInputEntero); 
    numPeriodosInput.addEventListener('input', generarCamposProduccion); 
    
    capacidadUnitSelect.addEventListener('change', generarCamposProduccion);
    
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

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        resultadoDiv.innerHTML = '';
        errorDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');
        exportExcelButton.classList.add('hidden');
        rawTableData = [];

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
        const numPeriodos = Math.floor(limpiarNumero(numPeriodosInput.value));
        
        const produccionAnualInputs = document.querySelectorAll('.produccion-periodo-input');
        const produccionAnual = [];
        let sumaProduccion = 0;
        let camposProduccionInvalidos = false;

        produccionAnualInputs.forEach(input => {
            const valor = limpiarNumero(input.value);
            if (isNaN(valor) || valor < 0) {
                camposProduccionInvalidos = true;
            } else {
                produccionAnual.push(valor);
                sumaProduccion += valor;
            }
        });
        
        if (isNaN(valorActivo) || valorActivo <= 0) {
             errorDiv.textContent = 'El Valor de Activo debe ser un número positivo.';
             return;
        }
        if (isNaN(valorVidaUtil) || valorVidaUtil <= 0) {
             errorDiv.textContent = 'La Vida Útil debe ser un número positivo.';
             return;
        }
        
        const vidaEnAnos = convertirAAnos(valorVidaUtil, unidadVidaUtil);
        if (vidaEnAnos > 15) {
            errorDiv.textContent = 'Tiempo excedido. El máximo permitido es 15 años (o su equivalente).';
            return;
        }
        
        if (isNaN(valorSalvamentoFinal) || valorSalvamentoFinal < 0) {
            errorDiv.textContent = 'El Valor de Salvamento no puede ser negativo.';
            return;
        }

        if (currentMetodo === 'saldosDecrecientes') {
             if (isNaN(valorSalvamentoFinal) || valorSalvamentoFinal <= 0) {
                errorDiv.textContent = 'Saldos Decrecientes requiere un Valor de Salvamento positivo.';
                return;
            }
        }
        
        if (currentMetodo === 'unidadesProduccion') {
            if (isNaN(unidadesTotales) || unidadesTotales <= 0) {
                errorDiv.textContent = 'La Capacidad Total debe ser un número positivo.';
                return;
            }
            if (isNaN(numPeriodos) || numPeriodos <= 0) {
                errorDiv.textContent = 'El Número de Períodos debe ser un entero positivo.';
                return;
            }
            if (camposProduccionInvalidos || produccionAnual.length !== numPeriodos) {
                errorDiv.textContent = `Por favor, ingrese un valor válido (ej: 0 o 360) para los ${numPeriodos} períodos de producción.`;
                return;
            }
            if (Math.abs(sumaProduccion - unidadesTotales) > 0.001) {
                errorDiv.textContent = `La suma de la producción (${sumaProduccion}) debe ser exactamente igual a la Capacidad Total (${unidadesTotales}).`;
                return;
            }
        }

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

    function mostrarTabla(data, metodo, unidad) {
        tituloTabla.classList.remove('hidden');
        exportExcelButton.classList.remove('hidden');
        
        let unidadHeader = 'Período';
        if (unidad === 'anos') { unidadHeader = 'Año'; }
        else if (unidad === 'meses') { unidadHeader = 'Mes'; }
        else if (unidad === 'dias') { unidadHeader = 'Día'; }
        
        let headers = [unidadHeader];
        
        if (metodo === 'sumaDigitos') { headers.push('Factor', 'Porcentaje'); }
        else if (metodo === 'saldosDecrecientes') { headers.push('Tasa Depreciación', 'Valor sin Depreciar'); }
        else if (metodo === 'unidadesProduccion') {
            const capUnit = getCapacidadUnitName();
            unidadHeader = 'Período';
            headers = [unidadHeader, `Producción (${capUnit})`, `Deprec. por ${capUnit}`];
        }
        
        if (metodo !== 'unidadesProduccion') {
             headers.push('Cuota Depreciación', 'Depreciación Acumulada', 'Valor Neto en Libros');
        } else {
             headers.push('Cuota Depreciación', 'Depreciación Acumulada', 'Valor Neto en Libros');
        }

        const formatterMoneda = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formatterPorcentaje = new Intl.NumberFormat('es-EC', { style: 'percent', minimumFractionDigits: 5, maximumFractionDigits: 5 });
        const formatterFactor = new Intl.NumberFormat('es-EC', { style: 'decimal', minimumFractionDigits: 10, maximumFractionDigits: 10 });
        const formatterTasa = new Intl.NumberFormat('es-EC', { style: 'decimal', minimumFractionDigits: 5, maximumFractionDigits: 5 });
        const formatterUnidad = new Intl.NumberFormat('es-EC', { style: 'decimal', maximumFractionDigits: 2 });
        const formatterCostoUnidad = new Intl.NumberFormat('es-EC', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        });

        let tableHTML = '<table><thead><tr>';
        headers.forEach(header => { tableHTML += `<th>${header}</th>`; });
        tableHTML += '</tr></thead><tbody>';

        let totalUnidades = 0;
        let totalCuota = 0;

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
                totalUnidades += row.unidades;
            }
            tableHTML += `<td>${formatterMoneda.format(row.cuota)}</td>`;
            tableHTML += `<td>${formatterMoneda.format(row.acumulada)}</td>`;
            const valorNetoFormateado = (row.valorNeto < 0.001 && row.valorNeto > -0.001) ? 0.00 : row.valorNeto;
            tableHTML += `<td>${formatterMoneda.format(valorNetoFormateado)}</td>`;
            
            totalCuota += row.cuota;
        });

        tableHTML += '</tbody>';

        tableHTML += '<tfoot><tr>';
        if (metodo === 'unidadesProduccion') {
            const capUnit = getCapacidadUnitName();
            tableHTML += `<td><strong>Total</strong></td>`;
            tableHTML += `<td><strong>${formatterUnidad.format(totalUnidades)} (${capUnit})</strong></td>`;
            tableHTML += '<td></td>';
            tableHTML += `<td><strong>${formatterMoneda.format(totalCuota)}</strong></td>`;
            tableHTML += '<td></td><td></td>';
        } else {
            const numCols = headers.length;
            tableHTML += `<td><strong>Total</strong></td>`;
            for (let i = 0; i < numCols - 3; i++) {
                tableHTML += '<td></td>';
            }
            tableHTML += `<td><strong>${formatterMoneda.format(totalCuota)}</strong></td>`;
            tableHTML += '<td></td><td></td>';
        }
        tableHTML += '</tr></tfoot>';

        tableHTML += '</table>';
        resultadoDiv.innerHTML = tableHTML;
    }
    
    clearButton.addEventListener('click', () => {
        form.reset();
        
        ivaToggle.checked = false;
        valorSinIVAInput.readOnly = false;
        valorConIVAInput.readOnly = true;
        valorSinIVAInput.value = '';
        valorConIVAInput.value = '';
        montoIVADisplay.textContent = '';
        porcentajeIVAInput.value = '15';
        
        dynamicFieldsContainer.innerHTML = '';
        
        document.getElementById('salvamento-val').checked = true;
        valorSalvamentoInput.value = '0';
        
        capacidadUnitSelect.value = 'Uds.';
        
        resultadoDiv.innerHTML = '';
        tituloTabla.classList.add('hidden');
        errorDiv.innerHTML = '';
        exportExcelButton.classList.add('hidden');
        rawTableData = [];
        
        valorSinIVAInput.focus();
    });
});