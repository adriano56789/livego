const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const manualSchema = new mongoose.Schema({
    titulo: String,
    secoes: [{
        titulo: String,
        itens: [String]
    }]
});

const ManualModel = mongoose.model('ManualTransmissao', manualSchema);

const manualData = {
    titulo: "Manual de Transmissão",
    secoes: [
        {
            titulo: "Como Entrar ao Vivo",
            itens: [
                "Clique no botão de câmera para entrar ao vivo",
                "Digite um título para sua transmissão",
                "Escolha uma categoria",
                "Clique em 'Iniciar Transmissão' para começar"
            ]
        },
        {
            titulo: "Durante a Live",
            itens: [
                "Fale com seu público nos comentários",
                "Use filtros de beleza para melhorar a imagem",
                "Receba presentes dos seus seguidores",
                "Compartilhe sua live nas redes sociais"
            ]
        }
    ]
};

async function seedManual() {
    try {
        await mongoose.connect(MONGO_URI);
        await ManualModel.deleteMany({});
        await ManualModel.create(manualData);
        console.log('✅ Manual criado com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

seedManual();
