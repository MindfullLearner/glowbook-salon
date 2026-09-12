-- ============================================
-- GlowBook — Salon Booking System — Database Schema
-- ============================================
-- Import this file in phpMyAdmin OR run:
-- mysql -u root -p < database.sql

CREATE DATABASE IF NOT EXISTS salon_booking_system;
USE salon_booking_system;

-- -----------------------------
-- Table: users
-- Stores both clients and admin/salon-owner (role column)
-- -----------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,        -- bcrypt hash, never plain text
    phone VARCHAR(20) DEFAULT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------
-- Table: services
-- The salon treatments/services that can be booked
-- -----------------------------
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------
-- Table: stylists
-- The salon's staff/stylists a client can (optionally) choose when booking
-- -----------------------------
CREATE TABLE stylists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(150) DEFAULT NULL,   -- e.g. "Hair Colour Specialist", "Bridal Makeup Artist"
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------
-- Table: appointments
-- Links a client to a service + (optionally) a specific stylist, at a date/time
-- -----------------------------
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    stylist_id INT DEFAULT NULL,           -- NULL = "any available stylist"
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE SET NULL
);

-- -----------------------------
-- Seed data
-- Default admin login -> email: admin@example.com | password: Admin@123
-- IMPORTANT: run generate_password.php once and update this hash for your PHP version
-- -----------------------------
INSERT INTO users (name, email, password, role) VALUES
('Salon Admin', 'admin@example.com', '$2y$10$W3n0X9c2q1Pz7yQe1nGZmeQm7z3z2iFhU2b1lB1x2K9m8yQeVv2Zi', 'admin');

INSERT INTO services (name, description, duration_minutes, price) VALUES
('Haircut & Styling', 'Wash, cut, and blow-dry styled to suit you.', 45, 1500.00),
('Hair Colouring', 'Full colour or highlights using premium products.', 120, 5500.00),
('Facial Treatment', 'Deep-cleansing facial to refresh and hydrate skin.', 60, 3000.00),
('Manicure & Pedicure', 'Nail shaping, cuticle care, and polish for hands and feet.', 50, 2000.00),
('Bridal Makeup', 'Full bridal makeup package with trial session available.', 90, 8000.00),
('Relaxing Spa Massage', 'Full-body massage to release tension and relax.', 60, 3500.00);

INSERT INTO stylists (name, specialty) VALUES
('Ayesha Khan', 'Hair Colour Specialist'),
('Bilal Ahmed', 'Haircut & Styling Expert'),
('Sana Malik', 'Bridal Makeup Artist'),
('Fatima Noor', 'Skin Care & Facials');
