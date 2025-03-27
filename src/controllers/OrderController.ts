import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Order, { OrderStatus, OrderItem } from '../models/Order';
import { Cart, CartItem } from '../models/Cart';
import Product from '../models/Product';
import sequelize from '../config/database';
import Stripe from 'stripe';
import Refund, { RefundStatus } from '../models/Refund'; 
import { createPaymentIntent } from '../controllers/StripeController';

// iniciamos stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

class OrderController {
  // creamos orden y proceso de pago
  static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const { items } = req.body;

      // validamos los items
      if (!items || items.length === 0) {
        res.status(400).json({ 
          message: 'No hay productos en la orden' 
        });
        return;
      }

      // verificamos stock de productos antes de procesar el pago
      const outOfStockProducts = [];
      let totalAmount = 0;

      for (const item of items) {
        const product = await Product.findByPk(item.productId);
        if (!product || product.stock < item.quantity) {
          outOfStockProducts.push(`Producto ${item.productId} sin stock suficiente`);
        } else {
          totalAmount += product.price * item.quantity; // calcula el total a pagar
        }
      }

      if (outOfStockProducts.length > 0) {
        res.status(400).json({ 
          message: 'Algunos productos no tienen stock suficiente',
          errors: outOfStockProducts
        });
        return;
      }

      // creamos orden con estado inicial PENDING
      const order = await Order.create({
        total: totalAmount,
        status: OrderStatus.PENDING
      }, { transaction });
 
      // delega la creación al StripeController
      const stripeResponse = await createPaymentIntent({ 
        body: { 
          amount: totalAmount, 
          orderId: order.id 
        } 
      } as Request, res);

      // si la creación del PaymentIntent falla, revertir la orden
      if (stripeResponse === null) {
        await transaction.rollback();
        return;
      }

      // añadimos los productos a la orden y bajamos el stock
      for (const item of items) {
        const product = await Product.findByPk(item.productId);
        
        if (product) {
          product.stock -= item.quantity;
          await product.save({ transaction });
        }
      }

      // hacemos el commit de la transacción
      await transaction.commit();

      // devolvemos la orden y el secreto del intent del payment
      res.status(201).json({
        order,
        ...(typeof stripeResponse === 'object' ? stripeResponse : {})
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error creando orden:', error);
      res.status(500).json({ 
        message: 'Error al crear orden',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // funcion mejorada de stripe checkout session
  static async createCheckoutSession(req: Request, res: Response): Promise<void> {
    const transaction = await sequelize.transaction();
  
    try {
      const { cartId } = req.body;
  
      // buscamos los productos por el cartId
      const cart = await Cart.findByPk(cartId, {
        include: ['items']
      });
  
      const items = await cart?.getItems();
  
      // validamos los productos
      if (!items || items.length === 0) {
        res.status(400).json({ 
          message: 'No hay productos en el carrito' 
        });
        return;
      }
  
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      let totalAmount = 0;
      const outOfStockProducts = [];
  
      for (const item of items) {
        const product = await Product.findByPk(item.productId);
        
        if (!product || product.stock < item.quantity) {
          outOfStockProducts.push(`Producto ${item.productId} sin stock suficiente`);
          continue;
        }
  
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
            },
            unit_amount: Math.round(product.price * 100) // a centavos
          },
          quantity: item.quantity
        });
  
        totalAmount += product.price * item.quantity;
      }
  
      if (outOfStockProducts.length > 0) {
        res.status(400).json({ 
          message: 'Algunos productos no tienen stock suficiente',
          errors: outOfStockProducts
        });
        return;
      }
  
      // creamos sesión de checkout de Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/order-cancel`,
        metadata: { cartId }
      });
  
      // creamos orden en base de datos
      const order = await Order.create({
        total: totalAmount,
        status: OrderStatus.PENDING,
        cartId: cartId,
        userId: 1,
        paymentIntentId: session.id
      }, { transaction });
  
      // añadimos los items de la orden sin eliminar los cart items
      for (const item of items) {
        const product = await Product.findByPk(item.productId);
        if (product) {
          // Reducir stock
          product.stock -= item.quantity;
          await product.save({ transaction });
  
          // Crear OrderItem sin eliminar CartItem
          await OrderItem.create({
            orderId: order.id,
            productId: product.id,
            quantity: item.quantity,
            price: product.price
          }, { transaction });
        }
      }
  
      // En lugar de destruir el cart, lo marcamos como usado
      await Cart.update(
        { used: true }, 
        { 
          where: { id: cartId }, 
          transaction 
        }
      );
  
      // NO ELIMINAMOS los CartItems, solo marcamos el cart como usado
      await transaction.commit();
  
      // devolvemos la URL de checkout de stripe
      res.json({ 
        checkoutUrl: session.url,
        sessionId: session.id,
        orderId: order.id
      });
  
    } catch (error) {
      await transaction.rollback();
      console.error('Error creando checkout:', error);
      res.status(500).json({ 
        message: 'Error al crear checkout',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // obtenemos las ordenes
  static async getOrders(req: Request, res: Response) {
    try {
      const { status } = req.query;
  
      const whereConditions: any = {};
      if (status) {
        whereConditions.status = status;
      }
  
      const orders = await Order.findAll({
        where: whereConditions,
        include: [{
          model: Product,
          as: 'products', // especificamos el alias definido en la relación
          through: {
            attributes: ['quantity']
          }, 
        },
        // AÑADIMOS LOS REFUNDS
        {
          model: Refund,
          as: 'refunds'
        }
      ],

        order: [['createdAt', 'DESC']]
      });
  
      res.json({
        total: orders.length,
        orders
      });
    } catch (error) {
      console.error('Error obteniendo órdenes:', error);
      res.status(500).json({ 
        message: 'Error al obtener órdenes',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // solicitamos el reembolso
  static async requestRefund(req: Request, res: Response): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const { orderId, sessionId } = req.params;
      const { amount, reason, metaData } = req.body;

      const order = await Order.findByPk(orderId);

      if (!order) {
        res.status(404).json({ 
          message: 'Orden no encontrada' 
        });
        return;
      }

      // Validar monto de reembolso
      if (amount > order.total) {
        res.status(400).json({ 
          message: 'Monto de reembolso inválido' 
        });
        return;
      }

      // treamos el paymentIntentId de stripe
      if (!order.paymentIntentId) {
        res.status(400).json({ 
          message: 'El paymentIntentId no está definido para esta orden' 
        });
        return;
      }

      const paymentIntent = await stripe.checkout.sessions.retrieve(order.paymentIntentId);
      
      // procesamos reembolso en Stripe
      const refund = await stripe.refunds.create({
        payment_intent: typeof paymentIntent.payment_intent === 'string' ? paymentIntent.payment_intent : undefined,
        amount: Math.round(amount * 100)
      });

      // Crear registro de reembolso en la base de datos
      const refundRecord = await Refund.create({
        orderId: order.id,
        amount: amount,
        status: refund.status === 'succeeded' ? RefundStatus.COMPLETED : RefundStatus.FAILED,
        stripeRefundId: refund.id,
        reason: reason,
        metaData: metaData
      }, { transaction });

      // actualizamos el estado de la orden
      order.status = amount === order.total 
        ? OrderStatus.REFUNDED 
        : OrderStatus.PARTIALLY_REFUNDED;

      await order.save({ transaction });

      // Commit the transaction
      await transaction.commit();

      res.json({
        message: 'Reembolso procesado exitosamente',
        refund: refundRecord,
        stripeRefund: refund
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error procesando reembolso:', error);
      res.status(500).json({ 
        message: 'Error al procesar reembolso',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

export default OrderController;