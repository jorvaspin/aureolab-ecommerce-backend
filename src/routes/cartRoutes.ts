import express from 'express';
import CartController from '../controllers/CartController';

const router = express.Router();

// obtenenemos o creamos un carrito
router.get('/', CartController.getOrCreateCart);

// añadimos producto al carrito
router.post('/add', CartController.addToCart);

// eliminanamos producto del carrito
router.delete('/remove/:productId', CartController.removeFromCart);

// procesamos checkout
router.post('/checkout', CartController.checkoutCart);

export default router;