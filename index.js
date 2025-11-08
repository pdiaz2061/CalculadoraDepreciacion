// ESTE ES EL CÓDIGO CORRECTO Y ACTUALIZADO PARA index.js

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.post('/calcular', (req, res) => {
    // AHORA RECIBIMOS 'valorSalvamento' EN TODAS LAS PETICIONES
    const { metodo, valorActivo, vidaUtil, valorSalvamento, produccionAnual, unidadesTotales } = req.body;

    let tablaResultado = [];

    try {
        switch (metodo) {
            case 'lineaRecta':
                tablaResultado = calcularLineaRecta(valorActivo, vidaUtil, valorSalvamento);
                break;
            case 'sumaDigitos':
                tablaResultado = calcularSumaDigitos(valorActivo, vidaUtil, valorSalvamento);
                break;
            case 'saldosDecrecientes':
                // Este método requiere un valor de salvamento > 0 para la tasa
                if (!valorSalvamento || valorSalvamento <= 0) {
                    throw new Error('Saldos Decrecientes requiere un Valor de Salvamento mayor a 0.');
                }
                tablaResultado = calcularSaldosDecrecientes(valorActivo, vidaUtil, valorSalvamento);
                break;
            case 'unidadesProduccion':
                tablaResultado = calcularUnidadesProduccion(valorActivo, unidadesTotales, produccionAnual, valorSalvamento);
                break;
            default:
                throw new Error('Método no reconocido');
        }
        res.json(tablaResultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// --- FUNCIONES DE CÁLCULO ACTUALIZADAS ---

function calcularLineaRecta(valorActivo, vidaUtil, valorSalvamento) {
    // Lógica actualizada
    const valorADepreciar = valorActivo - valorSalvamento;
    const cuota = valorADepreciar / vidaUtil;
    let tabla = [];
    let depreciacionAcumulada = 0;
    
    for (let i = 1; i <= vidaUtil; i++) {
        depreciacionAcumulada += cuota;
        // Asegura que la última cuota no sobrepase
        if (i === vidaUtil) {
            const ajuste = (depreciacionAcumulada - valorADepreciar);
            depreciacionAcumulada -= ajuste;
        }
        
        let valorNeto = valorActivo - depreciacionAcumulada;
        
        tabla.push({
            ano: i, 
            cuota: (i === vidaUtil) ? cuota - (depreciacionAcumulada - valorADepreciar) : cuota,
            acumulada: depreciacionAcumulada,
            valorNeto: valorNeto
        });
    }
    return tabla;
}

function calcularSumaDigitos(valorActivo, vidaUtil, valorSalvamento) {
    // Lógica actualizada
    const valorADepreciar = valorActivo - valorSalvamento;
    const sumaDigitos = (vidaUtil * (vidaUtil + 1)) / 2;
    let tabla = [];
    let depreciacionAcumulada = 0;

    for (let i = 0; i < vidaUtil; i++) {
        const vidaRestante = vidaUtil - i;
        const factor = vidaRestante / sumaDigitos;
        let cuota = factor * valorADepreciar;
        
        // Ajuste para el último año
        if (i === vidaUtil - 1) {
            const ajuste = (depreciacionAcumulada + cuota) - valorADepreciar;
            cuota -= ajuste;
        }
        
        depreciacionAcumulada += cuota;
        let valorNeto = valorActivo - depreciacionAcumulada;

        tabla.push({
            ano: i + 1, 
            factor: factor, 
            porcentaje: factor,
            cuota: cuota, 
            acumulada: depreciacionAcumulada,
            valorNeto: valorNeto
        });
    }
    return tabla;
}

function calcularSaldosDecrecientes(valorActivo, vidaUtil, valorSalvamento) {
    // Esta función ya usaba el valor de salvamento para la tasa, por lo que está bien.
    // Solo nos aseguramos de que el valor neto final sea exactamente el de salvamento.
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
            // El último año se ajusta para llegar exactamente al valor de salvamento
            cuota = valorSinDepreciar - valorSalvamento;
        }
        
        // Prevenir depreciación negativa
        if (cuota < 0) cuota = 0;

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

function calcularUnidadesProduccion(valorActivo, unidadesTotales, produccionAnual, valorSalvamento) {
    // Lógica actualizada
    const valorADepreciar = valorActivo - valorSalvamento;
    const costoPorUnidad = valorADepreciar / unidadesTotales;
    let tabla = [];
    let depreciacionAcumulada = 0;
    
    for (let i = 0; i < produccionAnual.length; i++) {
        const unidadesProducidas = produccionAnual[i];
        let cuota = unidadesProducidas * costoPorUnidad;
        
        // Ajuste para no depreciar más del total
        if (depreciacionAcumulada + cuota > valorADepreciar) {
            cuota = valorADepreciar - depreciacionAcumulada;
        }

        depreciacionAcumulada += cuota;
        let valorNeto = valorActivo - depreciacionAcumulada;

        // Prevenir que la cuota sea negativa
        if (cuota < 0) cuota = 0;

        tabla.push({
            ano: i + 1, 
            unidades: unidadesProducidas, 
            costoPorUnidad: costoPorUnidad,
            cuota: cuota, 
            acumulada: depreciacionAcumulada,
            valorNeto: valorNeto
        });
    }
    return tabla;
}

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});