import express from 'express';
import bodyParser from 'body-parser';
import { createPaymentIntent, stripeWebhookHandler, verifyStripeSession } from '../controllers/StripeController';

const stripeRouter = express.Router();

// añadimos rutas de stripe a las rutas existentes
stripeRouter.post('/create-payment-intent', createPaymentIntent);
stripeRouter.post('/webhook', 
  bodyParser.raw({ type: 'application/json' }), 
  stripeWebhookHandler
);

// nueva ruta para verificar la sesión de Stripe
stripeRouter.get('/verify-stripe-session/:sessionId', verifyStripeSession);

export default stripeRouter;