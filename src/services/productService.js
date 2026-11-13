// APPLICATION TIER - business rules and validation for products
const repo = require('../repositories/productRepository');

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

function toNumberOrNull(value) {
  if (value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

async function listProducts(query) {
  const page = Math.max(1, toInt(query.page, 1));
  const limit = Math.min(50, Math.max(1, toInt(query.limit, 12)));
  const { rows, total } = await repo.findAll({
    search: (query.search || '').trim(),
    categoryId: toInt(query.category, null),
    minPrice: toNumberOrNull(query.minPrice),
    maxPrice: toNumberOrNull(query.maxPrice),
    sort: query.sort,
    limit,
    offset: (page - 1) * limit
  });
  return { data: rows, page, limit, total, totalPages: Math.ceil(total / limit) };
}

async function getProduct(id) {
  const product = await repo.findById(id);
  if (!product) throw httpError(404, 'Product not found');
  return product;
}

async function validate(body) {
  const p = {
    categoryId: toInt(body.categoryId, null),
    name: String(body.name || '').trim(),
    brand: String(body.brand || '').trim(),
    description: body.description ? String(body.description).trim() : null,
    price: Number(body.price),
    stock: Number(body.stock),
    imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null
  };
  if (!p.name || !p.brand) throw httpError(400, 'name and brand are required');
  if (!(p.price >= 0)) throw httpError(400, 'price must be a number >= 0');
  if (!Number.isInteger(p.stock) || p.stock < 0) throw httpError(400, 'stock must be a whole number >= 0');
  if (!p.categoryId || !(await repo.categoryExists(p.categoryId))) throw httpError(400, 'Valid categoryId is required');
  return p;
}

async function createProduct(body) {
  const id = await repo.create(await validate(body));
  return repo.findById(id);
}

async function updateProduct(id, body) {
  const ok = await repo.update(id, await validate(body));
  if (!ok) throw httpError(404, 'Product not found');
  return repo.findById(id);
}

async function deleteProduct(id) {
  try {
    const ok = await repo.remove(id);
    if (!ok) throw httpError(404, 'Product not found');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      throw httpError(409, 'Product is part of existing orders and cannot be deleted');
    }
    throw err;
  }
}

const listCategories = () => repo.findCategories();

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, listCategories };
