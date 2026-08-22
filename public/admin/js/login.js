/* ============================================================
   Agua de Mar — login.js
   ============================================================ */

if (new URLSearchParams(location.search).get('expired')) {
  toast('Tu sesión expiró. Iniciá sesión de nuevo.');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error || 'Usuario o contraseña incorrectos.');
      return;
    }
    window.location.href = 'dashboard.html';
  } catch (err) {
    handleError('Error de conexión. Intenta de nuevo.', err);
  }
});
