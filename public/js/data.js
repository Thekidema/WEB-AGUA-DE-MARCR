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
  faqs: [
    { q: '¿Cómo elijo mi talla?', a: 'Cada pieza incluye una tabla de medidas en centímetros. Si estás entre dos tallas, escribinos por WhatsApp con tus medidas y te recomendamos la mejor opción. Nuestras telas tienen buena recuperación, así que ceden lo justo sin deformarse.' },
    { q: '¿Hacen envíos a todo el país?', a: 'Sí. Enviamos a toda Costa Rica con entrega de 2 a 4 días hábiles. En el GAM coordinamos entrega exprés. El costo de envío se calcula al finalizar tu pedido por WhatsApp.' },
    { q: '¿Puedo cambiar o devolver una prenda?', a: 'Tenés 15 días para cambios siempre que la prenda esté sin uso, con etiquetas y forro higiénico intacto. Por higiene, no aceptamos devoluciones de bottoms una vez retirado el forro.' },
    { q: '¿De qué está hecha la tela?', a: 'Trabajamos con un tejido de poliamida reciclada y elastano, resistente al cloro, al agua salada y al protector solar. Es de secado rápido y mantiene el color estación tras estación.' },
    { q: '¿Cómo cuido mi traje de baño?', a: 'Enjuagá con agua dulce después de cada uso, lavá a mano con jabón neutro y secá a la sombra. Evitá la secadora y el contacto prolongado con superficies rugosas. Así te dura años.' },
  ]
};
