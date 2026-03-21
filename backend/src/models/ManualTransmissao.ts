import mongoose, { Document, Schema } from 'mongoose';

export interface IManualTransmissao extends Document {
    titulo: string;
    secoes: Array<{
        titulo: string;
        itens: string[];
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const ManualTransmissaoSchema: Schema = new Schema({
    titulo: {
        type: String,
        required: true,
        default: 'Manual de Transmissão'
    },
    secoes: [{
        titulo: {
            type: String,
            required: true
        },
        itens: [{
            type: String,
            required: true
        }]
    }]
}, {
    timestamps: true
});

const ManualTransmissao = mongoose.model<IManualTransmissao>('ManualTransmissao', ManualTransmissaoSchema);
export default ManualTransmissao;
export { ManualTransmissao };
