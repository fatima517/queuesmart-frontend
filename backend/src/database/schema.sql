CREATE DATABASE IF NOT EXISTS queuesmart;
USE queuesmart;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS queue_entries;
DROP TABLE IF EXISTS queues;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;

-- 1. UserCredentials
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'administrator', 'business') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. UserProfile
CREATE TABLE profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    preferences TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 3. Service
CREATE TABLE services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    expected_duration INT NOT NULL,
    priority_level ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_services_business
        FOREIGN KEY (business_id) REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 4. Queue
CREATE TABLE queues (
    queue_id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    max_size INT NOT NULL DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_queues_service
        FOREIGN KEY (service_id) REFERENCES services(service_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 5. QueueEntry
CREATE TABLE queue_entries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    queue_id INT NOT NULL,
    user_id INT NOT NULL,
    position INT NOT NULL,
    join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('waiting', 'served', 'canceled') NOT NULL DEFAULT 'waiting',
    CONSTRAINT fk_queue_entries_queue
        FOREIGN KEY (queue_id) REFERENCES queues(queue_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_queue_entries_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT uq_queue_user UNIQUE (queue_id, user_id),
    CONSTRAINT uq_queue_position UNIQUE (queue_id, position)
);

-- 6. Notification / History
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('sent', 'viewed') NOT NULL DEFAULT 'sent',
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);