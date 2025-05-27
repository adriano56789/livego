const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    try {
        // Parse URL
        const url = req.url === '/' ? '/index.html' : req.url;
        const filePath = path.join(__dirname, url.split('?')[0]);
        const extname = path.extname(filePath);
        
        // Verifica se é um diretório
        fs.stat(filePath, (err, stats) => {
            if (err) {
                // Erro ao acessar o arquivo/diretório
                if (err.code === 'ENOENT') {
                    // Página não encontrada
                    fs.readFile(path.join(__dirname, '404.html'), (error, content) => {
                        if (error) {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            res.end('404 Not Found', 'utf-8');
                        } else {
                            res.writeHead(404, { 'Content-Type': 'text/html' });
                            res.end(content, 'utf-8');
                        }
                    });
                } else {
                    // Outro erro
                    res.writeHead(500);
                    res.end(`Server Error: ${err.code}`);
                }
                return;
            }

            // Se for um diretório, tenta carregar index.html dentro dele
            if (stats.isDirectory()) {
                const indexPath = path.join(filePath, 'index.html');
                fs.readFile(indexPath, (err, content) => {
                    if (err) {
                        // Se não encontrar index.html, lista o diretório ou mostra erro
                        if (err.code === 'ENOENT') {
                            res.writeHead(403, { 'Content-Type': 'text/plain' });
                            res.end('Directory listing not allowed');
                        } else {
                            res.writeHead(500);
                            res.end(`Server Error: ${err.code}`);
                        }
                    } else {
                        // Encontrou index.html no diretório
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    }
                });
                return;
            }

            // Se for um arquivo, tenta lê-lo
            fs.readFile(filePath, (error, content) => {
                if (error) {
                    res.writeHead(500);
                    res.end(`Error reading file: ${error.code}`);
                } else {
                    // Define o tipo de conteúdo com base na extensão
                    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving files from: ${__dirname}`);
});
