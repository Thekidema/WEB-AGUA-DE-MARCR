/* ============================================================
   Agua de Mar — pedidos.js
   Ranking visual de "productos más pedidos" (veces pedido por
   WhatsApp) + lista de pedidos recientes. Solo lectura.
   ============================================================ */

(() => {
  const $p = (s, el = document) => el.querySelector(s);
  const escP = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const crcP = (n) => '₡' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const chartEl = $p('#pedidosChart');
  if (!chartEl) return; // esta página no tiene la sección de Pedidos

  async function loadStats() {
    try {
      const res = await adminFetch('/api/admin/orders/stats');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      renderChart(await res.json());
    } catch (err) {
      handleError('No se pudo cargar el ranking de pedidos.', err);
    }
  }

  function renderChart(ranked) {
    $p('#pedidosChartEmpty').hidden = ranked.length > 0;
    if (!ranked.length) { chartEl.innerHTML = ''; return; }

    const max = ranked[0].count;
    chartEl.innerHTML = ranked
      .map((r) => {
        const pct = Math.max(6, Math.round((r.count / max) * 100));
        const thumb = r.image
          ? `<img class="pedidos-bar-thumb" src="${r.image}" alt="" onerror="this.style.visibility='hidden'">`
          : `<span class="pedidos-bar-thumb pedidos-bar-thumb--empty"></span>`;
        return `
          <div class="pedidos-bar-row">
            <div class="pedidos-bar-label">
              ${thumb}
              <span>${escP(r.type)} ${escP(r.color)}</span>
            </div>
            <div class="pedidos-bar-track">
              <div class="pedidos-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="pedidos-bar-count">${r.count}</span>
          </div>`;
      })
      .join('');
  }

  async function loadRecent() {
    try {
      const res = await adminFetch('/api/admin/orders');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      renderRecent(await res.json());
    } catch (err) {
      handleError('No se pudo cargar la lista de pedidos.', err);
    }
  }

  function renderRecent(orders) {
    const body = $p('#pedidosBody');
    $p('#pedidosEmptyState').hidden = orders.length > 0;
    body.innerHTML = orders
      .map((o) => {
        const summary = o.items.map((i) => `${i.qty}× ${escP(i.type)} ${escP(i.color)}`).join(', ');
        const subtotal = o.items.reduce((s, i) => s + i.price * i.qty, 0);
        const date = new Date(o.created_at.replace(' ', 'T') + 'Z').toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' });
        return `
          <tr>
            <td data-label="Fecha">${date}</td>
            <td class="admin-cell-title">${summary}</td>
            <td data-label="Subtotal">${crcP(subtotal)}</td>
          </tr>`;
      })
      .join('');
  }

  loadStats();
  loadRecent();
})();
