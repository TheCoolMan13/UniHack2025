-- Migration: Add driver requests tables
-- Run this to create the driver_requests and driver_request_responses tables

USE carshare_db;

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

