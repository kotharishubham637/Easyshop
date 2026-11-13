// APPLICATION TIER - REST API routes (mounted at /api)
const express = require('express');
const products = require('../controllers/productController');
const orders = require('../controllers/orderController');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', app: 'Easyshop' }));

router.get('/categories', products.categories);

router.get('/products', products.list);
router.get('/products/:id', products.get);
router.post('/products', products.create);
router.put('/products/:id', products.update);
router.delete('/products/:id', products.remove);

router.post('/orders', orders.create);
router.get('/orders', orders.listByEmail);
router.get('/orders/:id', orders.get);

module.exports = router;
