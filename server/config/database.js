const mongoose = require('mongoose');
const config = require('./dotEnvConfig');

const url = config.mongoUrl; // MongoDB connection URL from config
const options = { serverSelectionTimeoutMS: 30000, connectTimeoutMS: 5000, }; // Set connection timeout to 30 seconds

// Connect to MongoDB before starting the server 
const connectDB = async () => {
    try {
        await mongoose.connect(url, options);
        console.log('Connected to MongoDB');

        // Optionally, you can set up a connection event listener
        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected successfully');
        });

        // Handle connection errors and disconnections
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
            connectDB(); // Attempt to reconnect
        });
    } catch (error) {
        console.log('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the process if connection fails
    }
};

module.exports = connectDB;