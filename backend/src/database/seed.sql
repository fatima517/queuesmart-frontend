USE queuesmart;

INSERT INTO users (user_id, email, password, role)
VALUES (1, 'seed-business@queuesmart.local', '$2b$10$placeholderhashnotforlogin', 'business');

INSERT INTO profiles (user_id, full_name)
VALUES (1, 'QueueSmart Seed Business');

INSERT INTO services (service_id, business_id, service_name, description, expected_duration, priority_level)
VALUES (1, 1, 'General Consultation', 'Default walk-in service', 10, 'medium');

INSERT INTO queues (queue_id, service_id, status, max_size)
VALUES (1, 1, 'open', 50);
