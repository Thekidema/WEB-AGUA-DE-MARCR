/* ============================================================
   Agua de Mar — dashboard.js
   CRUD de productos. Reutiliza DM (data.js) para poblar los
   <select> de type/color/tone, y admin-common.js para auth/toast.
   ============================================================ */

const DM = AguaDeMar.data;
const crc = (n) => '₡' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* referencia visual aproximada para el preview en vivo del <select> de color de tela
   (no es un dato del producto, solo ayuda a elegir mirando el color en vez del nombre) */
const COLOR_HEX = {
  'Coral': '#C85C44', 'Turquesa': '#2AA9A0', 'Terracota': '#B5651D', 'Verde oliva': '#708238',
  'Negro': '#1A1A1A', 'Arena': '#C2A878', 'Mostaza': '#C9A227', 'Vino': '#6B2737',
  'Marfil': '#F0E6D2', 'Aguamarina': '#4FD9C4', 'Rosa palo': '#D9A0A0', 'Cobalto': '#1E4B9E',
};

let products = [];
let editingId = null;

/* ===== Selects estáticos (type/color/tone) ===== */
function populateStaticSelects() {
  $('#typeSelect').innerHTML = DM.types.map((t) => `<option value="${esc(t.t)}">${esc(t.t)}</option>`).join('');
  $('#colorSelect').innerHTML = DM.colorways.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  $('#toneSelect').innerHTML = DM.tones.map((t) => `<option value="${t}">${t}</option>`).join('');
  renderSizeChips();
  updateColorSwatch();
  updateToneSwatch();
}

function updateColorSwatch() {
  const name = $('#colorSelect').value;
  $('#colorSwatch').style.background = COLOR_HEX[name] || 'transparent';
}
function updateToneSwatch() {
  $('#toneSwatch').style.background = $('#toneSelect').value;
}
$('#colorSelect').addEventListener('change', updateColorSwatch);
$('#toneSelect').addEventListener('change', updateToneSwatch);

/* ===== Precio: formateo en vivo con separador de miles (estilo ₡ CR: puntos) ===== */
function formatThousands(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function rawPriceValue() {
  return Number($('#priceInput').value.replace(/\./g, '')) || 0;
}
$('#priceInput').addEventListener('input', (e) => {
  const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  e.target.value = digits ? formatThousands(digits) : '';
});

/* ===== Foto: mostrar nombre del archivo elegido ===== */
$('#imageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  $('#imageFileName').textContent = file ? file.name : 'Ningún archivo elegido';
});

function renderSizeChips(selected = []) {
  const type = $('#typeSelect').value;
  const typeDef = DM.types.find((t) => t.t === type) || DM.types[0];
  const sizes = typeDef ? typeDef.sizes : [];
  $('#sizesWrap').innerHTML = sizes
    .map((s) => `
      <label class="admin-size-chip${selected.includes(s) ? ' sel' : ''}" data-size="${esc(s)}">
        <input type="checkbox" value="${esc(s)}" ${selected.includes(s) ? 'checked' : ''}>${esc(s)}
      </label>`)
    .join('');
}

$('#typeSelect').addEventListener('change', () => renderSizeChips());

document.addEventListener('click', (e) => {
  const chip = e.target.closest('.admin-size-chip');
  if (!chip) return;
  const input = chip.querySelector('input');
  input.checked = !input.checked;
  chip.classList.toggle('sel', input.checked);
});

function selectedSizes() {
  return $$('#sizesWrap input:checked').map((i) => i.value);
}

/* ===== Cargar y renderizar productos ===== */
async function loadProducts() {
  try {
    const res = await adminFetch('/api/admin/products');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    products = await res.json();
    renderTable();
  } catch (err) {
    handleError('No se pudo cargar el catálogo.', err);
  }
}

function toggleSwitch(id, field, checked, label) {
  return `
    <label class="admin-toggle" title="${esc(label)}">
      <input type="checkbox" data-toggle="${field}" data-id="${id}" ${checked ? 'checked' : ''}>
      <span class="admin-toggle-track"><span class="admin-toggle-thumb"></span></span>
    </label>`;
}

function renderTable() {
  const body = $('#productsBody');
  $('#emptyState').hidden = products.length > 0;
  body.innerHTML = products
    .map(
      (p) => `
    <tr data-id="${p.id}" class="${p.active ? '' : 'admin-row-inactive'}">
      <td><img class="admin-thumb" src="${p.image}" alt="" onerror="this.style.visibility='hidden'"></td>
      <td>${esc(p.type)} ${esc(p.color)}</td>
      <td>${crc(p.price)}</td>
      <td>${p.sizes.map(esc).join(', ')}</td>
      <td>${toggleSwitch(p.id, 'active', p.active, 'Visible en el catálogo público')}</td>
      <td>${toggleSwitch(p.id, 'featured', p.featured, 'Aparece en Colección Destacada')}</td>
      <td class="admin-row-actions">
        <button type="button" class="btn btn-ghost" data-edit="${p.id}">Editar</button>
        <button type="button" class="btn btn-ghost" data-del="${p.id}">Borrar</button>
      </td>
    </tr>`
    )
    .join('');
}

