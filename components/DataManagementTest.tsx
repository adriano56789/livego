import React, { useState } from 'react';
import { api } from '../services/api';

interface TestData {
  id?: string;
  name: string;
  description: string;
  value: number;
  createdAt?: string;
  updatedAt?: string;
}

const DataManagementTest: React.FC = () => {
  const [entity, setEntity] = useState('test_data');
  const [testData, setTestData] = useState<TestData>({
    name: '',
    description: '',
    value: 0
  });
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    try {
      const response = await api.saveData(entity, testData);
      setMessage(`Dados salvos com sucesso! ID: ${response.id}`);
      setTestData({ name: '', description: '', value: 0 });
      handleLoad(); // Recarregar dados
    } catch (error) {
      setMessage(`Erro ao salvar: ${error}`);
    }
  };

  const handleLoad = async () => {
    try {
      const data = await api.getData(entity);
      setResults(data);
      setMessage('Dados carregados com sucesso!');
    } catch (error) {
      setMessage(`Erro ao carregar: ${error}`);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.updateData(entity, id, testData);
      setMessage(`Dados atualizados com sucesso! ID: ${id}`);
      handleLoad(); // Recarregar dados
    } catch (error) {
      setMessage(`Erro ao atualizar: ${error}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteData(entity, id);
      setMessage(`Dados deletados com sucesso! ID: ${id}`);
      handleLoad(); // Recarregar dados
    } catch (error) {
      setMessage(`Erro ao deletar: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Teste de Gerenciamento de Dados</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Tipo de Entidade: 
          <input
            type="text"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Formulário de Dados</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Nome: 
            <input
              type="text"
              value={testData.name}
              onChange={(e) => setTestData({...testData, name: e.target.value})}
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Descrição: 
            <input
              type="text"
              value={testData.description}
              onChange={(e) => setTestData({...testData, description: e.target.value})}
              style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Valor: 
            <input
              type="number"
              value={testData.value}
              onChange={(e) => setTestData({...testData, value: Number(e.target.value)})}
              style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
            />
          </label>
        </div>
        <button onClick={handleSave} style={{ padding: '8px 16px', marginRight: '10px' }}>
          Salvar
        </button>
        <button onClick={handleLoad} style={{ padding: '8px 16px' }}>
          Carregar Dados
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <strong>{message}</strong>
        </div>
      )}

      <div>
        <h3>Resultados ({results.length} registros)</h3>
        {results.length === 0 ? (
          <p>Nenhum dado encontrado. Use o botão "Carregar Dados" para buscar informações.</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {results.map((item) => (
              <div key={item.id} style={{ 
                marginBottom: '10px', 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                backgroundColor: '#f9f9f9'
              }}>
                <div><strong>ID:</strong> {item.id}</div>
                <div><strong>Nome:</strong> {item.name}</div>
                <div><strong>Descrição:</strong> {item.description}</div>
                <div><strong>Valor:</strong> {item.value}</div>
                <div><strong>Criado em:</strong> {new Date(item.createdAt).toLocaleString()}</div>
                <div><strong>Atualizado em:</strong> {new Date(item.updatedAt).toLocaleString()}</div>
                <div style={{ marginTop: '10px' }}>
                  <button 
                    onClick={() => handleUpdate(item.id)}
                    style={{ padding: '5px 10px', marginRight: '5px', fontSize: '12px' }}
                  >
                    Atualizar
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#ff4444', color: 'white', border: 'none', fontSize: '12px' }}
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManagementTest;
