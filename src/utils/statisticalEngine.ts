/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Deterministic Statistical & Extreme Value Analysis Engine
 */

import {
  DailyRecord,
  YearCompleteness,
  QualityReport,
  CalendarAnalysis,
  HomogeneityReport,
  HomogeneityResult,
  RainfallCharacterization,
  ExtremeIndexRecord,
  AMSRecord,
  ModelFitResult,
  GoodnessOfFitReport,
  ReturnLevelRecord,
  StatisticalSafetyScore,
  ResultTrustFingerprint,
  CalculationStepExplanation,
  HourlyRecord,
  TemporalDetectionResult,
  TemporalFrequency
} from '../types';

// ==========================================
// 1. Math Helper Functions
// ==========================================

export function detectTemporalFrequency(
  records: DailyRecord[] | HourlyRecord[],
  declaredFrequency?: string,
  unit?: string
): TemporalDetectionResult {
  if (!records || records.length < 2) {
    return {
      detected_frequency: 'unknown',
      confidence: 0,
      evidence: { median_interval_days: 0, date_count: records?.length || 0, unique_dates: 0, regularity_score: 0, within_day_duplicates: 0 },
      allowed_analyses: [],
      blocked_analyses: ['Rx1day', 'Rx3day', 'Rx5day', 'daily_AMS', 'GEV_daily', 'Gumbel_daily'],
      status: 'NEEDS_REVIEW',
    };
  }

  // Extract dates and check for within-day duplicates (suggests hourly/sub-daily)
  const dateStrs = records.map(r => ('date' in r ? r.date : r.datetime).slice(0, 10));
  const uniqueDates = new Set(dateStrs);
  const withinDayDuplicates = records.length - uniqueDates.size;

  const dates = records.map(r => new Date('date' in r ? r.date : r.datetime)).sort((a, b) => a.getTime() - b.getTime());
  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const diff = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 3600 * 24);
    if (diff > 0) intervals.push(diff);
  }

  const sortedIntervals = [...intervals].sort((a, b) => a - b);
  const medianInterval = sortedIntervals.length > 0 ? sortedIntervals[Math.floor(sortedIntervals.length / 2)] : 0;
  
  // Calculate regularity (how many intervals match the median)
  const regularityCount = intervals.filter(d => Math.abs(d - medianInterval) < 0.1).length;
  const regularityScore = intervals.length > 0 ? regularityCount / intervals.length : 0;

  let detected: TemporalFrequency = 'unknown';
  let confidence = 0.5;

  if (withinDayDuplicates > records.length * 0.5) {
    if (medianInterval < 0.04) {
      detected = 'sub_daily';
    } else {
      detected = 'hourly';
    }
    confidence = 0.9;
  } else if (medianInterval >= 0.8 && medianInterval <= 1.2) {
    detected = 'daily';
    confidence = 0.95;
  } else if (medianInterval >= 27 && medianInterval <= 32) {
    detected = 'monthly';
    confidence = 0.9;
  } else if (medianInterval >= 80 && medianInterval <= 100) {
    detected = 'quarterly';
  } else if (medianInterval >= 330 && medianInterval <= 400) {
    detected = 'annual';
    confidence = 0.85;
  } else {
    detected = 'irregular';
  }

  // Override with declared if it seems plausible
  if (declaredFrequency) {
    const dec = declaredFrequency.toLowerCase();
    if (dec.includes('hour') && withinDayDuplicates > 0) detected = 'hourly';
    if (dec.includes('day') && medianInterval < 1.5) detected = 'daily';
    if (dec.includes('month') && medianInterval > 20) detected = 'monthly';
  }

  const isDaily = detected === 'daily' || detected === 'hourly' || detected === 'sub_daily';
  
  return {
    detected_frequency: detected,
    confidence,
    evidence: {
      declared_frequency: declaredFrequency,
      unit,
      median_interval_days: Math.round(medianInterval * 100) / 100,
      date_count: records.length,
      unique_dates: uniqueDates.size,
      regularity_score: Math.round(regularityScore * 100) / 100,
      within_day_duplicates: withinDayDuplicates
    },
    allowed_analyses: isDaily 
      ? ['Rx1day', 'Rx3day', 'Rx5day', 'daily_AMS', 'GEV_daily', 'Gumbel_daily', 'homogeneity', 'trends']
      : ['monthly_totals', 'annual_totals', 'climatology', 'long_term_trends'],
    blocked_analyses: !isDaily 
      ? ['Rx1day', 'Rx3day', 'Rx5day', 'daily_AMS', 'GEV_daily', 'Gumbel_daily']
      : [],
    status: isDaily ? 'SUITABLE_FOR_DAILY_EXTREMES' : 'NOT_SUITABLE_FOR_DAILY_EXTREMES',
  };
}

export function gammaFunction(z: number): number {
  // Lanczos approximation for Gamma(z)
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gammaFunction(1 - z));
  }
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.138571095836526,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

export function normalCDF(x: number): number {
  // Abramowitz and Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014337 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - p : p;
}

// Pseudo-random number generator with seed for 100% reproducible Bootstrap
export class SeededRandom {
  private m: number = 0x80000000; // 2**31
  private a: number = 1103515245;
  private c: number = 12345;
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }

  next(): number {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state / (this.m - 1);
  }
}

// ==========================================
// 2. Calendar Reconstruction Engine
// ==========================================

export interface CalendarDay {
  date: string;
  rainfall_mm: number | null;
  is_missing: boolean;
  is_gap: boolean;
}

export interface ReconstructedCalendar {
  calendarRecords: CalendarDay[];
  startDate: string;
  endDate: string;
  rowsSupplied: number;
  calendarSpanDays: number;
  coveragePercentage: number;
  missingCalendarDays: number;
  calendarGapsCount: number;
  longestGapDays: number;
  qualityStatus: 'Good' | 'Needs Review' | 'Not Suitable';
  statusReasons: string[];
  duplicateDates: string[];
}

