# Inicialización de Proyecto y PoC Frontend (Traducción Visual a ZPL)

El objetivo de esta primera fase es establecer las bases técnicas del frontend y abordar el riesgo técnico más importante del proyecto: traducir un diseño visual (coordenadas X, Y) a código ZPL (Zebra Programming Language) con precisión.

## User Review Required

> [!IMPORTANT]
> Necesito tu aprobación para crear el proyecto e instalar las dependencias básicas. Por defecto, generaré el proyecto en una carpeta temporal segura (`/home/otniel/.gemini/antigravity/scratch/label-printer-saas`), pero es **muy recomendable que me indiques la ruta exacta donde guardas tus proyectos** (por ejemplo, `~/Documentos/Proyectos/saas-etiquetas`) para crearlo allí directamente y que luego lo configures como tu espacio de trabajo (workspace) principal.

## Open Questions

> [!WARNING]
> 1. **Ruta del proyecto:** ¿Dónde prefieres que aloje el código de este proyecto en tu computadora? Si no tienes preferencia, lo pondré en la carpeta de trabajo por defecto.
> 2. **Nombre del directorio:** ¿Te parece bien `saas-etiquetas-frontend` como nombre de la carpeta inicial para el proyecto React?

## Proposed Changes

### 1. Inicialización del Entorno
- Generar un nuevo proyecto utilizando **Vite + React + TypeScript**. Esto garantiza un entorno rápido y tipado seguro.
- Configurar el linter y reglas básicas.

### 2. Instalación de Dependencias Core
- **Estilos:** `tailwindcss` y dependencias asociadas para un diseño rápido y moderno.
- **Motor Gráfico:** `konva` y `react-konva` para la creación del lienzo interactivo (canvas).
- **Gestión de Estado:** `zustand` para manejar el estado de los elementos del lienzo (posiciones, textos, configuraciones) de forma limpia sin prop drilling.

### 3. Estructura de Carpetas Sugerida
- `src/components/canvas`: Componentes relacionados con Konva.js (Lienzo, Texto, Código de Barras).
- `src/components/toolbar`: Interfaz para agregar elementos al lienzo.
- `src/services/zpl`: Lógica pura de TypeScript para convertir el estado del lienzo a comandos ZPL.
- `src/store`: Estado global de Zustand.

### 4. Prueba de Concepto (PoC)
- Un lienzo de Konva.js donde el usuario pueda agregar una etiqueta de texto y arrastrarla.
- Un botón "Generar ZPL" que lea las coordenadas (X, Y) del texto y escupa en la consola el código ZPL correspondiente (ej. `^XA^FO50,50^A0N,25,25^FDHola Mundo^FS^XZ`).

## Verification Plan

### Manual Verification
- Levantar el servidor de desarrollo (`npm run dev`).
- Visualizar el lienzo en el navegador.
- Agregar un elemento de texto, moverlo a una nueva posición.
- Generar el ZPL y verificar visualmente en un simulador ZPL en línea (como Labelary) si las coordenadas coinciden con la posición en pantalla.
