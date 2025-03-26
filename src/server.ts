import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import sequelize from './config/database';
import cookieParser from 'cookie-parser';

// importamos rutas
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import cartRoutes from './routes/cartRoutes';
import stripeRoutes from './routes/stripeRoutes';

// modelos
import './models/Product';
import './models/Order';
import './models/Cart';

// cargamos variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


// app.use(cartRoutes);

// middlewares
// configuración de CORS para permitir credenciales
app.use(cors({
    origin: 'http://localhost:5185', // URL de la app cliente
    credentials: true
  }));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Rutas
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/carts', cartRoutes);
// stripe
app.use('/api/stripe', stripeRoutes);

// Manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Ruta no encontrada' 
  });
});

// conectamos a la base de datos
sequelize.authenticate()
  .then(() => {
    console.log('Conexión a la base de datos establecida.');
    
    // sincronizamos los modelos
    return sequelize.sync({ 
        // force: true,
        alter: true,
        logging: console.log
    });
  })
  .then(() => {
    // inciamos el servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo conectar a la base de datos:', error);
  });

export default app;