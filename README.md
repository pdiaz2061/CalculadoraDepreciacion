# 🧮 Calculadora de Depreciación de Activos
Este es un proyecto web académico desarrollado para la materia de **Tecnología del Mantenimiento**. La aplicación simula el cálculo de depreciación de un activo fijo utilizando los cuatro métodos contables más comunes, basándose en los conceptos teóricos del PDF de la materia.
La aplicación está construida con **Node.js** y **Express** en el backend, y **HTML/CSS/JavaScript** puro en el frontend.

## ✨ Características Principales

La aplicación no solo calcula, sino que incluye una interfaz de usuario completa con múltiples características avanzadas:

* **Navegación Multi-Página:** Portada, Objetivos, Conclusiones y Calculadora.
* **Selección de Método:** Interfaz gráfica con tarjetas para elegir uno de los 4 métodos:
    1.  Línea Recta
    2.  Suma de los Dígitos del Año
    3.  Saldos Decrecientes
    4.  Unidades de Producción
* **Cálculo de IVA Dinámico:**
    * Permite al usuario ingresar el valor del activo **CON** o **SIN IVA**.
    * Un interruptor bloquea un campo y calcula el otro automáticamente.
    * Muestra el monto del IVA calculado en tiempo real.
* **Manejo de Períodos Flexibles:**
    * Permite ingresar la vida útil en **Años, Meses o Días**.
    * Validación de un límite máximo de 15 años (o su equivalente).
* **Cálculo de Valor de Salvamento:**
    * Aparece *solo* para el método de **Saldos Decrecientes** (como lo requiere el PDF).
    * Permite ingresar el salvamento como un valor fijo en **$** o como un **%** del valor del activo.
* **Formulario Interactivo para "Unidades de Producción":**
    * El usuario especifica el "Número de Períodos".
    * La aplicación genera dinámicamente esa cantidad de campos de entrada.
    * Incluye una función de **"Autocompletar Hacia Abajo" (↓)** en cada fila (similar a Excel) para rellenar valores repetidos.
* **Exportación a Excel:**
    * Un botón "Exportar a Excel" genera un archivo `.xlsx` (usando SheetJS) con la tabla de depreciación calculada.
    * Exporta los **números puros** para evitar errores de formato regional (ej: `.` vs `,`).

## 🛠️ Tecnologías Utilizadas

* **Backend:** Node.js, Express
* **Frontend:** HTML5, CSS3 (Flexbox y Grid), JavaScript (Vanilla ES6+)
* **Librerías (Frontend):**
    * **SheetJS (xlsx.js):** Para la funcionalidad de exportar a Excel.

## 🚀 Cómo ejecutar el proyecto localmente

1.  Clona este repositorio:
    ```bash
    git clone [https://github.com/tu-usuario/tu-repositorio.git](https://github.com/tu-usuario/tu-repositorio.git)
    ```
2.  Navega a la carpeta del proyecto:
    ```bash
    cd tu-repositorio
    ```
3.  Instala las dependencias de Node.js:
    ```bash
    npm install
    ```
4.  Para ejecutar en **modo de desarrollo** (con reinicio automático al guardar cambios):
    ```bash
    npm run dev
    ```
5.  Para ejecutar en **modo de producción** (como lo haría el servidor):
    ```bash
    npm start
    ```
6.  Abre tu navegador y ve a `http://localhost:3000` (o al puerto que tengas configurado).
