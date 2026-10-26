const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RideRequest = sequelize.define('RideRequest', {
  pickupAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dropAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  requestedTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true
  },
  donorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  riderId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'ride_requests',
  timestamps: true
});

module.exports = RideRequest;
