import Product from '../../src/models/Product';
import testSequelize from '../config/testDatabase';

describe('Modelo de Producto', () => {
  beforeAll(async () => {
    // Sincronizar el modelo con la base de datos de pruebas
    await testSequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Cerrar conexión después de las pruebas
    await testSequelize.close();
  });

  test('Crear producto válido', async () => {
    const producto = await Product.create({
      name: 'Producto de Prueba',
      description: 'Descripción del producto de prueba',
      price: 19.99,
      stock: 100,
      category: 'Electrónica'
    });

    expect(producto.name).toBe('Producto de Prueba');
    expect(producto.price).toBe(19.99);
    expect(producto.stock).toBe(100);
  });

  test('Validación de precio negativo', async () => {
    await expect(Product.create({
      name: 'Producto Inválido',
      description: 'Producto con precio negativo',
      price: -10,
      stock: 50,
      category: 'Pruebas'
    })).rejects.toThrow();
  });
});