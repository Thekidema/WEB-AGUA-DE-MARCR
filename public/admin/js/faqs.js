/* ============================================================
   Agua de Mar — faqs.js
   CRUD de preguntas frecuentes.
   ============================================================ */

(() => {
  const $f = (s, el = document) => el.querySelector(s);
  const $$f = (s, el = document) => [...el.querySelectorAll(s)];
  const escFaq = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let faqs = [];
  let editingFaqId = null;

  async function loadFaqs() {
    try {
      const res = await adminFetch('/api/admin/faqs');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      faqs = await res.json();
      renderFaqTable();
    } catch (err) {
      handleError('No se pudieron cargar las preguntas frecuentes.', err);
    }
  }

  function renderFaqTable() {
    const body = $f('#faqsBody');
    if (!body) return;
    $f('#faqEmptyState').hidden = faqs.length > 0;
    body.innerHTML = faqs
      .map(
        (f) => `
      <tr data-id="${f.id}">
        <td>${f.sort_order}</td>
        <td>${escFaq(f.question)}</td>
        <td class="admin-row-actions">
          <button type="button" class="btn btn-ghost" data-faq-edit="${f.id}">Editar</button>
          <button type="button" class="btn btn-ghost" data-faq-del="${f.id}">Borrar</button>
        </td>
      </tr>`
      )
      .join('');
  }

  function openFaqModal(faq) {
    editingFaqId = faq ? faq.id : null;
    $f('#faqModalTitle').textContent = faq ? 'Editar pregunta' : 'Agregar pregunta';
    const form = $f('#faqForm');
    form.reset();
    form.id.value = editingFaqId || '';
    if (faq) {
      form.question.value = faq.question;
      form.answer.value = faq.answer;
      form.sort_order.value = faq.sort_order;
    } else {
      form.sort_order.value = faqs.length;
    }
    $f('#faqModalScrim').classList.add('show');
  }

  function closeFaqModal() {
    $f('#faqModalScrim').classList.remove('show');
    editingFaqId = null;
  }

  const newBtn = $f('#newFaqBtn');
  if (newBtn) {
    newBtn.addEventListener('click', () => openFaqModal(null));
    $f('#faqCancelBtn').addEventListener('click', closeFaqModal);
    $f('#faqModalScrim').addEventListener('click', (e) => {
      if (e.target === $f('#faqModalScrim')) closeFaqModal();
    });

    document.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-faq-edit]');
      if (editBtn) return openFaqModal(faqs.find((f) => f.id === editBtn.dataset.faqEdit));

      const delBtn = e.target.closest('[data-faq-del]');
      if (delBtn) {
        if (!confirm('¿Borrar esta pregunta?')) return;
        try {
          const res = await adminFetch(`/api/admin/faqs/${delBtn.dataset.faqDel}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          toast('Pregunta eliminada.');
          loadFaqs();
        } catch (err) {
          handleError('No se pudo borrar la pregunta.', err);
        }
      }
    });

    $f('#faqForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const isEdit = !!editingFaqId;
      const payload = {
        question: form.question.value.trim(),
        answer: form.answer.value.trim(),
        sort_order: Number(form.sort_order.value) || 0,
      };
      const url = isEdit ? `/api/admin/faqs/${editingFaqId}` : '/api/admin/faqs';
      try {
        const res = await adminFetch(url, {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast(data.error || 'No se pudo guardar la pregunta.');
          return;
        }
        toast(isEdit ? 'Pregunta actualizada.' : 'Pregunta agregada.');
        closeFaqModal();
        loadFaqs();
      } catch (err) {
        handleError('No se pudo guardar la pregunta.', err);
      }
    });

    loadFaqs();
  }
})();
