import fs from 'fs';
import path from 'path';

/**
 * Automated Regression Test Suite for Data Consistency & Stale Cache Prevention
 */

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, failureMsg) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASSED: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAILED: ${testName}`);
    console.error(`     Reason: ${failureMsg}`);
  }
}

console.log('====================================================');
console.log('🧪 RUNNING AUTOMATED DATA CONSISTENCY REGRESSION TESTS');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST GROUP 1: FRONTEND STATE & LOCALSTORAGE PERSISTENCE
// ----------------------------------------------------
console.log('📦 Test Group 1: AdminContext updateSettings & LocalStorage Persistence');

const adminContextPath = path.resolve('src/context/AdminContext.jsx');
const adminContextContent = fs.readFileSync(adminContextPath, 'utf-8');

// 1.1 Check if updateSettings calls setCache('settings', ...)
const updateSettingsBody = adminContextContent.match(/const updateSettings = async [\s\S]*?^\s{4}\};/m);
const hasSetCacheInUpdateSettings = updateSettingsBody ? updateSettingsBody[0].includes("setCache('settings'") : false;

assert(
  hasSetCacheInUpdateSettings,
  'updateSettings() must persist updated settings to localStorage via setCache("settings")',
  'updateSettings() updates React state in memory but omits setCache("settings"), causing stale localStorage on reload.'
);

// 1.2 Check if updateSettings dispatches 'faheem_data_updated' event
const hasEventDispatchInUpdateSettings = updateSettingsBody ? updateSettingsBody[0].includes("faheem_data_updated") : false;

assert(
  hasEventDispatchInUpdateSettings,
  'updateSettings() must dispatch custom event "faheem_data_updated"',
  'updateSettings() does not dispatch faheem_data_updated event, preventing multi-tab real-time synchronization.'
);

// ----------------------------------------------------
// TEST GROUP 2: BACKEND COLD-START FALLBACK PROTECTION
// ----------------------------------------------------
console.log('\n⚡ Test Group 2: Backend /api/bootstrap Connection Lag & Fallback Protection');

const apiJsPath = path.resolve('server/routes/api.js');
const apiJsContent = fs.readFileSync(apiJsPath, 'utf-8');

const bootstrapRouteMatch = apiJsContent.match(/router\.get\('\/bootstrap',[\s\S]*?^\}\);/m);
const returnsFallbackOnLag = bootstrapRouteMatch ? bootstrapRouteMatch[0].includes("buildFallbackPayload()") : false;

assert(
  !returnsFallbackOnLag,
  '/api/bootstrap must NOT return static seed fallback JSON when DB connection is pending/offline',
  '/api/bootstrap returns static seed default JSON with HTTP 200, which corrupts client localStorage cache.'
);

// ----------------------------------------------------
// TEST GROUP 3: CLOUDINARY ASSET CACHE BUSTING VERSIONING
// ----------------------------------------------------
console.log('\n🖼️ Test Group 3: Cloudinary Asset URL Cache Busting Versioning');

const imageOptPath = path.resolve('src/utils/imageOptimizer.js');
const imageOptContent = fs.readFileSync(imageOptPath, 'utf-8');

const hasVersionTagSupport = imageOptContent.includes('v=') || imageOptContent.includes('version') || imageOptContent.includes('updatedAt');

assert(
  hasVersionTagSupport,
  'imageOptimizer.js must support timestamp versioning parameters (?v=timestamp)',
  'imageOptimizer.js lacks asset version query support, causing browser disk HTTP cache to serve old images.'
);

// ----------------------------------------------------
// TEST GROUP 4: MAINTENANCE MODE CACHE INVALIDATION
// ----------------------------------------------------
console.log('\n🔒 Test Group 4: Maintenance Mode Invalidation');

const maintenancePath = path.resolve('server/middleware/maintenance.js');
const maintenanceContent = fs.readFileSync(maintenancePath, 'utf-8');

const hasLongTtlCache = maintenanceContent.includes('30 * 1000');

assert(
  !hasLongTtlCache,
  'maintenance.js must not retain a 30-second in-memory process cache across serverless requests',
  'maintenance.js uses a 30s in-memory variable cache, serving stale maintenance status across serverless instances.'
);

// ----------------------------------------------------
// TEST SUMMARY
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`📊 TEST RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('====================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
