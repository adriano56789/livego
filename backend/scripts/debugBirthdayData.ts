import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const debugBirthdayData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        const userId = '65384127';
        
        console.log(`\n🔍 Debug completo dos dados de aniversário para usuário: ${userId}`);
        
        // Buscar usuário completo
        const user = await User.findOne({ id: userId });
        
        if (!user) {
            console.log('❌ Usuário não encontrado');
            return;
        }
        
        console.log('\n📊 Dados completos do usuário:');
        console.log(`- ID: ${user.id}`);
        console.log(`- Nome: "${user.name}"`);
        console.log(`- Data de Nascimento: ${user.birthday || 'NÃO DEFINIDO'}`);
        console.log(`- Idade: ${user.age || 'NÃO DEFINIDA'}`);
        
        // Verificar todos os campos relevantes
        console.log('\n🔍 Todos os campos do usuário:');
        const userObj = user.toObject() as any;
        Object.keys(userObj).forEach(key => {
            const value = userObj[key];
            if (key.toLowerCase().includes('birth') || key.toLowerCase().includes('age') || key.toLowerCase().includes('date')) {
                console.log(`  • ${key}: ${value} (${typeof value})`);
            }
        });
        
        // Calcular idade e signo corretos se houver data
        if (user.birthday) {
            console.log('\n📅 Análise da data de aniversário:');
            const birthDate = new Date(user.birthday);
            console.log(`- Data original: ${user.birthday}`);
            console.log(`- Data parseada: ${birthDate.toISOString()}`);
            console.log(`- Data formatada: ${birthDate.toLocaleDateString('pt-BR')}`);
            
            // Calcular idade correta
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            console.log(`- Idade calculada: ${age} anos`);
            
            // Calcular signo
            const getZodiacSign = (date: Date) => {
                const month = date.getMonth() + 1;
                const day = date.getDate();
                
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
                return 'Peixes';
            };
            
            const correctZodiac = getZodiacSign(birthDate);
            console.log(`- Signo correto: ${correctZodiac}`);
            
            // Verificar se precisa atualizar
            const needsUpdate = user.age !== age;
            
            if (needsUpdate) {
                console.log('\n🔄 Dados precisam ser atualizados:');
                console.log(`- Idade: ${user.age} → ${age}`);
                console.log(`- Signo calculado: ${correctZodiac} (será calculado no frontend)`);
                
                // Atualizar apenas a idade no banco
                await User.updateOne(
                    { id: userId },
                    { 
                        age: age
                    }
                );
                
                console.log('✅ Idade atualizada com sucesso!');
                
                // Verificar após atualização
                const updatedUser = await User.findOne({ id: userId });
                console.log('\n📊 Após atualização:');
                console.log(`- Idade: ${updatedUser?.age}`);
                console.log(`- Signo: ${correctZodiac} (calculado no frontend)`);
            } else {
                console.log('\n✅ Idade já está correta!');
                console.log(`- Signo: ${correctZodiac} (calculado no frontend)`);
            }
        } else {
            console.log('\n❌ Usuário não possui data de aniversário definida');
        }

    } catch (error) {
        console.error('❌ Erro durante debug:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar debug
debugBirthdayData();
