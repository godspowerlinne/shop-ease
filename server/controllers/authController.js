const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/dotEnvConfig');

// Add validation functions that are missing
const validateRegistration = (data) => {
  const Joi = require('joi');
  
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstname: Joi.string().min(2).max(50).required(),
    lastname: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(15).required()
  });

  return schema.validate(data);
};

const validateLogin = (data) => {
  const Joi = require('joi');
  
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  return schema.validate(data);
};

/**
 * Authentication Controller
 * Handles all authentication related operations
 */
class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      // Validate registration data
      const { error } = validateRegistration(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
  
      const { username, email, password, firstname, lastname, phone } = req.body;
  
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }, { phone }]
      });
  
      if (existingUser) {
        let message = 'User already exists';
        if (existingUser.email === email) message = 'Email already in use';
        if (existingUser.username === username) message = 'Username already taken';
        if (existingUser.phone === phone) message = 'Phone number already registered';
        
        return res.status(409).json({
          success: false,
          message
        });
      }

  
      // Create new user
      const newUser = new User({
        username,
        email,
        password,
        firstname,
        lastname,
        phone,
      });
  
      await newUser.save();
  
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please login to your account.',
        data: {
          user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            phone: newUser.phone
          }
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      // Validate login data
      const { error } = validateLogin(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login time
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user._id,
          role: user.role,
          email: user.email
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn || '24h' }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            phone: user.phone,
            role: user.role,
            addresses: user.addresses
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again later.'
      });
    }
  }

  /**
   * Request password reset
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }
  
      const user = await User.findOne({ email });
  
      if (!user) {
        // Don't reveal that the user doesn't exist
        return res.status(200).json({
          success: true,
          message: 'If your email is registered, you will receive a password reset link'
        });
      }
  
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour
  
      // Update user with reset token
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();
  
      // Send reset email
      await emailService.sendResetPasswordEmail(user);
  
      res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset request failed. Please try again later.'
      });
    }
  }

  /**
   * Reset password with token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Find user with valid reset token
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Update password and clear reset token
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password reset successful. You can now log in with your new password.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed. Please try again later.'
      });
    }
  }
  
  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            phone: user.phone,
            role: user.role,
            addresses: user.addresses,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
          }
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile. Please try again later.'
      });
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateProfile(req, res) {
    try {
      const allowedUpdates = ['firstname', 'lastname', 'phone', 'profilePicture'];
      const updates = Object.keys(req.body);
      
      // Check if updates are allowed
      const isValidOperation = updates.every(update => allowedUpdates.includes(update));
      
      if (!isValidOperation) {
        return res.status(400).json({
          success: false,
          message: 'Invalid updates. Allowed fields: ' + allowedUpdates.join(', ')
        });
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Apply updates
      updates.forEach(update => {
        user[update] = req.body[update];
      });

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            phone: user.phone,
            role: user.role,
            addresses: user.addresses,
            profilePicture: user.profilePicture
          }
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile. Please try again later.'
      });
    }
  }

  /**
   * Change password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password. Please try again later.'
      });
    }
  }

  /**
   * Add user address
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addAddress(req, res) {
    try {
      const { street, city, state, postalCode, country, isDefault } = req.body;

      if (!street || !city || !state || !postalCode) {
        return res.status(400).json({
          success: false,
          message: 'Street, city, state, and postal code are required'
        });
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create new address
      const newAddress = {
        street,
        city,
        state,
        postalCode,
        country: country || 'Nigeria',
        isDefault: isDefault || false
      };

      // If this address is set as default, unset others
      if (newAddress.isDefault) {
        user.addresses.forEach(address => {
          address.isDefault = false;
        });
      }

      // If this is the first address, make it default
      if (user.addresses.length === 0) {
        newAddress.isDefault = true;
      }

      user.addresses.push(newAddress);
      await user.save();

      res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: {
          address: newAddress,
          user: {
            id: user._id,
            addresses: user.addresses
          }
        }
      });
    } catch (error) {
      console.error('Add address error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add address. Please try again later.'
      });
    }
  }

  /**
   * Update user address
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateAddress(req, res) {
    try {
      const { addressId } = req.params;
      const updates = req.body;
      
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Find address index
      const addressIndex = user.addresses.findIndex(
        address => address._id.toString() === addressId
      );

      if (addressIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      // Update address fields
      Object.keys(updates).forEach(key => {
        if (key !== '_id') {
          user.addresses[addressIndex][key] = updates[key];
        }
      });

      // If this address is being set as default, unset others
      if (updates.isDefault) {
        user.addresses.forEach((address, index) => {
          if (index !== addressIndex) {
            address.isDefault = false;
          }
        });
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Address updated successfully',
        data: {
          address: user.addresses[addressIndex],
          user: {
            id: user._id,
            addresses: user.addresses
          }
        }
      });
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update address. Please try again later.'
      });
    }
  }

  /**
   * Delete user address
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteAddress(req, res) {
    try {
      const { addressId } = req.params;
      
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Find address
      const addressIndex = user.addresses.findIndex(
        address => address._id.toString() === addressId
      );

      if (addressIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      // Check if address is default
      const isDefault = user.addresses[addressIndex].isDefault;

      // Remove address
      user.addresses.splice(addressIndex, 1);

      // If removed address was default and there are other addresses, set a new default
      if (isDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
        data: {
          user: {
            id: user._id,
            addresses: user.addresses
          }
        }
      });
    } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete address. Please try again later.'
      });
    }
  }

  /**
   * Logout user
   * Note: Client-side should remove the JWT token
   * This endpoint can be used for additional cleanup if needed
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      // Additional server-side cleanup can be added here if needed
      // For example, add token to a blacklist or invalidate refresh tokens
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed. Please try again later.'
      });
    }
  }
}

module.exports = new AuthController();