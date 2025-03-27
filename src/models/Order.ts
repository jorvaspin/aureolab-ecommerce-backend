import { 
    Model, 
    DataTypes, 
    Optional,
    BelongsToManyAddAssociationMixin,
    HasManyGetAssociationsMixin
} from 'sequelize';
import sequelize from '../config/database';
import Product from './Product';
import { Cart, CartItem } from './Cart';
import Refund from './Refund';  // Importa el modelo de Refund

// tipos de estado de la orden
enum OrderStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    REFUNDED = 'REFUNDED',
    CANCELLED = 'CANCELLED',
    PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

// modelo para la tabla intermedia
class OrderItem extends Model {
    public orderId!: number;
    public productId!: number;
    public quantity!: number;
    public price!: number;
}

interface OrderAttributes {
    id: number;
    total: number;
    status: OrderStatus;
    cartId?: string; // referencia al carrito original
    paymentIntentId?: string;
    userId?: number; // para usuarios no registrados
}

interface OrderCreationAttributes 
    extends Optional<OrderAttributes, 'id'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> 
    implements OrderAttributes {
    
    public id!: number;
    public total!: number;
    public status!: OrderStatus;
    public cartId?: string;
    public paymentIntentId?: string;
    public userId?: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // definimos método de asociación
    public addProduct!: BelongsToManyAddAssociationMixin<Product, number>;
    
    // método para obtener refunds
    public getRefunds!: HasManyGetAssociationsMixin<Refund>;
}

Order.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    status: {
        type: DataTypes.ENUM(...Object.values(OrderStatus)),
        defaultValue: OrderStatus.PENDING
    },
    cartId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'cart_id',
        references: {
            model: 'carts',
            key: 'id'
        }
    },
    paymentIntentId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    underscored: true
});

// Inicializar OrderItem
OrderItem.init({
    orderId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'order_id',
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'product_id',
        references: {
            model: 'products',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    }
}, {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    timestamps: false,
    underscored: true
});

// Relaciones
Order.belongsToMany(Product, { 
    through: OrderItem,
    foreignKey: 'orderId',
    otherKey: 'productId',
    as: 'products'
});

Product.belongsToMany(Order, { 
    through: OrderItem,
    foreignKey: 'productId',
    otherKey: 'orderId',
    as: 'orders'
});

// Asociación con Cart
Order.belongsTo(Cart, {
    foreignKey: 'cartId',
    as: 'originalCart'
});

// Asociación con Refund
Refund.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order'
});

Order.hasMany(Refund, {
    foreignKey: 'orderId',
    as: 'refunds'
});

// Asociaciones
OrderItem.belongsTo(Order, { 
    foreignKey: 'order_id',
    as: 'order'
});

OrderItem.belongsTo(Product, { 
    foreignKey: 'product_id',
    as: 'product'
});

export default Order;
export { OrderItem, OrderStatus };