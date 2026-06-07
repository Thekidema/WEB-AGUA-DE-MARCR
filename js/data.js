/* ============================================================
   Agua de Mar — data.js
   Datos del catálogo. Sin lógica de UI ni acceso al DOM.
   Se carga ANTES de app.js (expone variables globales).
   ============================================================ */

/* Número de WhatsApp del negocio (formato internacional, sin + ni espacios). */
const WHATSAPP = '50683425634'; // +506 8342 5634

/* URL pública de Instagram. */
const INSTAGRAM = 'https://www.instagram.com/aguademarbeachwearcr';

const colorways = ['Coral', 'Turquesa', 'Terracota', 'Verde oliva', 'Negro', 'Arena', 'Mostaza', 'Vino', 'Marfil', 'Aguamarina', 'Rosa palo', 'Cobalto'];

const types = [
  { t: 'Bikini', base: 34900, sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { t: 'Enterizo', base: 46900, sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { t: 'Cover up', base: 39900, sizes: ['XS/S', 'M/L', 'XL'] },
  { t: 'Top', base: 22900, sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { t: 'Pareo', base: 18900, sizes: ['Única'] },
  { t: 'Bottom', base: 19900, sizes: ['XS', 'S', 'M', 'L', 'XL'] },
];

const tones = ['#EDE3D3', '#E7DECF', '#E2E7E1', '#EAE0D0', '#E5E2DA', '#DDE4DF', '#EFE6D7', '#E3DCCD', '#E8E2D5', '#DEE5E2'];
const ratios = [0.78, 0.82, 1, 0.72, 0.88, 0.75, 0.9, 0.8];
const descs = [
  'Corte clásico de tiro medio, soporte real sin renunciar a la comodidad. Forro doble que no transparenta.',
  'Tela compresiva de secado rápido. Se siente como segunda piel y aguanta brazada tras brazada.',
  'Pensado para pasar del mar al café sin cambiarse. Tejido liviano con caída natural.',
  'Costuras planas que no marcan. Diseñado para nadar de verdad, no solo para la foto.',
  'Edición de tela teñida en lotes pequeños. Cada pieza tiene su propia personalidad de color.',
];

/* Catálogo generado: 40 piezas, identificadas por tipo + color. */
const PRODUCT_COUNT = 40;
const products = [];
for (let idx = 0; idx < PRODUCT_COUNT; idx++) {
  const ty = types[idx % types.length];
  const priceJitter = (idx % 5) * 1000 - 2000;
  products.push({
    id: 'p' + idx,
    type: ty.t,
    color: colorways[idx % colorways.length],
    price: ty.base + priceJitter,
    sizes: ty.sizes,
    tone: tones[idx % tones.length],
    ratio: ratios[idx % ratios.length],
    desc: descs[idx % descs.length],
    image: `assets/images/products/${ty.t.toLowerCase().replaceAll(' ', '-')}-${colorways[idx % colorways.length].toLowerCase().replaceAll(' ', '-')}.jpg`
  });
}

const clientas = [
  { who: 'Mariana R.', loc: 'Puntarenas', tone: '#E7DECF' },
  { who: 'Valeria C.', loc: 'Guanacaste', tone: '#E2E7E1' },
  { who: 'Daniela M.', loc: 'Limón', tone: '#EAE0D0' },
];

const faqs = [
  { q: '¿Cómo elijo mi talla?', a: 'Cada pieza incluye una tabla de medidas en centímetros. Si estás entre dos tallas, escribinos por WhatsApp con tus medidas y te recomendamos la mejor opción. Nuestras telas tienen buena recuperación, así que ceden lo justo sin deformarse.' },
  { q: '¿Hacen envíos a todo el país?', a: 'Sí. Enviamos a toda Costa Rica con entrega de 2 a 4 días hábiles. En el GAM coordinamos entrega exprés. El costo de envío se calcula al finalizar tu pedido por WhatsApp.' },
  { q: '¿Puedo cambiar o devolver una prenda?', a: 'Tenés 15 días para cambios siempre que la prenda esté sin uso, con etiquetas y forro higiénico intacto. Por higiene, no aceptamos devoluciones de bottoms una vez retirado el forro.' },
  { q: '¿De qué está hecha la tela?', a: 'Trabajamos con un tejido de poliamida reciclada y elastano, resistente al cloro, al agua salada y al protector solar. Es de secado rápido y mantiene el color estación tras estación.' },
  { q: '¿Cómo cuido mi traje de baño?', a: 'Enjuagá con agua dulce después de cada uso, lavá a mano con jabón neutro y secá a la sombra. Evitá la secadora y el contacto prolongado con superficies rugosas. Así te dura años.' },
];
