-- Car Share Database Schema
-- Run this script to create the database and tables

CREATE DATABASE IF NOT EXISTS carshare_db;
USE carshare_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('driver', 'passenger', 'both') DEFAULT 'passenger',
    rating DECIMAL(3, 2) DEFAULT 0.00,
    verified BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rides table
CREATE TABLE IF NOT EXISTS rides (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id INT NOT NULL,
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    pickup_address VARCHAR(500) NOT NULL,
    dropoff_latitude DECIMAL(10, 8) NOT NULL,
    dropoff_longitude DECIMAL(11, 8) NOT NULL,
    dropoff_address VARCHAR(500) NOT NULL,
    schedule_days JSON NOT NULL, -- Array of days: ["monday", "tuesday", ...]
    schedule_time VARCHAR(20) NOT NULL, -- e.g., "7:30 AM"
    price DECIMAL(10, 2) NOT NULL,
    available_seats INT NOT NULL DEFAULT 1,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_driver (driver_id),
    INDEX idx_status (status),
    INDEX idx_location (pickup_latitude, pickup_longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ride requests table
CREATE TABLE IF NOT EXISTS ride_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ride_id INT NOT NULL,
    passenger_id INT NOT NULL,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    pickup_address VARCHAR(500),
    dropoff_latitude DECIMAL(10, 8),
    dropoff_longitude DECIMAL(11, 8),
    dropoff_address VARCHAR(500),
    status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ride (ride_id),
    INDEX idx_passenger (passenger_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Driver requests table (drivers looking for riders)
CREATE TABLE IF NOT EXISTS driver_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id INT NOT NULL,
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    pickup_address VARCHAR(500) NOT NULL,
    dropoff_latitude DECIMAL(10, 8) NOT NULL,
    dropoff_longitude DECIMAL(11, 8) NOT NULL,
    dropoff_address VARCHAR(500) NOT NULL,
    schedule_days JSON NOT NULL, -- Array of days: ["monday", "tuesday", ...]
    schedule_time VARCHAR(20) NOT NULL, -- e.g., "7:30 AM"
    price DECIMAL(10, 2) NOT NULL,
    available_seats INT NOT NULL DEFAULT 1,
    status ENUM('active', 'fulfilled', 'cancelled') DEFAULT 'active',
    notes TEXT, -- Optional notes from driver
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_driver (driver_id),
    INDEX idx_status (status),
    INDEX idx_location (pickup_latitude, pickup_longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Driver request responses table (passengers responding to driver requests)
CREATE TABLE IF NOT EXISTS driver_request_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_request_id INT NOT NULL,
    passenger_id INT NOT NULL,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    pickup_address VARCHAR(500),
    dropoff_latitude DECIMAL(10, 8),
    dropoff_longitude DECIMAL(11, 8),
    dropoff_address VARCHAR(500),
    status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_request_id) REFERENCES driver_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_driver_request (driver_request_id),
    INDEX idx_passenger (passenger_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sessions table (for JWT token blacklisting if needed)
CREATE TABLE IF NOT EXISTS sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_token (token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

