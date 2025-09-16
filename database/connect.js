import mongoose from 'mongoose';
import { config } from '../config.js';

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(config.mongodbUri, {
      // Keep options explicit; SRV URIs sometimes need retryWrites and w majority
      // These are safe defaults for both local and Atlas
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    if (error && (error.code === 'EREFUSED' || String(error.message || '').includes('querySrv'))) {
      console.error('Database connection error: DNS SRV lookup failed.');
      console.error('Hint: Use a direct connection string or ensure DNS/Network allows _mongodb._tcp lookups.');
      console.error(`Current MONGODB_URI: ${config.mongodbUri}`);
    } else {
      console.error('Database connection error:', error);
    }
    process.exit(1);
  }
};

export default connectDB;
