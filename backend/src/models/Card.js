const { Model, DataTypes } = require('sequelize');

class Card extends Model {
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
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        position: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        due_date: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        list_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'Card',
        tableName: 'cards',
        timestamps: true,
      }
    );
  }

  static associate(models) {
    Card.belongsTo(models.List, { foreignKey: 'list_id', as: 'list' });
    Card.belongsToMany(models.Label, {
      through: models.CardLabel,
      foreignKey: 'card_id',
      otherKey: 'label_id',
      as: 'labels',
    });
    Card.hasMany(models.Checklist, { foreignKey: 'card_id', as: 'checklists' });
  }
}

module.exports = Card;
