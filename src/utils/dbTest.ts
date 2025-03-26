import sequelize from '../config/database';
import Product from '../models/Product';

const testDatabaseConnection = async () => {
  try {
    // comprobamos la conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');

    // contamos productos (prueba de consulta)
    const productCount = await Product.count();
    console.log(`📊 Productos en la base de datos: ${productCount}`);
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error);
  }
};

export default testDatabaseConnection;