const mongoose = require('mongoose');

/**
 * Connects to MongoDB database
 * @async
 * @function connectDB
 * @description Establishes connection to MongoDB using environment variable or default local URI
 * Special features:
 * - Uses new URL parser and unified topology for better performance
 * - Automatically creates database indexes after successful connection
 * - Exits process with code 1 if connection fails
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/EASYBORROW', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes
    await createIndexes();
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

/**
 * Creates database indexes for optimal query performance
 * @async
 * @function createIndexes
 * @description Creates text search indexes and other performance indexes for all models
 * Special features:
 * - Creates text indexes for full-text search functionality on Item model
 * - Improves query performance for search operations
 * - Handles errors gracefully without stopping the application
 * @returns {Promise<void>}
 */
const createIndexes = async () => {
  try {
    const User = require('../models/User');
    const Item = require('../models/Item');
    const Booking = require('../models/Booking');
    
    // Create unique and performance indexes
    await User.createIndexes();
    await Item.createIndexes();
    await Booking.createIndexes();
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

module.exports = connectDB;
