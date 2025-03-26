import { Request, Response } from 'express';
import Product from '../models/Product';

class ProductController {
  // obtenemos todos los productos
  static async getAllProducts(req: Request, res: Response) {
    try {
      const { category, minPrice, maxPrice } = req.query;
      
      // contruimos condiciones de filtro
      const whereConditions: any = {};
      
      if (category) {
        whereConditions.category = category;
      }
      
      if (minPrice || maxPrice) {
        whereConditions.price = {};
        
        if (minPrice) {
          whereConditions.price['$gte'] = parseFloat(minPrice as string);
        }
        
        if (maxPrice) {
          whereConditions.price['$lte'] = parseFloat(maxPrice as string);
        }
      }

      // obtenemos los productos con las condiciones de filtro
      const products = await Product.findAll({
        where: whereConditions,
        order: [['createdAt', 'DESC']],
        attributes: { 
          exclude: ['createdAt', 'updatedAt'] 
        }
      });

      res.json({
        total: products.length,
        products
      });
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      res.status(500).json({ 
        message: 'Error al obtener productos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // obtenemos el producto por ID
  static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const product = await Product.findByPk(id, {
        attributes: { 
          exclude: ['createdAt', 'updatedAt'] 
        }
      });

      if (!product) {
        res.status(404).json({ 
          message: 'Producto no encontrado' 
        });
      }

      res.json(product);
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      res.status(500).json({ 
        message: 'Error al obtener producto',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // buscamos productos por categoría
  static async getProductsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      
      const products = await Product.findAll({
        where: { category },
        order: [['price', 'ASC']],
        attributes: { 
          exclude: ['createdAt', 'updatedAt'] 
        }
      });

      res.json({
        total: products.length,
        category,
        products
      });
    } catch (error) {
      console.error('Error obteniendo productos por categoría:', error);
      res.status(500).json({ 
        message: 'Error al obtener productos por categoría',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }


  // creamos un nuevo producto (Solo pruebas)
  static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { 
        name, 
        description, 
        price, 
        stock, 
        category, 
        imageUrl 
      } = req.body;

      // validamos los campos requeridos
      if (!name || !description || !price || stock === undefined || !category) {
        res.status(400).json({ 
          message: 'Todos los campos requeridos deben ser proporcionados' 
        });
        return;
      }

      // creamos el nuevo producto
      const newProduct = await Product.create({
        name,
        description,
        price: parseFloat(price as string),
        stock: parseInt(stock as string),
        category,
        imageUrl: imageUrl as string | undefined
      });

      // response de producto creado
      res.status(201).json({
        message: 'Producto creado exitosamente',
        product: {
          id: newProduct.id,
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          stock: newProduct.stock,
          category: newProduct.category,
          imageUrl: newProduct.imageUrl
        }
      });

    } catch (error) {
      console.error('Error creando producto:', error);
      
      // manejamos los errores de validación de Sequelize
      if (error instanceof Error && error.name === 'SequelizeValidationError') {
        const validationErrors = error.message.split(';');
        res.status(400).json({ 
          message: 'Error de validación',
          errors: validationErrors
        });
        return;
      }

      res.status(500).json({ 
        message: 'Error al crear producto',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

export default ProductController;