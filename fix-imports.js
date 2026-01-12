import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of directories to process
const directories = [
  'config',
  'controllers',
  'middleware',
  'models',
  'routes',
  'utils'
];

// File extensions to process
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Regular expression to match import/require statements
const importRegex = /(?:import|export)(?:\s+[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g;

// Function to update imports in a file
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let updated = false;

    // Find all imports and update them
    const updatedContent = content.replace(importRegex, (match, importPath) => {
      // Skip node_modules and built-in modules
      if (importPath.startsWith('.') || importPath.startsWith('@/')) {
        // Check if the import path already has an extension
        const ext = path.extname(importPath);
        if (!extensions.includes(ext)) {
          updated = true;
          // Add .js extension for relative imports
          if (importPath.startsWith('@/')) {
            return match.replace(importPath, `${importPath}.js`);
          } else {
            const dir = path.dirname(filePath);
            const fullPath = path.resolve(dir, importPath);
            try {
              // Check if the file exists with .ts or .tsx extension
              if (fs.existsSync(`${fullPath}.ts`)) {
                return match.replace(importPath, `${importPath}.js`);
              } else if (fs.existsSync(`${fullPath}.tsx`)) {
                return match.replace(importPath, `${importPath}.js`);
              } else if (fs.existsSync(`${fullPath}/index.ts`)) {
                return match.replace(importPath, `${importPath}/index.js`);
              } else if (fs.existsSync(`${fullPath}/index.tsx`)) {
                return match.replace(importPath, `${importPath}/index.js`);
              }
            } catch (e) {
              console.warn(`Could not resolve import: ${importPath} in ${filePath}`);
            }
          }
        }
      }
      return match;
    });

    if (updated) {
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      console.log(`Updated imports in ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Process all files in a directory
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      processDirectory(fullPath);
    } else if (extensions.includes(path.extname(file.name))) {
      updateImports(fullPath);
    }
  }
}

// Process the root directory files
const rootFiles = fs.readdirSync(__dirname, { withFileTypes: true });
for (const file of rootFiles) {
  if (file.isFile() && extensions.includes(path.extname(file.name))) {
    updateImports(path.join(__dirname, file.name));
  }
}

// Process all specified directories
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    processDirectory(dirPath);
  }
});

console.log('Import updates completed!');
