import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Gift, Streamer, Message, PurchaseRecord, Order } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function initDB() {
    console.log('Connecting to MongoDB at:', MONGODB_URI);

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully!');
        console.log('Starting manual explicit creation of collections inside MongoDB...');

        // Expliciting creating collections directly in the DB
        await User.createCollection();
        console.log('✅ Collection "users" created explicitly.');

        await Gift.createCollection();
        console.log('✅ Collection "gifts" created explicitly.');

        await Streamer.createCollection();
        console.log('✅ Collection "streamers" created explicitly.');

        await Message.createCollection();
        console.log('✅ Collection "messages" created explicitly.');

        await PurchaseRecord.createCollection();
        console.log('✅ Collection "purchaserecords" created explicitly.');

        await Order.createCollection();
        console.log('✅ Collection "orders" created explicitly.');

        console.log('🎉 All necessary collections have been fully created within MongoDB.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating collections:', error);
        process.exit(1);
    }
}

initDB();
