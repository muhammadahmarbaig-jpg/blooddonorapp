const sequelize = require('../config/database');
const User = require('./user');
const BloodRequest = require('./bloodRequest');
const Appointment = require('./appointment');
const RideRequest = require('./rideRequest');
const EmergencyResponse = require('./emergencyResponse');

User.belongsTo(User, { as: 'attachedSociety', foreignKey: 'attachedSocietyId' });
User.hasMany(User, { as: 'attachedDonors', foreignKey: 'attachedSocietyId' });

BloodRequest.belongsTo(User, { as: 'requestedBySociety', foreignKey: 'requestedBySocietyId' });
User.hasMany(BloodRequest, { as: 'bloodRequestsPosted', foreignKey: 'requestedBySocietyId' });

Appointment.belongsTo(User, { as: 'donor', foreignKey: 'donorId' });
Appointment.belongsTo(User, { as: 'society', foreignKey: 'societyId' });
User.hasMany(Appointment, { as: 'appointmentsAsDonor', foreignKey: 'donorId' });
User.hasMany(Appointment, { as: 'appointmentsAsSociety', foreignKey: 'societyId' });

RideRequest.belongsTo(User, { as: 'donor', foreignKey: 'donorId' });
RideRequest.belongsTo(User, { as: 'rider', foreignKey: 'riderId' });
User.hasMany(RideRequest, { as: 'rideRequestsAsDonor', foreignKey: 'donorId' });
User.hasMany(RideRequest, { as: 'rideRequestsAsRider', foreignKey: 'riderId' });

EmergencyResponse.belongsTo(BloodRequest, { as: 'bloodRequest', foreignKey: 'bloodRequestId' });
EmergencyResponse.belongsTo(User, { as: 'donor', foreignKey: 'donorId' });
BloodRequest.hasMany(EmergencyResponse, { as: 'responses', foreignKey: 'bloodRequestId' });
User.hasMany(EmergencyResponse, { as: 'emergencyResponses', foreignKey: 'donorId' });

async function connectDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
}

module.exports = {
  sequelize,
  User,
  BloodRequest,
  Appointment,
  RideRequest,
  EmergencyResponse,
  connectDatabase
};
