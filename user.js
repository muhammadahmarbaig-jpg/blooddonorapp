const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accountType: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '1 = donor, 2 = society, 3 = admin, 4 = rider'
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  bloodGroup: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastDonationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  attachedSocietyId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bloodBagsCollected: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetTokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vehicleInfo: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
