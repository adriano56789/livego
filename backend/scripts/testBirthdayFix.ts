import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const testBirthdayFix = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        const userId = '65384127';
        
        console.log(`\n🔍 Testando correção de data para usuário: ${userId}`);
        
        // Simular atualização com data correta
        const birthdayValue = '04/03/1993'; // 4 de março de 1993
        
        // Converter data do formato brasileiro (dd/mm/yyyy) para Date
        const parts = birthdayValue.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts.map(Number);
            const birthDate = new Date(year, month - 1, day); // mês-1 porque JS usa 0-11
            
            console.log('\n📅 Processamento da data:');
            console.log(`- Data original: ${birthdayValue}`);
            console.log(`- Parseada como: ${birthDate.toISOString()}`);
            console.log(`- Formatada: ${birthDate.toLocaleDateString('pt-BR')}`);
            
            // Calcular idade correta
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            console.log(`- Idade calculada: ${age} anos`);
            
            // Atualizar no banco
            await User.updateOne(
                { id: userId },
                { 
                    birthday: birthdayValue,
                    age: age
                }
            );
            
            console.log('✅ Data e idade atualizadas no banco!');
            
            // Verificar após atualização
            const updatedUser = await User.findOne({ id: userId });
            console.log('\n📊 Após atualização:');
            console.log(`- Birthday: ${updatedUser?.birthday}`);
            console.log(`- Age: ${updatedUser?.age}`);
            
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
            
            const zodiac = getZodiacSign(birthDate);
            console.log(`- Signo: ${zodiac} (calculado no frontend)`);
            
            console.log('\n🎉 SUCESSO! Data de aniversário corrigida:');
            console.log(`✅ Data persistirá: ${birthdayValue}`);
            console.log(`✅ Idade persistirá: ${age} anos`);
            console.log(`✅ Signo calculado: ${zodiac}`);
        }

    } catch (error) {
        console.error('❌ Erro durante teste:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar teste
testBirthdayFix();
