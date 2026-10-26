const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  appointmentDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
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
  societyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'appointments',
  timestamps: true
});

module.exports = Appointment;
