-- Migration: Add rider searches tables
-- Run this to create the rider_searches and rider_search_matches tables

USE carshare_db;

-- Rider searches table (passengers saving searches for future matches)
CREATE TABLE IF NOT EXISTS rider_searches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    passenger_id INT NOT NULL,
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    pickup_address VARCHAR(500) NOT NULL,
    dropoff_latitude DECIMAL(10, 8) NOT NULL,
    dropoff_longitude DECIMAL(11, 8) NOT NULL,
    dropoff_address VARCHAR(500) NOT NULL,
    schedule_days JSON NOT NULL, -- Array of days: ["monday", "tuesday", ...]
    schedule_time VARCHAR(20) NOT NULL, -- e.g., "7:30 AM"
    status ENUM('active', 'fulfilled', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_passenger (passenger_id),
    INDEX idx_status (status),
    INDEX idx_location (pickup_latitude, pickup_longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rider search matches table (matches found for saved searches)
CREATE TABLE IF NOT EXISTS rider_search_matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rider_search_id INT NOT NULL,
    ride_id INT NOT NULL,
    match_score INT NOT NULL,
    status ENUM('new', 'viewed', 'requested', 'dismissed') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rider_search_id) REFERENCES rider_searches(id) ON DELETE CASCADE,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    INDEX idx_rider_search (rider_search_id),
    INDEX idx_ride (ride_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_search_ride (rider_search_id, ride_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

