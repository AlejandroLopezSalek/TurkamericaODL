const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const enDir = path.join(srcDir, 'en');
const ptDir = path.join(srcDir, 'pt');
const includesDir = path.join(srcDir, '_includes');

// Create directories
if (!fs.existsSync(enDir)) fs.mkdirSync(enDir, { recursive: true });
if (!fs.existsSync(ptDir)) fs.mkdirSync(ptDir, { recursive: true });

// Copy base layouts
const baseContent = fs.readFileSync(path.join(includesDir, 'base.njk'), 'utf8');
fs.writeFileSync(path.join(includesDir, 'base_en.njk'), baseContent.replace('<html lang="es"', '<html lang="en"'));
fs.writeFileSync(path.join(includesDir, 'base_pt.njk'), baseContent.replace('<html lang="es"', '<html lang="pt"'));

// Top-level HTML and NJK files
const files = fs.readdirSync(srcDir).filter(f => {
    const stat = fs.statSync(path.join(srcDir, f));
    return stat.isFile() && (f.endsWith('.html') || f.endsWith('.njk'));
});

for (const file of files) {
    const content = fs.readFileSync(path.join(srcDir, file), 'utf8');

    // replace layout references
    const contentEn = content.replace(/layout:\s*([a-zA-Z0-9_-]+)\.njk/g, 'layout: $1_en.njk');
    const contentPt = content.replace(/layout:\s*([a-zA-Z0-9_-]+)\.njk/g, 'layout: $1_pt.njk');

    fs.writeFileSync(path.join(enDir, file), contentEn);
    fs.writeFileSync(path.join(ptDir, file), contentPt);
}

// Check other files in _includes
const includesFiles = ['auth_base.njk', 'components.njk', 'niveles.njk'];
for (const file of includesFiles) {
    if (fs.existsSync(path.join(includesDir, file))) {
        const content = fs.readFileSync(path.join(includesDir, file), 'utf8');
        const contentEn = content.replace(/layout:\s*([a-zA-Z0-9_-]+)\.njk/g, 'layout: $1_en.njk');
        const contentPt = content.replace(/layout:\s*([a-zA-Z0-9_-]+)\.njk/g, 'layout: $1_pt.njk');
        fs.writeFileSync(path.join(includesDir, file.replace('.njk', '_en.njk')), contentEn);
        fs.writeFileSync(path.join(includesDir, file.replace('.njk', '_pt.njk')), contentPt);
    }
}
console.log('i18n language templates successfully cloned.');
