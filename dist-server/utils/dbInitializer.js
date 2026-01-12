/**
 * Garante que o Mongoose está ciente dos modelos. A criação de coleções agora é "sob demanda".
 * A lógica de criação explícita foi removida para alinhar com o comportamento padrão do Mongoose,
 * onde as coleções são criadas automaticamente na primeira operação de escrita (ex: inserir um documento).
 */
export const ensureAllCollectionsExist = async () => {
    console.log('[DB_INIT] Verificação de coleções iniciada.');
    // A criação explícita de coleções foi removida.
    // O Mongoose criará as coleções automaticamente na primeira operação de escrita para cada modelo.
    // Isso está alinhado com o comportamento "on-demand" esperado.
    console.log('👍 [DB_INIT] O Mongoose gerenciará a criação de coleções sob demanda.');
};
