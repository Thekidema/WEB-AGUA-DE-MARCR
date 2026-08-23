/* ============================================================
   Agua de Mar — testimonials.js
   CRUD de fotos del carrusel "Nuestras clientas".
   ============================================================ */

(() => {
  const $t = (s, el = document) => el.querySelector(s);
  const escT = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const newBtn = $t('#newTestimonialBtn');
  if (!newBtn) return; // esta página no tiene la sección de Clientas

  let testimonials = [];
  let editingTestimonialId = null;

  async function loadTestimonials() {
    try {
      const res = await adminFetch('/api/admin/testimonials');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      testimonials = await res.json();
      renderTestimonialsTable();
    } catch (err) {
      handleError('No se pudieron cargar las fotos de clientas.', err);
    }
  }

  function renderTestimonialsTable() {
    const body = $t('#testimonialsBody');
    $t('#testimonialsEmptyState').hidden = testimonials.length > 0;
    body.innerHTML = testimonials
      .map(
        (t) => `
      <tr data-id="${t.id}">
        <td><img class="admin-thumb" src="${t.image}" alt="" onerror="this.style.visibility='hidden'"></td>
        <td>${t.sort_order}</td>
        <td>${escT(t.alt)}</td>
        <td class="admin-row-actions">
          <button type="button" class="btn btn-ghost" data-testimonial-edit="${t.id}">Editar</button>
          <button type="button" class="btn btn-ghost" data-testimonial-del="${t.id}">Borrar</button>
        </td>
      </tr>`
      )
      .join('');
  }

  function openTestimonialModal(item) {
    editingTestimonialId = item ? item.id : null;
    $t('#testimonialModalTitle').textContent = item ? 'Editar foto' : 'Agregar foto';
    const form = $t('#testimonialForm');
    form.reset();
    form.id.value = editingTestimonialId || '';
    $t('#testimonialFileName').textContent = 'Ningún archivo elegido';

    const currentImage = $t('#testimonialCurrentImage');
    const hint = $t('#testimonialImageHint');
    if (item) {
      form.alt.value = item.alt;
      form.sort_order.value = item.sort_order;
      currentImage.src = item.image;
      currentImage.hidden = false;
      hint.hidden = false;
      $t('#testimonialImageInput').required = false;
    } else {
      form.sort_order.value = testimonials.length;
      currentImage.hidden = true;
      hint.hidden = true;
      $t('#testimonialImageInput').required = true;
    }
    $t('#testimonialModalScrim').classList.add('show');
  }

  function closeTestimonialModal() {
    $t('#testimonialModalScrim').classList.remove('show');
    editingTestimonialId = null;
  }

  newBtn.addEventListener('click', () => openTestimonialModal(null));
  $t('#testimonialCancelBtn').addEventListener('click', closeTestimonialModal);
  $t('#testimonialModalScrim').addEventListener('click', (e) => {
    if (e.target === $t('#testimonialModalScrim')) closeTestimonialModal();
  });
  $t('#testimonialImageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    $t('#testimonialFileName').textContent = file ? file.name : 'Ningún archivo elegido';
  });

  document.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-testimonial-edit]');
    if (editBtn) return openTestimonialModal(testimonials.find((t) => t.id === editBtn.dataset.testimonialEdit));

    const delBtn = e.target.closest('[data-testimonial-del]');
    if (delBtn) {
      if (!confirm('¿Borrar esta foto?')) return;
      try {
        const res = await adminFetch(`/api/admin/testimonials/${delBtn.dataset.testimonialDel}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        toast('Foto eliminada.');
        loadTestimonials();
      } catch (err) {
        handleError('No se pudo borrar la foto.', err);
      }
    }
  });

  $t('#testimonialForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const isEdit = !!editingTestimonialId;
    const imageFile = $t('#testimonialImageInput').files[0];
    if (!isEdit && !imageFile) {
      toast('Elegí una foto.');
      return;
    }

    const formData = new FormData();
    formData.set('alt', form.alt.value.trim());
    formData.set('sort_order', form.sort_order.value || 0);
    if (imageFile) formData.set('image', imageFile);

    const url = isEdit ? `/api/admin/testimonials/${editingTestimonialId}` : '/api/admin/testimonials';
    try {
      const res = await adminFetch(url, { method: isEdit ? 'PUT' : 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || 'No se pudo guardar la foto.');
        return;
      }
      toast(isEdit ? 'Foto actualizada.' : 'Foto agregada.');
      closeTestimonialModal();
      loadTestimonials();
    } catch (err) {
      handleError('No se pudo guardar la foto.', err);
    }
  });

  loadTestimonials();
})();
