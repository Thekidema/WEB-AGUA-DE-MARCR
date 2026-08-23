/* ============================================================
   Agua de Mar — data.js
   Datos del catálogo. Sin lógica de UI ni acceso al DOM.
   Se carga ANTES de app.js.

   Todo se expone bajo AguaDeMar.data para reducir contaminación
   del scope global y hacer el código más mantenible a futuro.

   `products` arranca vacío; app.js lo puebla con fetch('/api/products').
   Este mismo archivo también lo carga el panel admin (public/admin/)
   para poblar los <select> de type/color/tone del formulario.
   ============================================================ */

window.AguaDeMar = window.AguaDeMar || {};

/* Datos expuestos de forma controlada */
AguaDeMar.data = {
  WHATSAPP: '50683425634',
  INSTAGRAM: 'https://www.instagram.com/aguademarbeachwearcr',

  colorways: ['Coral', 'Turquesa', 'Terracota', 'Verde oliva', 'Negro', 'Arena', 'Mostaza', 'Vino', 'Marfil', 'Aguamarina', 'Rosa palo', 'Cobalto'],

  types: [
    { t: 'Bikini', base: 34900, sizes: ['XS', 'S', 'M', 'L', 'XL'] },
    { t: 'Enterizo', base: 46900, sizes: ['XS', 'S', 'M', 'L', 'XL'] },
    { t: 'Cover up', base: 39900, sizes: ['XS/S', 'M/L', 'XL'] },
    { t: 'Top', base: 22900, sizes: ['XS', 'S', 'M', 'L', 'XL'] },
    { t: 'Pareo', base: 18900, sizes: ['Única'] },
    { t: 'Bottom', base: 19900, sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  ],

  tones: ['#EDE3D3', '#E7DECF', '#E2E7E1', '#EAE0D0', '#E5E2DA', '#DDE4DF', '#EFE6D7', '#E3DCCD', '#E8E2D5', '#DEE5E2'],
  descs: [
    'Corte clásico de tiro medio, soporte real sin renunciar a la comodidad. Forro doble que no transparenta.',
    'Tela compresiva de secado rápido. Se siente como segunda piel y aguanta brazada tras brazada.',
    'Pensado para pasar del mar al café sin cambiarse. Tejido liviano con caída natural.',
    'Costuras planas que no marcan. Diseñado para nadar de verdad, no solo para la foto.',
    'Edición de tela teñida en lotes pequeños. Cada pieza tiene su propia personalidad de color.',
  ],

  products: [],
  clientas: [
    { who: 'Mariana R.', loc: 'Puntarenas', tone: '#E7DECF' },
    { who: 'Valeria C.', loc: 'Guanacaste', tone: '#E2E7E1' },
    { who: 'Daniela M.', loc: 'Limón', tone: '#EAE0D0' },
  ],
  faqs: [], // se puebla vía fetch('/api/site-content') en app.js
};
