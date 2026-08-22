function serializeProduct(row) {
  return {
    id: row.id,
    type: row.type,
    color: row.color,
    price: row.price,
    sizes: JSON.parse(row.sizes),
    tone: row.tone,
    desc: row.desc,
    image: `/assets/images/products/${row.image}`,
  };
}

module.exports = { serializeProduct };
