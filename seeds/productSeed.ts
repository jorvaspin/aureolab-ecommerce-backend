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
        category: 'Electrónica',
        imageUrl: 'https://i01.appmifile.com/webfile/globalimg/products/m/K19A/specs1.png'
      },
      {
        name: 'Laptop Pro',
        description: 'Computadora portátil de alto rendimiento',
        price: 1299.99,
        stock: 20,
        category: 'Computadoras',
        imageUrl: 'https://atlas-content-cdn.pixelsquid.com/assets_v2/246/2461903618920420852/jpeg-600/G03.jpg'
      },
      {
        name: 'Tablet Mini',
        description: 'Tableta pequeña y ligera',
        price: 299.99,
        stock: 10,
        category: 'Electrónica',
        imageUrl: 'https://atlas-content-cdn.pixelsquid.com/assets_v2/248/2484944479010690212/jpeg-600/G03.jpg'
      },
      {
        name: 'Smartwatch Z',
        description: 'Reloj inteligente con seguimiento de actividad',
        price: 199.99,
        stock: 30,
        category: 'Electrónica',
        imageUrl: 'https://s.alicdn.com/@sc04/kf/H0dcdaae212d844a28e36b6b11ea93d26u.png_720x720q50.png'
      },
      {
        name: 'Cámara 4K',
        description: 'Cámara de video con grabación en ultra alta definición',
        price: 499.99,
        stock: 15,
        category: 'Electrónica',
        imageUrl: 'https://www.kindpng.com/picc/m/50-506934_video-cameras-professional-video-camera-4k-resolution-panasonic.png'
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