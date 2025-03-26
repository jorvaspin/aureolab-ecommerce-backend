import { Request, Response } from 'express';
import { Cart, CartItem } from '../models/Cart';
import Product from '../models/Product';
import Order, { OrderItem, OrderStatus } from '../models/Order';
import sequelize from '../config/database';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

// Inicializar Stripe con tu clave secreta (DE MOMENTO NO LO USAMOS)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

// extendemos la interfaz Request de express para añadir sessionID
declare global {
    namespace Express {
        interface Request {
        sessionID?: string;
        }
    }
}

class CartController {
  // obtenemos o creamos un carrito
  static async getOrCreateCart(req: Request, res: Response) {
    try {
      let cartId = req.query.cartId as string || 
                   req.body.cartId || 
                   req.cookies.cartId;
  
      // Si hay un cartId, verificamos si está usado
      if (cartId) {
        const existingCart = await Cart.findByPk(cartId);
        
        // Si el carrito existe y está usado, generamos uno nuevo
        if (existingCart?.used) {
          cartId = `cart_${uuidv4()}`;
          
          // Establecemos nueva cookie con el nuevo cartId
          res.cookie('cartId', cartId, { 
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });
        }
      }
  
      // Si no hay cartId o el anterior estaba usado, generamos uno nuevo
      if (!cartId) {
        cartId = `cart_${uuidv4()}`;
        
        // Establecemos la cookie
        res.cookie('cartId', cartId, { 
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }
  
      // Buscamos o creamos el carrito
      const [cart, created] = await Cart.findOrCreate({
        where: { id: cartId },
        defaults: { 
          id: cartId,
          sessionId: req.sessionID || null,
          used: false // Aseguramos que sea un carrito nuevo
        }
      });
  
      // Obtenemos el carrito con sus items
      const foundCart = await Cart.findByPk(cartId, {
        include: [
          { 
            model: CartItem, 
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          }
        ]
      });
  
      res.json({ 
        cart: foundCart, 
        created,
        cartId: cartId 
      });
  
    } catch (error) {
      console.error('Error al obtener/crear carrito:', error);
      res.status(500).json({ 
        message: 'Error al gestionar el carrito',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // añadimos producto al carrito
  static async addToCart(req: Request, res: Response): Promise<void> {
    try {
      const { cartId, productId, quantity = 1 } = req.body;

      if (!cartId) {
        res.status(400).json({ message: 'Carrito no encontrado' });
        return;
      }


      // verificamos si el producto existe y tiene stock
      const product = await Product.findByPk(productId);
      if (!product) {
        res.status(404).json({ message: 'Producto no encontrado' });
        return;
      }

      if (product.stock < quantity) {
        res.status(400).json({ 
          message: 'Cantidad solicitada supera el stock disponible' 
        });
        return;
      }

      // buscamos si el producto ya está en el carrito
      let cartItem = await CartItem.findOne({
        where: { cartId, productId }
      });

      if (cartItem) {
        // actualizamos cantidad si ya existe
        cartItem.quantity += quantity;
        await cartItem.save();
      } else {
        // añadimos nuevo item al carrito
        cartItem = await CartItem.create({
          cartId,
          productId,
          quantity
        });
      }

      // obtenemos el carrito actualizado con todos los items
      const cart = await Cart.findByPk(cartId, {
        include: [
          { 
            model: CartItem, 
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          }
        ]
      });

      res.json(cart);
    } catch (error) {
      console.error('Error al añadir al carrito:', error);
      res.status(500).json({ 
        message: 'Error al añadir producto al carrito',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // eliminamos producto del carrito
  static async removeFromCart(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const cartId = req.cookies.cartId;

      // enviar debug prueba
      console.log('cartId:', cartId);
      console.log('productId:', productId);

      if (!cartId) {
        res.status(400).json({ message: 'Carrito no encontrado' });
      }

      await CartItem.destroy({
        where: { cartId, productId }
      });

      // obtenemos el carrito actualizado
      const cart = await Cart.findByPk(cartId, {
        include: [
          { 
            model: CartItem, 
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          }
        ]
      });

      res.json(cart);
    } catch (error) {
      console.error('Error al eliminar del carrito:', error);
      res.status(500).json({ 
        message: 'Error al eliminar producto del carrito',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Checkout del carrito
  static async checkoutCart(req: Request, res: Response): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const cartId = req.cookies.cartId;
      const { 
        billingAddress, 
        shippingAddress, 
        email, 
        phone 
      } = req.body;

      if (!cartId) {
        res.status(400).json({ message: 'Carrito no encontrado' });
        return;
      }

      // obtenemos el carrito con sus items
      const cart = await Cart.findByPk(cartId, {
        include: [
          { 
            model: CartItem, 
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          }
        ],
        transaction
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        res.status(400).json({ message: 'Carrito vacío' });
        return;
      }

      // calculamos total y verificar stock
      let totalAmount = 0;
      const outOfStockProducts = [];

      for (const item of cart.items) {
        const product = item.product;
        
        if (!product || product.stock < item.quantity) {
          outOfStockProducts.push(`Producto ${product?.id} sin stock suficiente`);
        }
        
        if (product) {
          totalAmount += product.price * item.quantity;
        }
      }

      if (outOfStockProducts.length > 0) {
        res.status(400).json({ 
          message: 'Algunos productos no tienen stock suficiente',
          errors: outOfStockProducts
        });
      }

      // creamos pago en stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // convertimos a centavos
        currency: 'usd',
        // añadimos el metodo de pago que es tarjeta
        payment_method_types: ['card'],
        metadata: { 
          cartId, 
          email,
          phone 
        }
      });

      // creamos la orden
      const order = await Order.create({
        total: totalAmount,
        status: OrderStatus.PENDING,
        cartId: cartId,   // mantenemos camelCase por compatibilidad
        paymentIntentId: paymentIntent.id,
        // añadimos userId 1 ya que no tenemos autenticación
        userId: 1
      }, { transaction });

      // creamos items order y reducir stock
      for (const item of cart.items) {
        const product = item.product;

        if (!product) {
          continue;
        }

        // creamos el items de la orden
        await OrderItem.create({
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          price: product.price
        }, { transaction });

        // bajamos el stock
        product.stock -= item.quantity;
        await product.save({ transaction });
      }

      // eliminamos items del carrito
      await CartItem.destroy({ 
        where: { cartId }, 
        transaction 
      });

      // destruimos el carrito
      await Cart.destroy({ 
        where: { id: cartId }, 
        transaction 
      });

      // confiramos transacción
      await transaction.commit();

      // limbiamos la cookie
      res.clearCookie('cartId');

      res.status(201).json({
        order,
        clientSecret: paymentIntent.client_secret,
        // url de pago
        paymentUrl: paymentIntent,
        message: 'Checkout procesado exitosamente'
      });

    } catch (error) {
      // si hay error revertimos transacción 
      await transaction.rollback();

      console.error('Error en checkout:', error);
      res.status(500).json({ 
        message: 'Error en el proceso de checkout',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

export default CartController;