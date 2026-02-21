import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginState extends Document {
  name?: string; // nome real ou apelido, usado no registro
  email: string; // login do usuário
  password: string; // senha do usuário
  isRegistering: boolean; // se está criando conta ou fazendo login
  createdAt: Date;
  updatedAt: Date;
}

const LoginStateSchema: Schema = new Schema({
  name: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isRegistering: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.models.LoginState || mongoose.model<ILoginState>('LoginState', LoginStateSchema);