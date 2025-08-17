import * as mockDb from './mockDb';
import type { User, LiveStreamRecord, PurchaseOrder, WithdrawalTransaction, ConvitePK, PrivateLiveInviteSettings, NotificationSettings, LogPresenteEnviado, PkSettings, LiveCategory, TabelaUsuario, BatalhaPK, TabelaConversa, TabelaMensagem, Denuncia, Sugestao, ConfiguracaoNivel, ArtigoAjuda, CanalContato, SeguidorRelacionamento, VisitaPerfil, FilaPK, Achievement, Like } from '../types';

// Simulate reading from a .env file
const ENV = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'livego_user',
  DB_PASSWORD: 'secure_password',
  DB_NAME: 'livego_db',
};

// In-memory representation of the database, initialized from mockDb
// Using structuredClone to avoid direct mutation of the imported arrays
let database: {
    users: User[];
    tabelaUsuarios: TabelaUsuario[];
    liveStreamRecords: LiveStreamRecord[];
    tabelaConversas: TabelaConversa[];
    tabelaMensagens: TabelaMensagem[];
    purchaseOrders: PurchaseOrder[];
    withdrawalTransactions: WithdrawalTransaction[];
    pkInvitations: ConvitePK[];
    privateLiveInviteSettings: PrivateLiveInviteSettings[];
    notificationSettings: NotificationSettings[];
    pkSettings: PkSettings[];
    denuncias: Denuncia[];
    sugestoes: Sugestao[];
    logPresentesEnviados: LogPresenteEnviado[];
    liveCategories: LiveCategory[];
    batalhasPK: BatalhaPK[];
    configuracaoNiveis: ConfiguracaoNivel[];
    artigosAjuda: ArtigoAjuda[];
    canaisContato: CanalContato[];
    seguidores: SeguidorRelacionamento[];
    visitasPerfil: VisitaPerfil[];
    filaPK: FilaPK[];
    blockedRelationships: { blockerId: number, targetId: number }[];
    achievements: Achievement[];
    likes: Like[];
} = {
    users: structuredClone(mockDb.mockUserDatabase),
    tabelaUsuarios: structuredClone(mockDb.mockTabelaUsuariosDatabase),
    liveStreamRecords: structuredClone(mockDb.mockLiveStreamRecordsDatabase),
    tabelaConversas: structuredClone(mockDb.mockTabelaConversasDatabase),
    tabelaMensagens: structuredClone(mockDb.mockTabelaMensagensDatabase),
    purchaseOrders: structuredClone(mockDb.mockPurchaseOrders),
    withdrawalTransactions: structuredClone(mockDb.mockWithdrawalTransactions),
    pkInvitations: structuredClone(mockDb.mockConvitesPKDatabase),
    privateLiveInviteSettings: structuredClone(mockDb.mockPrivateLiveInviteSettings),
    notificationSettings: structuredClone(mockDb.mockNotificationSettings),
    pkSettings: structuredClone(mockDb.mockPkSettingsDatabase),
    denuncias: structuredClone(mockDb.mockDenunciasDatabase),
    sugestoes: structuredClone(mockDb.mockSugestoesDatabase),
    logPresentesEnviados: structuredClone(mockDb.mockLogPresentesEnviadosDatabase),
    liveCategories: structuredClone(mockDb.mockLiveCategoriesDatabase),
    batalhasPK: structuredClone(mockDb.mockBatalhasPKDatabase),
    configuracaoNiveis: structuredClone(mockDb.mockConfiguracaoNiveisDatabase),
    artigosAjuda: structuredClone(mockDb.mockArtigosAjudaDatabase),
    canaisContato: structuredClone(mockDb.mockCanaisContatoDatabase),
    seguidores: structuredClone(mockDb.mockSeguidoresDatabase),
    visitasPerfil: structuredClone(mockDb.mockVisitasPerfilDatabase),
    filaPK: structuredClone(mockDb.mockFilaPKDatabase),
    blockedRelationships: structuredClone(mockDb.mockBlockedRelationships),
    achievements: structuredClone(mockDb.mockAchievementsDatabase),
    likes: structuredClone(mockDb.mockLikesDatabase),
};

let connected = false;

const connect = async () => {
    if (connected) {
        return;
    }
    console.log(`[DB Client] Simulating connection to ${ENV.DB_NAME} at ${ENV.DB_HOST}:${ENV.DB_PORT}...`);
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async connection
    connected = true;
    console.log('[DB Client] Conexão com o banco estabelecida com sucesso (modo simulado).');
};

type Table = typeof database;
type TableName = keyof Table;
type TableItem<K extends TableName> = Table[K][number];

