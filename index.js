const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));
app.use(express.json());
app.post('/calcular', (req, res) => {
    const { metodo, valorActivo, vidaUtil, valorSalvamento, produccionAnual, unidadesTotales } = req.body;

    let tablaResultado = [];

    try {
        switch (metodo) {
            case 'lineaRecta':
                tablaResultado = calcularLineaRecta(valorActivo, vidaUtil);
                break;
            case 'sumaDigitos':
                tablaResultado = calcularSumaDigitos(valorActivo, vidaUtil);
                break;
            case 'saldosDecrecientes':
                if (!valorSalvamento || valorSalvamento <= 0) {
                    throw new Error('El método de Saldos Decrecientes requiere un Valor de Salvamento.');
                }
                tablaResultado = calcularSaldosDecrecientes(valorActivo, vidaUtil, valorSalvamento);
                break;
            case 'unidadesProduccion':
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
    const sumaDigitos = (vidaUtil * (vidaUtil + 1)) / 2;
    let tabla = [];
    let depreciacionAcumulada = 0;
    let valorNeto = valorActivo;

    for (let i = 0; i < vidaUtil; i++) {
        const vidaRestante = vidaUtil - i;
        const factor = vidaRestante / sumaDigitos;
        const cuota = factor * valorActivo; // [cite: 126]
        
        depreciacionAcumulada += cuota;
        valorNeto -= cuota;
        
        tabla.push({
            ano: i + 1,
            factor: factor,      
            porcentaje: factor,   
            cuota: cuota,
            acumulada: depreciacionAcumulada,
            valorNeto: (i === vidaUtil - 1) ? 0 : valorNeto
        });
    }
    return tabla;
}

function calcularSaldosDecrecientes(valorActivo, vidaUtil, valorSalvamento) {
    const tasa = 1 - Math.pow(valorSalvamento / valorActivo, 1 / vidaUtil);
    let tabla = [];
    let depreciacionAcumulada = 0;
    let valorNeto = valorActivo;

    for (let i = 1; i <= vidaUtil; i++) {
        const valorSinDepreciar = valorNeto; 
        let cuota;

        if (i < vidaUtil) {
            cuota = valorSinDepreciar * tasa;
        } else {
            cuota = valorSinDepreciar - valorSalvamento;
        }

        depreciacionAcumulada += cuota;
        valorNeto -= cuota;

        tabla.push({
            ano: i,
            tasa: tasa, 
            valorSinDepreciar: valorSinDepreciar, 
            cuota: cuota,
            acumulada: depreciacionAcumulada,
            valorNeto: valorNeto
        });
    }
    return tabla;
}

function calcularUnidadesProduccion(valorActivo, unidadesTotales, produccionAnual) {
    const costoPorUnidad = valorActivo / unidadesTotales;
    let tabla = [];
    let depreciacionAcumulada = 0;
    let valorNeto = valorActivo;
    
    for (let i = 0; i < produccionAnual.length; i++) {
        const unidadesProducidas = produccionAnual[i];
        const cuota = unidadesProducidas * costoPorUnidad;

        depreciacionAcumulada += cuota;
        valorNeto -= cuota;

        tabla.push({
            ano: i + 1,
            unidades: unidadesProducidas,
            costoPorUnidad: costoPorUnidad, 
            cuota: cuota,
            acumulada: depreciacionAcumulada,
            valorNeto: (valorNeto < 0.001 && valorNeto > -0.001) ? 0 : valorNeto 
        });
    }
    return tabla;
}


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});