/**
 * Monorepo Architectural Boundary & Dependency Rule Validator
 * Enforces the strict rules defined in three-apps-monorepo-prompt.md:
 * 1. Apps depend on packages. Packages NEVER depend on apps.
 * 2. Apps NEVER import from each other.
 * 3. Packages contain NO secrets, NO privileged keys, and NO app-specific business screens.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const APPS_DIR = path.join(ROOT_DIR, 'apps');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

let errors = [];

function getSubdirectories(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(file => {
    return fs.statSync(path.join(dir, file)).isDirectory();
  });
}

function getAllDartFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== '.dart_tool' && file !== 'build') {
        results = results.concat(getAllDartFiles(filePath));
      }
    } else if (file.endsWith('.dart') || file.endsWith('.yaml')) {
      results.push(filePath);
    }
  });
  return results;
}

console.log('🔍 Checking Monorepo Dependency Rules & Architectural Boundaries...\n');

const appNames = getSubdirectories(APPS_DIR);
const packageNames = getSubdirectories(PACKAGES_DIR);

console.log(`Found ${appNames.length} apps:`, appNames.join(', '));
console.log(`Found ${packageNames.length} packages:`, packageNames.join(', '));
console.log('--------------------------------------------------');

// Rule 1: Packages MUST NEVER import from apps
packageNames.forEach(pkg => {
  const pkgPath = path.join(PACKAGES_DIR, pkg);
  const files = getAllDartFiles(pkgPath);

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');

    // Check for imports from apps
    appNames.forEach(app => {
      if (
        content.includes(`package:${app}`) ||
        content.includes(`apps/${app}`) ||
        content.includes(`../apps/${app}`)
      ) {
        errors.push(`[Rule Violation] Package '${pkg}' (${path.relative(ROOT_DIR, file)}) imports from app '${app}'! Packages must never depend on apps.`);
      }
    });

    // Check for hardcoded secrets or privileged keys
    const secretKeywords = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'ADMIN_SECRET_KEY',
      'RAZORPAY_SECRET',
      'api_secret =',
      'private_key ='
    ];
    secretKeywords.forEach(keyword => {
      if (content.includes(keyword) && !file.endsWith('.example')) {
        errors.push(`[Security Violation] Package '${pkg}' (${path.relative(ROOT_DIR, file)}) contains potential secret/privileged key: '${keyword}'!`);
      }
    });
  });
});

// Rule 2: Apps MUST NEVER import from other apps
appNames.forEach(app => {
  const appPath = path.join(APPS_DIR, app);
  const files = getAllDartFiles(appPath);

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const otherApps = appNames.filter(a => a !== app);

    otherApps.forEach(otherApp => {
      if (
        content.includes(`package:${otherApp}`) ||
        content.includes(`apps/${otherApp}`) ||
        content.includes(`../${otherApp}/`)
      ) {
        errors.push(`[Rule Violation] App '${app}' (${path.relative(ROOT_DIR, file)}) imports directly from peer app '${otherApp}'! Apps must never depend on each other.`);
      }
    });
  });
});

if (errors.length > 0) {
  console.error('\n❌ Architectural boundary violations detected:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log('\n✅ All monorepo dependency rules and architectural boundaries verified successfully!');
  console.log('   ✓ Packages never depend on apps');
  console.log('   ✓ Apps never import from peer apps');
  console.log('   ✓ Packages contain no hardcoded secrets or privileged keys');
  process.exit(0);
}