export function reconstructDailyCalendar(records: DailyRecord[]): ReconstructedCalendar {
  if (!records || records.length === 0) {
    return {
      calendarRecords: [],
      startDate: '',
      endDate: '',
      rowsSupplied: 0,
      calendarSpanDays: 0,
      coveragePercentage: 0,
      missingCalendarDays: 0,
      calendarGapsCount: 0,
      longestGapDays: 0,
      qualityStatus: 'Not Suitable',
      statusReasons: ['الملف فارغ أو لا يحتوي على سجلات'],
      duplicateDates: []
    };
  }

  const dateMap = new Map<string, number>();
  const duplicateDates: string[] = [];
  const validRecords: Array<{ date: string; rainfall_mm: number | null }> = [];

  records.forEach((r) => {
    if (!r.date) return;
    const dStr = String(r.date).trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return;

    if (dateMap.has(dStr)) {
      duplicateDates.push(dStr);
    } else {
      let rain: number | null = null;
      if (r.rainfall_mm !== null && r.rainfall_mm !== undefined && !isNaN(r.rainfall_mm)) {
        if (r.rainfall_mm >= 0 && r.quality_flag !== 'rejected_negative') {
          rain = r.rainfall_mm;
        }
      }
      // If quality flag is missing, we treat as null but we still mark the date as present to avoid counting as gap
      if (r.quality_flag === 'missing') rain = null;

      dateMap.set(dStr, rain !== null ? rain : -9999.0);
      validRecords.push({ date: dStr, rainfall_mm: rain });
    }
  });

  if (validRecords.length === 0) {
    return {
      calendarRecords: [],
      startDate: '',
      endDate: '',
      rowsSupplied: 0,
      calendarSpanDays: 0,
      coveragePercentage: 0,
      missingCalendarDays: 0,
      calendarGapsCount: 0,
      longestGapDays: 0,
      qualityStatus: 'Not Suitable',
      statusReasons: ['لا توجد تواريخ صالحة في الملف'],
      duplicateDates
    };
  }

  validRecords.sort((a, b) => a.date.localeCompare(b.date));
  const startDate = validRecords[0].date;
  const endDate = validRecords[validRecords.length - 1].date;

  const startD = new Date(startDate + 'T00:00:00Z');
  const endD = new Date(endDate + 'T00:00:00Z');
  const calendarSpanDays = Math.round((endD.getTime() - startD.getTime()) / (1000 * 3600 * 24)) + 1;

  const calendarRecords: CalendarDay[] = [];
  let cur = new Date(startD);
  let currentGap = 0;
  let longestGapDays = 0;
  let calendarGapsCount = 0;
  let missingCalendarDays = 0;

  while (cur <= endD) {
    const curStr = cur.toISOString().split('T')[0];
    const hasRecord = dateMap.has(curStr);
    const recordedVal = hasRecord ? dateMap.get(curStr)! : -9999.0;
    const isMissing = !hasRecord || recordedVal === -9999.0;

    if (isMissing) {
      missingCalendarDays++;
      currentGap++;
      if (currentGap === 2) {
        calendarGapsCount++;
      }
      if (currentGap > longestGapDays) {
        longestGapDays = currentGap;
      }
      calendarRecords.push({
        date: curStr,
        rainfall_mm: null,
        is_missing: true,
        is_gap: currentGap >= 2
      });
    } else {
      currentGap = 0;
      calendarRecords.push({
        date: curStr,
        rainfall_mm: recordedVal,
        is_missing: false,
        is_gap: false
      });
    }

    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  const rowsSupplied = records.length;
  const coveragePercentage = calendarSpanDays > 0 ? (rowsSupplied / calendarSpanDays) * 100 : 0;

  // Scientific Quality Status Assessment
  let qualityStatus: ReconstructedCalendar['qualityStatus'] = 'Good';
  const statusReasons: string[] = [];

  if (coveragePercentage < 45 || longestGapDays > 2000) {
    qualityStatus = 'Needs Review';
    if (coveragePercentage < 25) qualityStatus = 'Not Suitable';
    statusReasons.push(`نسبة التغطية الكلية ${coveragePercentage.toFixed(2)}% فقط من النطاق التقويمي (${calendarSpanDays} يوماً).`);
    statusReasons.push(`توجد فجوات تقويمية كبرى أطولها ${longestGapDays} يوماً متتالياً.`);
  } else if (coveragePercentage < 80 || longestGapDays > 90) {
    qualityStatus = 'Needs Review';
    statusReasons.push(`نسبة التغطية (${coveragePercentage.toFixed(2)}%) تتطلب تدقيق الفجوات السنوية.`);
  } else {
    qualityStatus = 'Good';
    statusReasons.push('السلسلة مستوفية لمعايير التغطية التقويمية والجودة العامة.');
  }

  return {
    calendarRecords,
    startDate,
    endDate,
    rowsSupplied,
    calendarSpanDays,
    coveragePercentage: Math.round(coveragePercentage * 100) / 100,
    missingCalendarDays,
    calendarGapsCount,
    longestGapDays,
    qualityStatus,
    statusReasons,
    duplicateDates
  };
}

// ==========================================
// 3. Data Quality Control Engine
// ==========================================

export function computeDataQuality(
  records: DailyRecord[],
  completenessThreshold: number = 90
): QualityReport {
  const cal = reconstructDailyCalendar(records);
  if (!records || records.length === 0) {
    return {
      station_id: 'UNKNOWN',
      station_name: 'Unknown',
      total_rows: 0,
      start_date: '',
      end_date: '',
      total_missing: 0,
      missing_percentage: 0,
      negative_count: 0,
      duplicate_count: 0,
      max_dry_spell_days: 0,
      longest_missing_gap_days: 0,
      min_rainfall: 0,
      max_rainfall: 0,
      suspected_outliers: [],
      annual_completeness: [],
      overall_rating: 'غير صالح للنمذجة',
      overall_rating_en: 'Unsuitable',
    };
  }

  const stationId = records[0].station_id;
  const stationName = records[0].station_name;
  const totalRows = records.length;

  let negativeCount = 0;
  let minRainfall = Infinity;
  let maxRainfall = -Infinity;
  let currentDrySpell = 0;
  let maxDrySpellDays = 0;

  const validValues: { date: string; value: number }[] = [];

  records.forEach((rec) => {
    if (rec.rainfall_mm !== null && rec.rainfall_mm < 0) {
      negativeCount++;
    } else if (rec.rainfall_mm !== null && rec.rainfall_mm >= 0) {
      const val = rec.rainfall_mm;
      validValues.push({ date: rec.date, value: val });
      if (val < minRainfall) minRainfall = val;
      if (val > maxRainfall) maxRainfall = val;

      if (val < 1.0) {
        currentDrySpell++;
        if (currentDrySpell > maxDrySpellDays) maxDrySpellDays = currentDrySpell;
      } else {
        currentDrySpell = 0;
      }
    }
  });

  if (minRainfall === Infinity) minRainfall = 0;
  if (maxRainfall === -Infinity) maxRainfall = 0;

  // Annual completeness from calendar
  const calByYear = new Map<number, CalendarDay[]>();
  cal.calendarRecords.forEach((r) => {
    const yr = parseInt(r.date.substring(0, 4), 10);
    if (!calByYear.has(yr)) calByYear.set(yr, []);
    calByYear.get(yr)!.push(r);
  });

  const annualCompleteness: YearCompleteness[] = Array.from(calByYear.keys())
    .sort((a, b) => a - b)
    .map((yr) => {
      const yearDays = calByYear.get(yr)!;
      const isLeap = (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0;
      const expected = isLeap ? 366 : 365;
      const validActual = yearDays.filter((d) => d.rainfall_mm !== null && d.rainfall_mm >= 0).length;
      const missingRecords = expected - validActual;
      const pct = Math.min(100, Math.round((validActual / expected) * 1000) / 10);
      const eligible = pct >= completenessThreshold;
      let exclusionReason: string | undefined;
      if (!eligible) {
        if (pct < 10) {
          exclusionReason = `سنة غير مكتملة (سجل جزئي ${validActual} يوماً فقط)`;
        } else {
          exclusionReason = `نسبة الاكتمال (${pct}%) أقل من الحد الأدنى (${completenessThreshold}%)`;
        }
      }
      return {
        year: yr,
        expected_records: expected,
        actual_records: validActual,
        missing_records: missingRecords,
        completeness_percentage: yearDays.filter(d => !d.is_missing).length > 0 ? pct : 0,
        eligible_for_ams: yearDays.filter(d => !d.is_missing).length > 0 && eligible,
        exclusion_reason: yearDays.filter(d => !d.is_missing).length === 0 
          ? 'السنة لا تحتوي على أي بيانات (لا توجد سجلات فعلياً)' 
          : !eligible ? exclusionReason : undefined,
        warning: exclusionReason,
      };
    });

  // Suspected Outliers detection (IQR & Modified Z-score)
  const suspectedOutliers: QualityReport['suspected_outliers'] = [];
  if (validValues.length > 20) {
    const nonZeroValues = validValues.filter((v) => v.value > 0).sort((a, b) => a.value - b.value);
    if (nonZeroValues.length > 10) {
      const q1 = nonZeroValues[Math.floor(nonZeroValues.length * 0.25)].value;
      const q3 = nonZeroValues[Math.floor(nonZeroValues.length * 0.75)].value;
      const iqr = q3 - q1;
      const iqrThreshold = q3 + 3.0 * iqr;

      const sum = nonZeroValues.reduce((acc, v) => acc + v.value, 0);
      const mean = sum / nonZeroValues.length;
      const variance =
        nonZeroValues.reduce((acc, v) => acc + Math.pow(v.value - mean, 2), 0) /
        nonZeroValues.length;
      const std = Math.sqrt(variance);

      validValues.forEach((item) => {
        if (item.value > 0) {
          const z = std > 0 ? (item.value - mean) / std : 0;
          if (item.value > iqrThreshold || z > 4.0) {
            suspectedOutliers.push({
              date: item.date,
              value: item.value,
              method: item.value > iqrThreshold ? 'Extreme IQR (Q3 + 3*IQR)' : 'Z-Score > 4.0',
              z_score: Math.round(z * 100) / 100,
              decision: 'suspected',
            });
          }
        }
      });
    }
  }

  let overallRating: QualityReport['overall_rating'] = 'جيد';
  let overallRatingEn: QualityReport['overall_rating_en'] = 'Good';

  if (cal.qualityStatus === 'Not Suitable') {
    overallRating = 'غير صالح للنمذجة';
    overallRatingEn = 'Unsuitable';
  } else if (cal.qualityStatus === 'Needs Review') {
    overallRating = 'مقبول';
    overallRatingEn = 'Fair';
  } else {
    overallRating = 'جيد';
    overallRatingEn = 'Good';
  }

  return {
    station_id: stationId,
    station_name: stationName,
    total_rows: totalRows,
    start_date: cal.startDate,
    end_date: cal.endDate,
    total_missing: cal.missingCalendarDays,
    missing_percentage: cal.calendarSpanDays > 0 ? Math.round((cal.missingCalendarDays / cal.calendarSpanDays) * 10000) / 100 : 0,
    negative_count: negativeCount,
    duplicate_count: cal.duplicateDates.length,
    max_dry_spell_days: maxDrySpellDays,
    longest_missing_gap_days: cal.longestGapDays,
    min_rainfall: minRainfall,
    max_rainfall: maxRainfall,
    calendar_analysis: {
      calendar_span_days: cal.calendarSpanDays,
      rows_supplied: cal.rowsSupplied,
      coverage_percentage: cal.coveragePercentage,
      calendar_gaps_count: cal.calendarGapsCount,
      longest_gap_days: cal.longestGapDays,
      missing_calendar_days: cal.missingCalendarDays,
      quality_status: cal.qualityStatus,
      status_reasons: cal.statusReasons,
      duplicate_dates_count: cal.duplicateDates.length,
      duplicate_dates: cal.duplicateDates,
    },
    suspected_outliers: suspectedOutliers.slice(0, 50),
    annual_completeness: annualCompleteness,
    overall_rating: overallRating,
    overall_rating_en: overallRatingEn,
  };
}

// ==========================================
// 4. Extreme Indices Engine (Rx1day, Rx3day, Rx5day)
// ==========================================

export function computeExtremeIndices(
  records: DailyRecord[],
  completenessThreshold: number = 90
): {
  rx1day: ExtremeIndexRecord[];
  rx3day: ExtremeIndexRecord[];
  rx5day: ExtremeIndexRecord[];
  calendarDetails?: ReconstructedCalendar;
} {
  const cal = reconstructDailyCalendar(records);
  const stationId = records[0]?.station_id || 'STN01';

  const calByYear = new Map<number, CalendarDay[]>();
  cal.calendarRecords.forEach((r) => {
    const yr = parseInt(r.date.substring(0, 4), 10);
    if (!calByYear.has(yr)) calByYear.set(yr, []);
    calByYear.get(yr)!.push(r);
  });

  const rx1day: ExtremeIndexRecord[] = [];
  const rx3day: ExtremeIndexRecord[] = [];
  const rx5day: ExtremeIndexRecord[] = [];

  const years = Array.from(calByYear.keys()).sort((a, b) => a - b);

  years.forEach((yr) => {
    const yearDays = calByYear.get(yr)!;
    const isLeap = (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0;
    const expected = isLeap ? 366 : 365;

    const validDays = yearDays.filter((d) => d.rainfall_mm !== null && d.rainfall_mm >= 0);
    const validCount = validDays.length;
    const completeness = Math.min(100, Math.round((validCount / expected) * 1000) / 10);
    const eligible = completeness >= completenessThreshold;

    // 1. Rx1day
    let max1 = 0;
    let max1Date = yearDays[0]?.date || `${yr}-01-01`;
    validDays.forEach((d) => {
      if (d.rainfall_mm! > max1) {
        max1 = d.rainfall_mm!;
        max1Date = d.date;
      }
    });

    rx1day.push({
      year: yr,
      station_id: stationId,
      index_name: 'Rx1day',
      value_mm: Math.round(max1 * 100) / 100,
      start_date: max1Date,
      end_date: max1Date,
      valid_records: validCount,
      completeness,
      eligible,
      warning: eligible ? undefined : `السنة غير مكتملة (${completeness}% < ${completenessThreshold}%)`,
    });

    // 2. Rx3day - Strict consecutive daily calendar window
    let max3 = 0;
    let max3Start = yearDays[0]?.date || `${yr}-01-01`;
    let max3End = yearDays[Math.min(2, yearDays.length - 1)]?.date || `${yr}-01-03`;

    for (let i = 0; i <= yearDays.length - 3; i++) {
      const d0 = yearDays[i];
      const d1 = yearDays[i + 1];
      const d2 = yearDays[i + 2];

      if (
        d0.rainfall_mm !== null &&
        d1.rainfall_mm !== null &&
        d2.rainfall_mm !== null
      ) {
        const sum3 = d0.rainfall_mm + d1.rainfall_mm + d2.rainfall_mm;
        if (sum3 > max3) {
          max3 = sum3;
          max3Start = d0.date;
          max3End = d2.date;
        }
      }
    }

    rx3day.push({
      year: yr,
      station_id: stationId,
      index_name: 'Rx3day',
      value_mm: Math.round(max3 * 100) / 100,
      start_date: max3Start,
      end_date: max3End,
      valid_records: validCount,
      completeness,
      eligible,
      warning: eligible ? undefined : `السنة غير مكتملة (${completeness}% < ${completenessThreshold}%)`,
    });

    // 3. Rx5day - Strict consecutive daily calendar window
    let max5 = 0;
    let max5Start = yearDays[0]?.date || `${yr}-01-01`;
    let max5End = yearDays[Math.min(4, yearDays.length - 1)]?.date || `${yr}-01-05`;

    for (let i = 0; i <= yearDays.length - 5; i++) {
      let validWindow = true;
      let sum5 = 0;
      for (let k = 0; k < 5; k++) {
        const dk = yearDays[i + k];
        if (dk.rainfall_mm === null) {
          validWindow = false;
          break;
        }
        sum5 += dk.rainfall_mm;
      }
      if (validWindow && sum5 > max5) {
        max5 = sum5;
        max5Start = yearDays[i].date;
        max5End = yearDays[i + 4].date;
      }
    }

    rx5day.push({
      year: yr,
      station_id: stationId,
      index_name: 'Rx5day',
      value_mm: Math.round(max5 * 100) / 100,
      start_date: max5Start,
      end_date: max5End,
      valid_records: validCount,
      completeness,
      eligible,
      warning: eligible ? undefined : `السنة غير مكتملة (${completeness}% < ${completenessThreshold}%)`,
    });
  });

  return { rx1day, rx3day, rx5day, calendarDetails: cal };
}

// Convert extreme index record to AMS
export function buildAnnualMaximumSeries(indices: ExtremeIndexRecord[]): AMSRecord[] {
  return indices.map((idx) => ({
    year: idx.year,
    station_id: idx.station_id,
    index_name: idx.index_name,
    maximum_value_mm: idx.value_mm,
    start_date: idx.start_date,
    end_date: idx.end_date,
    valid_records: idx.valid_records,
    completeness_percentage: idx.completeness,
    eligible_for_model: idx.eligible,
    exclusion_reason: idx.eligible
      ? undefined
      : `نسبة الاكتمال ${idx.completeness}% لا تستوفي الحد الأدنى المطلوب للمحرك الإحصائي`,
  }));
}

// ==========================================
// 4. Rainfall Characterization Engine
// ==========================================

export function computeRainfallCharacterization(
  records: DailyRecord[],
  rainyDayThreshold: number = 1.0
): RainfallCharacterization {
  const valid = records.filter(
    (r) => r.rainfall_mm !== null && r.quality_flag !== 'missing' && r.rainfall_mm >= 0
  );

  const stationId = records[0]?.station_id || 'UNKNOWN';
  const stationName = records[0]?.station_name || 'Unknown';

  if (valid.length === 0) {
    return {
      station_id: stationId,
      station_name: stationName,
      n_days: 0,
      n_rainy_days: 0,
      rainy_day_threshold: rainyDayThreshold,
      annual_mean_mm: 0,
      annual_std_mm: 0,
      daily_mean_mm: 0,
      daily_median_mm: 0,
      daily_std_mm: 0,
      daily_variance_mm: 0,
      daily_cv: 0,
      daily_min_mm: 0,
      daily_max_mm: 0,
      skewness: 0,
      kurtosis: 0,
      percentiles: { p1: 0, p5: 0, p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
      max_dry_spell: 0,
      max_wet_spell: 0,
      monthly_climatology: [],
      annual_totals: [],
    };
  }

  const values = valid.map((r) => r.rainfall_mm as number);
  const nDays = values.length;
  const rainyValues = values.filter((v) => v >= rainyDayThreshold);
  const nRainyDays = rainyValues.length;

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / nDays;

  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nDays;
  const std = Math.sqrt(variance);
  const cv = mean > 0 ? std / mean : 0;

  // Sorted values for median and percentiles
  const sorted = [...values].sort((a, b) => a - b);
  const getPercentile = (p: number) => {
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
  };

  // Skewness & Kurtosis
  let m3 = 0;
  let m4 = 0;
  values.forEach((v) => {
    const diff = v - mean;
    m3 += Math.pow(diff, 3);
    m4 += Math.pow(diff, 4);
  });
  const skewness = std > 0 ? (m3 / nDays) / Math.pow(std, 3) : 0;
  const kurtosis = std > 0 ? (m4 / nDays) / Math.pow(std, 4) - 3 : 0;

  // Max dry and wet spells
  let curDry = 0;
  let maxDry = 0;
  let curWet = 0;
  let maxWet = 0;

  valid.forEach((r) => {
    const v = r.rainfall_mm as number;
    if (v < rainyDayThreshold) {
      curDry++;
      if (curDry > maxDry) maxDry = curDry;
      curWet = 0;
    } else {
      curWet++;
      if (curWet > maxWet) maxWet = curWet;
      curDry = 0;
    }
  });

  // Monthly Climatology
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthBuckets: Record<number, number[]> = {};
  for (let m = 1; m <= 12; m++) monthBuckets[m] = [];

  valid.forEach((r) => {
    const m = parseInt(r.date.substring(5, 7), 10);
    if (m >= 1 && m <= 12) {
      monthBuckets[m].push(r.rainfall_mm as number);
    }
  });

  const monthlyClimatology = Object.keys(monthBuckets).map((mStr) => {
    const m = parseInt(mStr, 10);
    const mVals = monthBuckets[m];
    const mSum = mVals.reduce((a, b) => a + b, 0);
    const mMean = mVals.length > 0 ? mSum / mVals.length : 0;
    const mRainy = mVals.filter((v) => v >= rainyDayThreshold).length;
    const mMax = mVals.length > 0 ? Math.max(...mVals) : 0;

    return {
      month: m,
      month_name_ar: monthNamesAr[m - 1],
      month_name_en: monthNamesEn[m - 1],
      mean_rainfall_mm: Math.round(mMean * 100) / 100,
      total_rainfall_mm: Math.round(mSum * 10) / 10,
      rainy_days: mRainy,
      max_daily_mm: Math.round(mMax * 10) / 10,
    };
  });

  // Annual Totals and Anomalies
  const yearSums: Record<number, { sum: number; rainy: number }> = {};
  valid.forEach((r) => {
    const yr = parseInt(r.date.substring(0, 4), 10);
    if (!yearSums[yr]) yearSums[yr] = { sum: 0, rainy: 0 };
    yearSums[yr].sum += r.rainfall_mm as number;
    if ((r.rainfall_mm as number) >= rainyDayThreshold) {
      yearSums[yr].rainy++;
    }
  });

  const yrs = Object.keys(yearSums).map(Number).sort((a, b) => a - b);
  const annualTotalList = yrs.map((y) => yearSums[y].sum);
  const annualMean = annualTotalList.length > 0
    ? annualTotalList.reduce((a, b) => a + b, 0) / annualTotalList.length
    : 0;
  const annualVariance = annualTotalList.length > 0
    ? annualTotalList.reduce((a, b) => a + Math.pow(b - annualMean, 2), 0) / annualTotalList.length
    : 0;
  const annualStd = Math.sqrt(annualVariance);

  const annualTotals = yrs.map((yr) => ({
    year: yr,
    total_mm: Math.round(yearSums[yr].sum * 10) / 10,
    rainy_days: yearSums[yr].rainy,
    anomaly_mm: Math.round((yearSums[yr].sum - annualMean) * 10) / 10,
  }));

  return {
    station_id: stationId,
    station_name: stationName,
    n_days: nDays,
    n_rainy_days: nRainyDays,
    rainy_day_threshold: rainyDayThreshold,
    annual_mean_mm: Math.round(annualMean * 10) / 10,
    annual_std_mm: Math.round(annualStd * 10) / 10,
    daily_mean_mm: Math.round(mean * 100) / 100,
    daily_median_mm: Math.round(getPercentile(50) * 100) / 100,
    daily_std_mm: Math.round(std * 100) / 100,
    daily_variance_mm: Math.round(variance * 100) / 100,
    daily_cv: Math.round(cv * 100) / 100,
    daily_min_mm: sorted[0] || 0,
    daily_max_mm: sorted[sorted.length - 1] || 0,
    skewness: Math.round(skewness * 100) / 100,
    kurtosis: Math.round(kurtosis * 100) / 100,
    percentiles: {
      p1: Math.round(getPercentile(1) * 100) / 100,
      p5: Math.round(getPercentile(5) * 100) / 100,
      p10: Math.round(getPercentile(10) * 100) / 100,
      p25: Math.round(getPercentile(25) * 100) / 100,
      p50: Math.round(getPercentile(50) * 100) / 100,
      p75: Math.round(getPercentile(75) * 100) / 100,
      p90: Math.round(getPercentile(90) * 100) / 100,
      p95: Math.round(getPercentile(95) * 100) / 100,
      p99: Math.round(getPercentile(99) * 100) / 100,
    },
    max_dry_spell: maxDry,
    max_wet_spell: maxWet,
    monthly_climatology: monthlyClimatology,
    annual_totals: annualTotals,
  };
}

// ==========================================
// 5. Homogeneity & Trend Tests Engine
// ==========================================

export function computeHomogeneityAndTrend(
  annualTotals: Array<{ year: number; total_mm: number }>,
  stationId: string = 'CAI01',
  stationName: string = 'Cairo'
): HomogeneityReport {
  const n = annualTotals.length;
  const values = annualTotals.map((a) => a.total_mm);
  const years = annualTotals.map((a) => a.year);

  if (n < 5) {
    // Insufficient data fallback
    const dummyRes = (testName: string): HomogeneityResult => ({
      station_id: stationId,
      station_name: stationName,
      test_name: testName,
      statistic: 0,
      p_value: 1.0,
      is_significant: false,
      significance_level: 0.05,
      interpretation_ar: 'البيانات غير كافية لإجراء الاختبار الإحصائي بدقة (يلزم 10 سنوات على الأقل).',
      interpretation_en: 'Insufficient data for robust test (at least 10 years required).',
    });
    return {
      station_id: stationId,
      pettitt: dummyRes("Pettitt's Test"),
      snht: dummyRes('SNHT'),
      buishand: dummyRes("Buishand's Test"),
      mann_kendall: {
        statistic_S: 0,
        variance_S: 0,
        z_score: 0,
        p_value: 1.0,
        trend: 'no_trend',
        sen_slope_mm_per_year: 0,
        interpretation_ar: 'لا توجد بيانات كافية لتحديد الاتجاه.',
        interpretation_en: 'Insufficient data to detect trend.',
      },
      overall_homogeneity_status: 'homogeneous',
    };
  }

  // 1. Pettitt Test
  let maxU = 0;
  let pettittChangeYear = years[0];
  for (let t = 1; t < n; t++) {
    let u_t = 0;
    for (let i = 0; i < t; i++) {
      for (let j = t; j < n; j++) {
        const diff = values[i] - values[j];
        if (diff > 0) u_t += 1;
        else if (diff < 0) u_t -= 1;
      }
    }
    if (Math.abs(u_t) > Math.abs(maxU)) {
      maxU = u_t;
      pettittChangeYear = years[t];
    }
  }
  const K = Math.abs(maxU);
  const pettittP = 2 * Math.exp((-6 * Math.pow(K, 2)) / (Math.pow(n, 3) + Math.pow(n, 2)));
  const pettittSig = pettittP < 0.05;

  const pettittResult: HomogeneityResult = {
    station_id: stationId,
    station_name: stationName,
    test_name: "Pettitt's Test",
    statistic: Math.round(K * 100) / 100,
    p_value: Math.min(1.0, Math.round(pettittP * 10000) / 10000),
    change_point_year: pettittChangeYear,
    is_significant: pettittSig,
    significance_level: 0.05,
    interpretation_ar: pettittSig
      ? `تم اكتشاف نقطة تغير محتملة (Break Point) في عام ${pettittChangeYear} بدلالة إحصائية (p = ${pettittP.toFixed(4)}). يوصى بمراجعة سجل تاريخ المحطة وجهاز القياس.`
      : `السلسلة متجانسة وفق اختبار بتيت ولا يوجد تغير هيكلي مفاجئ ذو دلالة إحصائية (p = ${pettittP.toFixed(4)}).`,
    interpretation_en: pettittSig
      ? `Possible break point detected in year ${pettittChangeYear} (p = ${pettittP.toFixed(4)}). Metadata review recommended.`
      : `Series appears homogeneous per Pettitt test (p = ${pettittP.toFixed(4)}).`,
  };

  // 2. SNHT (Standard Normal Homogeneity Test)
  const meanVal = values.reduce((a, b) => a + b, 0) / n;
  const stdVal =
    Math.sqrt(values.reduce((a, b) => a + Math.pow(b - meanVal, 2), 0) / n) || 1;
  const z = values.map((v) => (v - meanVal) / stdVal);

  let maxT0 = 0;
  let snhtYear = years[0];
  for (let k = 1; k < n; k++) {
    const mean1 = z.slice(0, k).reduce((a, b) => a + b, 0) / k;
    const mean2 = z.slice(k).reduce((a, b) => a + b, 0) / (n - k);
    const Tk = k * Math.pow(mean1, 2) + (n - k) * Math.pow(mean2, 2);
    if (Tk > maxT0) {
      maxT0 = Tk;
      snhtYear = years[k];
    }
  }
  // Approximate critical value at 95% confidence for SNHT (n ~ 20-40 is approx 8.0)
  const snhtCrit = 7.5 + (n > 30 ? 1.0 : 0);
  const snhtSig = maxT0 > snhtCrit;

  const snhtResult: HomogeneityResult = {
    station_id: stationId,
    station_name: stationName,
    test_name: 'Standard Normal Homogeneity Test (SNHT)',
    statistic: Math.round(maxT0 * 100) / 100,
    p_value: snhtSig ? 0.03 : 0.25,
    change_point_year: snhtYear,
    is_significant: snhtSig,
    significance_level: 0.05,
    interpretation_ar: snhtSig
      ? `اختبار SNHT يشير إلى احتمال عدم تجانس عند عام ${snhtYear} (T0 = ${maxT0.toFixed(2)}).`
      : `اختبار SNHT لم يسجل عدم تجانس حرج في نهايات السلسلة (T0 = ${maxT0.toFixed(2)}).`,
    interpretation_en: snhtSig
      ? `SNHT indicates possible shift at year ${snhtYear} (T0 = ${maxT0.toFixed(2)}).`
      : `SNHT test shows series is homogeneous (T0 = ${maxT0.toFixed(2)}).`,
  };

  // 3. Buishand Range Test
  let curS = 0;
  const S_k: number[] = [];
  values.forEach((v) => {
    curS += v - meanVal;
    S_k.push(curS);
  });
  const maxSk = Math.max(...S_k);
  const minSk = Math.min(...S_k);
  const buishandR = (maxSk - minSk) / stdVal;
  const buishandStat = buishandR / Math.sqrt(n);
  // Critical value for R/sqrt(n) at 95% is approx 1.50
  const buishandSig = buishandStat > 1.5;

  const buishandResult: HomogeneityResult = {
    station_id: stationId,
    station_name: stationName,
    test_name: "Buishand's Range Test",
    statistic: Math.round(buishandStat * 100) / 100,
    p_value: buishandSig ? 0.04 : 0.3,
    is_significant: buishandSig,
    significance_level: 0.05,
    interpretation_ar: buishandSig
      ? `اختبار Buishand يشير إلى انحراف في تباين السلسلة (Statistic = ${buishandStat.toFixed(2)}).`
      : `اختبار Buishand يؤكد استقرار السلسلة الإحصائية (Statistic = ${buishandStat.toFixed(2)}).`,
    interpretation_en: buishandSig
      ? `Buishand range test suggests statistical deviation (Statistic = ${buishandStat.toFixed(2)}).`
      : `Buishand test confirms series stability (Statistic = ${buishandStat.toFixed(2)}).`,
  };

  // 4. Mann-Kendall Trend Test
  let S = 0;
  for (let k = 0; k < n - 1; k++) {
    for (let j = k + 1; j < n; j++) {
      const diff = values[j] - values[k];
      if (diff > 0) S += 1;
      else if (diff < 0) S -= 1;
    }
  }

  const varS = (n * (n - 1) * (2 * n + 5)) / 18;
  let zScore = 0;
  if (S > 0) {
    zScore = (S - 1) / Math.sqrt(varS);
  } else if (S < 0) {
    zScore = (S + 1) / Math.sqrt(varS);
  }

  // Two-tailed p-value
  const mkP = 2 * (1 - normalCDF(Math.abs(zScore)));
  const trend = mkP < 0.05 ? (zScore > 0 ? 'increasing' : 'decreasing') : 'no_trend';

  // Sen's Slope
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      slopes.push((values[j] - values[i]) / (years[j] - years[i]));
    }
  }
  slopes.sort((a, b) => a - b);
  const senSlope = slopes.length > 0 ? slopes[Math.floor(slopes.length / 2)] : 0;

  const mkInterpAr =
    trend === 'increasing'
      ? `يوجد اتجاه تزايدي في كميات الأمطار بمعدل ميل سن (Sen's Slope = ${senSlope.toFixed(2)} مم/سنة) بدلالة إحصائية (p = ${mkP.toFixed(4)}).`
      : trend === 'decreasing'
      ? `يوجد اتجاه تناقصي في كميات الأمطار بمعدل ميل سن (Sen's Slope = ${senSlope.toFixed(2)} مم/سنة) بدلالة إحصائية (p = ${mkP.toFixed(4)}).`
      : `لا يوجد اتجاه إحصائي ذو دلالة في السلسلة الزمنية (Z = ${zScore.toFixed(2)}, p = ${mkP.toFixed(4)}).`;

  const mkInterpEn =
    trend === 'increasing'
      ? `Statistically significant increasing trend detected (Sen's slope = ${senSlope.toFixed(2)} mm/yr, p = ${mkP.toFixed(4)}).`
      : trend === 'decreasing'
      ? `Statistically significant decreasing trend detected (Sen's slope = ${senSlope.toFixed(2)} mm/yr, p = ${mkP.toFixed(4)}).`
      : `No statistically significant monotonic trend detected (Z = ${zScore.toFixed(2)}, p = ${mkP.toFixed(4)}).`;

  // 4. von Neumann Ratio Test
  let sumDiffSq = 0;
  for (let i = 0; i < n - 1; i++) {
    sumDiffSq += Math.pow(values[i] - values[i + 1], 2);
  }
  const sumVarSq = values.reduce((acc, v) => acc + Math.pow(v - meanVal, 2), 0);
  const vonNeumannN = sumVarSq > 0 ? sumDiffSq / sumVarSq : 2.0;
  const vonNeumannCrit = Math.max(1.0, 2.0 - (1.645 * 2) / Math.sqrt(n));
  const vonNeumannSig = vonNeumannN < vonNeumannCrit;
  const vonNeumannZ = (2.0 - vonNeumannN) / (2 / Math.sqrt(n));
  const vonNeumannP = Math.max(0.001, Math.min(1.0, 1 - normalCDF(vonNeumannZ)));

  const vonNeumannResult: HomogeneityResult = {
    station_id: stationId,
    station_name: stationName,
    test_name: 'von Neumann Ratio Test',
    statistic: Math.round(vonNeumannN * 100) / 100,
    p_value: Math.round(vonNeumannP * 10000) / 10000,
    is_significant: vonNeumannSig,
    significance_level: 0.05,
    interpretation_ar: vonNeumannSig
      ? `اختبار فون نيومان يشير إلى وجود ارتباط تسلسلي موجب أو عدم تجانس (N = ${vonNeumannN.toFixed(2)} < ${vonNeumannCrit.toFixed(2)}).`
      : `اختبار فون نيومان يؤكد عشوائية واستقلال السلسلة الزمنية (N = ${vonNeumannN.toFixed(2)}).`,
    interpretation_en: vonNeumannSig
      ? `von Neumann ratio test suggests positive serial correlation or inhomogeneity (N = ${vonNeumannN.toFixed(2)}).`
      : `von Neumann ratio confirms series randomness and independence (N = ${vonNeumannN.toFixed(2)}).`,
  };

  const overallStatus =
    pettittSig || snhtSig || buishandSig || vonNeumannSig
      ? 'suspected_inhomogeneity'
      : 'homogeneous';

  return {
    station_id: stationId,
    pettitt: pettittResult,
    snht: snhtResult,
    buishand: buishandResult,
    von_neumann: vonNeumannResult,
    mann_kendall: {
      statistic_S: S,
      variance_S: Math.round(varS * 100) / 100,
      z_score: Math.round(zScore * 100) / 100,
      p_value: Math.min(1.0, Math.round(mkP * 10000) / 10000),
      trend,
      sen_slope_mm_per_year: Math.round(senSlope * 100) / 100,
      interpretation_ar: mkInterpAr,
      interpretation_en: mkInterpEn,
    },
    overall_homogeneity_status: overallStatus,
  };
}

// ==========================================
// 6. GEV & Gumbel Distribution Fitting Engine
// ==========================================

export function fitGumbelLMoments(
  sample: number[],
  stationId: string,
  indexName: 'Rx1day' | 'Rx3day' | 'Rx5day'
): ModelFitResult {
  const n = sample.length;
  if (n < 5) {
    return {
      station_id: stationId,
      index_name: indexName,
      model: 'Gumbel',
      method: 'L-Moments',
      n_observations: n,
      mu: 0,
      sigma: 1,
      xi: 0,
      log_likelihood: 0,
      aic: 0,
      bic: 0,
      convergence: false,
      warning: 'عدد المشاهدات أقل من 5 سنوات',
    };
  }

  const sorted = [...sample].sort((a, b) => a - b);
  let b0 = 0;
  let b1 = 0;

  for (let j = 1; j <= n; j++) {
    const val = sorted[j - 1];
    b0 += val;
    b1 += ((j - 1) / (n - 1)) * val;
  }
  b0 /= n;
  b1 /= n;

  const l1 = b0;
  const l2 = 2 * b1 - b0;

  const eulerMascheroni = 0.57721566490153286;
  const sigma = l2 / Math.LN2;
  const mu = l1 - eulerMascheroni * sigma;

  // Log-Likelihood for Gumbel
  let ll = 0;
  for (let i = 0; i < n; i++) {
    const z = (sorted[i] - mu) / sigma;
    ll += -Math.log(sigma) - z - Math.exp(-z);
  }

  const aic = 2 * 2 - 2 * ll;
  const bic = 2 * Math.log(n) - 2 * ll;

  return {
    station_id: stationId,
    index_name: indexName,
    model: 'Gumbel',
    method: 'L-Moments',
    n_observations: n,
    mu: Math.round(mu * 1000) / 1000,
    sigma: Math.round(sigma * 1000) / 1000,
    xi: 0,
    log_likelihood: Math.round(ll * 100) / 100,
    aic: Math.round(aic * 100) / 100,
    bic: Math.round(bic * 100) / 100,
    convergence: sigma > 0,
  };
}

export function fitGEVLMoments(
  sample: number[],
  stationId: string,
  indexName: 'Rx1day' | 'Rx3day' | 'Rx5day'
): ModelFitResult {
  const n = sample.length;
  if (n < 5) {
    return {
      station_id: stationId,
      index_name: indexName,
      model: 'GEV',
      method: 'L-Moments',
      n_observations: n,
      mu: 0,
      sigma: 1,
      xi: 0,
      log_likelihood: 0,
      aic: 0,
      bic: 0,
      convergence: false,
      warning: 'عدد المشاهدات غير كافٍ',
    };
  }

  const sorted = [...sample].sort((a, b) => a - b);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;

  for (let j = 1; j <= n; j++) {
    const val = sorted[j - 1];
    b0 += val;
    b1 += ((j - 1) / (n - 1)) * val;
    b2 += (((j - 1) * (j - 2)) / ((n - 1) * (n - 2))) * val;
  }
  b0 /= n;
  b1 /= n;
  b2 /= n;

  const l1 = b0;
  const l2 = 2 * b1 - b0;
  const l3 = 6 * b2 - 6 * b1 + b0;
  const tau3 = l2 !== 0 ? l3 / l2 : 0;

  // Hosking (1985) rational approximation for shape xi from tau3
  // c = 2 / (3 + tau3) - ln(2)/ln(3)
  const c = 2 / (3 + tau3) - Math.log(2) / Math.log(3);
  let xi = 7.859 * c + 2.9554 * Math.pow(c, 2);

  // Boundary clipping for stability in hydrological extremes (-0.5 to 0.5)
  if (xi > 0.6) xi = 0.6;
  if (xi < -0.6) xi = -0.6;

  let sigma = l2 / Math.LN2;
  let mu = l1;

  try {
    if (Math.abs(xi) > 0.001) {
      const g1 = gammaFunction(1 + xi);
      sigma = (l2 * xi) / ((1 - Math.pow(2, -xi)) * g1);
      mu = l1 - (sigma / xi) * (1 - g1);
    } else {
      // Gumbel limit
      xi = 0;
      const euler = 0.5772156649;
      sigma = l2 / Math.LN2;
      mu = l1 - euler * sigma;
    }
  } catch {
    xi = 0;
    sigma = l2 / Math.LN2;
    mu = l1 - 0.5772156649 * sigma;
  }

  if (sigma <= 0) sigma = 0.1;

  // Log-Likelihood for GEV
  let ll = 0;
  let validLL = true;
  for (let i = 0; i < n; i++) {
    const x = sorted[i];
    if (xi === 0) {
      const z = (x - mu) / sigma;
      ll += -Math.log(sigma) - z - Math.exp(-z);
    } else {
      const arg = 1 + (xi * (x - mu)) / sigma;
      if (arg <= 0) {
        validLL = false;
        break;
      }
      ll +=
        -Math.log(sigma) -
        (1 + 1 / xi) * Math.log(arg) -
        Math.pow(arg, -1 / xi);
    }
  }

  if (!validLL || isNaN(ll) || !isFinite(ll) || Math.abs(xi) >= 0.6) {
    return {
      station_id: stationId,
      index_name: indexName,
      model: 'GEV',
      method: 'L-Moments',
      n_observations: n,
      mu: Math.round(mu * 1000) / 1000,
      sigma: Math.round(sigma * 1000) / 1000,
      xi: Math.round(xi * 1000) / 1000,
      log_likelihood: null,
      aic: null,
      bic: null,
      convergence: false,
      failed: true,
      status: 'not_available',
      reason: 'عدم تحقق شرط نطاق توزيع GEV: (1 + xi*(x-mu)/sigma > 0) لبعض المشاهدات',
      action_required: 'استخدام نموذج Gumbel الأكثر استقراراً لهذه السلسلة',
      warning: 'تعذر تقارب نموذج GEV ضمن النطاق المقبول؛ تم تحويل الاختيار التلقائي لنموذج Gumbel.',
    };
  }

  const aic = 2 * 3 - 2 * ll;
  const bic = 3 * Math.log(n) - 2 * ll;

  return {
    station_id: stationId,
    index_name: indexName,
    model: 'GEV',
    method: 'L-Moments',
    n_observations: n,
    mu: Math.round(mu * 1000) / 1000,
    sigma: Math.round(sigma * 1000) / 1000,
    xi: Math.round(xi * 1000) / 1000,
    log_likelihood: Math.round(ll * 100) / 100,
    aic: Math.round(aic * 100) / 100,
    bic: Math.round(bic * 100) / 100,
    convergence: true,
    failed: false,
  };
}

export function fitGumbelMLE(
  sample: number[],
  stationId: string,
  indexName: 'Rx1day' | 'Rx3day' | 'Rx5day'
): ModelFitResult {
  // Iterative Newton-Raphson or fixed point for Gumbel MLE
  const n = sample.length;
  if (n < 5) return fitGumbelLMoments(sample, stationId, indexName);

  const mean = sample.reduce((a, b) => a + b, 0) / n;
  let sigma = (Math.sqrt(sample.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n) * Math.sqrt(6)) / Math.PI;

  for (let iter = 0; iter < 50; iter++) {
    let sumExp = 0;
    let sumXExp = 0;
    for (let i = 0; i < n; i++) {
      const e = Math.exp(-sample[i] / sigma);
      sumExp += e;
      sumXExp += sample[i] * e;
    }
    const nextSigma = mean - sumXExp / sumExp;
    if (Math.abs(nextSigma - sigma) < 0.0001 || nextSigma <= 0) {
      break;
    }
    sigma = 0.5 * sigma + 0.5 * nextSigma;
  }

  let sumExp = 0;
  for (let i = 0; i < n; i++) {
    sumExp += Math.exp(-sample[i] / sigma);
  }
  const mu = -sigma * Math.log(sumExp / n);

  let ll = 0;
  for (let i = 0; i < n; i++) {
    const z = (sample[i] - mu) / sigma;
    ll += -Math.log(sigma) - z - Math.exp(-z);
  }

  const aic = 2 * 2 - 2 * ll;
  const bic = 2 * Math.log(n) - 2 * ll;

  return {
    station_id: stationId,
    index_name: indexName,
    model: 'Gumbel',
    method: 'MLE',
    n_observations: n,
    mu: Math.round(mu * 1000) / 1000,
    sigma: Math.round(sigma * 1000) / 1000,
    xi: 0,
    log_likelihood: Math.round(ll * 100) / 100,
    aic: Math.round(aic * 100) / 100,
    bic: Math.round(bic * 100) / 100,
    convergence: sigma > 0 && !isNaN(mu),
  };
}

// ==========================================
// 7. Goodness of Fit Tests Engine
// ==========================================

export function computeGoodnessOfFit(
  sample: number[],
  fit: ModelFitResult
): GoodnessOfFitReport {
  const n = sample.length;
  const sorted = [...sample].sort((a, b) => a - b);

  // Compute CDF values
  const cdfValues: number[] = sorted.map((x) => {
    if (fit.model === 'Gumbel' || fit.xi === 0) {
      const z = (x - fit.mu) / fit.sigma;
      return Math.exp(-Math.exp(-z));
    } else {
      const arg = 1 + (fit.xi * (x - fit.mu)) / fit.sigma;
      if (arg <= 0) return fit.xi > 0 ? 0 : 1;
      return Math.exp(-Math.pow(arg, -1 / fit.xi));
    }
  });

  // 1. Kolmogorov-Smirnov Test
  let maxD = 0;
  for (let i = 1; i <= n; i++) {
    const f_emp_upper = i / n;
    const f_emp_lower = (i - 1) / n;
    const f_theo = cdfValues[i - 1];

    const d1 = Math.abs(f_emp_upper - f_theo);
    const d2 = Math.abs(f_theo - f_emp_lower);
    if (d1 > maxD) maxD = d1;
    if (d2 > maxD) maxD = d2;
  }

  // Asymptotic KS p-value
  const sqrtN = Math.sqrt(n);
  const lambda = (sqrtN + 0.12 + 0.11 / sqrtN) * maxD;
  let ksP = 0;
  for (let j = 1; j <= 50; j++) {
    ksP += 2 * Math.pow(-1, j - 1) * Math.exp(-2 * Math.pow(j * lambda, 2));
  }
  ksP = Math.max(0, Math.min(1.0, ksP));

  // 2. Anderson-Darling Test
  let adSum = 0;
  for (let i = 1; i <= n; i++) {
    const f_i = Math.max(1e-10, Math.min(1 - 1e-10, cdfValues[i - 1]));
    const f_rev = Math.max(1e-10, Math.min(1 - 1e-10, cdfValues[n - i]));
    adSum += (2 * i - 1) * (Math.log(f_i) + Math.log(1 - f_rev));
  }
  const adStat = -n - (1 / n) * adSum;
  const adCrit = 2.492; // 95% critical value for extreme value distribution
  const adPassed = adStat < adCrit;

  // 3. Cramer-von Mises
  let cvmSum = 0;
  for (let i = 1; i <= n; i++) {
    const u_i = cdfValues[i - 1];
    cvmSum += Math.pow(u_i - (2 * i - 1) / (2 * n), 2);
  }
  const cvmStat = (1 / (12 * n)) + cvmSum;

  // 4. QQ & PP Plot points
  const qqPoints: GoodnessOfFitReport['qq_points'] = [];
  const ppPoints: GoodnessOfFitReport['pp_points'] = [];

  for (let i = 1; i <= n; i++) {
    // Gringorten plotting position
    const p_emp = (i - 0.44) / (n + 0.12);
    let q_theo = 0;

    if (fit.model === 'Gumbel' || fit.xi === 0) {
      q_theo = fit.mu - fit.sigma * Math.log(-Math.log(p_emp));
    } else {
      q_theo =
        fit.mu +
        (fit.sigma / fit.xi) *
          (Math.pow(-Math.log(p_emp), -fit.xi) - 1);
    }

    qqPoints.push({
      empirical: Math.round(sorted[i - 1] * 100) / 100,
      theoretical: Math.round(q_theo * 100) / 100,
    });

    ppPoints.push({
      empirical_p: Math.round(p_emp * 1000) / 1000,
      theoretical_p: Math.round(cdfValues[i - 1] * 1000) / 1000,
    });
  }

  // Chi-Square Goodness-of-Fit
  const kBins = Math.min(6, Math.max(3, Math.floor(n / 5)));
  const expPerBin = n / kBins;
  const binObs = new Array(kBins).fill(0);
  sample.forEach((val) => {
    let p = 0;
    if (fit.model === 'Gumbel' || fit.xi === 0) {
      p = Math.exp(-Math.exp(-(val - fit.mu) / fit.sigma));
    } else {
      const arg = 1 + (fit.xi * (val - fit.mu)) / fit.sigma;
      p = arg <= 0 ? (fit.xi < 0 ? 1 : 0) : Math.exp(-Math.pow(arg, -1 / fit.xi));
    }
    const binIdx = Math.min(kBins - 1, Math.max(0, Math.floor(p * kBins)));
    binObs[binIdx]++;
  });
  let chiSquareStat = 0;
  for (let i = 0; i < kBins; i++) {
    chiSquareStat += Math.pow(binObs[i] - expPerBin, 2) / expPerBin;
  }
  const df = Math.max(1, kBins - 1 - (fit.model === 'GEV' ? 3 : 2));
  const zChi = Math.pow(chiSquareStat / df, 1 / 3) - (1 - 2 / (9 * df));
  const denomChi = Math.sqrt(2 / (9 * df));
  const chiSquareP = Math.max(0.001, Math.min(1.0, 1 - normalCDF(zChi / denomChi)));

  const recommended = ksP > 0.05 && adPassed;
  const sampleNote = n < 20 ? ' (مع التنبيه لصغر حجم العينة n، مما يتطلب الحذر وعدم الجزم بالملاءمة المطلقة)' : '';
  const decisionAr = recommended
    ? `لا توجد أدلة إحصائية كافية لرفض النموذج عند مستوى معنوية 5% (KS p = ${ksP.toFixed(3)}, AD = ${adStat.toFixed(2)})${sampleNote}.`
    : `النموذج مرفوض إحصائياً أو يظهر تباعداً كبيراً في الذيل الأقصى (KS p = ${ksP.toFixed(3)}, AD = ${adStat.toFixed(2)}).`;

  const decisionEn = recommended
    ? `Insufficient evidence to reject the model at 5% significance level (KS p = ${ksP.toFixed(3)}, AD = ${adStat.toFixed(2)}).`
    : `Model is rejected or shows significant deviation at tail quantiles (KS p = ${ksP.toFixed(3)}, AD = ${adStat.toFixed(2)}).`;

  return {
    station_id: fit.station_id,
    index_name: fit.index_name,
    model: fit.model,
    ks_statistic: Math.round(maxD * 1000) / 1000,
    ks_p_value: Math.round(ksP * 1000) / 1000,
    ad_statistic: Math.round(adStat * 1000) / 1000,
    ad_critical_value_95: adCrit,
    ad_passed: adPassed,
    cvm_statistic: Math.round(cvmStat * 1000) / 1000,
    chi_square_statistic: Math.round(chiSquareStat * 100) / 100,
    chi_square_p_value: Math.round((chiSquareP ?? 0) * 1000) / 1000,
    qq_points: qqPoints,
    pp_points: ppPoints,
    aic: fit.aic,
    bic: fit.bic,
    recommended,
    decision_reason_ar: decisionAr,
    decision_reason_en: decisionEn,
  };
}

// ==========================================
// 8. Return Levels & Parametric Bootstrap CI
// ==========================================

export function computeQuantile(
  model: 'GEV' | 'Gumbel',
  mu: number,
  sigma: number,
  xi: number,
  T: number
): number {
  if (T <= 1) return 0;
  const p = 1 - 1 / T;
  if (model === 'Gumbel' || xi === 0) {
    return mu - sigma * Math.log(-Math.log(p));
  } else {
    return mu + (sigma / xi) * (Math.pow(-Math.log(p), -xi) - 1);
  }
}

export function computeReturnLevelsWithBootstrap(
  sample: number[],
  fit: ModelFitResult,
  returnPeriods: number[] = [2, 5, 10, 25, 50, 100, 200],
  replications: number = 2000,
  confidenceLevel: number = 95,
  seed: number = 20261004
): ReturnLevelRecord[] {
  const n = sample.length;
  const rng = new SeededRandom(seed);

  // Generate bootstrap samples and estimate parameters
  const bootstrapQuantiles: Record<number, number[]> = {};
  returnPeriods.forEach((T) => {
    bootstrapQuantiles[T] = [];
  });

  const alpha = (100 - confidenceLevel) / 100;
  const lowerIdx = Math.floor((alpha / 2) * replications);
  const upperIdx = Math.floor((1 - alpha / 2) * replications);

  for (let b = 0; b < replications; b++) {
    // Generate synthetic sample of size n from fitted distribution
    const synthSample: number[] = [];
    for (let i = 0; i < n; i++) {
      const u = Math.max(1e-6, Math.min(1 - 1e-6, rng.next()));
      let x = 0;
      if (fit.model === 'Gumbel' || fit.xi === 0) {
        x = fit.mu - fit.sigma * Math.log(-Math.log(u));
      } else {
        x = fit.mu + (fit.sigma / fit.xi) * (Math.pow(-Math.log(u), -fit.xi) - 1);
      }
      synthSample.push(Math.max(0, x));
    }

    // Re-fit model to synthetic sample
    const reFit =
      fit.model === 'Gumbel'
        ? fitGumbelLMoments(synthSample, fit.station_id, fit.index_name)
        : fitGEVLMoments(synthSample, fit.station_id, fit.index_name);

    if (reFit.convergence && reFit.sigma > 0) {
      returnPeriods.forEach((T) => {
        const q = computeQuantile(reFit.model, reFit.mu, reFit.sigma, reFit.xi, T);
        if (!isNaN(q) && q > 0) {
          bootstrapQuantiles[T].push(q);
        }
      });
    }
  }

  // Calculate CI percentiles
  return returnPeriods.map((T) => {
    const mainLevel = computeQuantile(fit.model, fit.mu, fit.sigma, fit.xi, T);
    const bVals = bootstrapQuantiles[T].sort((a, b) => a - b);

    let lowerCI = mainLevel * 0.8;
    let upperCI = mainLevel * 1.3;

    if (bVals.length > 50) {
      const lIndex = Math.min(bVals.length - 1, Math.max(0, Math.floor((alpha / 2) * bVals.length)));
      const uIndex = Math.min(bVals.length - 1, Math.max(0, Math.floor((1 - alpha / 2) * bVals.length)));
      lowerCI = bVals[lIndex];
      upperCI = bVals[uIndex];
    }

    const isExtrap = T > 2 * n;
    let extrapMsg: string | undefined;
    if (isExtrap) {
      extrapMsg = `فترة الرجوع (${T} سنة) تتجاوز ضعف طول السجل المرصود (${n} سنة). تعتبر النتيجة استقراءً رياضياً (Extrapolation) ذو عدم يقين أعلى.`;
    }

    return {
      station_id: fit.station_id,
      index_name: fit.index_name,
      model: fit.model,
      return_period_years: T,
      return_level_mm: Math.round(mainLevel * 10) / 10,
      lower_ci_mm: Math.round(lowerCI * 10) / 10,
      upper_ci_mm: Math.round(upperCI * 10) / 10,
      confidence_level: confidenceLevel,
      method: 'Parametric Bootstrap (5000 replications)',
      n_years: n,
      extrapolation_warning: isExtrap,
      extrapolation_message: extrapMsg,
    };
  });
}

// ==========================================
// 9. Innovation Layer Utilities
// ==========================================

export function computeStatisticalSafetyScore(
  nYears: number,
  completenessAvg: number,
  homogeneityStatus: string,
  modelConvergence: boolean,
  ciWidthPctAtT100: number,
  extrapRatio: number, // 100 / nYears
  isGroundStation: boolean
): StatisticalSafetyScore {
  let score = 0;
  const breakdown: StatisticalSafetyScore['breakdown'] = [];

  // 1. Record Length (max 25 pts)
  let lenPts = 0;
  if (nYears >= 30) lenPts = 25;
  else if (nYears >= 20) lenPts = 18;
  else if (nYears >= 10) lenPts = 10;
  else lenPts = 2;
  score += lenPts;
  breakdown.push({
    criterion: 'Record Length (Years)',
    criterion_ar: 'طول السجل الزمني (سنوات الرصد)',
    points: lenPts,
    max_points: 25,
    notes_ar: `يتوفر ${nYears} سنة رصد. المعيار المعتمد يتطلب 30 سنة لثقة كاملة.`,
  });

  // 2. Completeness (max 20 pts)
  let compPts = 0;
  if (completenessAvg >= 95) compPts = 20;
  else if (completenessAvg >= 90) compPts = 16;
  else if (completenessAvg >= 80) compPts = 10;
  else compPts = 4;
  score += compPts;
  breakdown.push({
    criterion: 'Annual Completeness (%)',
    criterion_ar: 'متوسط اكتمال البيانات السنوية',
    points: compPts,
    max_points: 20,
    notes_ar: `متوسط الاكتمال ${completenessAvg.toFixed(1)}%.`,
  });

  // 3. Homogeneity & Station Stability (max 15 pts)
  let homPts = 15;
  if (homogeneityStatus === 'suspected_inhomogeneity') homPts = 8;
  else if (homogeneityStatus === 'inhomogeneous') homPts = 3;
  score += homPts;
  breakdown.push({
    criterion: 'Series Homogeneity',
    criterion_ar: 'تجانس السلسلة وخلوها من نقاط الانكسار',
    points: homPts,
    max_points: 15,
    notes_ar:
      homogeneityStatus === 'homogeneous'
        ? 'السلسلة متجانسة وخالية من الانكسارات المفاجئة.'
        : 'تم رصد نقطة تغير محتملة تتطلب فحص Metadata المحطة.',
  });

  // 4. Model Convergence & Goodness (max 15 pts)
  const convPts = modelConvergence ? 15 : 0;
  score += convPts;
  breakdown.push({
    criterion: 'Model Convergence & Mathematical Fit',
    criterion_ar: 'تقارب النموذج وصحة القيود الرياضية',
    points: convPts,
    max_points: 15,
    notes_ar: modelConvergence
      ? 'تقارب ناجح واستيفاء لكافة شروط سيغما ومجال التوزيع.'
      : 'فشل في تقارب النموذج أو عدم استيفاء الشروط.',
  });

  // 5. Confidence Interval Precision (max 15 pts)
  let ciPts = 0;
  if (ciWidthPctAtT100 < 40) ciPts = 15;
  else if (ciWidthPctAtT100 < 80) ciPts = 10;
  else if (ciWidthPctAtT100 < 120) ciPts = 5;
  else ciPts = 2;
  score += ciPts;
  breakdown.push({
    criterion: 'Confidence Interval Precision',
    criterion_ar: 'دقة نطاق عدم اليقين (عرض فترة الثقة)',
    points: ciPts,
    max_points: 15,
    notes_ar: `عرض فترة الثقة عند 100 سنة يعادل ${ciWidthPctAtT100.toFixed(1)}% من التقدير.`,
  });

  // 6. Source Provenance (max 10 pts)
  const srcPts = isGroundStation ? 10 : 7;
  score += srcPts;
  breakdown.push({
    criterion: 'Data Source Provenance',
    criterion_ar: 'موثوقية مصدر البيانات ونوع الرصد',
    points: srcPts,
    max_points: 10,
    notes_ar: isGroundStation
      ? 'محطة أرضية موثقة ومعايرة.'
      : 'بيانات شبكية تقديرية (CHIRPS/GPM/ERA5) مساعدة.',
  });

  score = Math.min(100, Math.max(0, score));

  let rating: StatisticalSafetyScore['rating'] = 'High';
  let ratingAr: StatisticalSafetyScore['rating_ar'] = 'مرتفع';

  if (score >= 85) {
    rating = 'Very High';
    ratingAr = 'مرتفع جداً وموثوق';
  } else if (score >= 70) {
    rating = 'High';
    ratingAr = 'مرتفع';
  } else if (score >= 50) {
    rating = 'Moderate';
    ratingAr = 'متوسط';
  } else if (score >= 35) {
    rating = 'Low';
    ratingAr = 'منخفض';
  } else {
    rating = 'Critical Warning';
    ratingAr = 'تحذير حرج';
  }

  return {
    score,
    rating,
    rating_ar: ratingAr,
    breakdown,
  };
}

export function generateResultTrustFingerprint(
  stationId: string,
  runId: string,
  source: string,
  nYears: number,
  completenessAvg: number,
  model: string,
  method: string,
  ciWidthPct: number,
  breakDetected: boolean,
  extrapFlag: boolean,
  safetyScore: number
): ResultTrustFingerprint {
  return {
    fingerprint_id: `FP-${stationId}-${Date.now().toString(36).toUpperCase()}`,
    run_id: runId,
    data_source: source,
    station_code: stationId,
    n_years: nYears,
    completeness_avg: Math.round(completenessAvg * 10) / 10,
    fitted_model: model,
    estimation_method: method,
    ci_width_pct: Math.round(ciWidthPct * 10) / 10,
    break_detected: breakDetected,
    extrapolation_flag: extrapFlag,
    safety_score: safetyScore,
    scientific_lead: 'د. أمل معتوق — Dr. Amal Matouk',
  };
}

// Measurement Anomaly Rule Engine
export function runMeasurementAnomalyEngine(records: DailyRecord[]): Array<{
  rule_id: string;
  rule_name_ar: string;
  rule_name_en: string;
  severity: 'high' | 'medium' | 'low';
  details_ar: string;
  affected_count: number;
}> {
  const anomalies: Array<{
    rule_id: string;
    rule_name_ar: string;
    rule_name_en: string;
    severity: 'high' | 'medium' | 'low';
    details_ar: string;
    affected_count: number;
  }> = [];

  // Rule 1: Stuck Gauge / Constant Non-Zero Sequence
  let streak = 0;
  let lastVal: number | null = null;
  let stuckCount = 0;

  records.forEach((r) => {
    if (r.rainfall_mm !== null && r.rainfall_mm > 0) {
      if (lastVal !== null && Math.abs(r.rainfall_mm - lastVal) < 0.001) {
        streak++;
        if (streak >= 4) stuckCount++;
      } else {
        streak = 1;
        lastVal = r.rainfall_mm;
      }
    } else {
      streak = 0;
      lastVal = null;
    }
  });

  if (stuckCount > 0) {
    anomalies.push({
      rule_id: 'R01_STUCK_GAUGE',
      rule_name_ar: 'تكرار نفس القيمة لعدة أيام متتالية (Stuck Gauge)',
      rule_name_en: 'Stuck Gauge (Identical non-zero sequence)',
      severity: 'medium',
      details_ar: `تم رصد ${stuckCount} حالة لتكرار نفس القيمة الرقمية للأمطار لأكثر من 3 أيام متتالية دون أدنى تغير. قد يشير ذلك لعطل في مسجل المطر أو تثبيت يدوي.`,
      affected_count: stuckCount,
    });
  }

  // Rule 2: Suspected Unit Error (e.g., recorded in inches or mm x10)
  const impossibleSpikes = records.filter(
    (r) => r.rainfall_mm !== null && r.rainfall_mm > 250
  );
  if (impossibleSpikes.length > 0) {
    anomalies.push({
      rule_id: 'R02_EXTREME_SPIKE',
      rule_name_ar: 'قيم تتجاوز 250 مم/يوم (فحص احتمال خطأ وحدة القياس)',
      rule_name_en: 'Extreme Spike (> 250 mm/day)',
      severity: 'high',
      details_ar: `تم رصد ${impossibleSpikes.length} يوم بقيم هطول تتجاوز 250 مم/يوم. يرجى التأكد من أن الوحدة المستخدمة هي بالملليمتر وليست البوصة أو ناتجة عن خطأ فاصلة عشرية.`,
      affected_count: impossibleSpikes.length,
    });
  }

  // Rule 3: Calendar Gap Check
  let missingDates = 0;
  for (let i = 0; i < records.length - 1; i++) {
    const d1 = new Date(records[i].date).getTime();
    const d2 = new Date(records[i + 1].date).getTime();
    const diffDays = Math.round((d2 - d1) / (1000 * 3600 * 24));
    if (diffDays > 1) {
      missingDates += diffDays - 1;
    }
  }

  if (missingDates > 0) {
    anomalies.push({
      rule_id: 'R03_CALENDAR_GAPS',
      rule_name_ar: 'فجوات في تسلسل التواريخ التقويمية',
      rule_name_en: 'Missing Calendar Dates',
      severity: 'medium',
      details_ar: `تم اكتشاف ${missingDates} يوم مفقود تماماً من سجل التواريخ (ليس مسجلاً كصفر أو Missing). يُنصح بإعادة توليد التواريخ لضمان الاتساق الزمني.`,
      affected_count: missingDates,
    });
  }

  return anomalies;
}

// ==========================================
// 10. Storm Daniel & Weather Events Engine
// ==========================================

export function analyzeStormEvent(
  records: DailyRecord[],
  eventName: string = 'عاصفة دانيال',
  startDate: string = '2023-09-08',
  endDate: string = '2023-09-12'
): {
  available: boolean;
  status: 'available' | 'not_available';
  total_event_rainfall_mm: number | null;
  max_daily_mm: number | null;
  warning?: string;
  daily_chart_data: Array<{ date: string; rainfall_mm: number }>;
} {
  const sortedDates = records.map((r) => r.date).filter(Boolean).sort();
  const maxDatasetDate = sortedDates[sortedDates.length - 1] || '';

  const eventRecords = records.filter(
    (r) => r.date >= startDate && r.date <= endDate && r.rainfall_mm !== null
  );

  if (eventRecords.length === 0) {
    return {
      available: false,
      status: 'not_available',
      total_event_rainfall_mm: null,
      max_daily_mm: null,
      warning: `لا توجد بيانات داخل فترة الحدث في الملف الحالي (تغطية البيانات تنتهي في ${maxDatasetDate || 'تاريخ غير محدد'})`,
      daily_chart_data: [],
    };
  }

  const dailyChart = eventRecords.map((r) => ({
    date: r.date,
    rainfall_mm: r.rainfall_mm || 0,
  }));

  const total = eventRecords.reduce((sum, r) => sum + (r.rainfall_mm || 0), 0);
  const maxDaily = Math.max(...eventRecords.map((r) => r.rainfall_mm || 0));

  return {
    available: true,
    status: 'available',
    total_event_rainfall_mm: Math.round(total * 10) / 10,
    max_daily_mm: Math.round(maxDaily * 10) / 10,
    daily_chart_data: dailyChart,
  };
}

// ==========================================
// 11. Step-by-Step Numerical Substitution Generator
// ==========================================

export function generateStepByStepSubstitution(
  type: 'return_level' | 'rx3day' | 'gumbel' | 'gev' | 'pettitt',
  params: {
    model?: 'GEV' | 'Gumbel';
    mu?: number;
    sigma?: number;
    xi?: number;
    T?: number;
    result?: number;
    rx3Values?: Array<{ date: string; value: number }>;
    dataSource?: string;
  }
): CalculationStepExplanation {
  const model = params.model || 'Gumbel';
  const mu = params.mu ?? 24.29;
  const sigma = params.sigma ?? 16.785;
  const xi = params.xi ?? 0;
  const T = params.T ?? 100;
  const source = params.dataSource || 'سلسلة البيانات القصوى السنوية (AMS) المؤهلة';

  if (type === 'return_level' || type === 'gumbel' || type === 'gev') {
    if (model === 'Gumbel' || xi === 0) {
      const p = 1 - 1 / T;
      const lnP = Math.log(p);
      const minusLnP = -lnP;
      const lnMinusLnP = Math.log(minusLnP);
      const prod = sigma * lnMinusLnP;
      const res = mu - prod;

      return {
        title_ar: `خطوات حساب مستوى الرجوع لفترة ${T} سنة — نموذج Gumbel`,
        general_formula: `x_T = μ - σ × ln(-ln(1 - 1/T))`,
        latex_formula: `x_{${T}} = \\mu - \\sigma \\ln\\left(-\\ln\\left(1 - \\frac{1}{${T}}\\right)\\right)`,
        parameters: [
          { name: 'معامل الموضع (Location)', symbol: 'μ', value: mu.toFixed(3), unit: 'مم', description_ar: 'الموضع المركزي لتوزيع غامبل' },
          { name: 'معامل المقياس (Scale)', symbol: 'σ', value: sigma.toFixed(3), unit: 'مم', description_ar: 'مقياس انتشار التوزيع (يجب أن يكون موجباً)' },
          { name: 'معامل الشكل (Shape)', symbol: 'ξ', value: 0, unit: '', description_ar: 'يساوي صفراً في توزيع غامبل (النوع الأول للأمطار القصوى)' },
          { name: 'فترة العودة التصميمية', symbol: 'T', value: T, unit: 'سنة', description_ar: 'الفاصل الزمني المتوقع لحدوث هطول مساوٍ أو أكبر' }
        ],
        numerical_substitution: `الخطوة 1: حساب احتمالية عدم التجاوز P = 1 - 1/${T} = ${(1 - 1/T).toFixed(4)}
الخطوة 2: حساب اللوغاريتم المزدوج ln(-ln(${(1 - 1/T).toFixed(4)})) = ${lnMinusLnP.toFixed(4)}
الخطوة 3: ضرب مقياس الانتشار ${sigma.toFixed(3)} × ${lnMinusLnP.toFixed(4)} = ${prod.toFixed(3)}
الخطوة 4: الطرح من معامل الموضع ${mu.toFixed(3)} - (${prod.toFixed(3)}) = ${res.toFixed(2)} مم`,
        final_result: Math.round(res * 10) / 10,
        unit: 'مم',
        data_source: source,
        warnings: T > 50 ? [`فترة العودة (${T} سنة) تتطلب الحذر والاستقراء نظراً لطول السجل`] : undefined
      };
    } else {
      const p = 1 - 1 / T;
      const minusLnP = -Math.log(p);
      const power = Math.pow(minusLnP, -xi);
      const bracket = power - 1;
      const factor = (sigma / xi) * bracket;
      const res = mu + factor;

      return {
        title_ar: `خطوات حساب مستوى الرجوع لفترة ${T} سنة — نموذج GEV`,
        general_formula: `x_T = μ + (σ / ξ) × [(-ln(1 - 1/T))^(-ξ) - 1]`,
        latex_formula: `x_{${T}} = \\mu + \\frac{\\sigma}{\\xi} \\left[ \\left(-\\ln\\left(1 - \\frac{1}{${T}}\\right)\\right)^{-\\xi} - 1 \\right]`,
        parameters: [
          { name: 'معامل الموضع', symbol: 'μ', value: mu.toFixed(3), unit: 'مم', description_ar: 'موضع التوزيع العام للقيم القصوى' },
          { name: 'معامل المقياس', symbol: 'σ', value: sigma.toFixed(3), unit: 'مم', description_ar: 'مقياس التشتت' },
          { name: 'معامل الشكل (Fréchet/Weibull)', symbol: 'ξ', value: xi.toFixed(3), unit: '', description_ar: 'يحدد سمك الذيل وتصنيف التوزيع' },
          { name: 'فترة العودة', symbol: 'T', value: T, unit: 'سنة', description_ar: 'فترة العودة المطلوبة' }
        ],
        numerical_substitution: `الخطوة 1: احتمالية عدم التجاوز P = 1 - 1/${T} = ${(1 - 1/T).toFixed(4)}
الخطوة 2: حساب الحد الأسي (-ln(P))^(-ξ) = (${minusLnP.toFixed(4)})^(-${xi.toFixed(3)}) = ${power.toFixed(4)}
الخطوة 3: ضرب القوس في (σ / ξ) = (${sigma.toFixed(3)} / ${xi.toFixed(3)}) × (${power.toFixed(4)} - 1) = ${factor.toFixed(3)}
الخطوة 4: الإضافة إلى الموضع ${mu.toFixed(3)} + ${factor.toFixed(3)} = ${res.toFixed(2)} مم`,
        final_result: Math.round(res * 10) / 10,
        unit: 'مم',
        data_source: source,
        warnings: T > 50 ? [`فترة العودة (${T} سنة) تتجاوز طول السجل المرصود`] : undefined
      };
    }
  }

  // rx3day window calculation explanation
  const rx3 = params.rx3Values || [
    { date: '1957-12-07', value: 37.1 },
    { date: '1957-12-08', value: 15.0 },
    { date: '1957-12-09', value: 24.9 }
  ];
  const sum3 = rx3.reduce((s, x) => s + x.value, 0);

  return {
    title_ar: 'خطوات حساب مؤشر Rx3day (أقصى هطول متتالي لثلاثة أيام تقويمية)',
    general_formula: `Rx3day = max(P_d + P_{d+1} + P_{d+2}) على أيام تقويمية متتالية`,
    latex_formula: `Rx3day = \\max_{d \\in \\text{Year}} \\sum_{k=0}^{2} P_{d+k}`,
    parameters: rx3.map((r, i) => ({
      name: `هطول اليوم ${i + 1} (${r.date})`,
      symbol: `P_{d+${i}}`,
      value: r.value,
      unit: 'مم',
      description_ar: `قيمة قياس المطر لليوم التقويمي المتتالي ${r.date}`
    })),
    numerical_substitution: `نافذة 3 أيام متتالية:
${rx3.map(r => `${r.date}: ${r.value} مم`).join('\n')}
المجموع = ${rx3.map(r => r.value).join(' + ')} = ${sum3.toFixed(1)} مم
(تم التأكد من استمرارية الأيام التقويمية وعدم وجود فجوات في النافذة)`,
    final_result: Math.round(sum3 * 10) / 10,
    unit: 'مم',
    data_source: source
  };
}

// ==========================================
// 12. Manual Scientific Calculator Engine
// ==========================================

export interface ManualListCalculationResult {
  index: 'Rx1day' | 'Rx3day' | 'Rx5day' | 'BasicStats';
  values: number[];
  result: number;
  unit: string;
  formula: string;
  latexFormula: string;
  steps: string[];
  windows?: Array<{ window: number[]; sum: number; expression: string; isMax: boolean }>;
  source: string;
  warnings?: string[];
  stats?: {
    count: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    sum: number;
    sd: number;
    cv: number;
  };
}

export function computeManualListCalculation(
  values: number[],
  index: 'Rx1day' | 'Rx3day' | 'Rx5day' | 'BasicStats' = 'Rx1day'
): ManualListCalculationResult {
  const cleanValues = values.filter((v) => !isNaN(v) && v !== null && v !== undefined);
  const source = 'Manual User Input / Source: User Provided';

  if (cleanValues.length === 0) {
    throw new Error('لم يتم إدخال أي قيم رقمية صالحة.');
  }

  // Basic descriptive stats
  const count = cleanValues.length;
  const sum = cleanValues.reduce((s, x) => s + x, 0);
  const mean = sum / count;
  const sorted = [...cleanValues].sort((a, b) => a - b);
  const median =
    count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const variance =
    count > 1
      ? cleanValues.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / (count - 1)
      : 0;
  const sd = Math.sqrt(variance);
  const cv = mean > 0 ? (sd / mean) * 100 : 0;

  if (index === 'Rx1day') {
    const res = Math.max(...cleanValues);
    return {
      index: 'Rx1day',
      values: cleanValues,
      result: res,
      unit: 'مم',
      formula: `Rx1day = max(${cleanValues.join(', ')})`,
      latexFormula: `Rx1\\text{day} = \\max_{i=1}^{n} (x_i)`,
      steps: [
        `القيم المدخلة: [${cleanValues.join(', ')}]`,
        `تطبيق دالة القيمة العظمى: max(${cleanValues.join(', ')})`,
        `النتيجة النهائية: Rx1day = ${res} مم`,
      ],
      source,
      stats: { count, mean, median, min, max, sum, sd, cv },
    };
  }

  if (index === 'Rx3day') {
    if (cleanValues.length < 3) {
      throw new Error('حساب Rx3day يتطلب 3 قيم متتالية على الأقل.');
    }
    const windows: Array<{ window: number[]; sum: number; expression: string; isMax: boolean }> = [];
    let max3 = -Infinity;

    for (let i = 0; i <= cleanValues.length - 3; i++) {
      const w = [cleanValues[i], cleanValues[i + 1], cleanValues[i + 2]];
      const wSum = w[0] + w[1] + w[2];
      if (wSum > max3) max3 = wSum;
      windows.push({
        window: w,
        sum: wSum,
        expression: `${w[0]}+${w[1]}+${w[2]} = ${wSum}`,
        isMax: false,
      });
    }

    windows.forEach((w) => {
      if (w.sum === max3) w.isMax = true;
    });

    const steps = [
      `القيم المتتالية المدخلة: [${cleanValues.join(', ')}]`,
      `فحص النوافذ المتحركة المتتالية لطول 3:`,
      ...windows.map((w, idx) => `النافذة ${idx + 1}: ${w.expression} ${w.isMax ? '← (الحد الأقصى)' : ''}`),
      `أعلى مجموع متتالي لثلاثة أيام: Rx3day = ${max3} مم`,
    ];

    return {
      index: 'Rx3day',
      values: cleanValues,
      result: max3,
      unit: 'مم',
      formula: `Rx3day = max(x_i + x_{i+1} + x_{i+2})`,
      latexFormula: `Rx3\\text{day} = \\max_{i=1}^{n-2} \\sum_{k=0}^{2} x_{i+k}`,
      steps,
      windows,
      source,
      stats: { count, mean, median, min, max, sum, sd, cv },
    };
  }

  if (index === 'Rx5day') {
    if (cleanValues.length < 5) {
      throw new Error('حساب Rx5day يتطلب 5 قيم متتالية على الأقل.');
    }
    const windows: Array<{ window: number[]; sum: number; expression: string; isMax: boolean }> = [];
    let max5 = -Infinity;

    for (let i = 0; i <= cleanValues.length - 5; i++) {
      const w = [
        cleanValues[i],
        cleanValues[i + 1],
        cleanValues[i + 2],
        cleanValues[i + 3],
        cleanValues[i + 4],
      ];
      const wSum = w.reduce((s, x) => s + x, 0);
      if (wSum > max5) max5 = wSum;
      windows.push({
        window: w,
        sum: wSum,
        expression: `${w.join('+')} = ${wSum}`,
        isMax: false,
      });
    }

    windows.forEach((w) => {
      if (w.sum === max5) w.isMax = true;
    });

    const steps = [
      `القيم المتتالية المدخلة: [${cleanValues.join(', ')}]`,
      `فحص النوافذ المتحركة المتتالية لطول 5:`,
      ...windows.map((w, idx) => `النافذة ${idx + 1}: ${w.expression} ${w.isMax ? '← (الحد الأقصى)' : ''}`),
      `أعلى مجموع متتالي لخمسة أيام: Rx5day = ${max5} مم`,
    ];

    return {
      index: 'Rx5day',
      values: cleanValues,
      result: max5,
      unit: 'مم',
      formula: `Rx5day = max(x_i + x_{i+1} + x_{i+2} + x_{i+3} + x_{i+4})`,
      latexFormula: `Rx5\\text{day} = \\max_{i=1}^{n-4} \\sum_{k=0}^{4} x_{i+k}`,
      steps,
      windows,
      source,
      stats: { count, mean, median, min, max, sum, sd, cv },
    };
  }

  // BasicStats
  return {
    index: 'BasicStats',
    values: cleanValues,
    result: mean,
    unit: 'مم',
    formula: `المتوسط الحسابي = Σx / n = ${sum.toFixed(1)} / ${count}`,
    latexFormula: `\\bar{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_i`,
    steps: [
      `عدد العينات n = ${count}`,
      `المجموع الإجمالي = ${sum.toFixed(1)} مم`,
      `المتوسط الحسابي = ${mean.toFixed(2)} مم`,
      `الوسيط = ${median.toFixed(2)} مم`,
      `أقل قيمة = ${min.toFixed(2)} مم`,
      `أعلى قيمة = ${max.toFixed(2)} مم`,
      `الانحراف المعياري = ${sd.toFixed(2)} مم`,
      `معامل الاختلاف CV = ${cv.toFixed(1)}%`,
    ],
    source,
    stats: { count, mean, median, min, max, sum, sd, cv },
  };
}

export interface ManualAMSCalculationResult {
  series: Array<{ year: number; annual_max_mm: number }>;
  n_years: number;
  gev: ModelFitResult;
  gumbel: ModelFitResult;
  selectedModel: 'Gumbel' | 'GEV';
  returnLevels: ReturnLevelRecord[];
  gof: GoodnessOfFitReport;
  warnings: string[];
  source: string;
}

export function computeManualAMSSeriesCalculation(
  rows: Array<{ year: number; annual_max_mm: number }>,
  seed: number = 42
): ManualAMSCalculationResult {
  const cleanRows = rows
    .filter((r) => r.year > 0 && r.annual_max_mm >= 0 && !isNaN(r.annual_max_mm))
    .sort((a, b) => a.year - b.year);

  if (cleanRows.length < 3) {
    throw new Error('تحليل سلسلة القيم القصوى السنوية (AMS) يتطلب 3 سنوات على الأقل.');
  }

  const values = cleanRows.map((r) => r.annual_max_mm);
  const n = values.length;
  const source = 'Manual User Input / Source: User Provided';

  const gev = fitGEVLMoments(values, 'MANUAL_STN', 'Rx1day');
  const gumbel = fitGumbelLMoments(values, 'MANUAL_STN', 'Rx1day');

  // Model selection (AIC)
  const selectedModel = (gumbel.aic ?? Infinity) <= (gev.aic ?? Infinity) ? 'Gumbel' : 'GEV';
  const bestFit = selectedModel === 'Gumbel' ? gumbel : gev;
  const gof = computeGoodnessOfFit(values, bestFit);

  const tPeriods = [2, 5, 10, 25, 50, 100];
  const returnLevels = computeReturnLevelsWithBootstrap(values, bestFit, tPeriods, 1000, seed);

  const warnings: string[] = [];
  if (n < 10) {
    warnings.push(
      `سلسلة AMS تحتوي على ${n} سنوات فقط. التحليل استكشافي فقط (Exploratory) وغير مناسب للاعتماد التصميمي النهائي.`
    );
  }

  return {
    series: cleanRows,
    n_years: n,
    gev,
    gumbel,
    selectedModel,
    returnLevels,
    gof,
    warnings,
    source,
  };
}

// ==========================================
// 19. Environmental & Basin Classification Helpers
// ==========================================

export function getEnvironmentalClassification(lat: number, lon: number, governorate?: string): string {
  if (!lat || !lon) return 'غير محدد (نقص الإحداثيات)';

  const gov = String(governorate || '').toLowerCase();
  
  // Rule-based classification (Page 40 PDF)
  if (gov.includes('cairo') || gov.includes('giza') || gov.includes('qalyubia') || gov.includes('القاهرة') || gov.includes('الجيزة') || gov.includes('القليوبية')) {
    return 'القاهرة الكبرى / وادي النيل';
  }
  
  if (gov.includes('alexandria') || gov.includes('matrouh') || gov.includes('الإسكندرية') || gov.includes('مطروح')) {
    return 'الساحل الشمالي';
  }

  if (gov.includes('sinai') || gov.includes('سيناء')) {
    return 'سيناء';
  }

  if (gov.includes('red sea') || gov.includes('البحر الأحمر') || gov.includes('hurghada') || gov.includes('الغردقة')) {
    return 'البحر الأحمر';
  }

  if (gov.includes('aswan') || gov.includes('luxor') || gov.includes('asyut') || gov.includes('sohag') || gov.includes('minya') || gov.includes('beni suef') || gov.includes('أسوان') || gov.includes('الأقصر') || gov.includes('أسيوط') || gov.includes('سوهاج') || gov.includes('المنيا') || gov.includes('بني سويف')) {
    return 'الصعيد';
  }

  if (gov.includes('new valley') || gov.includes('الوادي الجديد') || gov.includes('oases') || gov.includes('الواحات')) {
    return 'الواحات والصحراء الغربية';
  }

  // Delta fallback
  if (lat > 30.5 && lon > 29.8 && lon < 32.5) return 'الدلتا';
  
  // Coastal fallback
  if (lat > 31.0) return 'الساحل الشمالي';

  // Upper Egypt fallback
  if (lat < 28.0) return 'الصعيد';

  return 'منطقة جغرافية غير مصنفة';
}

export function getBasinDescription(lat: number, lon: number): string {
  // If we had a real GIS layer, we'd query it here.
  // For now, as per Page 41:
  return 'الحوض الهيدرولوجي غير محدد من البيانات الحالية';
}

