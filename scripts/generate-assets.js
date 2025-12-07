const fs = require('fs'); 
const path = require('path'); 
const sharp = require('sharp'); 
// Caminhos 
const assetsDir = path.join(__dirname, '..', 'assets'); 
const outputDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res'); 
const fastlaneDir = path.join(__dirname, '..', 'android', 'fastlane', 'metadata', 'android', 'pt-BR', 'images'); 
// Criar diret¢rios se n∆o existirem 
[assetsDir, outputDir, fastlaneDir].forEach(dir =
  if (!fs.existsSync(dir)) { 
    fs.mkdirSync(dir, { recursive: true }); 
    console.log(`Diret¢rio criado: ${dir}`); 
  } 
}); 
