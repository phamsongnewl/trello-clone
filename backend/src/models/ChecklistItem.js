const { Model, DataTypes } = require('sequelize');

class ChecklistItem extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        content: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        is_checked: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        position: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        checklist_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'ChecklistItem',
        tableName: 'checklist_items',
        timestamps: true,
      }
    );
  }

  static associate(models) {
    ChecklistItem.belongsTo(models.Checklist, {
      foreignKey: 'checklist_id',
      as: 'checklist',
    });
  }
}

module.exports = ChecklistItem;
