import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function fixIdentification() {
    console.log('Connecting to MongoDB at:', MONGODB_URI);

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully!');

        // Find all users with empty or null identification
        const users = await User.find({
            $or: [
                { identification: '' },
                { identification: null },
                { identification: { $exists: false } }
            ]
        });

        console.log(`Found ${users.length} users with empty identification`);

        for (const user of users) {
            const newIdentification = `user_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`Updating user ${user.id} with identification: ${newIdentification}`);
            
            await User.updateOne(
                { _id: user._id },
                { identification: newIdentification }
            );
        }

        console.log('✅ All users have been updated with unique identification');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing identification:', error);
        process.exit(1);
    }
}

fixIdentification();
