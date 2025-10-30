#!/bin/bash
set -e

# PostgreSQL initialization script
# This script runs when the PostgreSQL container is first created
# It creates the test database if TEST_DB_NAME is set

if [ -n "$TEST_DB_NAME" ]; then
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
      -- Create test database if it doesn't exist
      SELECT 'CREATE DATABASE ${TEST_DB_NAME}'
      WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${TEST_DB_NAME}')\gexec

      -- Grant all privileges to postgres user
      GRANT ALL PRIVILEGES ON DATABASE ${TEST_DB_NAME} TO ${POSTGRES_USER};
EOSQL

  echo "✓ Databases initialized: $POSTGRES_DB (default), $TEST_DB_NAME (for tests)"
else
  echo "✓ Database initialized: $POSTGRES_DB (default)"
  echo "ℹ️  Set TEST_DB_NAME environment variable to create a separate test database"
fi

