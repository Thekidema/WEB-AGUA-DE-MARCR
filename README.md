# Agua de Mar · Beachwear Costa Rica

Sitio web estático para la marca de trajes de baño hechos a mano en Costa Rica.

## Estructura del proyecto

```
.
├── index.html                 # Página principal
├── _headers                   # Configuración para hosting (Netlify)
├── README.md
├── js/
│   ├── app.js                 # Lógica de interfaz (carrito, modal, carrusel, etc.)
│   └── data.js                # Datos del catálogo y configuración
└── assets/
    ├── css/
    │   ├── fonts.css          # Tipografías auto-hospedadas
    │   └── styles.css         # Estilos principales del sitio
    ├── fonts/                 # Archivos de fuente .woff2
    ├── images/
    │   ├── clientas/          # Fotos reales de clientas (carrusel)
    │   │   ├── modelo-1.jpg
    │   │   ├── modelo-2.jpg
    │   │   └── modelo-3.jpg
    │   ├── hero-frame.jpg     # Imagen de la sección Filosofía
    │   ├── hero-poster.jpg    # Poster del video del hero
    │   └── logos/             # Marcas de logo
    │       ├── logo-mark-cream.webp
    │       ├── logo-mark-ink.png
    │       └── logo-mark-ink.webp
    ├── icons/                 # Favicon y assets de iconos
    │   ├── apple-touch-icon.png
    │   ├── favicon.ico
    │   └── favicon.svg
    └── videos/
        └── hero.mp4           # Video principal del hero (10s, 1080p alta calidad)
```

## Notas

- El catálogo actualmente usa placeholders (no hay fotos de productos reales aún). Las rutas están preparadas en `assets/images/products/`.
- El carrusel de clientas usa las 3 imágenes en `assets/images/clientas/`.
- El video del hero está optimizado en `assets/videos/hero.mp4`.
- Estructura pensada para ser simple, limpia y fácil de mantener.
- Se agregó `.gitignore` básico.

## Desarrollo local

Abrir `index.html` directamente en el navegador o servir con un servidor estático simple:

```bash
python3 -m http.server 8000
```

## Licencia

Proyecto privado de Agua de Mar Beachwear CR.
