const Joi = require('joi');

/**
 * Validation Utility
 * Contains validation schemas for authentication operations
 */

/**
 * Validate user registration data
 * @param {Object} data - Registration data to validate
 * @returns {Object} Validation result
 */
const validateRegistration = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.base': 'Username must be a string',
        'string.alphanum': 'Username must only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    firstname: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.base': 'First name must be a string',
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required'
      }),
    lastname: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.base': 'Last name must be a string',
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.base': 'Email must be a string',
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    phone: Joi.string()
      .pattern(/^[0-9+\s()-]{8,15}$/)
      .required()
      .messages({
        'string.base': 'Phone number must be a string',
        'string.pattern.base': 'Please provide a valid phone number',
        'any.required': 'Phone number is required'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.base': 'Password must be a string',
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      })
  });

  return schema.validate(data);
};

/**
 * Validate user login data
 * @param {Object} data - Login data to validate
 * @returns {Object} Validation result
 */
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.base': 'Email must be a string',
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.base': 'Password must be a string',
        'any.required': 'Password is required'
      })
  });

  return schema.validate(data);
};

/**
 * Validate address data
 * @param {Object} data - Address data to validate
 * @returns {Object} Validation result
 */
const validateAddress = (data) => {
  const schema = Joi.object({
    street: Joi.string()
      .required()
      .messages({
        'string.base': 'Street must be a string',
        'any.required': 'Street is required'
      }),
    city: Joi.string()
      .required()
      .messages({
        'string.base': 'City must be a string',
        'any.required': 'City is required'
      }),
    state: Joi.string()
      .required()
      .messages({
        'string.base': 'State must be a string',
        'any.required': 'State is required'
      }),
    postalCode: Joi.string()
      .required()
      .messages({
        'string.base': 'Postal code must be a string',
        'any.required': 'Postal code is required'
      }),
    country: Joi.string()
      .default('Nigeria')
      .messages({
        'string.base': 'Country must be a string'
      }),
    isDefault: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'isDefault must be a boolean'
      })
  });

  return schema.validate(data);
};

/**
 * Validate profile update data
 * @param {Object} data - Profile data to validate
 * @returns {Object} Validation result
 */
const validateProfileUpdate = (data) => {
  const schema = Joi.object({
    firstname: Joi.string()
      .min(2)
      .max(50)
      .messages({
        'string.base': 'First name must be a string',
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastname: Joi.string()
      .min(2)
      .max(50)
      .messages({
        'string.base': 'Last name must be a string',
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    phone: Joi.string()
      .pattern(/^[0-9+\s()-]{8,15}$/)
      .messages({
        'string.base': 'Phone number must be a string',
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    profilePicture: Joi.string()
      .messages({
        'string.base': 'Profile picture must be a string URL'
      })
  }).min(1);

  return schema.validate(data);
};

/**
 * Validate password change data
 * @param {Object} data - Password change data to validate
 * @returns {Object} Validation result
 */
const validatePasswordChange = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'string.base': 'Current password must be a string',
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.base': 'New password must be a string',
        'string.min': 'New password must be at least 6 characters long',
        'any.required': 'New password is required'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords must match',
        'any.required': 'Please confirm your new password'
      })
  });

  return schema.validate(data);
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateAddress,
  validateProfileUpdate,
  validatePasswordChange
};