import { 
  Model, 
  DataTypes, 
  Optional 
} from 'sequelize';
import sequelize from '../config/database';
// Comentamos o removemos la importación directa de Order
// import Order from './Order'; 

// Enum for Refund Status
enum RefundStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Attributes interface for Refund
interface RefundAttributes {
  id: number;
  orderId: number;
  amount: number;
  status: RefundStatus;
  stripeRefundId?: string;
  reason?: string;
  metaData?: Record<string, any>;
}

// Creation attributes (making some fields optional)
interface RefundCreationAttributes 
  extends Optional<RefundAttributes, 'id'> {}

class Refund extends Model<RefundAttributes, RefundCreationAttributes> 
  implements RefundAttributes {
  
  public id!: number;
  public orderId!: number;
  public amount!: number;
  public status!: RefundStatus;
  public stripeRefundId?: string;
  public reason?: string;
  public metaData?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Refund Model
Refund.init({
  id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
  },
  orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id',
      references: {
          model: 'orders',
          key: 'id'
      }
  },
  amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
          min: 0
      }
  },
  status: {
      type: DataTypes.ENUM(...Object.values(RefundStatus)),
      defaultValue: RefundStatus.PENDING
  },
  stripeRefundId: {
      type: DataTypes.STRING,
      allowNull: true
  },
  reason: {
      type: DataTypes.TEXT,
      allowNull: true
  },
  metaData: {
      type: DataTypes.JSONB,
      allowNull: true
  }
}, {
  sequelize,
  modelName: 'Refund',
  tableName: 'refunds',
  timestamps: true,
  underscored: true
});

// Removemos las asociaciones de aquí
// Las definiremos en el modelo de Order

export default Refund;
export { RefundStatus, RefundAttributes, RefundCreationAttributes };