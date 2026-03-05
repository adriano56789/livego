import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Streamer } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function diagnosticDatabase() {
    console.log('=== DATABASE DIAGNOSTIC ===');
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected successfully');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }
        
        // Check collections
        const collections = await db.listCollections().toArray();
        console.log('\n📋 Collections found:', collections.map(c => c.name));

        // Test User model operations
        console.log('\n👤 Testing User model:');
        const usersCount = await User.countDocuments();
        console.log(`  - Total users: ${usersCount}`);
        
        const sampleUser = await User.findOne();
        if (sampleUser) {
            console.log(`  - Sample user: ${sampleUser.name} (${sampleUser.email})`);
        } else {
            console.log('  - No users found');
        }

        // Test Streamer model operations
        console.log('\n🎥 Testing Streamer model:');
        const streamersCount = await Streamer.countDocuments();
        console.log(`  - Total streamers: ${streamersCount}`);
        
        const sampleStreamer = await Streamer.findOne();
        if (sampleStreamer) {
            console.log(`  - Sample streamer: ${sampleStreamer.name} (host: ${sampleStreamer.hostId})`);
        } else {
            console.log('  - No streamers found');
        }

        // Test creating a test user
        console.log('\n🧪 Testing User creation:');
        const testUserId = `test_${Date.now()}`;
        try {
            const testUser = await User.create({
                id: testUserId,
                name: 'Test User',
                email: `test_${Date.now()}@example.com`,
                identification: `user_${testUserId}_test`,
                diamonds: 100,
                level: 1
            });
            console.log(`  ✅ Created test user: ${testUser.name}`);
            
            // Test finding the user
            const foundUser = await User.findOne({ id: testUserId });
            if (foundUser) {
                console.log(`  ✅ Found test user: ${foundUser.name}`);
            }
            
            // Clean up
            await User.deleteOne({ id: testUserId });
            console.log(`  🗑️  Cleaned up test user`);
        } catch (error: any) {
            console.log(`  ❌ Error creating test user: ${error.message}`);
        }

        // Test creating a test streamer
        console.log('\n🧪 Testing Streamer creation:');
        const testStreamId = `stream_${Date.now()}`;
        try {
            const testStreamer = await Streamer.create({
                id: testStreamId,
                hostId: '10755083',
                name: 'Test Stream',
                avatar: '',
                location: 'Test Location',
                time: 'Live Now',
                message: 'Test message',
                tags: ['test'],
                viewers: 0
            });
            console.log(`  ✅ Created test streamer: ${testStreamer.name}`);
            
            // Test finding the streamer
            const foundStreamer = await Streamer.findOne({ id: testStreamId });
            if (foundStreamer) {
                console.log(`  ✅ Found test streamer: ${foundStreamer.name}`);
            }
            
            // Clean up
            await Streamer.deleteOne({ id: testStreamId });
            console.log(`  🗑️  Cleaned up test streamer`);
        } catch (error: any) {
            console.log(`  ❌ Error creating test streamer: ${error.message}`);
        }

        console.log('\n✅ Database diagnostic completed successfully');
        
    } catch (error: any) {
        console.error('❌ Database diagnostic failed:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

diagnosticDatabase();
