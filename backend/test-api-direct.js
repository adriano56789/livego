const http = require('http');

function testApi(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n🌐 API: ${path}`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        console.log(`Content-Length: ${res.headers['content-length']} bytes`);
        console.log(`Response size: ${data.length} bytes (${(data.length / 1024).toFixed(1)} kB)`);
        
        try {
          const parsed = JSON.parse(data);
          console.log(`Parsed: ${Array.isArray(parsed) ? `Array[${parsed.length}]` : typeof parsed}`);
          
          if (Array.isArray(parsed)) {
            if (parsed.length === 0) {
              console.log('❌ ARRAY VAZIO');
            } else {
              console.log('✅ Dados encontrados:');
              parsed.slice(0, 3).forEach((item, i) => {
                console.log(`   ${i + 1}. ${item.name || item.id}: ${item.contribution || 'N/A'}`);
              });
            }
          }
        } catch (e) {
          console.log('❌ ERRO JSON:', e.message);
          console.log('Raw response (first 200 chars):', data.substring(0, 200));
        }
        
        resolve(data);
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Erro na requisição: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

async function testAllApis() {
  console.log('🧪 Testando APIs diretamente...');
  
  try {
    await testApi('/api/contribution/daily');
    await testApi('/api/contribution/weekly');
    await testApi('/api/contribution/monthly');
    await testApi('/api/contribution/live');
  } catch (error) {
    console.error('Erro:', error);
  }
}

testAllApis();
