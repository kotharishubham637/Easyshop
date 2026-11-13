-- Easyshop - Data tier (MySQL 8+)
CREATE DATABASE IF NOT EXISTS easyshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE easyshop;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name  VARCHAR(80)  NOT NULL,
  slug  VARCHAR(80)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE products (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  category_id  INT UNSIGNED  NOT NULL,
  name         VARCHAR(150)  NOT NULL,
  brand        VARCHAR(80)   NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock        INT UNSIGNED  NOT NULL DEFAULT 0,
  image_url    VARCHAR(255)  DEFAULT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_category (category_id),
  KEY idx_products_name (name),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  customer_name   VARCHAR(120)  NOT NULL,
  customer_email  VARCHAR(160)  NOT NULL,
  customer_phone  VARCHAR(30)   DEFAULT NULL,
  shipping_address TEXT         NOT NULL,
  total_amount    DECIMAL(12,2) NOT NULL,
  status          ENUM('PENDING','PAID','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_email (customer_email)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_id    INT UNSIGNED  NOT NULL,
  product_id  INT UNSIGNED  NOT NULL,
  quantity    INT UNSIGNED  NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_items_order (order_id),
  CONSTRAINT fk_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id)   ON DELETE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB;

-- Seed data
INSERT INTO categories (name, slug) VALUES
  ('Mobiles',      'mobiles'),
  ('Laptops',      'laptops'),
  ('Audio',        'audio'),
  ('Televisions',  'televisions'),
  ('Wearables',    'wearables'),
  ('Accessories',  'accessories');

INSERT INTO products (category_id, name, brand, description, price, stock, image_url) VALUES
  (1, 'Galaxy S-Series 5G 256GB',      'Samsung',  '6.7-inch AMOLED display, 50MP triple camera, 5000mAh battery.',          74999.00, 25, 'https://placehold.co/400x300?text=Galaxy+5G'),
  (1, 'iPhone 15 128GB',               'Apple',    '6.1-inch Super Retina XDR, A16 Bionic, USB-C.',                          69900.00, 18, 'https://placehold.co/400x300?text=iPhone+15'),
  (1, 'Nord CE 4 8GB/256GB',           'OnePlus',  '120Hz AMOLED, Snapdragon 7 Gen 3, 100W fast charging.',                  24999.00, 40, 'https://placehold.co/400x300?text=Nord+CE+4'),
  (2, 'ZenBook 14 OLED',               'ASUS',     'Intel Core Ultra 7, 16GB RAM, 1TB SSD, 14-inch 2.8K OLED.',              99990.00, 12, 'https://placehold.co/400x300?text=ZenBook+14'),
  (2, 'MacBook Air 13 M3',             'Apple',    'Apple M3 chip, 8GB unified memory, 256GB SSD, up to 18h battery.',      104900.00, 10, 'https://placehold.co/400x300?text=MacBook+Air'),
  (2, 'IdeaPad Slim 3 Ryzen 5',        'Lenovo',   'Ryzen 5 7520U, 16GB RAM, 512GB SSD, 15.6-inch FHD.',                     44990.00, 30, 'https://placehold.co/400x300?text=IdeaPad+Slim+3'),
  (3, 'WH-1000XM5 Headphones',         'Sony',     'Industry-leading noise cancelling, 30-hour battery.',                    26990.00, 22, 'https://placehold.co/400x300?text=WH-1000XM5'),
  (3, 'Airdopes 141 Earbuds',          'boAt',     '42-hour playback, ENx noise cancellation, IPX4.',                         1299.00, 120,'https://placehold.co/400x300?text=Airdopes+141'),
  (3, 'Soundbar 2.1 300W',             'JBL',      'Wireless subwoofer, Dolby Digital, HDMI ARC.',                           17999.00, 15, 'https://placehold.co/400x300?text=JBL+Soundbar'),
  (4, '55-inch 4K Smart Google TV',    'Sony',     'Bravia 4K HDR, Google TV, Dolby Audio.',                                 67990.00, 9,  'https://placehold.co/400x300?text=Sony+55+4K'),
  (4, '43-inch Full HD Smart TV',      'Mi',       'Android TV, 20W speakers, Dolby Audio.',                                 24999.00, 35, 'https://placehold.co/400x300?text=Mi+43+FHD'),
  (5, 'Watch Series 9 GPS 41mm',       'Apple',    'Always-on Retina display, S9 chip, double-tap gesture.',                 41900.00, 14, 'https://placehold.co/400x300?text=Watch+S9'),
  (5, 'Smart Band 8',                  'Xiaomi',   '1.62-inch AMOLED, 16-day battery, 150+ workout modes.',                   2999.00, 80, 'https://placehold.co/400x300?text=Band+8'),
  (6, '65W GaN Fast Charger',          'Anker',    '3-port GaN charger for laptop, phone and tablet.',                        3499.00, 60, 'https://placehold.co/400x300?text=GaN+Charger'),
  (6, '20000mAh Power Bank',           'Mi',       '22.5W fast charging, dual output, USB-C in/out.',                         2199.00, 75, 'https://placehold.co/400x300?text=Power+Bank'),
  (6, 'Wireless Mouse MX Anywhere',    'Logitech', 'Multi-device, 8000 DPI sensor, USB-C rechargeable.',                      7495.00, 28, 'https://placehold.co/400x300?text=MX+Anywhere');
