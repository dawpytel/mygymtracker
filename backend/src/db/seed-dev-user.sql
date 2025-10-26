-- ============================================================================
-- Development User Seed Data
-- ============================================================================
-- This script creates a default user for development purposes
-- Run this after running the initial schema migration
--
-- To execute: psql -U postgres -d myapp_dev -f seed-dev-user.sql
-- Or via npm script: npm run db:seed-dev
-- ============================================================================

-- Insert default development user
-- Password hash is for 'password123' (bcrypt)
INSERT INTO users (id, email, password_hash, created_at, account_created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@example.com',
  '$2b$10$rKJ9nLNZ5fUhq0p.vJ3zO.xqL3XqD8p5F5mH5YpqG5xZ5qF5qF5qF',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verify the user was created
SELECT 
  id,
  email,
  created_at,
  'User created successfully' as status
FROM users 
WHERE email = 'dev@example.com';

-- ============================================================================
-- Optional: Create sample workout plans for the dev user
-- ============================================================================

-- Insert sample exercises first (if not already present)
INSERT INTO exercises (id, name) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Bench Press'),
  ('10000000-0000-0000-0000-000000000002', 'Squat'),
  ('10000000-0000-0000-0000-000000000003', 'Deadlift'),
  ('10000000-0000-0000-0000-000000000004', 'Overhead Press'),
  ('10000000-0000-0000-0000-000000000005', 'Barbell Row')
ON CONFLICT (name) DO NOTHING;

-- Insert sample workout plans
INSERT INTO workout_plans (id, user_id, plan_name, created_at)
VALUES 
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Push Day', NOW() - INTERVAL '3 days'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pull Day', NOW() - INTERVAL '2 days'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Leg Day', NOW() - INTERVAL '1 day')
ON CONFLICT (user_id, plan_name) DO NOTHING;

-- Verify sample data
SELECT 
  COUNT(*) as total_plans,
  'Sample workout plans created' as status
FROM workout_plans 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. This user should ONLY be used in development environments
-- 2. Never deploy this to production
-- 3. The user ID is: 00000000-0000-0000-0000-000000000001
-- 4. The email is: dev@example.com
-- 5. The password is: password123 (for future auth implementation)
-- ============================================================================

