import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function fixIndex() {
    console.log('Connecting to MongoDB at:', MONGODB_URI);

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully!');

        // Get the users collection
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }
        const collection = db.collection('users');

        // Drop existing identification index if it exists
        try {
            await collection.dropIndex('identification_1');
            console.log('✅ Dropped existing identification_1 index');
        } catch (error: any) {
            if (error.codeName === 'IndexNotFound') {
                console.log('ℹ️ identification_1 index does not exist, skipping drop');
            } else {
                throw error;
            }
        }

        // Create new sparse unique index on identification
        await collection.createIndex(
            { identification: 1 },
            { unique: true, sparse: true, name: 'identification_1' }
        );
        console.log('✅ Created new sparse unique index on identification');

        // List all indexes to verify
        const indexes = await collection.indexes();
        console.log('📋 Current indexes:', indexes.map(idx => idx.name));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing index:', error);
        process.exit(1);
    }
}

fixIndex();
