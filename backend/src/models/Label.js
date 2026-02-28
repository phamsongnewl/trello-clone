const { Model, DataTypes } = require('sequelize');

class Label extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        color: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        board_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'Label',
        tableName: 'labels',
        timestamps: true,
      }
    );
  }

  static associate(models) {
    Label.belongsTo(models.Board, { foreignKey: 'board_id', as: 'board' });
    Label.belongsToMany(models.Card, {
      through: models.CardLabel,
      foreignKey: 'label_id',
      otherKey: 'card_id',
      as: 'cards',
    });
  }
}

module.exports = Label;
