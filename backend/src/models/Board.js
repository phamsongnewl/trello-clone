const { Model, DataTypes } = require('sequelize');

class Board extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        background_color: {
          type: DataTypes.STRING,
          defaultValue: '#0052CC',
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'Board',
        tableName: 'boards',
        timestamps: true,
      }
    );
  }

  static associate(models) {
    Board.belongsTo(models.User, { foreignKey: 'user_id', as: 'owner' });
    Board.hasMany(models.List, { foreignKey: 'board_id', as: 'lists' });
    Board.hasMany(models.Label, { foreignKey: 'board_id', as: 'labels' });
  }
}

module.exports = Board;
