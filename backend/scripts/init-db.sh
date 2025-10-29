#!/bin/bash
set -e

# PostgreSQL initialization script
# This script runs when the PostgreSQL container is first created
# It creates both the development and E2E test databases

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create E2E test database if it doesn't exist
    SELECT 'CREATE DATABASE myapp_db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'myapp_db')\gexec

    -- Grant all privileges to postgres user
    GRANT ALL PRIVILEGES ON DATABASE myapp_db TO postgres;
EOSQL

echo "✓ Databases initialized: $POSTGRES_DB (default), myapp_db (for E2E tests)"

