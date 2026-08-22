/* ============================================================
   Agua de Mar — admin-common.js
   Helpers compartidos por login.js y dashboard.js.
   No depende de app.js (evita cargar lógica de carrito/catálogo
   público que no aplica en el panel admin).
   ============================================================ */

let toastT;
function toast(msg) {
  try {
    const toastEl = document.getElementById('toast');
    const msgEl = document.getElementById('toastMsg');
    if (!toastEl || !msgEl) return;
    msgEl.textContent = msg || 'Ocurrió algo inesperado.';
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
  } catch (e) {
    console.warn('Toast falló:', msg);
  }
}

function handleError(message, err) {
  console.error('[AguaDeMar Admin]', message, err || '');
  toast(message || 'Ocurrió un error inesperado.');
}

/* fetch con manejo centralizado de sesión expirada (401 -> login) */
async function adminFetch(url, opts = {}) {
  const res = await fetch(url, { credentials: 'same-origin', ...opts });
  if (res.status === 401) {
    window.location.href = 'login.html?expired=1';
    throw new Error('Sesión expirada');
  }
  return res;
}

async function adminLogout() {
  try {
    await adminFetch('/api/admin/logout', { method: 'POST' });
  } catch (e) { /* ya se redirige si expiró */ }
  window.location.href = 'login.html';
}
