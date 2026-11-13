// APPLICATION TIER - checkout rules and validation
const repo = require('../repositories/orderRepository');

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function placeOrder(body) {
  const customer = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    phone: body.phone ? String(body.phone).trim() : null,
    address: String(body.address || '').trim()
  };
  if (!customer.name) throw httpError(400, 'Name is required');
  if (!EMAIL_RE.test(customer.email)) throw httpError(400, 'A valid email is required');
  if (!customer.address) throw httpError(400, 'Shipping address is required');

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw httpError(400, 'Cart is empty');
  }
  const items = body.items.map((i) => ({
    productId: parseInt(i.productId, 10),
    quantity: parseInt(i.quantity, 10)
  }));
  if (items.some((i) => !i.productId || !(i.quantity > 0) || i.quantity > 20)) {
    throw httpError(400, 'Each item needs a productId and a quantity between 1 and 20');
  }

  const orderId = await repo.createOrder(customer, items);
  return repo.findById(orderId);
}

async function getOrder(id) {
  const order = await repo.findById(id);
  if (!order) throw httpError(404, 'Order not found');
  return order;
}

async function listOrdersByEmail(email) {
  if (!EMAIL_RE.test(String(email || ''))) throw httpError(400, 'A valid email query parameter is required');
  return repo.findByEmail(String(email).trim().toLowerCase());
}

module.exports = { placeOrder, getOrder, listOrdersByEmail };
