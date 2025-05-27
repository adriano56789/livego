const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
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
        const parsedUrl = url.parse(req.url);
        let pathname = path.join(PUBLIC_DIR, parsedUrl.pathname);
        
        // If URL ends with /, serve index.html
        if (pathname.endsWith('/')) {
            pathname = path.join(pathname, 'index.html');
        }
        
        // Get file extension
        const extname = path.extname(pathname);
        
        // Read file
        fs.readFile(pathname, (err, data) => {
            if (err) {
                // If file not found, serve index.html for SPA routing
                if (err.code === 'ENOENT') {
                    fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err, content) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            res.end('File not found');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(content, 'utf-8');
                        }
                    });
                } else {
                    // Other errors
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end(`Server Error: ${err.code}`);
                }
            } else {
                // File found, serve it
                const contentType = MIME_TYPES[extname] || 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data, 'binary');
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving files from: ${PUBLIC_DIR}`);
});
