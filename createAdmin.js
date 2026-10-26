require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');
const ACCOUNT_TYPES = require('../utils/accountTypes');

async function createAdmin() {
  await sequelize.authenticate();
  await sequelize.sync();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first.');
    process.exit(1);
  }

  const existingAdmin = await User.findOne({ where: { email } });
  if (existingAdmin) {
    console.log('An account with this email already exists:', email);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    fullName: 'Site Admin',
    email,
    password: hashedPassword,
    accountType: ACCOUNT_TYPES.ADMIN,
    isApproved: true,
    city: 'N/A'
  });

  console.log('Admin account created:', email);
  process.exit(0);
}

createAdmin().catch((error) => {
  console.error('Failed to create admin account:', error);
  process.exit(1);
});
