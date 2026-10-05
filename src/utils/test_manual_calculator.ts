/**
 * Automated Test Suite for Update 1: Manual Scientific Calculator (نظام الإدخال اليدوي)
 * Based on PDF specifications (pages 3, 13, 14, 15, 55, 64)
 */

import {
  computeManualListCalculation,
  computeManualAMSSeriesCalculation,
} from './statisticalEngine';

console.log('====================================================');
console.log('STARTING MANUAL SCIENTIFIC CALCULATOR ACCEPTANCE TESTS');
console.log('====================================================');

let allPassed = true;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`, details || '');
    allPassed = false;
  }
}

// ----------------------------------------------------
// TEST 1: Rx1day from list: 10, 25, 4, 36, 18
// PDF Page 15 & Page 64: "Input: 10, 25, 4, 36, 18 -> Expected Rx1day: 36 mm"
// ----------------------------------------------------
const inputList1 = [10, 25, 4, 36, 18];
const res1 = computeManualListCalculation(inputList1, 'Rx1day');

assert(res1.result === 36, 'Test 1.1: Rx1day value equals 36 mm', { expected: 36, actual: res1.result });
assert(res1.unit === 'مم', 'Test 1.2: Rx1day unit is mm', { unit: res1.unit });
assert(res1.source === 'Manual User Input / Source: User Provided', 'Test 1.3: Source is strictly Manual User Input', { source: res1.source });
assert(!res1.source.includes('NOAA'), 'Test 1.4: Source does NOT reference NOAA');
assert(res1.formula.includes('max'), 'Test 1.5: Formula includes max function');

// ----------------------------------------------------
// TEST 2: Rx3day from list: 1, 5, 8, 2, 10
// PDF Page 15 & Page 64: "Input: 1, 5, 8, 2, 10 -> Windows: 14, 15, 20 -> Expected Rx3day: 20 mm"
// ----------------------------------------------------
const inputList2 = [1, 5, 8, 2, 10];
const res2 = computeManualListCalculation(inputList2, 'Rx3day');

assert(res2.result === 20, 'Test 2.1: Rx3day value equals 20 mm', { expected: 20, actual: res2.result });
assert(res2.windows !== undefined && res2.windows.length === 3, 'Test 2.2: Generates exactly 3 rolling windows', {
  count: res2.windows?.length,
});

if (res2.windows && res2.windows.length === 3) {
  assert(res2.windows[0].sum === 14, 'Test 2.3: Window 1 (1+5+8) = 14', { sum: res2.windows[0].sum });
  assert(res2.windows[1].sum === 15, 'Test 2.4: Window 2 (5+8+2) = 15', { sum: res2.windows[1].sum });
  assert(res2.windows[2].sum === 20, 'Test 2.5: Window 3 (8+2+10) = 20', { sum: res2.windows[2].sum });
  assert(res2.windows[2].isMax === true, 'Test 2.6: Window 3 is identified as maximal window');
}

// ----------------------------------------------------
// TEST 3: Rx5day from list: 1, 2, 3, 4, 5, 6
// Consecutive 5-element sliding window
// ----------------------------------------------------
const inputList3 = [1, 2, 3, 4, 5, 6];
const res3 = computeManualListCalculation(inputList3, 'Rx5day');
assert(res3.result === 20, 'Test 3.1: Rx5day (2+3+4+5+6) = 20 mm', { expected: 20, actual: res3.result });
assert(res3.windows?.length === 2, 'Test 3.2: 2 windows for 6 items with window size 5');

// ----------------------------------------------------
// TEST 4: Basic Descriptive Statistics
// ----------------------------------------------------
const statsRes = computeManualListCalculation(inputList1, 'BasicStats');
assert(statsRes.stats?.count === 5, 'Test 4.1: Count = 5');
assert(statsRes.stats?.sum === 93, 'Test 4.2: Sum = 93');
assert(statsRes.stats?.mean === 18.6, 'Test 4.3: Mean = 18.6');
assert(statsRes.stats?.median === 18, 'Test 4.4: Median = 18');
assert(statsRes.stats?.min === 4, 'Test 4.5: Min = 4');
assert(statsRes.stats?.max === 36, 'Test 4.6: Max = 36');

// ----------------------------------------------------
// TEST 5: Manual AMS Series Calculation
// PDF Page 13 & 55: AMS: 2010=32.4, 2011=45.1, 2012=28.0...
// ----------------------------------------------------
const manualAmsInput = [
  { year: 2010, annual_max_mm: 32.4 },
  { year: 2011, annual_max_mm: 45.1 },
  { year: 2012, annual_max_mm: 28.0 },
  { year: 2013, annual_max_mm: 52.0 },
  { year: 2014, annual_max_mm: 39.5 },
  { year: 2015, annual_max_mm: 67.2 },
  { year: 2016, annual_max_mm: 21.0 },
];

const amsRes = computeManualAMSSeriesCalculation(manualAmsInput, 42);
assert(amsRes.n_years === 7, 'Test 5.1: Correct n_years count = 7');
assert(amsRes.gev.mu > 0 && amsRes.gumbel.mu > 0, 'Test 5.2: GEV & Gumbel fitted parameters successfully');
assert(amsRes.returnLevels.length === 6, 'Test 5.3: Return levels computed for 6 standard periods (2, 5, 10, 25, 50, 100)');
assert(amsRes.warnings.length > 0, 'Test 5.4: Generates limited sample warning when n < 10 (Critical / Exploratory warning)');
assert(amsRes.source === 'Manual User Input / Source: User Provided', 'Test 5.5: AMS Source labeled as User Provided');

console.log('====================================================');
if (allPassed) {
  console.log('ALL MANUAL SCIENTIFIC CALCULATOR ACCEPTANCE TESTS PASSED!');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('SOME ACCEPTANCE TESTS FAILED!');
  console.log('====================================================');
  process.exit(1);
}
