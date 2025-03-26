import Product from '../src/models/Product';
import sequelize from '../src/config/database';

const productSeed = async () => {
  try {
    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ force: true });

    // Datos semilla
    const products = [
      {
        name: 'Smartphone X',
        description: 'Teléfono inteligente de última generación',
        price: 599.99,
        stock: 50,
        category: 'Electrónica'
      },
      {
        name: 'Laptop Pro',
        description: 'Computadora portátil de alto rendimiento',
        price: 1299.99,
        stock: 20,
        category: 'Computadoras'
      },
      {
        name: 'Tablet Mini',
        description: 'Tableta pequeña y ligera',
        price: 299.99,
        stock: 10,
        category: 'Electrónica'
      },
      {
        name: 'Smartwatch Z',
        description: 'Reloj inteligente con seguimiento de actividad',
        price: 199.99,
        stock: 30,
        category: 'Electrónica'
      },
      {
        name: 'Cámara 4K',
        description: 'Cámara de video con grabación en ultra alta definición',
        price: 499.99,
        stock: 15,
        category: 'Electrónica'
      }
    ];

    // insertamos los productos
    await Product.bulkCreate(products);

    console.log('Seed de productos completado');
  } catch (error) {
    console.error('Error en seed de productos:', error);
  } finally {
    // cerramos la conexión
    await sequelize.close();
  }
};

// lanzamos el seed
productSeed();