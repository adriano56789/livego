import mongoose from 'mongoose';
const ParticipantSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    score: { type: Number, default: 0 }
}, { _id: false });
const PKBattleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    streamId: { type: String, required: true, index: true },
    participants: {
        type: [ParticipantSchema],
        validate: [(val) => val.length === 2, 'A batalha deve ter exatamente 2 participantes.']
    },
    startTime: { type: Date, default: Date.now, required: true },
    endTime: { type: Date, required: true },
    status: {
        type: String,
        enum: ['scheduled', 'active', 'finished', 'cancelled'],
        default: 'active',
        index: true
    },
    winnerId: { type: String, default: null }
}, { timestamps: true });
export const PKBattleModel = mongoose.model('PKBattle', PKBattleSchema);
