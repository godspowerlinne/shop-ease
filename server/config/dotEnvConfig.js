require('dotenv').config(); // Load environment variables from .env file

const config = {
    port: process.env.PORT || 5000,
    mongoUrl: process.env.MONGODB_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

    // Email service configuration
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_SECURE: process.env.EMAIL_SECURE,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    emailFrom: process.env.EMAIL_FROM || 'noreply@yourecommerce.com',
    emailFromName: process.env.EMAIL_FROM_NAME || 'Your E-commerce Store',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

    // Frontend links 
    VERIFY_EMAIL_URL: process.env.VERIFY_EMAIL_URL || 'http://localhost:3000/verify-email',
    RESET_PASSWORD_URL: process.env.RESET_PASSWORD_URL || 'http://localhost:3000/reset-password',
};

module.exports = config;