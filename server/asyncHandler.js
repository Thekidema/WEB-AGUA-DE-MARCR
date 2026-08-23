/* Express 4 no reenvía automáticamente los rechazos de promesas de un
   handler async a next() (eso solo lo hace Express 5) — sin este wrapper,
   una excepción en cualquier ruta async (ej. un timeout de red hacia la
   base de datos) queda como unhandled rejection y tira el proceso entero. */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
