// Teste das rotas de gerenciamento de dados
import { api } from '../services/api';

// Teste de salvamento
const testData = {
  name: 'Teste de Dados',
  description: 'Este é um teste das rotas de API',
  value: 42
};

// Função para testar as rotas
export const testDataRoutes = async () => {
  console.log('=== Testando Rotas de Gerenciamento de Dados ===');
  
  try {
    // Teste 1: Salvar dados
    console.log('1. Salvando dados...');
    const saveResponse = await api.saveData('test_entity', testData);
    console.log('Dados salvos:', saveResponse);
    
    // Teste 2: Buscar dados
    console.log('2. Buscando dados...');
    const getData = await api.getData('test_entity');
    console.log('Dados encontrados:', getData);
    
    // Teste 3: Atualizar dados
    if (saveResponse.id) {
      console.log('3. Atualizando dados...');
      const updateResponse = await api.updateData('test_entity', saveResponse.id, {
        ...testData,
        name: 'Teste Atualizado',
        value: 100
      });
      console.log('Dados atualizados:', updateResponse);
    }
    
    // Teste 4: Buscar dados atualizados
    console.log('4. Buscando dados atualizados...');
    const updatedData = await api.getData('test_entity');
    console.log('Dados atualizados encontrados:', updatedData);
    
    // Teste 5: Deletar dados
    if (saveResponse.id) {
      console.log('5. Deletando dados...');
      const deleteResponse = await api.deleteData('test_entity', saveResponse.id);
      console.log('Dados deletados:', deleteResponse);
    }
    
    // Teste 6: Verificar se foi deletado
    console.log('6. Verificando se foi deletado...');
    const finalData = await api.getData('test_entity');
    console.log('Dados finais:', finalData);
    
    console.log('=== Testes concluídos com sucesso! ===');
    
  } catch (error) {
    console.error('Erro durante os testes:', error);
  }
};

// Exportar para uso no console
if (typeof window !== 'undefined') {
  (window as any).testDataRoutes = testDataRoutes;
}
