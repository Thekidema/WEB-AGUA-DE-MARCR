const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

function serializeProduct(row) {
  return {
    id: row.id,
    type: row.type,
    color: row.color,
    price: row.price,
    sizes: JSON.parse(row.sizes),
    tone: row.tone,
    desc: row.desc,
    image: `${R2_PUBLIC_URL}/${row.image}`,
    active: !!row.active,
    featured: !!row.featured,
  };
}

module.exports = { serializeProduct };
