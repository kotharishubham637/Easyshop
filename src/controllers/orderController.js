// APPLICATION TIER - HTTP layer for orders
const service = require('../services/orderService');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

exports.create = wrap(async (req, res) => res.status(201).json(await service.placeOrder(req.body)));
exports.get = wrap(async (req, res) => res.json(await service.getOrder(Number(req.params.id))));
exports.listByEmail = wrap(async (req, res) => res.json(await service.listOrdersByEmail(req.query.email)));
