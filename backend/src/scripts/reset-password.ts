import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function resetPassword() {
    console.log('Connecting to MongoDB at:', MONGODB_URI);

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully!');

        const email = 'adrianomdk5@gmail.com';
        const newPassword = '123456';

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.updateOne(
            { email },
            { password: hashedPassword }
        );

        console.log(`✅ Password reset for ${email}`);
        console.log(`🔑 New password: ${newPassword}`);
        console.log('📧 You can now login with this password');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        process.exit(1);
    }
}

resetPassword();
