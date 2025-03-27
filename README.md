# 📌 Aureolab proyecto backend

Este proyecto es para una prueba técnica donde se crea una API backend para una store, la cual permita mostrar productos, añadir a un carro de compras, comprar vía Stripe, y poder reembolsar. Todos los precios se manejan en USD tanto para el pago como en los reembolsos.

---

# 🚀 Tecnologías Utilizadas

✅ Node.js con Express para la API.

✅ TypeScript

✅ PostgreSQL para almacenamiento de productos, ordenes de compra, carrito y reembolsos.

✅ Jest para unas pruebas básicas

---

## 📁 Estructura del Proyecto

Los archivos más relevantes en la lógica de la IA son:

📂 **`src/`**

- 📂 **`config`** → Archivo que instancia sequalize para el ORM de la base de datos y sus configuraciones
- 📂 **`controllers`** → Controladores para la parte logica del proyecto
- 📂 **`models`** → Modelos que interactuan con el tipado de dato en la base de datos y sus tablas relacionadas
- 📂 **`routes`** → Enpoints para consumir o enviar datos

  📂 **`seed/`**

  - 📂 **`productSeed.ts`** → Semilla que carga los productos por defecto creados.

**`server.ts`** → Servidor de node con express para usar el proyecto completo

---

### 🔹 **Objetivo**

Al levantar el servidor obtendremos distintos endpoints para nuestro sistema, estos serás consumidos por el fronted, que interactuará con el carro de compra,
las ordenes de pago, etc.

# 📚 API Endpoints modo ejemplo

A continuación se detallan los endpoints de la API con ejemplos de solicitudes y respuestas.

---

## GET - `/api/orders`

### Descripción

Nos devuelven todas las ordenes creadas, como no hay login funciona de forma general

### Response

```json
{
  "total": 8,
  "orders": [
    {
      "id": 9,
      "total": "599.99",
      "status": "PENDING",
      "cartId": "cart_26c37430-1aa3-469d-aef4-191094eed5ae",
      "paymentIntentId": null,
      "userId": 1,
      "createdAt": "2025-03-26T17:02:20.333Z",
      "updatedAt": "2025-03-26T17:02:20.333Z",
      "products": [
        {
          "id": 1,
          "name": "Smartphone X",
          "description": "Teléfono inteligente de última generación",
          "price": "599.99",
          "stock": 42,
          "category": "Electrónica",
          "imageUrl": null,
          "createdAt": "2025-03-25T08:34:50.771Z",
          "updatedAt": "2025-03-26T17:02:21.778Z",
          "OrderItem": {
            "quantity": 1
          }
        }
      ]
    }
  ]
}
```

## POST - `/api/carts/add`

### Descripción

Añadimos un producto a nuestro carro de compras, este carro se crea una vez entrando a la página con la COOCKIE del navegador y se parsea con coockie--parse para mantener
la sesión o el carrito persistido.

### JSON RAW BODY

```json
{
  "productId": 1,
  "quantity": 1
}
```

### Response

```json
{
  "id": "cart_516a6f21-5536-49ee-a2c7-01e883589b07",
  "userId": null,
  "sessionId": null,
  "used": false,
  "createdAt": "2025-03-26T20:44:14.939Z",
  "updatedAt": "2025-03-26T20:44:14.939Z",
  "items": [
    {
      "id": 1,
      "cartId": "cart_516a6f21-5536-49ee-a2c7-01e883589b07",
      "productId": 1,
      "quantity": 1,
      "product": {
        "id": 1,
        "name": "Smartphone Xiaomi Redmi 22",
        "description": "Un potente smartphone con cámara de alta resolución y batería de larga duración",
        "price": "599.99",
        "stock": 50,
        "category": "Electrónica",
        "imageUrl": "https://i01.appmifile.com/webfile/globalimg/products/m/K19A/specs1.png",
        "createdAt": "2025-03-26T19:53:35.620Z",
        "updatedAt": "2025-03-26T19:53:35.620Z"
      }
    }
  ]
}
```

--

# 📁 Ejecución del proyecto

## Guía de Instalación y Ejecución del Proyecto

Esta guía te ayudará a configurar y ejecutar el proyecto en tu entorno local

## Requisitos Previos

- [Node.js](https://nodejs.org/) (v14 o superior)
- [PostgreSQL](https://www.postgresql.org/)
- [Git](https://git-scm.com/)
- API Key stripe: sk_test_51R6R8sRr2OSUEpadTR9DijOeekbG8AeTXnQl8LOu6yNxsD3psYsNIbDJjdmBNba21tqhg606PQl5gB4d4kJgo2XC00T0WcGRn4

## Instalación Local

### 1. Clonar el Repositorio

```bash

git clone [URL_DEL_REPOSITORIO]

cd [NOMBRE_DEL_PROYECTO]

```

### 2. Instalar Dependencias

```bash

npm install

```

### 3. Configurar Variables de Entorno

El proyecto utiliza un archivo `.env` para las variables de entorno. Existe un archivo `.env.example` como plantilla.

```bash

cp .env.example  .env

```

Edita el archivo `.env` con tus configuraciones:

```

# Configuración de la Base de Datos

# Configuración del Servidor
PORT=3015
NODE_ENV=development

# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=xxx
DB_USER=xxx
DB_PASSWORD=xxx

# Configuración de Stripe
STRIPE_SECRET_KEY=sk_test_51R6R8sRr2OSUEpadTR9DijOeekbG8AeTXnQl8LOu6yNxsD3psYsNIbDJjdmBNba21tqhg606PQl5gB4d4kJgo2XC00T0WcGRn4
FRONTEND_URL=http://localhost:5192

```

### 4. Configurar la Base de Datos PostgreSql

1. Crea una base de datos en PostgreSql con el nombre `aureolab_ecommerce`:

2. El proyecto hara sync de los modelos definidos en la carpeta `models` para crear las tablas. Las tablas deberían crearse automáticamente al iniciar el servidor.

### 5. Lanzar el seed con los productos

Recuerda correr el siguiente comando para que los productos se creen en la tabla correspondiente

```bash

npm run seed

```

### 6. Iniciar el Servidor

Para ejecutar el proyecto localmente con TypeScript:

```bash

npn run dev

```

El servidor debería estar funcionando en `http://localhost:3000`.
Para desarrollo continuo, se integra nodemon

## Solución de Problemas

### Error de Conexión a la Base de Datos

- Verifica que las credenciales en `.env` sean correctas

- Asegúrate de que el servidor postgresql esté funcionando

- Comprueba que la base de datos `aureolab_ecommerce` exista o el nombre que elejiste

### Error de API Key de Stripe

- Asegúrate de que la API key sea válida, esta más arriba la key de test

### Error al Ejecutar con TypeScript

- Asegúrate de tener instalado ts-node: `npm install -g ts-node`

- Verifica que el archivo tsconfig.json esté correctamente configurado

### Error de Puertos

- Si el puerto 3000 está ocupado, cámbialo en el archivo `.env`

## Soporte

Si tienes algún problema, por favor crea un issue en el repositorio o contacta al equipo de desarrollo.