const find = async <K extends TableName>(tableName: K, query: (item: TableItem<K>) => boolean): Promise<TableItem<K>[]> => {
    if (!connected) throw new Error("Database not connected.");
    const table = database[tableName] as TableItem<K>[];
    if (!table) throw new Error(`Table ${tableName} not found.`);
    return structuredClone(table.filter(query));
};

const findOne = async <K extends TableName>(tableName: K, query: (item: TableItem<K>) => boolean): Promise<TableItem<K> | null> => {
     if (!connected) throw new Error("Database not connected.");
    const table = database[tableName] as TableItem<K>[];
    if (!table) throw new Error(`Table ${tableName} not found.`);
    const result = table.find(query);
    return result ? structuredClone(result) : null;
};

const insert = async <K extends TableName>(tableName: K, data: Omit<TableItem<K>, 'id'> & { id?: any }): Promise<TableItem<K>> => {
    if (!connected) throw new Error("Database not connected.");
    const table = database[tableName] as any[];
    if (!table) throw new Error(`Table ${tableName} not found.`);

    const newItem = { ...data };
    const primaryKey = (tableName === 'privateLiveInviteSettings' || tableName === 'notificationSettings' || tableName === 'pkSettings') ? 'userId' : 'id';
    
    // Only generate an 'id' if the primary key is 'id' and it's not provided
    if (primaryKey === 'id' && typeof (newItem as any).id === 'undefined') {
        const isNumericId = table.length > 0 && typeof table[0].id === 'number';
        if (isNumericId) {
            const maxId = table.reduce((max, item) => Math.max(item.id || 0, max), 0);
            (newItem as any).id = maxId + 1;
        } else {
            (newItem as any).id = `${tableName.slice(0, -1)}-${Date.now()}`;
        }
    }
    
    table.push(newItem);
    return structuredClone(newItem as TableItem<K>);
};

const update = async <K extends TableName>(tableName: K, id: number | string, updates: Partial<TableItem<K>>): Promise<TableItem<K> | null> => {
    if (!connected) throw new Error("Database not connected.");
    const table = database[tableName] as any[];
    if (!table) throw new Error(`Table ${tableName} not found.`);
    
    const primaryKey = 
        (tableName === 'privateLiveInviteSettings' || tableName === 'notificationSettings' || tableName === 'pkSettings') ? 'userId' :
        (tableName === 'purchaseOrders') ? 'orderId' :
        'id';
    
    const itemIndex = table.findIndex(item => String(item[primaryKey]) === String(id));

    if (itemIndex === -1) {
        // Handle "upsert" for settings tables that might not exist yet
        if (primaryKey === 'userId') {
            const newItemData = { ...updates };
            // Ensure userId is a number
            (newItemData as any)[primaryKey] = typeof id === 'string' ? parseInt(id, 10) : id;
            table.push(newItemData);
            return structuredClone(newItemData as TableItem<K>);
        }
        return null;
    }

    const updatedItem = { ...table[itemIndex], ...updates };
    table[itemIndex] = updatedItem;
    return structuredClone(updatedItem);
};


const deleteOne = async <K extends TableName>(tableName: K, query: (item: TableItem<K>) => boolean): Promise<boolean> => {
    if (!connected) throw new Error("Database not connected.");
    const table = database[tableName] as TableItem<K>[];
    if (!table) throw new Error(`Table ${tableName} not found.`);

    const initialLength = table.length;
    (database as any)[tableName] = table.filter(item => !query(item));
    return (database as any)[tableName].length < initialLength;
};

// This returns all data for the dev tools to inspect
const getRawDb = () => {
    return {
        ...database,
        // These are more like "cache" or non-relational data, so we get them from the original mockDb source
        mockGiftCatalog: mockDb.mockGiftCatalog,
        mockLiveConnections: mockDb.mockLiveConnections,
        mockChatDatabase: mockDb.mockChatDatabase,
        mockViewers: mockDb.mockViewers,
        mockRankings: mockDb.mockRankings,
        mockPublicProfiles: mockDb.mockPublicProfiles,
        mockPkPreferences: mockDb.mockPkPreferences,
        mockUserRewardsStatus: mockDb.mockUserRewardsStatus,
        mockMutedUsersInLive: mockDb.mockMutedUsersInLive,
        mockKickedUsersFromLive: mockDb.mockKickedUsersFromLive,
        mockSoundEffectLog: mockDb.mockSoundEffectLog,
        mockSupportConversation: mockDb.mockSupportConversation,
        mockPushSettings: mockDb.mockPushSettings,
    };
};

export const dbClient = {
    connect,
    find,
    findOne,
    insert,
    update,
    delete: deleteOne,
    getRawDb,
};