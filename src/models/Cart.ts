import { Model, DataTypes, HasManyGetAssociationsMixin, HasManyAddAssociationMixin } from 'sequelize';
import sequelize from '../config/database';
import Product from './Product';

class CartItem extends Model {
  public id!: number;
  public cartId!: string;
  public productId!: number;
  public quantity!: number;
  public product?: Product; 
}

class Cart extends Model {
  public id!: string;
  public userId?: number;
  public sessionId?: string;
  public used!: boolean; 

  // delcaramos los métodos de asociación
  public getItems!: HasManyGetAssociationsMixin<CartItem>;
  public addItem!: HasManyAddAssociationMixin<CartItem, number>;

  // ts
  public items?: CartItem[];
  static CartItem: any;
}

Cart.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'Cart',
  tableName: 'carts',
  timestamps: true
});

CartItem.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  cartId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'carts',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  }
}, {
  sequelize,
  modelName: 'CartItem',
  tableName: 'cart_items',
  timestamps: false
});

// Asociaciones
Cart.hasMany(CartItem, {
  foreignKey: 'cartId',
  as: 'items'
});

CartItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});


export { Cart, CartItem };