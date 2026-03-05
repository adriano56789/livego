import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function updateAvatar() {
    console.log('Connecting to MongoDB at:', MONGODB_URI);

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully!');

        const email = 'adrianomdk5@gmail.com';
        const newAvatarUrl = 'https://picsum.photos/seed/adriano123/200/200.jpg';

        // Find and update user
        const user = await User.findOneAndUpdate(
            { email },
            { avatarUrl: newAvatarUrl },
            { new: true }
        );

        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log(`✅ Avatar updated for ${email}`);
        console.log(`🖼️ New avatar: ${newAvatarUrl}`);
        console.log('📧 User updated:', user);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating avatar:', error);
        process.exit(1);
    }
}

updateAvatar();
