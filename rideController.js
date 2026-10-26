const { User, RideRequest } = require('../models');
const ACCOUNT_TYPES = require('../utils/accountTypes');

async function requestRide(req, res) {
  const donor = await User.findByPk(req.userId);

  if (!donor || donor.accountType !== ACCOUNT_TYPES.DONOR) {
    return res.status(403).json({ error: 'Only donor accounts can request a pickup.' });
  }

  const { pickupAddress, dropAddress, requestedTime, notes } = req.body;

  if (!pickupAddress || !dropAddress || !requestedTime) {
    return res.status(400).json({ error: 'Please fill in pickup address, drop address, and time.' });
  }

  await RideRequest.create({
    pickupAddress,
    dropAddress,
    city: donor.city,
    requestedTime,
    notes: notes || null,
    donorId: donor.id
  });

  res.status(201).json({ message: 'Ride requested. A nearby rider will accept it shortly.' });
}

async function getMyRides(req, res) {
  const user = await User.findByPk(req.userId);

  if (user.accountType === ACCOUNT_TYPES.DONOR) {
    const rides = await RideRequest.findAll({
      where: { donorId: user.id },
      order: [['requestedTime', 'ASC']],
      include: [{ model: User, as: 'rider', attributes: ['fullName', 'phoneNumber', 'vehicleInfo'] }]
    });
    return res.json({ role: 'donor', rides });
  }

  if (user.accountType === ACCOUNT_TYPES.RIDER) {
    const availableRides = await RideRequest.findAll({
      where: { status: 'pending', city: user.city },
      order: [['requestedTime', 'ASC']],
      include: [{ model: User, as: 'donor', attributes: ['fullName', 'phoneNumber'] }]
    });

    const myAcceptedRides = await RideRequest.findAll({
      where: { riderId: user.id },
      order: [['requestedTime', 'ASC']],
      include: [{ model: User, as: 'donor', attributes: ['fullName', 'phoneNumber'] }]
    });

    return res.json({ role: 'rider', availableRides, myAcceptedRides });
  }

  res.status(403).json({ error: 'Only donor or rider accounts have rides.' });
}

async function acceptRide(req, res) {
  const rider = await User.findByPk(req.userId);

  if (!rider || rider.accountType !== ACCOUNT_TYPES.RIDER) {
    return res.status(403).json({ error: 'Only rider accounts can accept a ride.' });
  }

  const ride = await RideRequest.findByPk(req.params.id);

  if (!ride) {
    return res.status(404).json({ error: 'Ride request not found.' });
  }

  if (ride.status !== 'pending') {
    return res.status(409).json({ error: 'This ride has already been accepted by someone else.' });
  }

  ride.riderId = rider.id;
  ride.status = 'accepted';
  await ride.save();

  res.json({ message: 'Ride accepted.' });
}

async function updateRideStatus(req, res) {
  const user = await User.findByPk(req.userId);
  const ride = await RideRequest.findByPk(req.params.id);

  if (!ride) {
    return res.status(404).json({ error: 'Ride request not found.' });
  }

  const { status } = req.body;
  const allowedStatuses = ['in_progress', 'completed', 'cancelled'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const isOwningRider = user.accountType === ACCOUNT_TYPES.RIDER && ride.riderId === user.id;
  const isOwningDonorCancelling =
    user.accountType === ACCOUNT_TYPES.DONOR && ride.donorId === user.id && status === 'cancelled';

  if (!isOwningRider && !isOwningDonorCancelling) {
    return res.status(403).json({ error: 'You are not allowed to update this ride.' });
  }

  ride.status = status;
  await ride.save();

  res.json({ message: 'Ride updated.' });
}

module.exports = {
  requestRide,
  getMyRides,
  acceptRide,
  updateRideStatus
};
