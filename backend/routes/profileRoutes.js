const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// All profile routes require authentication
router.use(authMiddleware);

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile.', error: error.message });
  }
});

// PUT /api/profile - update name and phone (email is immutable per acceptance criteria)
router.put('/', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name cannot be empty.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.name = name.trim();
    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile.', error: error.message });
  }
});

// POST /api/profile/addresses - add delivery address
router.post('/addresses', async (req, res) => {
  try {
    const { street, city, state, zipCode, label, isDefault } = req.body;

    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({ message: 'Street, city, state, and zip code are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If marked default or first address, set as default
    const shouldBeDefault = isDefault || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    user.addresses.push({
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      label: label ? label.trim() : 'Home',
      isDefault: shouldBeDefault
    });

    await user.save();

    res.status(201).json({
      message: 'Delivery address added successfully.',
      addresses: user.addresses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding address.', error: error.message });
  }
});

// PUT /api/profile/addresses/:addressId - edit delivery address
router.put('/addresses/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    const { street, city, state, zipCode, label, isDefault } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    if (street) address.street = street.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (zipCode) address.zipCode = zipCode.trim();
    if (label) address.label = label.trim();

    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
      address.isDefault = true;
    }

    await user.save();

    res.status(200).json({
      message: 'Address updated successfully.',
      addresses: user.addresses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating address.', error: error.message });
  }
});

// DELETE /api/profile/addresses/:addressId - delete delivery address
router.delete('/addresses/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const wasDefault = user.addresses.id(addressId)?.isDefault;
    user.addresses.pull(addressId);

    // If the deleted address was default, make the first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      message: 'Address deleted successfully.',
      addresses: user.addresses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address.', error: error.message });
  }
});

// PATCH /api/profile/addresses/:addressId/default - set default address
router.patch('/addresses/:addressId/default', async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    user.addresses.forEach(addr => { addr.isDefault = false; });
    address.isDefault = true;

    await user.save();

    res.status(200).json({
      message: 'Default address updated.',
      addresses: user.addresses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error setting default address.', error: error.message });
  }
});

module.exports = router;
