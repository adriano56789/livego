import mongoose from 'mongoose';
import { Streamer } from '../models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function checkStreamExists() {
    console.log('Connecting to MongoDB...');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully!');

        const streamId = 'stream_1773019954621_cr4g2a';
        
        console.log(`🔍 Checking if stream exists: ${streamId}`);
        
        // Buscar o stream
        const stream = await Streamer.findOne({ id: streamId });
        
        if (stream) {
            console.log('✅ Stream found:', {
                id: stream.id,
                name: stream.name,
                hostId: stream.hostId,
                isLive: stream.isLive,
                viewers: stream.viewers,
                streamStatus: stream.streamStatus
            });
        } else {
            console.log(`❌ Stream not found: ${streamId}`);
            
            // Listar todos os streams para debug
            const allStreams = await Streamer.find({}, 'id name hostId isLive viewers');
            console.log(`📋 All streams in database (${allStreams.length}):`);
            
            for (const s of allStreams) {
                console.log(`  - ${s.id} (Host: ${s.hostId}, Live: ${s.isLive}, Viewers: ${s.viewers})`);
            }
        }

        console.log('🎉 Stream check completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking stream:', error);
        process.exit(1);
    }
}

checkStreamExists();
