// ============================================================
// backend/src/config/db.js
// ============================================================
// Description: MongoDB connection configuration
// Version: 2.0.0
// ============================================================

import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

class Database {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryTimeout = null;
  }

  async connect() {
    if (this.isConnected) {
      logger.info('📊 Using existing database connection');
      return;
    }

    try {
      this.connectionAttempts++;

      const options = {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4,
        retryWrites: true,
        retryReads: true,
        connectTimeoutMS: 30000,
        waitQueueTimeoutMS: 10000,
        heartbeatFrequencyMS: 10000,
        autoIndex: env.nodeEnv !== 'production',
        autoCreate: true,
      };

      logger.info(`📡 Connecting to MongoDB... (Attempt ${this.connectionAttempts})`);
      logger.info(`🔗 Database: ${env.mongodbUri.split('/').pop()}`);

      const conn = await mongoose.connect(env.mongodbUri, options);

      this.isConnected = true;
      this.connectionAttempts = 0;
      
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }

      logger.info(`✅ MongoDB connected successfully`);
      logger.info(`📊 Database: ${conn.connection.name}`);
      logger.info(`🏠 Host: ${conn.connection.host}`);
      logger.info(`🔢 Port: ${conn.connection.port || 27017}`);
      logger.info(`📦 Models: ${Object.keys(conn.models).join(', ')}`);

      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        logger.error('❌ MongoDB connection error:', err.message);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ MongoDB disconnected');
        this.isConnected = false;
        this.handleDisconnection();
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 MongoDB reconnected');
        this.isConnected = true;
      });

      mongoose.connection.on('fullsetup', () => {
        logger.info('🔗 MongoDB fullsetup event - connected to all servers');
      });

      // Handle application termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error.message);
      
      // Check for specific errors
      if (error.message.includes('Authentication failed')) {
        logger.error('🔑 Check your username and password in MONGODB_URI');
        logger.error('📝 Username should be your MongoDB Atlas username (not email)');
        process.exit(1);
      }
      
      if (error.message.includes('timed out') || error.message.includes('timeout')) {
        logger.error('🌐 Check your internet connection and IP whitelist');
        logger.error('📍 Make sure your IP is allowed in MongoDB Atlas Network Access');
      }

      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        logger.error('🌐 DNS resolution failed. Check your connection string and internet.');
      }

      if (error.message.includes('MongoNetworkError')) {
        logger.error('🌐 Network error. Check your internet connection.');
      }

      // Retry logic
      if (this.connectionAttempts < this.maxRetries) {
        const waitTime = Math.min(this.connectionAttempts * 5000, 30000);
        logger.info(`🔄 Retrying connection in ${waitTime/1000} seconds...`);
        
        this.retryTimeout = setTimeout(() => {
          this.connect();
        }, waitTime);
      } else {
        logger.error('❌ Maximum retry attempts reached. Exiting...');
        process.exit(1);
      }
    }
  }

  async handleDisconnection() {
    if (!this.isConnected && this.connectionAttempts < this.maxRetries) {
      logger.info('🔄 Attempting to reconnect...');
      await this.connect();
    }
  }

  async disconnect() {
    if (!this.isConnected) return;
    
    try {
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }
      
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('🔌 MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting MongoDB:', error.message);
    }
  }

  getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized'
    };
    return {
      isConnected: this.isConnected,
      readyState: states[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      models: Object.keys(mongoose.models)
    };
  }
}

export default new Database();