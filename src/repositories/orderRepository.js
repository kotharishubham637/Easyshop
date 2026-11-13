// DATA TIER - order persistence. Checkout runs in a single transaction.
const pool = require('../config/db');

/**
 * Places an order atomically:
 *  1. locks the product rows (SELECT ... FOR UPDATE)
 *  2. verifies stock
 *  3. inserts order + items
 *  4. decrements stock
 * Throws an error with .status set for business-rule failures.
 */
async function createOrder(customer, items) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Merge duplicate product lines and lock rows in a stable order (avoids deadlocks)
    const merged = new Map();
    for (const it of items) {
      merged.set(it.productId, (merged.get(it.productId) || 0) + it.quantity);
    }
    const ids = [...merged.keys()].sort((a, b) => a - b);

    const [products] = await conn.query(
      'SELECT id, name, price, stock FROM products WHERE id IN (?) ORDER BY id FOR UPDATE',
      [ids]
    );
    const byId = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    const lines = [];
    for (const id of ids) {
      const qty = merged.get(id);
      const product = byId.get(id);
      if (!product) {
        const e = new Error(`Product ${id} does not exist`);
        e.status = 404;
        throw e;
      }
      if (product.stock < qty) {
        const e = new Error(`Insufficient stock for "${product.name}" (available: ${product.stock})`);
        e.status = 409;
        throw e;
      }
      total += product.price * qty;
      lines.push({ productId: id, quantity: qty, unitPrice: product.price });
    }
    total = Math.round(total * 100) / 100;

    const [orderResult] = await conn.query(
      `INSERT INTO orders (customer_name, customer_email, customer_phone, shipping_address, total_amount)
       VALUES (?, ?, ?, ?, ?)`,
      [customer.name, customer.email, customer.phone, customer.address, total]
    );
    const orderId = orderResult.insertId;

    for (const l of lines) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, l.productId, l.quantity, l.unitPrice]
      );
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [l.quantity, l.productId]);
    }

    await conn.commit();
    return orderId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function findById(id) {
  const [orders] = await pool.query(
    `SELECT id, customer_name AS customerName, customer_email AS customerEmail,
            customer_phone AS customerPhone, shipping_address AS shippingAddress,
            total_amount AS totalAmount, status, created_at AS createdAt
       FROM orders WHERE id = ?`,
    [id]
  );
  if (!orders[0]) return null;
  const [items] = await pool.query(
    `SELECT oi.product_id AS productId, p.name, oi.quantity, oi.unit_price AS unitPrice
       FROM order_items oi JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?`,
    [id]
  );
  return { ...orders[0], items };
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT id, total_amount AS totalAmount, status, created_at AS createdAt
       FROM orders WHERE customer_email = ? ORDER BY created_at DESC`,
    [email]
  );
  return rows;
}

module.exports = { createOrder, findById, findByEmail };
