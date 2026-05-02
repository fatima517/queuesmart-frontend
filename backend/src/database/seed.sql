USE queuesmart;

INSERT INTO users (user_id, email, password, role)
VALUES (1, 'seed-business@queuesmart.local', '$2b$10$placeholderhashnotforlogin', 'business');

INSERT INTO profiles (user_id, full_name)
VALUES (1, 'QueueSmart Seed Business');

INSERT INTO services (service_id, business_id, service_name, description, expected_duration, priority_level)
VALUES
  (1, 1, 'General Consultation', 'Default walk-in service', 10, 'medium'),
  (2, 1, 'Express Check-in', 'Short counter visits', 5, 'high');

INSERT INTO queues (queue_id, service_id, status, max_size)
VALUES
  (1, 1, 'open', 50),
  (2, 2, 'open', 30);

-- Demo admin (password: admin123) and customers (password: pass123)
INSERT INTO users (user_id, email, password, role) VALUES
  (2, 'admin@queuesmart.local', '$2b$10$j98kpF5/3C3hCdFoq.sHbeBAUIy3FBJi3SQxmdH24/rvrIHC.Rj.a', 'administrator'),
  (3, 'alex.customer@queuesmart.local', '$2b$10$CfZCGJxsq9JoEufMxu2i6OcrRZnsBc7D5WQEj43dGl/5ipj5wNZlC', 'user'),
  (4, 'jamie.customer@queuesmart.local', '$2b$10$CfZCGJxsq9JoEufMxu2i6OcrRZnsBc7D5WQEj43dGl/5ipj5wNZlC', 'user'),
  (5, 'sam.customer@queuesmart.local', '$2b$10$CfZCGJxsq9JoEufMxu2i6OcrRZnsBc7D5WQEj43dGl/5ipj5wNZlC', 'user');

INSERT INTO profiles (user_id, full_name, phone) VALUES
  (2, 'QueueSmart Administrator', NULL),
  (3, 'Alex Rivera', '555-0101'),
  (4, 'Jamie Chen', '555-0102'),
  (5, 'Sam Okonkwo', '555-0103');

-- Rich demo data: completed visits + one active wait (different users → respects uq_queue_user)
INSERT INTO queue_entries (entry_id, queue_id, user_id, position, join_time, completed_at, wait_minutes, status) VALUES
  (1, 1, 3, 1, '2026-04-28 09:00:00', '2026-04-28 09:14:00', 14.00, 'served'),
  (2, 1, 4, 2, '2026-04-28 10:30:00', '2026-04-28 10:36:00', 6.00, 'canceled'),
  (3, 2, 5, 1, '2026-04-29 08:45:00', '2026-04-29 08:52:00', 7.00, 'served'),
  (4, 1, 5, 3, '2026-05-01 07:00:00', NULL, NULL, 'waiting');

INSERT INTO queue_history (entry_id, queue_id, user_id, service_id, join_time, completed_at, final_status, wait_minutes) VALUES
  (1, 1, 3, 1, '2026-04-28 09:00:00', '2026-04-28 09:14:00', 'served', 14.00),
  (2, 1, 4, 1, '2026-04-28 10:30:00', '2026-04-28 10:36:00', 'canceled', 6.00),
  (3, 2, 5, 2, '2026-04-29 08:45:00', '2026-04-29 08:52:00', 'served', 7.00);

ALTER TABLE queue_entries AUTO_INCREMENT = 100;
