import assert from 'assert';
import { translations } from '../../src/i18n/translations';

function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function runI18nTests() {
  console.log('--- Running i18n Translation Parity Tests ---');

  const supportedLanguages = Object.keys(translations);
  console.log(`Supported languages found: ${supportedLanguages.join(', ')}`);
  assert.deepStrictEqual(supportedLanguages.sort(), ['en', 'es', 'fr'].sort());

  const enKeys = getAllKeys(translations.en);
  const frKeys = getAllKeys(translations.fr);
  const esKeys = getAllKeys(translations.es);

  console.log(`Key counts -> EN: ${enKeys.length}, FR: ${frKeys.length}, ES: ${esKeys.length}`);

  let missingFr = 0;
  let missingEs = 0;
  let emptyCount = 0;

  for (const key of enKeys) {
    const frVal = getValueByPath(translations.fr, key);
    const esVal = getValueByPath(translations.es, key);

    if (frVal === undefined) {
      console.error(`Missing FR key: ${key}`);
      missingFr++;
    } else if (typeof frVal === 'string' && frVal.trim() === '') {
      console.error(`Empty FR key: ${key}`);
      emptyCount++;
    }

    if (esVal === undefined) {
      console.error(`Missing ES key: ${key}`);
      missingEs++;
    } else if (typeof esVal === 'string' && esVal.trim() === '') {
      console.error(`Empty ES key: ${key}`);
      emptyCount++;
    }
  }

  // Also check if FR or ES have extra keys missing in EN
  for (const key of frKeys) {
    const enVal = getValueByPath(translations.en, key);
    if (enVal === undefined) {
      console.error(`FR has extra key missing in EN: ${key}`);
      missingFr++;
    }
  }

  for (const key of esKeys) {
    const enVal = getValueByPath(translations.en, key);
    if (enVal === undefined) {
      console.error(`ES has extra key missing in EN: ${key}`);
      missingEs++;
    }
  }

  assert.strictEqual(missingFr, 0, `FR has ${missingFr} missing or extra keys`);
  assert.strictEqual(missingEs, 0, `ES has ${missingEs} missing or extra keys`);
  assert.strictEqual(emptyCount, 0, `Found ${emptyCount} empty translation values`);

  console.log('✓ All i18n keys are 100% matched across EN, FR, ES with 0 missing keys.');
}

runI18nTests();
