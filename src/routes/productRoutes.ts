import express from 'express';
import ProductController from '../controllers/ProductController';

const router = express.Router();

// rutas de productos
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.get('/category/:category', ProductController.getProductsByCategory);
router.post('/', ProductController.createProduct);

export default router;