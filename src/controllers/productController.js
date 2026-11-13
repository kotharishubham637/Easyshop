// APPLICATION TIER - HTTP layer for products (thin: parse request, call service, send response)
const service = require('../services/productService');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

exports.list = wrap(async (req, res) => res.json(await service.listProducts(req.query)));
exports.get = wrap(async (req, res) => res.json(await service.getProduct(Number(req.params.id))));
exports.create = wrap(async (req, res) => res.status(201).json(await service.createProduct(req.body)));
exports.update = wrap(async (req, res) => res.json(await service.updateProduct(Number(req.params.id), req.body)));
exports.remove = wrap(async (req, res) => {
  await service.deleteProduct(Number(req.params.id));
  res.status(204).end();
});
exports.categories = wrap(async (req, res) => res.json(await service.listCategories()));
