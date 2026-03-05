import mongoose, { Document, Schema } from 'mongoose';

export interface IBirthday extends Document {
    id: string;
    userId: string;
    birthDate: Date;
    age: number;
    zodiacSign?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BirthdaySchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User', unique: true },
    birthDate: { type: Date, required: true },
    age: { type: Number, required: true, min: 13, max: 100 },
    zodiacSign: { type: String, enum: ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'] },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Índices para performance
BirthdaySchema.index({ userId: 1 });
BirthdaySchema.index({ birthDate: 1 });
BirthdaySchema.index({ isActive: 1 });

// Método para calcular signo
BirthdaySchema.methods.calculateZodiacSign = function(): string {
    const month = this.birthDate.getMonth() + 1;
    const day = this.birthDate.getDate();
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Áries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Touro';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gêmeos';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Câncer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leão';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgem';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Escorpião';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagitário';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricórnio';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquário';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Peixes';
    
    return 'Desconhecido';
};

BirthdaySchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const Birthday = mongoose.model<IBirthday>('Birthday', BirthdaySchema);
