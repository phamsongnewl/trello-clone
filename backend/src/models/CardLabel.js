const { Model, DataTypes } = require('sequelize');

class CardLabel extends Model {
  static init(sequelize) {
    return super.init(
      {
        card_id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'cards',
            key: 'id',
          },
        },
        label_id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'labels',
            key: 'id',
          },
        },
      },
      {
        sequelize,
        modelName: 'CardLabel',
        tableName: 'card_labels',
        timestamps: true,
      }
    );
  }

  static associate(_models) {
    // Junction table — associations handled via Card and Label
  }
}

module.exports = CardLabel;
