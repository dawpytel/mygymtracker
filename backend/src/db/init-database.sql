-- Create database if it doesn't exist
-- This should be run as a postgres superuser
SELECT 'CREATE DATABASE myapp_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'myapp_dev')\gexec

