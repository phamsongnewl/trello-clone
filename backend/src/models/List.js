const { Model, DataTypes } = require('sequelize');

class List extends Model {
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
        position: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        board_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'List',
        tableName: 'lists',
        timestamps: true,
      }
    );
  }

  static associate(models) {
    List.belongsTo(models.Board, { foreignKey: 'board_id', as: 'board' });
    List.hasMany(models.Card, { foreignKey: 'list_id', as: 'cards' });
  }
}

module.exports = List;
