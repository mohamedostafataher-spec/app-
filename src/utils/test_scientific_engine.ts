import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import {
  reconstructDailyCalendar,
  computeDataQuality,
  computeExtremeIndices,
  buildAnnualMaximumSeries,
  fitGEVLMoments,
  fitGumbelLMoments,
  computeGoodnessOfFit,
  computeReturnLevelsWithBootstrap,
  analyzeStormEvent,
  generateStepByStepSubstitution,
} from './statisticalEngine';
import { DailyRecord } from '../types';

async function runAcceptanceTests() {
  console.log('====================================================');
  console.log('STARTING SCIENTIFIC ACCEPTANCE TEST SUITE');
  console.log('====================================================\n');

  // Load alexandria_noaa_real_test.csv
  const csvPath = path.resolve('./src/data/alexandria_noaa_real_test.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
  
  const records: DailyRecord[] = parsed.data.map((r: any) => ({
    date: r.date,
    station_id: r.station_id,
    station_name: r.station_name,
    governorate: r.governorate,
    latitude: parseFloat(r.latitude),
    longitude: parseFloat(r.longitude),
    rainfall_mm: parseFloat(r.rainfall_mm),
    quality_flag: r.quality_flag,
    source: r.source,
  }));

  console.log(`[TEST 1] Loaded records count: ${records.length} (Expected: 10476)`);
  if (records.length !== 10476) throw new Error(`Record count mismatch: got ${records.length}`);

  // Test 1: Calendar Reconstruction
  const cal = reconstructDailyCalendar(records);
  console.log(`[TEST 2] Calendar Span Days: ${cal.calendarSpanDays} (Expected: 24266)`);
  console.log(`[TEST 2] Start Date: ${cal.startDate} (Expected: 1957-01-07)`);
  console.log(`[TEST 2] End Date: ${cal.endDate} (Expected: 2023-06-15)`);
  console.log(`[TEST 2] Coverage Percentage: ${cal.coveragePercentage}% (Expected: ~43.17%)`);
  console.log(`[TEST 2] Longest Gap Days: ${cal.longestGapDays} (Expected: >2000 days)`);
  console.log(`[TEST 2] Quality Status: ${cal.qualityStatus} (Expected: Needs Review or Not Suitable)`);

  if (cal.startDate !== '1957-01-07') throw new Error('Start date mismatch');
  if (cal.endDate !== '2023-06-15') throw new Error('End date mismatch');
  if (cal.calendarSpanDays !== 24266) throw new Error('Calendar span mismatch');
  if (Math.abs(cal.coveragePercentage - 43.17) > 0.5) throw new Error('Coverage percentage mismatch');
  if (cal.longestGapDays < 2000) throw new Error('Longest gap should be >2000 days');
  if (cal.qualityStatus === 'Good') throw new Error('Quality should NOT be Good on 43% coverage with gaps');

  // Test 2: Data Quality & Annual Completeness
  const qc = computeDataQuality(records, 90);
  console.log(`\n[TEST 3] QC Total Rows: ${qc.total_rows}`);
  console.log(`[TEST 3] QC Total Missing Calendar Days: ${qc.total_missing} (Expected: ~13790)`);
  console.log(`[TEST 3] Total Years With Data: ${qc.annual_completeness.length} (Expected: 61)`);

  const eligible90 = qc.annual_completeness.filter(y => y.eligible_for_ams);
  console.log(`[TEST 3] Years with Completeness >= 90%: ${eligible90.length} (Expected: 19)`);
  
  const qc80 = computeDataQuality(records, 80);
  const eligible80 = qc80.annual_completeness.filter(y => y.eligible_for_ams);
  console.log(`[TEST 3] Years with Completeness >= 80%: ${eligible80.length} (Expected: 21)`);

  const y1957 = qc.annual_completeness.find(y => y.year === 1957);
  console.log(`[TEST 3] Year 1957 Completeness: ${y1957?.completeness_percentage}% (Eligible at 90%: ${y1957?.eligible_for_ams})`);
  const y1958 = qc.annual_completeness.find(y => y.year === 1958);
  console.log(`[TEST 3] Year 1958 Completeness: ${y1958?.completeness_percentage}% (Eligible at 90%: ${y1958?.eligible_for_ams})`);
  const y2023 = qc.annual_completeness.find(y => y.year === 2023);
  console.log(`[TEST 3] Year 2023 Completeness: ${y2023?.completeness_percentage}% (Eligible at 90%: ${y2023?.eligible_for_ams})`);

  if (eligible90.length !== 19) throw new Error(`Expected exactly 19 eligible years at 90%, got ${eligible90.length}`);
  if (eligible80.length !== 21) throw new Error(`Expected exactly 21 eligible years at 80%, got ${eligible80.length}`);
  if (y1957?.eligible_for_ams !== false) throw new Error('1957 should be excluded at 90%');
  if (y1958?.eligible_for_ams !== true) throw new Error('1958 should be eligible');
  if (y2023?.eligible_for_ams !== false) throw new Error('2023 should be excluded');

  // Test 3: Extreme Indices & Consecutive Calendar Window
  const indices = computeExtremeIndices(records, 90);
  const rx3_1957 = indices.rx3day.find(i => i.year === 1957);
  console.log(`\n[TEST 4] 1957 Rx3day value: ${rx3_1957?.value_mm} mm (Expected: 77.0 mm)`);
  console.log(`[TEST 4] 1957 Rx3day window: ${rx3_1957?.start_date} to ${rx3_1957?.end_date}`);
  if (rx3_1957?.value_mm !== 77) {
    throw new Error(`Rx3day for 1957 should be 77.0 mm, got ${rx3_1957?.value_mm}`);
  }

  // Test 4: Storm Daniel Analysis
  const storm = analyzeStormEvent(records, 'عاصفة دانيال', '2023-09-08', '2023-09-12');
  console.log(`\n[TEST 5] Storm Daniel status: ${storm.status} (Expected: not_available)`);
  console.log(`[TEST 5] Storm Daniel rainfall: ${storm.total_event_rainfall_mm} (Expected: null)`);
  console.log(`[TEST 5] Storm Daniel warning: ${storm.warning}`);
  if (storm.status !== 'not_available' || storm.total_event_rainfall_mm !== null) {
    throw new Error('Storm Daniel should return not_available with null rainfall when outside dataset range');
  }

  // Test 5: AMS & Model Fitting (GEV and Gumbel)
  const ams = buildAnnualMaximumSeries(indices.rx1day);
  const eligibleAMS = ams.filter(a => a.eligible_for_model).map(a => a.maximum_value_mm);
  console.log(`\n[TEST 6] Eligible AMS count for model fitting: ${eligibleAMS.length} (Expected: 19)`);
  if (eligibleAMS.length !== 19) throw new Error(`Expected 19 AMS observations, got ${eligibleAMS.length}`);

  const gev = fitGEVLMoments(eligibleAMS, 'EGM00062318', 'Rx1day');
  const gumbel = fitGumbelLMoments(eligibleAMS, 'EGM00062318', 'Rx1day');
  console.log(`[TEST 6] GEV: mu=${gev.mu}, sigma=${gev.sigma}, xi=${gev.xi}, AIC=${gev.aic}, BIC=${gev.bic}`);
  console.log(`[TEST 6] Gumbel: mu=${gumbel.mu}, sigma=${gumbel.sigma}, xi=${gumbel.xi}, AIC=${gumbel.aic}, BIC=${gumbel.bic}`);
  
  if (gev.sigma <= 0 || gumbel.sigma <= 0) throw new Error('Scale parameter sigma must be positive');
  if (gumbel.xi !== 0) throw new Error('Gumbel xi must be 0');

  // Test 6: GoF
  const gofGev = computeGoodnessOfFit(eligibleAMS, gev);
  const gofGumbel = computeGoodnessOfFit(eligibleAMS, gumbel);
  console.log(`\n[TEST 7] GEV GoF: KS=${gofGev.ks_statistic}, KS p=${gofGev.ks_p_value}, AD=${gofGev.ad_statistic}, AD Passed=${gofGev.ad_passed}`);
  console.log(`[TEST 7] Gumbel GoF: KS=${gofGumbel.ks_statistic}, KS p=${gofGumbel.ks_p_value}, AD=${gofGumbel.ad_statistic}, AD Passed=${gofGumbel.ad_passed}`);

  // Test 7: Return Levels & Bootstrap Reproducibility
  const rl1 = computeReturnLevelsWithBootstrap(eligibleAMS, gumbel, [2, 5, 10, 25, 50, 100], 500, 95, 42);
  const rl2 = computeReturnLevelsWithBootstrap(eligibleAMS, gumbel, [2, 5, 10, 25, 50, 100], 500, 95, 42);
  const rl3 = computeReturnLevelsWithBootstrap(eligibleAMS, gumbel, [2, 5, 10, 25, 50, 100], 500, 95, 99);

  console.log(`\n[TEST 8] Return Level T=100 (seed 42 run 1): ${rl1.find(r => r.return_period_years === 100)?.return_level_mm} mm [${rl1.find(r => r.return_period_years === 100)?.lower_ci_mm} - ${rl1.find(r => r.return_period_years === 100)?.upper_ci_mm}]`);
  console.log(`[TEST 8] Return Level T=100 (seed 42 run 2): ${rl2.find(r => r.return_period_years === 100)?.return_level_mm} mm [${rl2.find(r => r.return_period_years === 100)?.lower_ci_mm} - ${rl2.find(r => r.return_period_years === 100)?.upper_ci_mm}]`);
  console.log(`[TEST 8] Return Level T=100 (seed 99 run 3): ${rl3.find(r => r.return_period_years === 100)?.return_level_mm} mm [${rl3.find(r => r.return_period_years === 100)?.lower_ci_mm} - ${rl3.find(r => r.return_period_years === 100)?.upper_ci_mm}]`);

  // Verify monotonicity
  for (let i = 1; i < rl1.length; i++) {
    if (rl1[i].return_level_mm <= rl1[i - 1].return_level_mm) {
      throw new Error(`Monotonicity failed between T=${rl1[i-1].return_period_years} and T=${rl1[i].return_period_years}`);
    }
  }

  // Verify seed 42 is 100% identical across runs
  if (rl1[5].lower_ci_mm !== rl2[5].lower_ci_mm || rl1[5].upper_ci_mm !== rl2[5].upper_ci_mm) {
    throw new Error('Seed 42 reproducibility failed');
  }

  // Verify extrapolation warning for T=100 with n=19
  const t100 = rl1.find(r => r.return_period_years === 100);
  console.log(`[TEST 8] T=100 Extrapolation warning: ${t100?.extrapolation_warning} (${t100?.extrapolation_message})`);
  if (!t100?.extrapolation_warning) throw new Error('T=100 should have extrapolation warning when n=19');

  // Test 8: Step-by-Step Numerical Substitution
  const stepSub = generateStepByStepSubstitution('return_level', {
    model: 'Gumbel',
    mu: gumbel.mu,
    sigma: gumbel.sigma,
    xi: 0,
    T: 100
  });
  console.log(`\n[TEST 9] Step-by-step title: ${stepSub.title_ar}`);
  console.log(`[TEST 9] Formula: ${stepSub.general_formula}`);
  console.log(`[TEST 9] LaTeX: ${stepSub.latex_formula}`);
  console.log(`[TEST 9] Substitution preview:\n${stepSub.numerical_substitution}`);

  console.log('\n====================================================');
  console.log('ALL SCIENTIFIC ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runAcceptanceTests().catch(err => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
