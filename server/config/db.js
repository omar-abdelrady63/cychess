const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.DATABASE_URI || process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error('MongoDB URI not found in environment variables');
        }

        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(' MongoDB connected successfully');
    } catch (error) {
        console.error(' MongoDB connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
