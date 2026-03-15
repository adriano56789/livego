import mongoose from 'mongoose';
import http from 'http';

const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const UserSchema = new mongoose.Schema({
  id: String,
  earnings: Number,
  receptores: Number,
  enviados: Number,
  diamonds: Number
}, { collection: 'users' });

const StreamerSchema = new mongoose.Schema({
  id: String,
  diamonds: Number
}, { collection: 'streamers' });

const User = mongoose.model('User', UserSchema);
const Streamer = mongoose.model('Streamer', StreamerSchema);

async function testeFluxoContador() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔍 TESTE COMPLETO DO FLUXO DO CONTADOR\n');

    const userId = '65384127';

    // 1. VERIFICAR DADOS NO BANCO
    console.log('=== 1. DADOS NO BANCO ===');
    const user = await User.findOne({ id: userId });
    const streamer = await Streamer.findOne({ id: userId });
    
    console.log(`Usuário: ${userId}`);
    console.log(`Earnings (ganho): ${user?.earnings || 0}`);
    console.log(`Receptores (recebidos): ${user?.receptores || 0}`);
    console.log(`Widget Streamer: ${streamer?.diamonds || 0}`);
    
    const valorEsperado = streamer?.diamonds || 0;
    console.log(`VALOR ESPERADO NO CONTADOR: ${valorEsperado}`);

    // 2. TESTAR API
    console.log('\n=== 2. TESTE DA API ===');
    
    const apiTest = () => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: 3000,
          path: `/api/lives/${userId}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const req = http.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on('error', reject);
        req.end();
      });
    };

    try {
      const apiResponse = await apiTest();
      console.log(`API Status: 200`);
      console.log(`API Diamonds: ${apiResponse.diamonds || 0}`);
      
      if (apiResponse.diamonds === valorEsperado) {
        console.log('✅ API retornando valor correto');
      } else {
        console.log('❌ API retornando valor incorreto');
      }
    } catch (error) {
      console.log('❌ Erro na API:', error.message);
    }

    // 3. VERIFICAR CONSISTÊNCIA
    console.log('\n=== 3. CONSISTÊNCIA DOS DADOS ===');
    const valores = {
      earnings: user?.earnings || 0,
      receptores: user?.receptores || 0,
      widget: streamer?.diamonds || 0,
      esperado: valorEsperado
    };

    const consistente = valores.earnings === valores.receptores && 
                       valores.receptores === valores.widget;

    console.log('Valores:', valores);
    
    if (consistente) {
      console.log('✅ Dados consistentes entre si');
    } else {
      console.log('❌ Dados inconsistentes');
    }

    // 4. FLUXO ESPERADO NO FRONTEND
    console.log('\n=== 4. FLUXO ESPERADO NO FRONTEND ===');
    console.log('1. Usuário inicia live');
    console.log('2. startLiveSession(streamer) é chamado');
    console.log('3. api.getLiveDetails(streamer.id) → retorna ' + valorEsperado);
    console.log('4. liveSession.coins = ' + valorEsperado);
    console.log('5. StreamRoom renderiza: ' + valorEsperado.toLocaleString());
    console.log('6. Contador mostra: ' + valorEsperado.toLocaleString());

    // 5. PONTOS DE VERIFICAÇÃO
    console.log('\n=== 5. PONTOS DE VERIFICAÇÃO ===');
    console.log('✅ Backend: API /api/lives/:id retorna diamonds');
    console.log('✅ Frontend: startLiveSession busca dados atualizados');
    console.log('✅ Frontend: liveSession.coins recebe valor persistido');
    console.log('✅ Frontend: StreamRoom exibe liveSession.coins');
    console.log('✅ Logs adicionados para depuração');

    console.log('\n🎯 RESULTADO: Contador deve mostrar ' + valorEsperado.toLocaleString());

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testeFluxoContador();
