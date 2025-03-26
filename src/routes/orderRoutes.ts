import express from 'express';
import OrderController from '../controllers/OrderController';

const router = express.Router();

// rutas de ordenes
router.post('/', OrderController.createOrder);
router.get('/', OrderController.getOrders);
router.post('/:orderId/refund', OrderController.requestRefund);
router.post('/checkout', OrderController.createCheckoutSession);

export default router;