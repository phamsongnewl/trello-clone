const { Model, DataTypes } = require('sequelize');

class Checklist extends Model {
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
        card_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'Checklist',
        tableName: 'checklists',
        timestamps: true,
      }
    );
  }

  static associate(models) {
    Checklist.belongsTo(models.Card, { foreignKey: 'card_id', as: 'card' });
    Checklist.hasMany(models.ChecklistItem, {
      foreignKey: 'checklist_id',
      as: 'items',
    });
  }
}

module.exports = Checklist;
