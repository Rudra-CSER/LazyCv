const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');

    // drop legacy unique index on `name` if it exists; this was causing
    // duplicate-key errors when registering because new documents don't
    // have a `name` field (the schema now uses username/email).
    try {
      await conn.connection.db.collection('users').dropIndex('name_1');
      console.log('Dropped obsolete name_1 index');
    } catch (err) {
      // ignore if index does not exist
      if (err.codeName !== 'IndexNotFound') {
        console.warn('Error dropping name_1 index:', err.message);
      }
    }
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

module.exports = connectDB;