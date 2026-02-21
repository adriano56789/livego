
const fs = require('fs');
const path = require('path');

// Configurações
const COMPONENTS_DIR = path.join(__dirname, '../components');
const MODELS_DIR = path.join(__dirname, '../models');

// Sufixos para ignorar ao tentar adivinhar o nome do Model
const SUFFIXES = ['Screen', 'Modal', 'View', 'Card', 'Item', 'List', 'Panel', 'Button', 'Icon', 'Tab', 'Display'];

// Componentes utilitários ou genéricos para ignorar completamente
const IGNORE_LIST = [
    'App', 'Main', 'Header', 'Footer', 'FooterNav', 'Loading', 'Toast', 
    'Watermark', 'Layout', 'Container', 'Router', 'index', 'Icons', 
    'Input', 'Select', 'Checkbox', 'Toggle', 'Button', 'Text',
    'ChatMessage', 'EntryChatMessage', 'VideoScreen', 'SearchScreen' 
];

// Mapeamentos manuais para casos onde o nome não bate direto (Componente -> Model Existente)
const KNOWN_MAPS = {
    'GoLive': 'Stream', // GoLive usa Stream
    'StreamRoom': 'Stream', // StreamRoom usa Stream
    'BroadcasterProfile': 'User', // Perfil usa User
    'TopFans': 'Fan', // TopFans usa Fan
    'Following': 'Follow',
    'Followers': 'Follow',
    'Visitors': 'Visit',
    'PrivateChat': 'Conversation',
    'Chat': 'Message',
    'Ganhos': 'Wallet', // Ganhos é parte da Wallet
    'Diamante': 'Wallet',
    'ConfigureWithdrawalMethod': 'Wallet',
    'ConfirmPurchase': 'Order',
    'PaymentSuccess': 'Order',
    'EditProfile': 'UserProfile', // Ou User
    'MyLevel': 'LevelInfo',
    'FriendRequests': 'FriendRequest',
    'EndStreamSummary': 'StreamSummary',
    'LiveHistory': 'StreamHistory',
    'LiveStreamManual': 'StreamManual',
    'BeautyEffects': 'BeautyEffect',
    'Region': 'Country',
    'PKBattle': 'PKBattle',
    'AvatarProtection': 'User', // Campo dentro de User
    'BlockList': 'Block',
    'AdminWallet': 'Wallet',
    'VIPCenter': 'VIPPlan',
    'AddAccount': 'GoogleAccount',
    'ChooseGmail': 'GoogleAccount',
    'CreateAccount': 'GoogleRegistration',
    'CreatePassword': 'GooglePassword',
    'GoogleAccount': 'GoogleAccount',
    'BasicInfo': 'User',
    'FullScreenPhotoViewer': 'FeedPhoto'
};

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

function getCleanName(fileName) {
    let name = fileName.replace('.tsx', '');
    
    // Tenta remover sufixos para achar a entidade
    for (const suffix of SUFFIXES) {
        if (name.endsWith(suffix)) {
            name = name.substring(0, name.length - suffix.length);
        }
    }
    return name;
}

function audit() {
    console.log('🔍 Iniciando auditoria de Componentes vs Models...\n');

    if (!fs.existsSync(MODELS_DIR)) {
        console.error('❌ Pasta models/ não encontrada.');
        return;
    }

    // 1. Listar Models Existentes
    const existingModels = fs.readdirSync(MODELS_DIR)
        .filter(f => f.endsWith('.ts'))
        .map(f => f.replace('.ts', ''));

    console.log(`✅ ${existingModels.length} Models encontrados.`);

    // 2. Listar Componentes
    const componentFiles = getAllFiles(COMPONENTS_DIR);
    const missingModels = [];

    componentFiles.forEach(filePath => {
        const fileName = path.basename(filePath);
        const nameWithoutExt = fileName.replace('.tsx', '');
        
        // Pula arquivos index ou ícones
        if (nameWithoutExt === 'index' || filePath.includes('/icons/')) return;
        
        // Pula ignorados
        if (IGNORE_LIST.some(ignore => nameWithoutExt.includes(ignore))) return;

        const entityName = getCleanName(fileName);
        
        // Se a entidade ficou vazia ou muito curta, ignora
        if (entityName.length < 3) return;

        // Verifica se existe mapeamento manual
        if (KNOWN_MAPS[nameWithoutExt] || KNOWN_MAPS[entityName]) {
            const mappedModel = KNOWN_MAPS[nameWithoutExt] || KNOWN_MAPS[entityName];
            if (existingModels.includes(mappedModel)) {
                return; // Está coberto
            }
        }

        // Verifica correspondência direta
        if (existingModels.includes(entityName)) return;
        
        // Verifica plural/singular simples (ex: Users -> User)
        if (entityName.endsWith('s') && existingModels.includes(entityName.slice(0, -1))) return;

        // Se chegou aqui, é um candidato a model faltante
        missingModels.push({
            component: nameWithoutExt,
            suggestedEntity: entityName,
            path: filePath.replace(path.join(__dirname, '..'), '')
        });
    });

    // 3. Resultado
    if (missingModels.length === 0) {
        console.log('\n🎉 Incrível! Aparentemente todos os componentes principais têm Models associados ou estão mapeados.');
    } else {
        console.log(`\n⚠️  Encontrados ${missingModels.length} componentes sem Models óbvios:\n`);
        
        missingModels.forEach(item => {
            console.log(`Componente: \x1b[36m${item.component}\x1b[0m`);
            console.log(`   📂 Arquivo: .${item.path}`);
            console.log(`   💡 Sugestão de Model: \x1b[33m${item.suggestedEntity}.ts\x1b[0m`);
            console.log('------------------------------------------------');
        });

        console.log('\n\x1b[32mDICA:\x1b[0m Se algum destes não precisar de banco de dados, adicione à lista IGNORE_LIST no script.');
        console.log('\x1b[32mDICA:\x1b[0m Se ele usa um model com nome diferente, adicione ao KNOWN_MAPS no script.');
    }
}

audit();
