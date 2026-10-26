const express = require('express');
const router = express.Router();

const {
  getPublicStats,
  getSocietyList,
  registerDonor,
  registerSociety,
  registerRider,
  loginUser,
  logoutUser,
  getHomeData,
  getProfileData,
  updateProfile,
  searchDonors,
  getBloodRequestsData,
  getSocietyDonorsData,
  addBloodBag,
  requestPasswordReset,
  resetPassword
} = require('../controllers/authController');

const {
  createBloodRequest,
  respondToEmergency,
  markRequestFulfilled,
  getEmergencyResponders
} = require('../controllers/bloodRequestController');

const {
  bookAppointment,
  getMyAppointments,
  updateAppointmentStatus
} = require('../controllers/appointmentController');

const {
  requestRide,
  getMyRides,
  acceptRide,
  updateRideStatus
} = require('../controllers/rideController');

const {
  listPendingAccounts,
  listAllAccounts,
  approveAccount,
  rejectAccount
} = require('../controllers/adminController');

const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimiters');

router.get('/stats', getPublicStats);
router.get('/societies', getSocietyList);
router.post('/signup/donor', registerDonor);
router.post('/signup/society', registerSociety);
router.post('/signup/rider', registerRider);

router.post('/login', loginLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/password/forgot', passwordResetLimiter, requestPasswordReset);
router.post('/password/reset', passwordResetLimiter, resetPassword);

router.get('/home', requireAuth, getHomeData);
router.get('/profile', requireAuth, getProfileData);
router.put('/profile', requireAuth, updateProfile);
router.get('/donors', requireAuth, searchDonors);
router.get('/requests', requireAuth, getBloodRequestsData);
router.post('/requests', requireAuth, createBloodRequest);
router.post('/requests/:id/respond', requireAuth, respondToEmergency);
router.post('/requests/:id/fulfill', requireAuth, markRequestFulfilled);
router.get('/requests/:id/responders', requireAuth, getEmergencyResponders);
router.get('/society/donors', requireAuth, getSocietyDonorsData);
router.post('/bags/add', requireAuth, addBloodBag);

router.post('/appointments', requireAuth, bookAppointment);
router.get('/appointments', requireAuth, getMyAppointments);
router.put('/appointments/:id', requireAuth, updateAppointmentStatus);

router.post('/rides', requireAuth, requestRide);
router.get('/rides', requireAuth, getMyRides);
router.post('/rides/:id/accept', requireAuth, acceptRide);
router.put('/rides/:id', requireAuth, updateRideStatus);

router.get('/admin/pending', requireAuth, requireAdmin, listPendingAccounts);
router.get('/admin/accounts', requireAuth, requireAdmin, listAllAccounts);
router.post('/admin/approve/:id', requireAuth, requireAdmin, approveAccount);
router.post('/admin/reject/:id', requireAuth, requireAdmin, rejectAccount);

module.exports = router;
