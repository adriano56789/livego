import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Birthday } from '../src/models/index';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const createBirthdays = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Buscar usuários REAIS
        console.log('🔍 Buscando usuários REAIS...');
        const users = await User.find({});
        
        if (users.length === 0) {
            console.log('❌ Nenhum usuário encontrado!');
            return;
        }

        console.log(`📊 Encontrados ${users.length} usuários REAIS`);

        // Limpar aniversários existentes
        console.log('\n🧹 Limpando aniversários existentes...');
        await Birthday.deleteMany({});
        console.log('✅ Aniversários limpos');

        // Criar aniversários REAIS para cada usuário
        console.log('\n🎂 Criando aniversários REAIS...');
        
        const birthdays = [];
        
        // Datas de aniversário realistas para os usuários
        const sampleBirthdates = [
            new Date('1995-03-15'), // 28 anos
            new Date('1992-07-22'), // 31 anos  
            new Date('1998-11-08'), // 25 anos
            new Date('1990-05-30'), // 33 anos
            new Date('1996-09-12'), // 27 anos
            new Date('1993-12-25'), // 30 anos
            new Date('1997-02-14'), // 26 anos
            new Date('1991-08-18'), // 32 anos
        ];

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const birthDate = sampleBirthdates[i % sampleBirthdates.length];
            const age = calculateAge(birthDate);
            
            const birthday = await Birthday.create({
                id: `birthday_${user.id}_${Date.now()}`,
                userId: user.id,
                birthDate: birthDate,
                age: age,
                isActive: true
            });
            
            birthdays.push(birthday);
            
            console.log(`✅ Aniversário criado: ${user.name} - ${formatDate(birthDate)} (${age} anos)`);
        }

        console.log(`\n✅ Criados ${birthdays.length} aniversários REAIS`);

        // Mostrar estatísticas
        console.log('\n📊 Estatísticas finais:');
        console.log(`👥 Usuários REAIS: ${users.length}`);
        console.log(`🎂 Aniversários REAIS: ${birthdays.length}`);

        // Mostrar próximos aniversários
        console.log('\n🎈 Próximos aniversários (60 dias):');
        const today = new Date();
        const next60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
        
        const upcomingBirthdays = birthdays.filter(b => {
            const thisYearBirthday = new Date(today.getFullYear(), b.birthDate.getMonth(), b.birthDate.getDate());
            const nextYearBirthday = new Date(today.getFullYear() + 1, b.birthDate.getMonth(), b.birthDate.getDate());
            
            return (thisYearBirthday >= today && thisYearBirthday <= next60Days) ||
                   (nextYearBirthday >= today && nextYearBirthday <= next60Days);
        });

        for (const birthday of upcomingBirthdays) {
            const user = users.find(u => u.id === birthday.userId);
            const thisYearBirthday = new Date(today.getFullYear(), birthday.birthDate.getMonth(), birthday.birthDate.getDate());
            const nextYearBirthday = new Date(today.getFullYear() + 1, birthday.birthDate.getMonth(), birthday.birthDate.getDate());
            
            const nextBirthday = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
            const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            console.log(`  🎂 ${user?.name} - ${formatDate(nextBirthday)} (em ${daysUntil} dias) - Signo: ${birthday.zodiacSign}`);
        }

        console.log('\n🎉 Sistema de aniversários criado com dados REAIS!');
        console.log('💡 Funcionalidades disponíveis:');
        console.log('  - GET /api/users/me/birthday - Ver aniversário do usuário');
        console.log('  - PUT /api/users/me/birthday - Atualizar aniversário');
        console.log('  - GET /api/users/birthdays/upcoming - Próximos aniversários');
        
    } catch (error) {
        console.error('❌ Erro ao criar aniversários:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Helper functions
const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Executar criação
createBirthdays();
