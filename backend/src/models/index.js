const sequelize = require('../config/database');

const User          = require('./User');
const Board         = require('./Board');
const List          = require('./List');
const Card          = require('./Card');
const Label         = require('./Label');
const CardLabel     = require('./CardLabel');
const Checklist     = require('./Checklist');
const ChecklistItem = require('./ChecklistItem');

// ── Initialize all models ────────────────────────────────────────────────────
User.init(sequelize);
Board.init(sequelize);
List.init(sequelize);
Card.init(sequelize);
Label.init(sequelize);
CardLabel.init(sequelize);
Checklist.init(sequelize);
ChecklistItem.init(sequelize);

// ── Bundle models for association calls ─────────────────────────────────────
const models = {
  User,
  Board,
  List,
  Card,
  Label,
  CardLabel,
  Checklist,
  ChecklistItem,
};

// ── Define all associations ──────────────────────────────────────────────────
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = models;
