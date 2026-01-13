#!/usr/bin/env node

/**
 * TurkAmerica Setup Script
 * Automatically configures the project for first-time setup
 * 
 * Usage: node setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('\n╔═══════════════════════════════════════╗');
console.log('║  TurkAmerica Setup Script             ║');
console.log('╚═══════════════════════════════════════╝\n');

let hasErrors = false;

// ================================
// 1. Check Node.js Version
// ================================
console.log('📦 Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

if (majorVersion >= 16) {
  console.log(`✅ Node.js ${nodeVersion} (OK)\n`);
} else {
  console.log(`❌ Node.js ${nodeVersion} (Need v16+)\n`);
  hasErrors = true;
}

// ================================
// 2. Create necessary directories
// ================================
console.log('📁 Creating necessary directories...');

const dirs = [
  'config',
  'models',
  'routes',
  'middleware',
  'public',
  'public/js',
  'public/css',
  'public/auth'
];

dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created ${dir}`);
  } else {
    console.log(`✓ ${dir} already exists`);
  }
});

console.log('');

// ================================
// 3. Create .env file if it doesn't exist
// ================================
console.log('⚙️  Configuring environment variables...');

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  // Generate secure JWT secret
  const jwtSecret = crypto.randomBytes(32).toString('hex');

  const envContent = `# TurkAmerica MVP - Environment Variables
# Generated on ${new Date().toISOString()}

PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/turkamerica
JWT_SECRET=${jwtSecret}
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with secure JWT secret\n');
} else {
  console.log('✓ .env file already exists\n');

  // Check if JWT_SECRET needs to be updated
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('your-super-secret') || envContent.includes('change-this')) {
    console.log('⚠️  WARNING: Your JWT_SECRET appears to be a default value!');
    console.log('💡 Run this command to generate a new secret:');
    console.log('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.log('');
  }
}

// ================================
// 4. Install dependencies
// ================================
console.log('📚 Checking dependencies...');

if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
  console.log('📥 Installing dependencies (this may take a while)...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    console.error('💡 Try running: npm install\n');
    hasErrors = true;
  }
} else {
  console.log('✓ Dependencies already installed\n');
}

// ================================
// 5. Check MongoDB
// ================================
console.log('🗄️  Checking MongoDB...');

try {
  execSync('mongosh --version', { stdio: 'pipe' });
  console.log('✅ MongoDB client is installed\n');

  // Try to connect
  try {
    execSync('mongosh --eval "db.version()" --quiet', { stdio: 'pipe' });
    console.log('✅ MongoDB is running and accessible\n');
  } catch (error) {
    console.log('⚠️  MongoDB is not running');
    console.log('💡 Start MongoDB with one of these commands:');
    console.log('   Windows: net start MongoDB');
    console.log('   Mac: brew services start mongodb-community');
    console.log('   Linux: sudo systemctl start mongod');
    console.log('');
  }
} catch (error) {
  console.log('⚠️  MongoDB client not found');
  console.log('💡 Install MongoDB from: https://www.mongodb.com/try/download/community');
  console.log('');
}

// ================================
// 6. Create package.json scripts if missing
// ================================
console.log('📝 Checking package.json scripts...');

const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  const requiredScripts = {
    'start': 'node server.js',
    'dev': 'nodemon server.js',
    'test': 'echo "Error: no test specified" && exit 1'
  };

  let updated = false;
  packageJson.scripts = packageJson.scripts || {};

  Object.entries(requiredScripts).forEach(([key, value]) => {
    if (!packageJson.scripts[key]) {
      packageJson.scripts[key] = value;
      updated = true;
      console.log(`✅ Added script: ${key}`);
    }
  });

  if (updated) {
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json\n');
  } else {
    console.log('✓ All scripts are present\n');
  }
}

// ================================
// 7. Create .gitignore if it doesn't exist
// ================================
console.log('🔒 Checking .gitignore...');

const gitignorePath = path.join(process.cwd(), '.gitignore');
const gitignoreContent = `# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Build
dist/
_site_tmp/

# Temporary files
tmp/
temp/
`;

if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('✅ Created .gitignore\n');
} else {
  console.log('✓ .gitignore already exists\n');
}

// ================================
// SUMMARY
// ================================
console.log('╔═══════════════════════════════════════╗');
console.log('║         Setup Complete!               ║');
console.log('╚═══════════════════════════════════════╝\n');

if (!hasErrors) {
  console.log('✅ All checks passed! You\'re ready to start.');
  console.log('\n📖 Next steps:');
  console.log('  1. Make sure MongoDB is running');
  console.log('  2. Review your .env configuration');
  console.log('  3. Start the development server:');
  console.log('     npm run dev');
  console.log('\n📚 Additional commands:');
  console.log('  npm start     - Start production server');
  console.log('  npm run dev   - Start development server with auto-reload');
  console.log('\n🌐 Once started, visit:');
  console.log('  http://localhost:3000 - Main application');
  console.log('  http://localhost:3000/health - Health check');
} else {
  console.log('⚠️  Setup completed with warnings.');
  console.log('Please review the messages above and fix any issues.');
}

console.log('\n💡 Need help? Check the README.md or documentation.\n');