document.addEventListener('change', async (e) => {
  const toggle = e.target.closest('[data-toggle]');
  if (!toggle) return;
  const { toggle: field, id } = toggle.dataset;
  try {
    const res = await adminFetch(`/api/admin/products/${id}/${field}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: toggle.checked }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const updated = await res.json();
    const idx = products.findIndex((p) => p.id === id);
    if (idx !== -1) products[idx] = updated;
    renderTable();
  } catch (err) {
    toggle.checked = !toggle.checked;
    handleError('No se pudo actualizar el producto.', err);
  }
});

document.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-edit]');
  if (editBtn) return openModal(products.find((p) => p.id === editBtn.dataset.edit));

  const delBtn = e.target.closest('[data-del]');
  if (delBtn) {
    if (!confirm('¿Borrar este producto? Esta acción no se puede deshacer.')) return;
    try {
      const res = await adminFetch(`/api/admin/products/${delBtn.dataset.del}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      toast('Producto eliminado.');
      loadProducts();
    } catch (err) {
      handleError('No se pudo borrar el producto.', err);
    }
  }
});

/* ===== Modal crear/editar ===== */
function openModal(product) {
  editingId = product ? product.id : null;
  $('#modalTitle').textContent = product ? 'Editar producto' : 'Agregar producto';
  const form = $('#productForm');
  form.reset();
  form.id.value = editingId || '';

  const currentImage = $('#currentImage');
  const currentImageHint = $('#currentImageHint');
  $('#imageFileName').textContent = 'Ningún archivo elegido';
  if (product) {
    $('#typeSelect').value = product.type;
    $('#colorSelect').value = product.color;
    $('#priceInput').value = formatThousands(String(product.price));
    $('#toneSelect').value = product.tone;
    form.desc.value = product.desc;
    renderSizeChips(product.sizes);
    currentImage.src = product.image;
    currentImage.hidden = false;
    currentImageHint.hidden = false;
    $('#imageInput').required = false;
  } else {
    renderSizeChips();
    currentImage.hidden = true;
    currentImageHint.hidden = true;
    $('#imageInput').required = true;
  }
  updateColorSwatch();
  updateToneSwatch();
  $('#modalScrim').classList.add('show');
}

function closeModal() {
  $('#modalScrim').classList.remove('show');
  editingId = null;
}

$('#newProductBtn').addEventListener('click', () => openModal(null));
$('#cancelBtn').addEventListener('click', closeModal);
$('#modalScrim').addEventListener('click', (e) => {
  if (e.target === $('#modalScrim')) closeModal();
});

$('#productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const sizes = selectedSizes();
  if (!sizes.length) {
    toast('Elegí al menos una talla.');
    return;
  }
  const isEdit = !!editingId;
  const imageFile = $('#imageInput').files[0];
  if (!isEdit && !imageFile) {
    toast('Elegí una foto para el producto.');
    return;
  }
  const price = rawPriceValue();
  if (!price) {
    toast('Ingresá un precio válido.');
    return;
  }

  const formData = new FormData();
  formData.set('type', $('#typeSelect').value);
  formData.set('color', $('#colorSelect').value);
  formData.set('price', price);
  formData.set('sizes', JSON.stringify(sizes));
  formData.set('tone', $('#toneSelect').value);
  formData.set('desc', form.desc.value);
  if (imageFile) formData.set('image', imageFile);

  const url = isEdit ? `/api/admin/products/${editingId}` : '/api/admin/products';
  try {
    const res = await adminFetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error || 'No se pudo guardar el producto.');
      return;
    }
    toast(isEdit ? 'Producto actualizado.' : 'Producto agregado.');
    closeModal();
    loadProducts();
  } catch (err) {
    handleError('No se pudo guardar el producto.', err);
  }
});

$('#logoutBtn').addEventListener('click', adminLogout);

/* ===== Init ===== */
(async () => {
  try {
    const res = await adminFetch('/api/admin/session');
    const data = await res.json();
    $('#whoami').textContent = 'Conectado como ' + data.username;
  } catch (err) {
    return; // adminFetch ya redirige a login si 401
  }
  populateStaticSelects();
  loadProducts();
})();
