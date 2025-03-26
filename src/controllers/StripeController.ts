import { Request, Response } from 'express';
import Stripe from 'stripe';
import Order, { OrderStatus } from '../models/Order'; 

// instanciamos stripe con tu clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

// webhook handler para manejar eventos de stripe en los cambios de estado de pago
export const stripeWebhookHandler = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(400).send('Invalid webhook signature');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return; // prevendrá que se procese el evento
  }

  // manejamos diferentes tipos de eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handleSuccessfulPayment(paymentIntent);
      break;
    
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
      await handleFailedPayment(failedPaymentIntent);
      break;
    
    case 'charge.refunded':
      const refund = event.data.object as unknown as Stripe.Refund;
      await handleRefund(refund);
      break;
  }

  res.json({ received: true });
};

// manejamos los pagos exitosos
const handleSuccessfulPayment = async (paymentIntent: Stripe.PaymentIntent) => {
  // actualizamos el estado de la orden en base de datos
  const order = await Order.findOne({
    where: { paymentIntentId: paymentIntent.id }
  });

  if (order) {
    order.status = OrderStatus.PAID
    await order.save();
  }
};

// manejamos los pagos fallidos
const handleFailedPayment = async (paymentIntent: Stripe.PaymentIntent) => {
  const order = await Order.findOne({
    where: { paymentIntentId: paymentIntent.id }
  });

  if (order) {
    order.status = OrderStatus.CANCELLED
    await order.save();
  }
};

// manejamos los reembolsos
const handleRefund = async (refund: Stripe.Refund) => {
  const order = await Order.findOne({
    where: { paymentIntentId: refund.payment_intent as string }
  });

  if (order) {
    order.status = refund.amount === order.total 
      ? OrderStatus.REFUNDED 
      : OrderStatus.PARTIALLY_REFUNDED;
    await order.save();
  }
};

// creamos un intento de pago
const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    // intento de pago
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency,
      // configuraciones adicionales
      payment_method_types: ['card'],
      // Puedes agregar más configuraciones como:
      // - metadata para rastrear información personalizada
      // - configuraciones de confirmación automática
      metadata: {
        orderId: req.body.orderId // Opcional: asociar con tu orden interna
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'No se pudo crear el intento de pago' 
    });
  }
};

export {
  createPaymentIntent
};