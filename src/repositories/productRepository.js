// DATA TIER - all SQL for products and categories lives here
const pool = require('../config/db');

const BASE_SELECT = `
  SELECT p.id, p.category_id AS categoryId, c.name AS category, p.name, p.brand,
         p.description, p.price, p.stock, p.image_url AS imageUrl
  FROM products p
  JOIN categories c ON c.id = p.category_id`;

async function findAll({ search, categoryId, minPrice, maxPrice, sort, limit, offset }) {
  const where = [];
  const params = [];

  if (search) {
    where.push('(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (categoryId) { where.push('p.category_id = ?'); params.push(categoryId); }
  if (minPrice != null) { where.push('p.price >= ?'); params.push(minPrice); }
  if (maxPrice != null) { where.push('p.price <= ?'); params.push(maxPrice); }

  const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  const orderBy = {
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    name: 'p.name ASC',
    newest: 'p.created_at DESC'
  }[sort] || 'p.id ASC';

  const [rows] = await pool.query(
    `${BASE_SELECT}${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p${whereSql}`,
    params
  );
  return { rows, total };
}

async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE p.id = ?`, [id]);
  return rows[0] || null;
}

async function create(p) {
  const [result] = await pool.query(
    `INSERT INTO products (category_id, name, brand, description, price, stock, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [p.categoryId, p.name, p.brand, p.description, p.price, p.stock, p.imageUrl]
  );
  return result.insertId;
}

async function update(id, p) {
  const [result] = await pool.query(
    `UPDATE products
        SET category_id = ?, name = ?, brand = ?, description = ?, price = ?, stock = ?, image_url = ?
      WHERE id = ?`,
    [p.categoryId, p.name, p.brand, p.description, p.price, p.stock, p.imageUrl, id]
  );
  return result.affectedRows > 0;
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function findCategories() {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.slug, COUNT(p.id) AS productCount
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.name`
  );
  return rows;
}

async function categoryExists(id) {
  const [rows] = await pool.query('SELECT 1 FROM categories WHERE id = ?', [id]);
  return rows.length > 0;
}

module.exports = { findAll, findById, create, update, remove, findCategories, categoryExists };
