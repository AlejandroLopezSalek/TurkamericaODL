// diagnose.js - Run this to check your setup
// Usage: node diagnose.js

const fs = require('fs');
const path = require('path');

console.log('\n╔═══════════════════════════════════════╗');
console.log('║  TurkAmerica MVP Diagnostic Tool     ║');
console.log('╚═══════════════════════════════════════╝\n');

let errors = 0;
let warnings = 0;

// ================================
// 1. Check Node.js Version
// ================================
console.log('📦 Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

if (majorVersion >= 16) {
    console.log(`✅ Node.js ${nodeVersion} (OK)`);
} else {
    console.log(`❌ Node.js ${nodeVersion} (Need v16+)`);
    errors++;
}

// ================================
// 2. Check Required Files
// ================================
console.log('\n📁 Checking required files...');

const requiredFiles = [
    'server.js',
    'package.json',
    '.env',
    'models/User.js',
    'routes/auth.js',
    'middleware/auth.js'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} (MISSING)`);
        errors++;
    }
});

// ================================
// 3. Check .env Configuration
// ================================
console.log('\n⚙️  Checking .env configuration...');

if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    
    const requiredVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];
    requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
            console.log(`✅ ${varName}`);
        } else {
            console.log(`❌ ${varName} (MISSING)`);
            errors++;
        }
    });
    
    // Check JWT_SECRET is changed
    if (envContent.includes('your-super-secret') || envContent.includes('change-this')) {
        console.log(`⚠️  JWT_SECRET appears to be default value`);
        warnings++;
    }
} else {
    console.log('❌ .env file not found');
    errors++;
}

// ================================
// 4. Check Dependencies
// ================================
console.log('\n📚 Checking dependencies...');

if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = pkg.dependencies || {};
    
    const required = ['express', 'mongoose', 'bcryptjs', 'jsonwebtoken', 'cors', 'dotenv'];
    required.forEach(dep => {
        if (deps[dep]) {
            console.log(`✅ ${dep}`);
        } else {
            console.log(`❌ ${dep} (NOT INSTALLED)`);
            errors++;
        }
    });
    
    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
        console.log('\n❌ node_modules folder not found');
        console.log('💡 Run: npm install');
        errors++;
    }
} else {
    console.log('❌ package.json not found');
    errors++;
}

// ================================
// 5. Check MongoDB Connection
// ================================
console.log('\n🗄️  Checking MongoDB...');

const { exec } = require('child_process');

exec('mongosh --version', (error, stdout, stderr) => {
    if (error) {
        console.log('⚠️  mongosh not found in PATH');
        console.log('💡 Make sure MongoDB is installed');
        warnings++;
    } else {
        console.log('✅ MongoDB client installed');
    }
    
    // Try to connect
    exec('mongosh --eval "db.version()" --quiet', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ Cannot connect to MongoDB');
            console.log('💡 Start MongoDB with: net start MongoDB (Windows) or brew services start mongodb-community (Mac)');
            errors++;
        } else {
            console.log(`✅ MongoDB is running (${stdout.trim()})`);
        }
        
        printSummary();
    });
});

// ================================
// 6. Check Public Folder
// ================================
console.log('\n🌐 Checking public folder...');

const publicFiles = [
    'public/index.html',
    'public/login.html',
    'public/register.html',
    'public/js/config.js',
    'public/js/auth.js'
];

publicFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`⚠️  ${file} (NOT FOUND)`);
        warnings++;
    }
});

// ================================
// Summary
// ================================
function printSummary() {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║           Diagnostic Summary          ║');
    console.log('╚═══════════════════════════════════════╝\n');
    
    if (errors === 0 && warnings === 0) {
        console.log('✅ All checks passed! You\'re ready to start the server.');
        console.log('\n🚀 Run: npm run dev');
    } else {
        if (errors > 0) {
            console.log(`❌ Found ${errors} error(s) that need to be fixed.`);
        }
        if (warnings > 0) {
            console.log(`⚠️  Found ${warnings} warning(s) to review.`);
        }
        
        console.log('\n📖 Common fixes:');
        console.log('  1. Create .env file: cp .env.example .env');
        console.log('  2. Install dependencies: npm install');
        console.log('  3. Start MongoDB: net start MongoDB');
        console.log('  4. Update JWT_SECRET in .env');
    }
    
    console.log('\n');
}