const { User, Appointment } = require('../models');
const ACCOUNT_TYPES = require('../utils/accountTypes');

async function bookAppointment(req, res) {
  const donor = await User.findByPk(req.userId);

  if (!donor || donor.accountType !== ACCOUNT_TYPES.DONOR) {
    return res.status(403).json({ error: 'Only donor accounts can book an appointment.' });
  }

  const { societyId, appointmentDate, notes } = req.body;

  if (!societyId || !appointmentDate) {
    return res.status(400).json({ error: 'Please choose a society and a date/time.' });
  }

  const society = await User.findByPk(societyId);
  if (!society || society.accountType !== ACCOUNT_TYPES.SOCIETY) {
    return res.status(400).json({ error: 'Selected society was not found.' });
  }

  await Appointment.create({
    donorId: donor.id,
    societyId: society.id,
    appointmentDate,
    notes: notes || null
  });

  res.status(201).json({ message: 'Appointment requested. The society will confirm it shortly.' });
}

async function getMyAppointments(req, res) {
  const user = await User.findByPk(req.userId);

  if (user.accountType === ACCOUNT_TYPES.DONOR) {
    const appointments = await Appointment.findAll({
      where: { donorId: user.id },
      order: [['appointmentDate', 'ASC']],
      include: [{ model: User, as: 'society', attributes: ['fullName', 'city'] }]
    });
    return res.json({ role: 'donor', appointments });
  }

  if (user.accountType === ACCOUNT_TYPES.SOCIETY) {
    const appointments = await Appointment.findAll({
      where: { societyId: user.id },
      order: [['appointmentDate', 'ASC']],
      include: [{ model: User, as: 'donor', attributes: ['fullName', 'email', 'bloodGroup', 'city'] }]
    });
    return res.json({ role: 'society', appointments });
  }

  res.status(403).json({ error: 'Only donor or society accounts have appointments.' });
}

async function updateAppointmentStatus(req, res) {
  const user = await User.findByPk(req.userId);
  const appointment = await Appointment.findByPk(req.params.id);

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  const { status } = req.body;
  const allowedStatuses = ['confirmed', 'completed', 'cancelled'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const isOwningSociety = user.accountType === ACCOUNT_TYPES.SOCIETY && appointment.societyId === user.id;
  const isOwningDonorCancelling =
    user.accountType === ACCOUNT_TYPES.DONOR && appointment.donorId === user.id && status === 'cancelled';

  if (!isOwningSociety && !isOwningDonorCancelling) {
    return res.status(403).json({ error: 'You are not allowed to update this appointment.' });
  }

  appointment.status = status;
  await appointment.save();

  if (status === 'completed') {
    const donor = await User.findByPk(appointment.donorId);
    const society = await User.findByPk(appointment.societyId);

    donor.lastDonationDate = appointment.appointmentDate;
    await donor.save();

    society.bloodBagsCollected = society.bloodBagsCollected + 1;
    await society.save();
  }

  res.json({ message: 'Appointment updated.' });
}

module.exports = {
  bookAppointment,
  getMyAppointments,
  updateAppointmentStatus
};
