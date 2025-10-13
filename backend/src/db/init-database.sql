-- Create database if it doesn't exist
-- This should be run as a postgres superuser
SELECT 'CREATE DATABASE mygymtracker'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mygymtracker')\gexec

