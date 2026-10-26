const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmergencyResponse = sequelize.define('EmergencyResponse', {
  bloodRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  donorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'emergency_responses',
  timestamps: true
});

module.exports = EmergencyResponse;
