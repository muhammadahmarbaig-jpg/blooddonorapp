const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BloodRequest = sequelize.define('BloodRequest', {
  bloodGroup: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unitsNeeded: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isEmergency: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isFulfilled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  requestedBySocietyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'blood_requests',
  timestamps: true
});

module.exports = BloodRequest;
