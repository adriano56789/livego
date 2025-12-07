const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Caminhos
const iconSource = path.resolve(__dirname, '../resources/icon.png');
const androidResDir = path.resolve(__dirname, '../android/app/src/main/res');

// Tamanhos para cada densidade (em dp)
const iconSizes = {
  'mipmap-mdpi': 48,    // 1x
  'mipmap-hdpi': 72,    // 1.5x
  'mipmap-xhdpi': 96,   // 2x
  'mipmap-xxhdpi': 144, // 3x
  'mipmap-xxxhdpi': 192 // 4x
};

// Função para criar diretórios
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Verifica se o arquivo de origem existe
if (!fs.existsSync(iconSource)) {
  console.error('Erro: Arquivo de ícone não encontrado em', iconSource);
  process.exit(1);
}

// Cria os diretórios necessários
Object.keys(iconSizes).forEach(dir => {
  const fullPath = path.join(androidResDir, dir);
  ensureDirectoryExists(fullPath);
});

// Gera os ícones
Object.entries(iconSizes).forEach(([dir, size]) => {
  const outputPath = path.join(androidResDir, dir, 'ic_launcher.png');
  const roundOutputPath = path.join(androidResDir, dir, 'ic_launcher_round.png');
  
  try {
    // Gera o ícone padrão
    execSync(`magick convert "${iconSource}" -resize ${size}x${size} "${outputPath}"`);
    
    // Gera o ícone redondo
    execSync(`magick convert "${iconSource}" -resize ${size}x${size} -alpha set -background none \( +clone -channel A -evaluate divide 2 +channel -blur 0x2.5 \) +swap -compose DstOut -composite -compose Over -alpha on "${roundOutputPath}"`);
    
    console.log(`Ícones gerados em ${dir}/`);
  } catch (error) {
    console.error(`Erro ao gerar ícones para ${dir}:`, error.message);
  }
});

console.log('\nPara concluir a instalação, execute:');
console.log('1. cd android');
console.log('2. ./gradlew clean');
console.log('3. cd ..');
console.log('4. npx cap sync android');
