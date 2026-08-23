/* ============================================================
   Agua de Mar — settings.js
   Configuración pública: WhatsApp / Instagram.
   ============================================================ */

(async () => {
  const form = document.getElementById('settingsForm');
  if (!form) return;

  try {
    const res = await adminFetch('/api/admin/settings');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    form.whatsapp.value = data.whatsapp;
    form.instagram.value = data.instagram;
  } catch (err) {
    handleError('No se pudo cargar la configuración.', err);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: form.whatsapp.value.trim(), instagram: form.instagram.value.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || 'No se pudo guardar la configuración.');
        return;
      }
      toast('Configuración actualizada.');
    } catch (err) {
      handleError('No se pudo guardar la configuración.', err);
    }
  });
})();
