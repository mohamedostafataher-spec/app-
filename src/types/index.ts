/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Type Definitions
 */

export type Language = 'ar' | 'en';

// Source Classification
export type SourceClassification =
  | 'Official Egyptian Station Data'
  | 'Public Station Archive'
  | 'Satellite/Grid Dataset'
  | 'Subnational Admin Aggregates'
  | 'User Upload'
  | 'Unverified';

export interface StationMetadata {
  station_id: string;
  station_name: string;
  governorate: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  start_date: string;
  end_date: string;
  instrument_type: string;
  station_status: 'active' | 'inactive' | 'relocated';
  relocation_date?: string;
  data_owner: string;
  data_source: string;
  notes: string;
  is_gridded?: boolean; // e.g. CHIRPS / GPM vs ground station
  source_classification?: SourceClassification;
  ghcn_id?: string;
  official_permit_verified?: boolean;
}

export interface GovernorateRiskProfile {
  governorate_ar: string;
  governorate_en: string;
  region_ar: string;
  region_en: string;
  stations_count: number;
  station_ids: string[];
  annual_mean_rainfall_mm: number;
  max_daily_observed_mm: number;
  max_3day_mm: number;
  max_5day_mm: number;
  historical_extreme_event: string;
  return_level_50yr_mm: number;
  return_level_100yr_mm: number;
  return_level_ci_range: string;
  risk_level: 'حرج جداً' | 'مرتفع' | 'متوسط' | 'منخفض';
  risk_level_en: 'Critical' | 'High' | 'Medium' | 'Low';
  data_source_category: SourceClassification;
  data_quality_score: number;
  notes_ar: string;
  recommended_design_guideline: string;
}

export interface PublicDataManifestItem {
  file_name: string;
  title_ar: string;
  title_en: string;
  provider: string;
  classification: SourceClassification;
  temporal_coverage: string;
  resolution: string;
  size_kb: number;
  variables: string[];
  url: string;
  official_warning_ar: string;
}


export interface DailyRecord {
  date: string; // ISO YYYY-MM-DD
  station_id: string;
  station_name: string;
  governorate: string;
  latitude: number;
  longitude: number;
  rainfall_mm: number | null; // null if missing
  raw_value?: string;
  quality_flag: 'valid' | 'missing' | 'suspect' | 'estimated' | 'rejected_negative';
  source: string;
}

export interface HourlyRecord {
  datetime: string; // ISO 8601
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  rainfall_mm: number | null;
  timezone: string;
  quality_flag: 'valid' | 'missing' | 'suspect' | 'estimated';
  source: string;
}

export interface CalendarAnalysis {
  calendar_span_days: number;
  rows_supplied: number;
  coverage_percentage: number;
  calendar_gaps_count: number;
  longest_gap_days: number;
  missing_calendar_days: number;
  quality_status: 'Good' | 'Needs Review' | 'Not Suitable';
  status_reasons: string[];
  duplicate_dates_count: number;
  duplicate_dates: string[];
}

export interface YearCompleteness {
  year: number;
  expected_records: number;
  actual_records: number;
  missing_records: number;
  completeness_percentage: number;
  eligible_for_ams: boolean;
  exclusion_reason?: string;
  warning?: string;
}

export interface QualityReport {
  station_id: string;
  station_name: string;
  total_rows: number;
  start_date: string;
  end_date: string;
  total_missing: number;
  missing_percentage: number;
  negative_count: number;
  duplicate_count: number;
  max_dry_spell_days: number;
  longest_missing_gap_days: number;
  min_rainfall: number;
  max_rainfall: number;
  calendar_analysis?: CalendarAnalysis;
  suspected_outliers: Array<{
    date: string;
    value: number;
    method: string;
    z_score?: number;
    decision: 'suspected' | 'kept' | 'flagged';
  }>;
  annual_completeness: YearCompleteness[];
  overall_rating: 'ممتاز' | 'جيد' | 'مقبول' | 'ضعيف' | 'غير صالح للنمذجة';
  overall_rating_en: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Unsuitable';
}

export interface HomogeneityResult {
  station_id: string;
  station_name: string;
  test_name: string;
  statistic: number;
  p_value: number;
  change_point_year?: number;
  is_significant: boolean;
  significance_level: number;
  interpretation_ar: string;
  interpretation_en: string;
  warning?: string;
}

export interface HomogeneityReport {
  station_id: string;
  pettitt: HomogeneityResult;
  snht: HomogeneityResult;
  buishand: HomogeneityResult;
  von_neumann?: HomogeneityResult;
  mann_kendall: {
    statistic_S: number;
    variance_S: number;
    z_score: number;
    p_value: number;
    trend: 'increasing' | 'decreasing' | 'no_trend';
    sen_slope_mm_per_year: number;
    interpretation_ar: string;
    interpretation_en: string;
  };
  overall_homogeneity_status: 'homogeneous' | 'suspected_inhomogeneity' | 'inhomogeneous';
}

