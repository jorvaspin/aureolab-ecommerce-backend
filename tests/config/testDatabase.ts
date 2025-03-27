import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Cargar variables de entorno de pruebas
dotenv.config({ path: '.env.test' });

const testSequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.TEST_DB_HOST,
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USER,
  password: process.env.TEST_DB_PASSWORD,
  database: process.env.TEST_DB_NAME,
  logging: false
});

export default testSequelize;