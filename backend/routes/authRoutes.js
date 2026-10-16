const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { authMiddleware, requireRole, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      businessName,
      businessType,
      gstNumber,
      vehicleNumber,
      licenseNumber
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const allowedRoles = ['customer', 'farmer', 'bulk_buyer', 'delivery_partner', 'admin'];
    const chosenRole = role && allowedRoles.includes(role) ? role : 'customer';

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : '',
      role: chosenRole,
      addresses: [],
      businessName: businessName ? businessName.trim() : undefined,
      businessType: businessType || undefined,
      gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : undefined,
      vehicleNumber: vehicleNumber ? vehicleNumber.trim().toUpperCase() : undefined,
      licenseNumber: licenseNumber ? licenseNumber.trim().toUpperCase() : undefined
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        businessName: user.businessName,
        businessType: user.businessType,
        gstNumber: user.gstNumber,
        vehicleNumber: user.vehicleNumber,
        licenseNumber: user.licenseNumber
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        businessName: user.businessName,
        businessType: user.businessType,
        gstNumber: user.gstNumber,
        vehicleNumber: user.vehicleNumber,
        licenseNumber: user.licenseNumber
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    // Generate a secure 6-digit numeric reset code or token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    res.status(200).json({
      message: 'Password reset token generated successfully.',
      resetToken,
      email: user.email
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error generating password reset.', error: error.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password.', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user.', error: error.message });
  }
});

// GET /api/auth/users - List all users (Admin only)
router.get('/users', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// PATCH /api/auth/users/:id/role - Update user role (Admin only)
router.patch('/users/:id/role', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['customer', 'farmer', 'bulk_buyer', 'delivery_partner', 'admin'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ 
        message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}` 
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'User role updated successfully.', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});

// GET /api/auth/admin/stats - Platform overview statistics (Admin only)
router.get('/admin/stats', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const Farmer = require('../models/Farmer');
    const SurplusListing = require('../models/SurplusListing');

    const totalUsers = await User.countDocuments();
    const totalFarmers = await Farmer.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalSurplus = await SurplusListing.countDocuments();

    const orders = await Order.find().lean();
    const totalGMV = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.json({
      totalUsers,
      totalFarmers,
      totalProducts,
      totalOrders,
      totalSurplus,
      totalGMV
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

module.exports = router;