export interface RainfallCharacterization {
  station_id: string;
  station_name: string;
  n_days: number;
  n_rainy_days: number;
  rainy_day_threshold: number; // default 1.0 mm
  annual_mean_mm: number;
  annual_std_mm: number;
  daily_mean_mm: number;
  daily_median_mm: number;
  daily_std_mm: number;
  daily_variance_mm: number;
  daily_cv: number; // coeff of variation
  daily_min_mm: number;
  daily_max_mm: number;
  skewness: number;
  kurtosis: number;
  percentiles: {
    p1: number;
    p5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  max_dry_spell: number;
  max_wet_spell: number;
  monthly_climatology: Array<{
    month: number;
    month_name_ar: string;
    month_name_en: string;
    mean_rainfall_mm: number;
    total_rainfall_mm: number;
    rainy_days: number;
    max_daily_mm: number;
  }>;
  annual_totals: Array<{
    year: number;
    total_mm: number;
    rainy_days: number;
    anomaly_mm: number;
  }>;
}

export interface ExtremeIndexRecord {
  year: number;
  station_id: string;
  index_name: 'Rx1day' | 'Rx3day' | 'Rx5day';
  value_mm: number;
  start_date: string;
  end_date: string;
  valid_records: number;
  completeness: number;
  eligible: boolean;
  warning?: string;
}

export interface AMSRecord {
  year: number;
  station_id: string;
  index_name: 'Rx1day' | 'Rx3day' | 'Rx5day';
  maximum_value_mm: number;
  start_date: string;
  end_date: string;
  valid_records: number;
  completeness_percentage: number;
  eligible_for_model: boolean;
  exclusion_reason?: string;
}

export interface ModelFitResult {
  station_id: string;
  index_name: 'Rx1day' | 'Rx3day' | 'Rx5day';
  model: 'GEV' | 'Gumbel';
  method: 'MLE' | 'L-Moments';
  estimation_method?: string;
  convergence_status?: string;
  n_observations: number;
  mu: number;     // location
  sigma: number;  // scale (must be > 0)
  xi: number;     // shape (xi = 0 for Gumbel)
  log_likelihood: number;
  aic: number;
  bic: number;
  convergence: boolean;
  warning?: string;
  selected?: boolean;
}

export interface GoodnessOfFitReport {
  station_id: string;
  index_name: 'Rx1day' | 'Rx3day' | 'Rx5day';
  model: 'GEV' | 'Gumbel';
  ks_statistic: number;
  ks_p_value: number;
  ad_statistic: number; // Anderson-Darling
  ad_critical_value_95: number;
  ad_passed: boolean;
  cvm_statistic: number; // Cramer-von Mises
  chi_square_statistic?: number;
  chi_square_p_value?: number;
  qq_points: Array<{ empirical: number; theoretical: number }>;
  pp_points: Array<{ empirical_p: number; theoretical_p: number }>;
  aic: number;
  bic: number;
  recommended: boolean;
  decision_reason_ar: string;
  decision_reason_en: string;
  detailed_tests?: Array<{
    test_name: string;
    statistic: number;
    p_value_or_method: string;
    decision: string;
    interpretation: string;
    warning?: string;
  }>;
}

export interface ReturnLevelRecord {
  station_id: string;
  index_name: 'Rx1day' | 'Rx3day' | 'Rx5day';
  model: 'GEV' | 'Gumbel';
  return_period_years: number;
  return_level_mm: number;
  lower_ci_mm: number;
  upper_ci_mm: number;
  confidence_level: number;
  method: string;
  replications?: number;
  successful_replications?: number;
  failed_replications?: number;
  random_seed?: number;
  n_years: number;
  extrapolation_warning: boolean;
  extrapolation_message?: string;
}

export interface CalculationStepExplanation {
  title_ar: string;
  general_formula: string;
  latex_formula: string;
  parameters: Array<{ name: string; symbol: string; value: number | string; unit?: string; description_ar: string }>;
  numerical_substitution: string;
  final_result: string | number;
  unit: string;
  data_source: string;
  warnings?: string[];
}

export interface StormEvent {
  event_id: string;
  event_name: string;
  start_datetime: string;
  end_datetime: string;
  region: string;
  station_ids: string[];
  source: string;
  notes: string;
  metrics: {
    event_total_mm: number;
    max_daily_mm: number;
    max_3day_mm: number;
    max_5day_mm: number;
    max_hourly_mm?: number;
    max_3hour_mm?: number;
    max_6hour_mm?: number;
    duration_days: number;
    rainy_days_count: number;
    historical_rank: number;
    percentile_in_history: number;
    estimated_return_period_years: number;
    return_period_ci_range: string;
  };
  hyetograph?: Array<{ timestamp: string; rainfall_mm: number; cumulative_mm: number }>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  region: string;
  station_ids: string[];
  period_start: string;
  period_end: string;
  source_name: string;
  researcher_name: string;
  created_at: string;
  status: 'Draft' | 'Data Uploaded' | 'Quality Review' | 'Ready for Analysis' | 'Analysis Completed' | 'Has Warnings' | 'Report Ready';
  is_demo: boolean;
  completeness_threshold: number; // default 90%
  rainy_day_threshold: number; // default 1.0 mm
  confidence_level: number; // default 95%
  bootstrap_replications: number; // default 5000
}

export interface AnalysisRunLog {
  analysis_run_id: string;
  timestamp: string;
  project_id: string;
  station_id: string;
  input_file_name: string;
  input_hash: string;
  data_source: string;
  period: string;
  index_name: 'Rx1day' | 'Rx3day' | 'Rx5day';
  selected_model: 'GEV' | 'Gumbel';
  estimation_method: 'MLE' | 'L-Moments';
  completeness_threshold: number;
  rainy_day_threshold: number;
  confidence_level: number;
  bootstrap_replications: number;
  random_seed: number;
  software_version: string;
  scientific_lead: string;
  safety_score: number;
  warnings: string[];
  return_levels: Record<number, { level: number; lower: number; upper: number }>;
}

// Innovation Layer Types
export interface ResultTrustFingerprint {
  fingerprint_id: string;
  run_id: string;
  data_source: string;
  station_code: string;
  n_years: number;
  completeness_avg: number;
  fitted_model: string;
  estimation_method: string;
  ci_width_pct: number;
  break_detected: boolean;
  extrapolation_flag: boolean;
  safety_score: number;
  scientific_lead: string;
}

export interface StatisticalSafetyScore {
  score: number; // 0 to 100
  rating: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Critical Warning';
  rating_ar: 'مرتفع جداً وموثوق' | 'مرتفع' | 'متوسط' | 'منخفض' | 'تحذير حرج';
  breakdown: Array<{
    criterion: string;
    criterion_ar: string;
    points: number;
    max_points: number;
    notes_ar: string;
  }>;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  name_ar: string;
  base_run_id: string;
  excluded_years: number[];
  completeness_threshold: number;
  preferred_model: 'GEV' | 'Gumbel';
  rainy_threshold: number;
  results?: {
    ams_count: number;
    mu: number;
    sigma: number;
    xi: number;
    t10: number;
    t50: number;
    t100: number;
  };
}

export interface SourceTwinComparison {
  ground_station_id: string;
  gridded_source_name: string; // e.g. CHIRPS v2.0 or NASA GPM
  period: string;
  metrics: {
    mean_bias_mm: number;
    rmse_mm: number;
    correlation_r: number;
    ground_max_mm: number;
    gridded_max_mm: number;
    ground_rx1_mean: number;
    gridded_rx1_mean: number;
    difference_at_t100_mm: number;
  };
  pairs: Array<{ date: string; ground_mm: number; gridded_mm: number }>;
}

export interface AnalysisPlan {
  query: string;
  understanding_ar: string;
  understanding_en: string;
  data_to_use_ar: string;
  data_to_use_en: string;
  station_id: string;
  station_name: string;
  time_period: string;
  start_year: number;
  end_year: number;
  requested_index: string;
  statistical_model: string;
  equation: string;
  equation_math: string;
  assumptions_ar: string[];
  warnings_ar: string[];
  can_execute: boolean;
  target_topic:
    | 'rx1day'
    | 'rx3day'
    | 'rx5day'
    | 'gev'
    | 'gumbel'
    | 'comparison'
    | 'return_level'
    | 'storm_daniel'
    | 'excluded_year'
    | 'confidence_interval'
    | 'best_model'
    | 'quality';
}

export interface AnalysisExecutionResult {
  run_id: string;
  query: string;
  title_ar: string;
  title_en: string;
  definition_ar: string;
  equation_math: string;
  equation_symbols: Array<{ symbol: string; explanation_ar: string; explanation_en?: string }>;
  data_used_summary: string;
  data_source: string;
  station_name: string;
  station_id: string;
  years_count: number;
  period: string;
  calculation_steps: Array<{ step_num: number; title: string; detail: string; value?: string }>;
  result_numeric: number | string;
  unit: string;
  confidence_interval?: {
    level_percent: number;
    lower: number;
    upper: number;
    method: string;
  };
  warnings: string[];
  notes: string[];
  scientific_ownership: string;
  timestamp: string;
  detailed_table?: Array<Record<string, any>>;
  nav_target?: string;
}

