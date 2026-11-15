-- TiDB (MySQL 8.0 Compatible) Relational Schema for LUMINA OPTICS

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  firebase_uid VARCHAR(128) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NULL,
  role ENUM('CUSTOMER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  fcm_token VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_phone (phone)
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(128) NOT NULL UNIQUE,
  sku VARCHAR(64) NOT NULL UNIQUE,
  name_vi VARCHAR(160) NOT NULL,
  name_en VARCHAR(160) NOT NULL,
  description_vi TEXT NOT NULL,
  description_en TEXT NOT NULL,
  price DECIMAL(12, 0) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  frame_style ENUM('SQUARE', 'ROUND', 'CAT_EYE', 'AVIATOR', 'RIMLESS', 'BROWLINE') NOT NULL,
  material ENUM('TITANIUM', 'ACETATE', 'METAL_PVD', 'TR90') NOT NULL,
  gender ENUM('MALE', 'FEMALE', 'UNISEX', 'KIDS') NOT NULL,
  color_tone ENUM('BLACK', 'TORTOISE', 'SILVER', 'GOLD', 'ROSE', 'CLEAR_CRYSTAL') NOT NULL,
  suitable_faces JSON NOT NULL,
  cloudinary_url VARCHAR(500) NOT NULL,
  average_rating DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
  total_reviews INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_filter_6d (is_active, frame_style, material, gender, price)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_code VARCHAR(32) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  shipping_address VARCHAR(300) NOT NULL,
  distance_km DECIMAL(8, 2) NOT NULL,
  shipping_fee DECIMAL(12, 0) NOT NULL,
  subtotal DECIMAL(12, 0) NOT NULL,
  discount_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 0) NOT NULL,
  voucher_code VARCHAR(32) NULL,
  payment_method ENUM('QR_CODE', 'COD') NOT NULL,
  payment_status ENUM('UNPAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
  order_status ENUM('PENDING', 'ARRANGING', 'READY', 'SHIPPING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_orders_user_created (user_id, created_at DESC),
  INDEX idx_orders_admin_queue (payment_status, order_status, created_at)
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12, 0) NOT NULL,
  lens_type ENUM('FRAME_ONLY', 'BLUE_LIGHT', 'PHOTOCHROMIC', 'PRESCRIPTION') NOT NULL,
  lens_price DECIMAL(12, 0) NOT NULL DEFAULT 0,
  prescription_json JSON NULL,
  prescription_image_url VARCHAR(500) NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS vouchers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL UNIQUE,
  discount_percent INT NOT NULL,
  is_first_order_only BOOLEAN NOT NULL DEFAULT FALSE,
  is_holiday_special BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS voucher_usages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  voucher_id BIGINT NOT NULL,
  user_id BIGINT NULL,
  customer_email VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  used_year INT NOT NULL,
  order_code VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_voucher_usages_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
  INDEX idx_voucher_email_year (voucher_id, customer_email, used_year),
  INDEX idx_voucher_phone_year (voucher_id, customer_phone, used_year)
);

CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'HIDDEN') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review_order_product (order_id, product_id),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_tryon_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  detected_face_shape ENUM('ROUND', 'SQUARE', 'OVAL', 'LONG') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tryon_user_date (user_id, created_at)
);
