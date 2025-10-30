import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load .env file - will be overridden by environment variables if they exist
dotenv.config();

// Determine if we're running from compiled JS or TypeScript source
const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME!,
  entities: [isProduction ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts'],
  migrations: [
    isProduction ? 'dist/db/migrations/*.js' : 'src/db/migrations/*.ts',
  ],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
