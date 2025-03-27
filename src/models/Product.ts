import { 
    Model, 
    DataTypes, 
    Optional 
  } from 'sequelize';
  import sequelize from '../config/database';
  
  // interfaz para creación de producto
  interface ProductAttributes {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    imageUrl?: string;
  }
  
  // hace que 'id' sea opcional en creación
  interface ProductCreationAttributes 
    extends Optional<ProductAttributes, 'id'> {}
  
  class Product extends Model<ProductAttributes, ProductCreationAttributes> 
    implements ProductAttributes {
    
    public id!: number;
    public name!: string;
    public description!: string;
    public price!: number;
    public stock!: number;
    public category!: string;
    public imageUrl?: string;
  
    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  
    static async findByCategory(category: string) {
      return this.findAll({ 
        where: { category },
        order: [['price', 'ASC']]
      });
    }
  }
  
  Product.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "El nombre no puede estar vacío" },
        len: [2, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isFloat: true
      },
      get() {
        const value = this.getDataValue('price');
        return value !== null && value !== undefined ? parseFloat(value.toString()) : null;
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true
      }
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true
  });
  
  export default Product;