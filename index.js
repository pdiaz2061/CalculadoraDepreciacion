const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware para servir archivos estáticos (HTML, CSS, JS) desde la carpeta 'public'
app.use(express.static('public'));
// Middleware para entender el JSON que nos enviará el frontend
app.use(express.json());

// Endpoint de la API para calcular
app.post('/calcular', (req, res) => {
    const { metodo, valorActivo, vidaUtil, valorSalvamento, produccionAnual, unidadesTotales } = req.body;

    let tablaResultado = [];

    try {
        switch (metodo) {
            case 'lineaRecta':
                // Basado en la fórmula de la página 6 [cite: 64]
                tablaResultado = calcularLineaRecta(valorActivo, vidaUtil);
                break;
            case 'sumaDigitos':
                // Basado en las fórmulas de las páginas 11-13 [cite: 126, 127, 153]
                tablaResultado = calcularSumaDigitos(valorActivo, vidaUtil);
                break;
            case 'saldosDecrecientes':
                // Basado en las fórmulas de las páginas 17-18 [cite: 226, 228]
                if (!valorSalvamento || valorSalvamento <= 0) {
                    throw new Error('El método de Saldos Decrecientes requiere un Valor de Salvamento.');
                }
                tablaResultado = calcularSaldosDecrecientes(valorActivo, vidaUtil, valorSalvamento);
                break;
            case 'unidadesProduccion':
                // Basado en las fórmulas de las páginas 21-22 [cite: 279, 289]
                if (!produccionAnual || !unidadesTotales || produccionAnual.length === 0 || unidadesTotales <= 0) {
                    throw new Error('El método de Unidades de Producción requiere Unidades Totales y la Producción por año.');
                }
                tablaResultado = calcularUnidadesProduccion(valorActivo, unidadesTotales, produccionAnual);
                break;
            default:
                throw new Error('Método no reconocido');
        }
        res.json(tablaResultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// --- FUNCIONES DE CÁLCULO (Lógica del PDF) ---

function calcularLineaRecta(valorActivo, vidaUtil) {
    // Fórmula: Depreciacion = Valor del activo / Vida útil [cite: 64]
    const cuota = valorActivo / vidaUtil;
    let tabla = [];
    let depreciacionAcumulada = 0;
    let valorNeto = valorActivo;

    for (let i = 1; i <= vidaUtil; i++) {
        depreciacionAcumulada += cuota;
        valorNeto -= cuota;
        tabla.push({
            ano: i,
            cuota: cuota,
            acumulada: depreciacionAcumulada,
            valorNeto: valorNeto
        });
    }
    return tabla;
}

function calcularSumaDigitos(valorActivo, vidaUtil) {
    // Fórmula Suma: [VidaUtil * (VidaUtil + 1)] / 2 [cite: 127]
    const sumaDigitos = (vidaUtil * (vidaUtil + 1)) / 2;
    let tabla = [];
    let depreciacionAcumulada = 0;
    let valorNeto = valorActivo;

    for (let i = 0; i < vidaUtil; i++) {
        const vidaRestante = vidaUtil - i;
        // Fórmula Factor: (Vida útil restante / Suma de digitos) [cite: 129]
        const factor = vidaRestante / sumaDigitos;
        const cuota = factor * valorActivo; // [cite: 126]
        
        depreciacionAcumulada += cuota;
        valorNeto -= cuota;
        
        tabla.push({
            ano: i + 1,
            factor: factor,       // <-- NUEVO: Enviamos el factor
            porcentaje: factor,   // <-- NUEVO: Enviamos el factor (que se convertirá en %)
            cuota: cuota,
            acumulada: depreciacionAcumulada,
            valorNeto: (i === vidaUtil - 1) ? 0 : valorNeto
        });
    }
    return tabla;
}

function calcularSaldosDecrecientes(valorActivo, vidaUtil, valorSalvamento) {
    // Tasa = 1 - (ValorSalvamento / ValorActivo)^(1/n) [cite: 228, 240]
    const tasa = 1 - Math.pow(valorSalvamento / valorActivo, 1 / vidaUtil);
    let tabla = [];
    let depreciacionAcumulada = 0;
    let valorNeto = valorActivo;

    for (let i = 1; i <= vidaUtil; i++) {
        const valorSinDepreciar = valorNeto; // Captura el valor al inicio del año
        let cuota;

        if (i < vidaUtil) {
            cuota = valorSinDepreciar * tasa;
        } else {
            // El último año se ajusta para llegar exactamente al valor de salvamento 
            cuota = valorSinDepreciar - valorSalvamento;
        }

        depreciacionAcumulada += cuota;
        valorNeto -= cuota;

        tabla.push({
            ano: i,
            tasa: tasa, // <-- NUEVO: Tasa de depreciación
            valorSinDepreciar: valorSinDepreciar, // <-- NUEVO: Valor al inicio del periodo
            cuota: cuota,
            acumulada: depreciacionAcumulada,
            valorNeto: valorNeto
        });
    }
    return tabla;
}

function calcularUnidadesProduccion(valorActivo, unidadesTotales, produccionAnual) {
    // Depreciación por unidad = Valor del activo / Unidades totales [cite: 289]
    const costoPorUnidad = valorActivo / unidadesTotales;
    let tabla = [];
    let depreciacionAcumulada = 0;
    let valorNeto = valorActivo;
    
    for (let i = 0; i < produccionAnual.length; i++) {
        const unidadesProducidas = produccionAnual[i];
        // Cuota = Unidades producidas * Costo por unidad [cite: 291]
        const cuota = unidadesProducidas * costoPorUnidad;

        depreciacionAcumulada += cuota;
        valorNeto -= cuota;

        tabla.push({
            ano: i + 1,
            unidades: unidadesProducidas,
            costoPorUnidad: costoPorUnidad, // <-- NUEVO: Depreciación por unidad
            cuota: cuota,
            acumulada: depreciacionAcumulada,
            valorNeto: (valorNeto < 0.001 && valorNeto > -0.001) ? 0 : valorNeto // Asegura que el final sea 0
        });
    }
    return tabla;
}


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});