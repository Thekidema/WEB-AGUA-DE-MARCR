/* ============================================================
   Agua de Mar — tabs.js
   Navegación por pestañas del panel (sin recargar página).
   ============================================================ */

document.querySelectorAll('.admin-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-panel').forEach((p) => { p.hidden = true; });

    btn.classList.add('active');
    const panel = document.getElementById('tab-' + btn.dataset.tab);
    if (panel) panel.hidden = false;
  });
});
