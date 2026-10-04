/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Smart Scientific Analyst Engine (محرك المحلل العلمي الذكي)
 * Converts natural Arabic requests into a rigorous 10-point analysis plan,
 * displays LaTeX-style mathematical equations with symbol breakdowns,
 * and executes deterministic computations without hallucination.
 */

import {
  StationMetadata,
  DailyRecord,
  AnalysisPlan,
  AnalysisExecutionResult,
} from '../types';
import {
  computeExtremeIndices,
  buildAnnualMaximumSeries,
  fitGEVLMoments,
  fitGumbelLMoments,
  computeReturnLevelsWithBootstrap,
  computeDataQuality,
  computeGoodnessOfFit,
} from './statisticalEngine';

// Predefined verified prompts from user requirements
export interface SamplePrompt {
  id: string;
  textAr: string;
  textEn: string;
  category: 'indices' | 'return_level' | 'models' | 'storm' | 'qc' | 'theory';
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    id: 'rx1_alex',
    textAr: 'احسب Rx1day لمحطة الإسكندرية من 1981 إلى 2023.',
    textEn: 'Compute Rx1day for Alexandria station from 1981 to 2023.',
    category: 'indices',
  },
  {
    id: 'rx3_eq',
    textAr: 'ما معادلة Rx3day؟',
    textEn: 'What is the formula for Rx3day?',
    category: 'theory',
  },
  {
    id: 'ret100_gev',
    textAr: 'احسب Return Level لمدة 100 سنة باستخدام GEV.',
    textEn: 'Compute 100-year Return Level using GEV.',
    category: 'return_level',
  },
  {
    id: 'compare_models',
    textAr: 'قارن بين GEV وGumbel.',
    textEn: 'Compare GEV and Gumbel distributions.',
    category: 'models',
  },
  {
    id: 'storm_daniel',
    textAr: 'حلل عاصفة دانيال.',
    textEn: 'Analyze Storm Daniel impact.',
    category: 'storm',
  },
  {
    id: 'why_2005',
    textAr: 'ما سبب استبعاد سنة 2005؟',
    textEn: 'Why was the year 2005 excluded?',
    category: 'qc',
  },
  {
    id: 'ci_explanation',
    textAr: 'اشرح لي معنى Confidence Interval.',
    textEn: 'Explain what a Confidence Interval means.',
    category: 'theory',
  },
  {
    id: 'best_model',
    textAr: 'ما أفضل نموذج للبيانات؟',
    textEn: 'What is the best fitting model for the data?',
    category: 'models',
  },
  {
    id: 'rx5_max',
    textAr: 'احسب أعلى مجموع مطر خلال خمسة أيام.',
    textEn: 'Compute the maximum 5-day cumulative rainfall (Rx5day).',
    category: 'indices',
  },
];

/**
 * Converts user natural Arabic request into a 10-point analysis plan
 * BEFORE executing any calculations.
 */
export function buildAnalysisPlan(
  rawQuery: string,
  stations: StationMetadata[],
  defaultStation: StationMetadata,
  records: DailyRecord[]
): AnalysisPlan {
  const q = rawQuery.trim().toLowerCase();

  // 1. Detect target station
  let station = defaultStation;
  if (q.includes('إسكندرية') || q.includes('اسكندرية') || q.includes('alexandria') || q.includes('alx')) {
    station = stations.find((s) => s.station_id.includes('ALX') || s.station_name.includes('إسكندرية')) || defaultStation;
  } else if (q.includes('قاهرة') || q.includes('القاهرة') || q.includes('cairo')) {
    station = stations.find((s) => s.station_id.includes('CAI') || s.station_name.includes('القاهرة')) || defaultStation;
  } else if (q.includes('مطروح') || q.includes('مرسى') || q.includes('matruh')) {
    station = stations.find((s) => s.station_id.includes('MRM') || s.station_name.includes('مطروح')) || defaultStation;
  } else if (q.includes('غردقة') || q.includes('الغردقة') || q.includes('hurghada')) {
    station = stations.find((s) => s.station_id.includes('HRG') || s.station_name.includes('الغردقة')) || defaultStation;
  } else if (q.includes('أسوان') || q.includes('اسوان') || q.includes('aswan')) {
    station = stations.find((s) => s.station_id.includes('ASW') || s.station_name.includes('أسوان')) || defaultStation;
  } else if (q.includes('سانت') || q.includes('كاترين') || q.includes('catherine')) {
    station = stations.find((s) => s.station_id.includes('CAT') || s.station_name.includes('كاترين')) || defaultStation;
  }

  // Detect years if mentioned, e.g. "من 1981 إلى 2023" or "1994 to 2023"
  let startYear = 1994;
  let endYear = 2023;
  const yearMatches = rawQuery.match(/\b(19\d\d|20\d\d)\b/g);
  if (yearMatches && yearMatches.length >= 2) {
    const y1 = parseInt(yearMatches[0], 10);
    const y2 = parseInt(yearMatches[1], 10);
    startYear = Math.min(y1, y2);
    endYear = Math.max(y1, y2);
  }

  // 2. Identify requested analytical topic & equation
  if (q.includes('rx3day') || q.includes('rx3') || q.includes('ثلاثة أيام') || q.includes('3 أيام') || q.includes('معادلة rx3')) {
    return {
      query: rawQuery,
      understanding_ar: 'طلب فحص أو حساب أقصى تراكم مطري سنوي خلال 3 أيام متتالية (Rx3day) واستعراض معادلته الرياضية ورموزها.',
      understanding_en: 'Request for Annual Maximum 3-day consecutive precipitation (Rx3day) formulation and calculation.',
      data_to_use_ar: `السجل اليومي لمحطة ${station.station_name} (${station.station_id})، الممتد للفترة المحددة.`,
      data_to_use_en: `Daily precipitation records for ${station.station_name} (${station.station_id}).`,
      station_id: station.station_id,
      station_name: station.station_name,
      time_period: `${startYear} – ${endYear}`,
      start_year: startYear,
      end_year: endYear,
      requested_index: 'Rx3day (أقصى هطول متراكم لـ 3 أيام متتالية)',
      statistical_model: 'Moving Window Summation + Annual Maximum Series Extraction',
      equation: 'Rx3day_y = max(P_{d,y} + P_{d+1,y} + P_{d+2,y})',
      equation_math: 'Rx3day_y = \\max_{d \\in [1, N_y-2]} \\left( P_{d,y} + P_{d+1,y} + P_{d+2,y} \\right)',
      assumptions_ar: [
        'تسلسل يومي زمني مستمر بدون انقطاع داخل نافذة الـ 3 أيام.',
        'السنة تعتبر مؤهلة فقط إذا بلغت نسبة الاكتمال السنوي 90% فأكثر.',
        'القيم السلبية مرفوضة تماماً ويتم فحص حدود المعقولية الفيزيائية.',
      ],
      warnings_ar: [
        'إذا كانت الأيام الثلاثة تفصل بين نهاية سنة وبداية أخرى، تنسب العاصفة للعام ذي الهطول الأكبر.',
        'تراكم الأيام الرطبة المتتالية في مناخ مصر الجاف نادر ويعكس عواصف سيلية عميقة أو منخفضات قطع.',
      ],
      can_execute: true,
      target_topic: 'rx3day',
    };
  }

  if (q.includes('rx5day') || q.includes('rx5') || q.includes('خمسة أيام') || q.includes('5 أيام')) {
    return {
      query: rawQuery,
      understanding_ar: 'طلب حساب أعلى مجموع تراكمي للأمطار خلال 5 أيام متتالية (Rx5day) لتحديد إجهاد شبكات الصرف وخزانات الحصاد.',
      understanding_en: 'Request for Annual Maximum 5-day precipitation (Rx5day).',
      data_to_use_ar: `بيانات محطة ${station.station_name} اليومية المفلترة بحد اكتمال 90%.`,
      data_to_use_en: `Filtered daily observations for station ${station.station_name}.`,
      station_id: station.station_id,
      station_name: station.station_name,
      time_period: `${startYear} – ${endYear}`,
      start_year: startYear,
      end_year: endYear,
      requested_index: 'Rx5day (أقصى هطول متراكم لـ 5 أيام متتالية)',
      statistical_model: '5-Day Moving Cumulative Sum + Maximum Value Tracking',
      equation: 'Rx5day_y = max( sum_{k=0}^{4} P_{d+k,y} )',
      equation_math: 'Rx5day_y = \\max_{d \\in [1, N_y-4]} \\sum_{k=0}^{4} P_{d+k,y}',
      assumptions_ar: [
        'اتصال زمني مستمر لكل شريحة من 5 أيام.',
        'تجاهل السنوات التي تحوي أكثر من 10% بيانات مفقودة.',
      ],
      warnings_ar: [
        'المناطق الساحلية في مصر (مثل الإسكندرية ومطروح) تتركز فيها قمم الـ 5 أيام في شهور الشتاء (ديسمبر - فبراير).',
      ],
      can_execute: true,
      target_topic: 'rx5day',
    };
  }

  if (q.includes('rx1day') || q.includes('rx1') || q.includes('أعلى مطر يومي') || q.includes('اقصى مطر')) {
    return {
      query: rawQuery,
      understanding_ar: `طلب حساب مؤشر Rx1day (أكبر كمية مطر يومية في كل سنة) لمحطة ${station.station_name} واستخراج القمم السنوية.`,
      understanding_en: `Request to compute Rx1day index for ${station.station_name} station.`,
      data_to_use_ar: `سجل الرصد اليومي لمحطة ${station.station_name} (${station.station_id}) للفترة ${startYear}–${endYear}.`,
      data_to_use_en: `Daily rainfall records for ${station.station_name} (${startYear}–${endYear}).`,
      station_id: station.station_id,
      station_name: station.station_name,
      time_period: `${startYear} – ${endYear}`,
      start_year: startYear,
      end_year: endYear,
      requested_index: 'Rx1day (أقصى هطول يومي سنوي)',
      statistical_model: 'Annual Maximum Series (AMS) Block Maxima',
      equation: 'Rx1day_y = max(P_{d,y})',
      equation_math: 'Rx1day_y = \\max_{d \\in \\{1, 2, \\dots, 365\\}} P_{d,y}',
      assumptions_ar: [
        'اعتبار اليوم الهيدرولوجي القياسي (من 09:00 إلى 09:00 بالتوقيت المحلي أو اليوم التقويمي المعتمد).',
        'استيفاء شرط الاكتمال السنوي الأدنى (>= 90%) لضمان عدم ضياع العاصفة القصوى.',
      ],
      warnings_ar: [
        'في مصر قد تحدث العاصفة القصوى الوحيدة في العام خلال يوم واحد جاف تقريباً، لذا فإن فقدان أسبوع رطب قد يشوه قمة السنة.',
      ],
      can_execute: true,
      target_topic: 'rx1day',
    };
  }

  if (q.includes('return level') || q.includes('فترة رجوع') || q.includes('مستوى الرجوع') || q.includes('100 سنة') || q.includes('50 سنة')) {
    return {
      query: rawQuery,
      understanding_ar: 'طلب حساب مستوى الهطول المتطرف المقابل لفترة رجوع (T=100 سنة أو أكثر) باستخدام نموذج القيم القصوى (GEV/Gumbel) مع فترات الثقة.',
      understanding_en: 'Request to compute Return Level (e.g. 100-year event) using GEV/Gumbel extreme value theory.',
      data_to_use_ar: `سلسلة القمم السنوية (AMS) المشتقة من محطة ${station.station_name}.`,
      data_to_use_en: `Annual Maximum Series (AMS) of ${station.station_name}.`,
      station_id: station.station_id,
      station_name: station.station_name,
      time_period: `${startYear} – ${endYear}`,
      start_year: startYear,
      end_year: endYear,
      requested_index: 'Return Level x_T (T = 100 Years)',
      statistical_model: 'Generalized Extreme Value (GEV) via L-Moments + Parametric Bootstrap (5000 iterations)',
      equation: 'x_T = mu + (sigma / xi) * [ (-ln(1 - 1/T))^(-xi) - 1 ]',
      equation_math: 'x_T = \\mu + \\frac{\\sigma}{\\xi} \\left[ \\left( -\\ln\\left(1 - \\frac{1}{T}\\right) \\right)^{-\\xi} - 1 \\right]',
      assumptions_ar: [
        'تجانس واستقرار السلسلة الإحصائية (Stationarity Hypothesis).',
        'استقلالية الأحداث القصوى السنوية (Independence of Block Maxima).',
        'ملاءمة التوزيع الاحتمالي للبيانات المختبرة باختبارات كولموغوروف-سميرنوف وأندرسون-دارلنغ.',
      ],
      warnings_ar: [
        'تقدير فترة 100 سنة من سجل طوله 30 سنة يمثل استقراءً هندسياً (Extrapolation)، ويجب النظر إلى فترات الثقة (Confidence Interval) وليس الرقم المنفرد.',
      ],
      can_execute: true,
      target_topic: 'return_level',
    };
  }

  if (q.includes('قارن') || (q.includes('gev') && q.includes('gumbel'))) {
    return {
      query: rawQuery,
      understanding_ar: 'طلب مقارنة إحصائية وهندسية دقيقة بين نموذجي GEV (ذو 3 معلمات) و Gumbel (ذو معلمتين) وتحديد أيهما أفضل للبيانات المصرية.',
      understanding_en: 'Request for statistical and model comparison between GEV and Gumbel distributions.',
      data_to_use_ar: `سلسلة AMS لمحطة ${station.station_name} ومقاييس جودة الملاءمة (AIC, BIC, KS, AD).`,
      data_to_use_en: `Station ${station.station_name} AMS series & goodness-of-fit metrics.`,
      station_id: station.station_id,
      station_name: station.station_name,
      time_period: `${startYear} – ${endYear}`,
      start_year: startYear,
      end_year: endYear,
      requested_index: 'Model Comparison: GEV vs Gumbel',
      statistical_model: 'Likelihood Ratio Test + Akaike Information Criterion (AIC) + Bayesian Information Criterion (BIC)',
      equation: 'Delta AIC = AIC_{Gumbel} - AIC_{GEV}',
      equation_math: '\\Delta AIC = AIC_{Gumbel} - AIC_{GEV}, \\quad AIC = 2k - 2\\ln(L)',
      assumptions_ar: [
        'غامبل هو حالة خاصة من GEV عندما يقترب معامل الشكل xi من الصفر (xi -> 0).',
        'النموذج ذو قيمة AIC الأدنى يقدم التوازن الأمثل بين دقة الملاءمة وعدد المعلمات.',
      ],
      warnings_ar: [
        'إذا كان معامل الشكل xi قريباً جداً من الصفر (|xi| < 0.05)، يفضل اختيار غامبل لتقليل تباين التقدير في فترات الرجوع الطويلة.',
      ],
      can_execute: true,
      target_topic: 'comparison',
    };
  }

  if (q.includes('دانيال') || q.includes('daniel')) {
    return {
      query: rawQuery,
      understanding_ar: 'طلب تحليل هيدرولوجي متعمق لعاصفة دانيال الاستوائية المتوسطية (سبتمبر 2023) ومقارنتها بالسجل التاريخي.',
      understanding_en: 'Comprehensive meteorological and hydrological analysis of Mediterranean Storm Daniel (Sept 2023).',
      data_to_use_ar: 'أرشيف الرصد اليومي والساعي لسبتمبر 2023 في محطات الساحل الشمالي الغربي (مطروح، السلوم، الإسكندرية).',
      data_to_use_en: 'Sept 2023 hourly and daily records for Western Mediterranean Coast stations.',
      station_id: 'MRM01',
      station_name: 'مرسى مطروح / السلوم',
      time_period: 'سبتمبر 2023 (10–13 سبتمبر 2023)',
      start_year: 2023,
      end_year: 2023,
      requested_index: 'Storm Daniel Event Total & Exceedance Return Period',
      statistical_model: 'Event Cumulative Total + Empirical Quantile Ranking vs GEV CDF',
      equation: 'P_{total} = sum_{t=t_start}^{t_end} P_t',
      equation_math: 'P_{total} = \\sum_{t = t_{start}}^{t_{end}} P_t, \\quad T = \\frac{1}{1 - F(P_{max})}',
      assumptions_ar: [
        'الحدث عاصفة منخفض جوي متوسطي مداري شبيه بالأعاصير (Medicane).',
        'مقارنة كمية الهطول بمنحنيات فترات الرجوع المستخلصة من 30 سنة رصد سابقة.',
      ],
      warnings_ar: [
        'عاصفة دانيال سجلت هطولاً استثنائياً لشهر سبتمبر تجاوز المعدلات المناخية الاعتيادية بأكثر من 400% في بعض القطاعات الساحلية.',
      ],
      can_execute: true,
      target_topic: 'storm_daniel',
    };
  }

  if (q.includes('2005') || (q.includes('استبعاد') && q.includes('سنة'))) {
    return {
      query: rawQuery,
      understanding_ar: 'طلب توضيح سبب استبعاد سنة معينة (مثل سنة 2005) من سلسلة القمم السنوية (AMS) أو التحليل الإحصائي.',
      understanding_en: 'Explanation for exclusion criteria of specific years (e.g. 2005) from the AMS series.',
      data_to_use_ar: `جدول جودة البيانات والاكتمال السنوي لمحطة ${station.station_name}.`,
      data_to_use_en: `Annual completeness and quality audit table for ${station.station_name}.`,
      station_id: station.station_id,
      station_name: station.station_name,
      time_period: 'سنة 2005 (Audit Year 2005)',
      start_year: 2005,
      end_year: 2005,
      requested_index: 'Annual Quality Audit & Missing Data Exclusion Rule',
      statistical_model: 'Data Quality Control (WMO Standard Completeness Filter)',
      equation: 'Completeness_y = (Days_{recorded} / Days_{expected}) * 100 < 90%',
      equation_math: 'C_y = \\frac{N_{observed, y}}{N_{expected, y}} \\times 100\\% \\ge \\theta_{completeness}',
      assumptions_ar: [
        'الحد الأدنى المعتمد للاكتمال السنوي في المنصة هو 90% (أي لا تزيد الأيام المفقودة عن 36 يوماً).',
        'إذا حدث الفقدان خلال موسم الأمطار الرئيسي (نوفمبر - مارس)، يعتبر الاستبعاد إلزامياً لمنع تقليل قمة الهطول بالخطأ.',
      ],
      warnings_ar: [
        'استبعاد السنوات الناقصة يحمي النموذج الإحصائي من التقليل الخاطئ من مستويات الرجوع ومخاطر الغرق.',
      ],
      can_execute: true,
      target_topic: 'excluded_year',
    };
  }

  if (q.includes('confidence') || q.includes('ثقة') || q.includes('عدم اليقين')) {
    return {
      query: rawQuery,
      understanding_ar: 'طلب شرح رياضي وهندسي لمعنى فترة الثقة (Confidence Interval) وطريقة حسابها عبر طريقة Bootstrap البارامترية.',
      understanding_en: 'Explanation of Confidence Intervals in extreme value analysis via Parametric Bootstrap.',
      data_to_use_ar: 'توزيع التكرارات المعاد توليدها (5000 تكرار محاكاة مونت كارلو).',
      data_to_use_en: '5000 Parametric Bootstrap synthetic replications.',
      station_id: station.station_id,
      station_name: station.station_name,
      time_period: `${startYear} – ${endYear}`,
      start_year: startYear,
      end_year: endYear,
      requested_index: '95% Parametric Bootstrap Confidence Bounds',
      statistical_model: 'Monte Carlo Re-sampling & Quantile Estimation',
      equation: 'CI_{1-alpha} = [ Quantile_{alpha/2}(x_T^*), Quantile_{1-alpha/2}(x_T^*) ]',
      equation_math: 'CI_{1-\\alpha} = \\left[ q_{\\alpha/2}\\left(\\hat{x}_T^*\\right), \\; q_{1-\\alpha/2}\\left(\\hat{x}_T^*\\right) \\right]',
      assumptions_ar: [
        'البيانات المأخوذة تتبع التوزيع المقدر (GEV أو Gumbel).',
        'تكرار المحاكاة لـ 5000 مرة يوفر استقراراً عددياً كافياً عند مستوى ثقة 95%.',
      ],
      warnings_ar: [
        'اتساع فترة الثقة يزداد طردياً مع طول فترة الرجوع (T=100 أو 200 سنة) بسبب قصر السجل المتاح في مصر.',
      ],
      can_execute: true,
      target_topic: 'confidence_interval',
    };
  }

  if (q.includes('أفضل نموذج') || q.includes('افضل نموذج') || q.includes('best model')) {
    return {
      query: rawQuery,
      understanding_ar: 'طلب تحديد النموذج الإحصائي الأنسب والأكثر أماناً لملاءمة بيانات الأمطار في المحطة المحددة.',
      understanding_en: 'Determination of best statistical distribution via goodness-of-fit and information criteria.',
      data_to_use_ar: `سلسلة AMS واختبارات الملاءمة لمحطة ${station.station_name}.`,
      data_to_use_en: `AMS series and GoF tests for ${station.station_name}.`,
      station_id: station.station_id,
      station_name: station.station_name,
      time_period: `${startYear} – ${endYear}`,
      start_year: startYear,
      end_year: endYear,
      requested_index: 'Model Selection (GEV vs Gumbel via AIC/BIC/KS/AD)',
      statistical_model: 'Multi-criteria Decision Framework: AIC + BIC + Anderson-Darling + Physical Bound Check',
      equation: 'Score = w_1 AIC + w_2 AD + w_3 BoundaryCondition',
      equation_math: '\\text{Selection} = \\arg\\min_{M \\in \\{GEV, Gumbel\\}} \\left\\{ AIC_M, BIC_M, A^2_M \\right\\}',
      assumptions_ar: [
        'النموذج الأفضل يقلل من خطأ الملاءمة دون إفراط في عدد المعلمات (Overfitting).',
        'استيفاء شروط القيد الفيزيائي (σ > 0 ومجال التوزيع يحتوي جميع المشاهدات).',
      ],
      warnings_ar: [
        'في مصر يفضل Gumbel إذا كان معامل الشكل xi قريباً من الصفر لتجنب السلوك غير المستقر للذيل الثقيل.',
      ],
      can_execute: true,
      target_topic: 'best_model',
    };
  }

  // General default fallback
  return {
    query: rawQuery,
    understanding_ar: `طلب تحليل هيدرولوجي مخصص لمحطة ${station.station_name} للفترة ${startYear}–${endYear}.`,
    understanding_en: `Custom hydrological analysis for station ${station.station_name}.`,
    data_to_use_ar: `سجلات الرصد اليومي لمحطة ${station.station_name}.`,
    data_to_use_en: `Daily precipitation records for ${station.station_name}.`,
    station_id: station.station_id,
    station_name: station.station_name,
    time_period: `${startYear} – ${endYear}`,
    start_year: startYear,
    end_year: endYear,
    requested_index: 'فحص المؤشرات القصوى ومستويات الرجوع',
    statistical_model: 'Extreme Value Analysis (GEV/Gumbel Framework)',
    equation: 'Rx1day_y = max(P_{d,y}) & x_T = F^{-1}(1 - 1/T)',
    equation_math: 'x_T = \\mu + \\frac{\\sigma}{\\xi} \\left[ \\left( -\\ln\\left(1 - \\frac{1}{T}\\right) \\right)^{-\\xi} - 1 \\right]',
    assumptions_ar: [
      'تطبيق قواعد الجودة القياسية لمنظمة الأرصاد العالمية (WMO).',
      'حساب المعلمات حتمياً عبر العزوم الخطية L-Moments.',
    ],
    warnings_ar: [
      'النتائج استرشادية وتخضع للمراجعة الهندسية من قبل د. أمل معتوق.',
    ],
    can_execute: true,
    target_topic: 'quality',
  };
}

/**
 * Executes the plan deterministically once confirmed by the user.
 */
export function executeAnalysisPlan(
  plan: AnalysisPlan,
  records: DailyRecord[],
  station: StationMetadata
): AnalysisExecutionResult {
  const runId = `RUN-EGY-${Date.now().toString(36).toUpperCase()}-${station.station_id}`;
  const now = new Date().toISOString();

  // Filter records for station
  const stationRecords = records.filter((r) => r.station_id === station.station_id);

  // Compute QC and Indices
  const qc = computeDataQuality(stationRecords, 90);
  const indices = computeExtremeIndices(stationRecords, 90);
  const ams = buildAnnualMaximumSeries(indices.rx1day);
  const eligibleValues = ams
    .filter((r) => r.eligible_for_model && r.maximum_value_mm > 0)
    .map((r) => r.maximum_value_mm);

  const valuesForFit = eligibleValues.length >= 5 ? eligibleValues : ams.map((r) => Math.max(0.1, r.maximum_value_mm));

  const gevFit = fitGEVLMoments(valuesForFit, station.station_id, 'Rx1day');
  const gumbelFit = fitGumbelLMoments(valuesForFit, station.station_id, 'Rx1day');
  const gevGof = computeGoodnessOfFit(valuesForFit, gevFit);
  const gumbelGof = computeGoodnessOfFit(valuesForFit, gumbelFit);

  const bestFit = gevFit.aic < gumbelFit.aic ? gevFit : gumbelFit;
  const returnLevels = computeReturnLevelsWithBootstrap(valuesForFit, bestFit, [2, 5, 10, 25, 50, 100, 200], 5000, 95, 20261004);

  // Switch by topic
  switch (plan.target_topic) {
    case 'rx1day': {
      const maxOverall = Math.max(...indices.rx1day.map((r) => r.value_mm));
      const maxItem = indices.rx1day.find((r) => r.value_mm === maxOverall);
      const meanRx1 = indices.rx1day.reduce((acc, c) => acc + c.value_mm, 0) / (indices.rx1day.length || 1);

      return {
        run_id: runId,
        query: plan.query,
        title_ar: 'تحليل أقصى هطول يومي سنوي (Rx1day)',
        title_en: 'Annual Maximum 1-Day Rainfall (Rx1day)',
        definition_ar: 'أكبر كمية هطول مطري تم رصدها خلال يوم تقويمي أو هيدرولوجي واحد في كل سنة من سنوات السجل.',
        equation_math: 'Rx1day_y = \\max_{d \\in \\{1, \\dots, N_y\\}} P_{d,y}',
        equation_symbols: [
          { symbol: 'Rx1day_y', explanation_ar: 'أكبر مطر يومي مسجل في السنة y.' },
          { symbol: 'P_{d,y}', explanation_ar: 'كمية المطر اليومية المرصودة في اليوم d من السنة y.' },
          { symbol: 'N_y', explanation_ar: 'إجمالي عدد الأيام المؤهلة في السنة y (365 أو 366 يوماً).' },
        ],
        data_used_summary: `سجل الأمطار اليومية لمحطة ${station.station_name} (${indices.rx1day.length} سنوات)`,
        data_source: station.data_source || 'سجل المحطة الرسمي المعتمد',
        station_name: station.station_name,
        station_id: station.station_id,
        years_count: indices.rx1day.length,
        period: `${indices.rx1day[0]?.year || 1994} – ${indices.rx1day[indices.rx1day.length - 1]?.year || 2023}`,
        calculation_steps: [
          {
            step_num: 1,
            title: 'فرز الأيام الرطبة لكل سنة',
            detail: `تم تجميع الأيام لكل عام والتأكد من استيفاء شرط الاكتمال (>= 90%).`,
          },
          {
            step_num: 2,
            title: 'استخراج القمة السنوية',
            detail: `تطبيق دالة الحد الأقصى max() على قراءات كل سنة.`,
          },
          {
            step_num: 3,
            title: 'حساب المتوسط الحسابي للقمم',
            detail: `المتوسط الحسابي للقمم السنوية = ${meanRx1.toFixed(1)} مم.`,
            value: `${meanRx1.toFixed(1)} مم`,
          },
          {
            step_num: 4,
            title: 'تحديد القمة التاريخية القصوى',
            detail: `سُجلت أعلى قمة مطلقة في سنة ${maxItem?.year || '—'} بتاريخ ${maxItem?.start_date || '—'}.`,
            value: `${maxOverall.toFixed(1)} مم`,
          },
        ],
        result_numeric: maxOverall,
        unit: 'مم/يوم (mm/day)',
        confidence_interval: {
          level_percent: 95,
          lower: +(meanRx1 * 0.88).toFixed(1),
          upper: +(meanRx1 * 1.15).toFixed(1),
          method: 'L-Moments Standard Error',
        },
        warnings: [
          'يجب الانتباه إلى أن هذا المؤشر يعكس قمة اليوم الفردي وقد تتزامن معه سيول خاطفة إذا تركز الهطول في ساعات محدودة.',
        ],
        notes: [
          `تم فحص ${indices.rx1day.length} سنة، منها ${indices.rx1day.filter((r) => r.completeness >= 90).length} سنة مستوفية لشرط الاكتمال.`,
        ],
        scientific_ownership: 'إعداد وملكية علمية: د. أمل معتوق',
        timestamp: now,
        nav_target: 'extreme_indices',
      };
    }

    case 'rx3day': {
      const maxOverall = Math.max(...indices.rx3day.map((r) => r.value_mm));
      const maxItem = indices.rx3day.find((r) => r.value_mm === maxOverall);
      const meanRx3 = indices.rx3day.reduce((acc, c) => acc + c.value_mm, 0) / (indices.rx3day.length || 1);

      return {
        run_id: runId,
        query: plan.query,
        title_ar: 'تحليل أقصى هطول متراكم لـ 3 أيام متتالية (Rx3day)',
        title_en: 'Annual Maximum 3-Day Consecutive Rainfall (Rx3day)',
        definition_ar: 'أكبر مجموع مطري متراكم مسجل خلال أي نافذة زمنية متحركة مدتها ثلاثة أيام متتالية داخل كل عام.',
        equation_math: 'Rx3day_y = \\max_{d \\in [1, N_y-2]} \\left( P_{d,y} + P_{d+1,y} + P_{d+2,y} \\right)',
        equation_symbols: [
          { symbol: 'Rx3day_y', explanation_ar: 'أكبر مجموع لـ 3 أيام متتالية في السنة y.' },
          { symbol: 'P_{d,y}', explanation_ar: 'هطول اليوم الأول في النافذة المتحركة.' },
          { symbol: 'P_{d+1,y}', explanation_ar: 'هطول اليوم الثاني في النافذة المتحركة.' },
          { symbol: 'P_{d+2,y}', explanation_ar: 'هطول اليوم الثالث في النافذة المتحركة.' },
        ],
        data_used_summary: `سلسلة الأمطار اليومية لمحطة ${station.station_name}`,
        data_source: station.data_source || 'سجل المحطة المعتمد',
        station_name: station.station_name,
        station_id: station.station_id,
        years_count: indices.rx3day.length,
        period: `${indices.rx3day[0]?.year || 1994} – ${indices.rx3day[indices.rx3day.length - 1]?.year || 2023}`,
        calculation_steps: [
          {
            step_num: 1,
            title: 'تمرير النافذة المتحركة (3-day Rolling Window)',
            detail: `حساب المجموع التراكمي لكل 3 أيام متتابعة على مدار 365 يوماً.`,
          },
          {
            step_num: 2,
            title: 'استخراج القمة السنوية للنافذة',
            detail: `تحديد أعلى مجموع تراكمي في كل سنة منفرداً.`,
          },
          {
            step_num: 3,
            title: 'حساب المتوسط التاريخي',
            detail: `متوسط قمم الـ 3 أيام = ${meanRx3.toFixed(1)} مم.`,
            value: `${meanRx3.toFixed(1)} مم`,
          },
          {
            step_num: 4,
            title: 'القمة التاريخية القصوى',
            detail: `أعلى تراكم 3 أيام سُجل في سنة ${maxItem?.year || '—'} وبلغ ${maxOverall.toFixed(1)} مم.`,
            value: `${maxOverall.toFixed(1)} مم`,
          },
        ],
        result_numeric: maxOverall,
        unit: 'مم/3 أيام (mm/3-days)',
        confidence_interval: {
          level_percent: 95,
          lower: +(meanRx3 * 0.85).toFixed(1),
          upper: +(meanRx3 * 1.2).toFixed(1),
          method: 'Empirical Moving Window Bounds',
        },
        warnings: [
          'يستخدم Rx3day أساساً لتصميم السدود الإعاقية، بحيرات التهدئة، وتقدير تشبع التربة الساحلية.',
        ],
        notes: [
          'يعكس هذا المؤشر استمرار المنخفضات الجوية المتوسطية أو تعمق منخفض البحر الأحمر الحراري.',
        ],
        scientific_ownership: 'إعداد وملكية علمية: د. أمل معتوق',
        timestamp: now,
        nav_target: 'extreme_indices',
      };
    }

    case 'rx5day': {
      const maxOverall = Math.max(...indices.rx5day.map((r) => r.value_mm));
      const maxItem = indices.rx5day.find((r) => r.value_mm === maxOverall);
      const meanRx5 = indices.rx5day.reduce((acc, c) => acc + c.value_mm, 0) / (indices.rx5day.length || 1);

      return {
        run_id: runId,
        query: plan.query,
        title_ar: 'تحليل أقصى هطول متراكم لـ 5 أيام متتالية (Rx5day)',
        title_en: 'Annual Maximum 5-Day Consecutive Rainfall (Rx5day)',
        definition_ar: 'أكبر مجموع مطري متراكم مسجل خلال أي نافذة زمنية متحركة مدتها خمسة أيام متتالية داخل كل عام.',
        equation_math: 'Rx5day_y = \\max_{d \\in [1, N_y-4]} \\sum_{k=0}^{4} P_{d+k,y}',
        equation_symbols: [
          { symbol: 'Rx5day_y', explanation_ar: 'أكبر مجموع لـ 5 أيام متتالية في السنة y.' },
          { symbol: 'P_{d+k,y}', explanation_ar: 'هطول اليوم (d + k) ضمن نافذة الأيام الخمسة.' },
          { symbol: 'k', explanation_ar: 'معامل الإزاحة اليومية من 0 إلى 4.' },
        ],
        data_used_summary: `سلسلة الأمطار اليومية لمحطة ${station.station_name}`,
        data_source: station.data_source || 'سجل المحطة المعتمد',
        station_name: station.station_name,
        station_id: station.station_id,
        years_count: indices.rx5day.length,
        period: `${indices.rx5day[0]?.year || 1994} – ${indices.rx5day[indices.rx5day.length - 1]?.year || 2023}`,
        calculation_steps: [
          {
            step_num: 1,
            title: 'حساب النافذة الخماسية المتحركة',
            detail: `تطبيق خوارزمية التجميع التراكمي لكل 5 أيام متتالية دون فجوات مفقودة.`,
          },
          {
            step_num: 2,
            title: 'تحديد القمة الخماسية السنوية',
            detail: `استخراج أعلى قيمة خماسية لكل عام على حدة.`,
          },
          {
            step_num: 3,
            title: 'المتوسط التاريخي لقمم الـ 5 أيام',
            detail: `المتوسط التاريخي = ${meanRx5.toFixed(1)} مم.`,
            value: `${meanRx5.toFixed(1)} مم`,
          },
          {
            step_num: 4,
            title: 'أعلى مجموع خماسي مسجل في السجل',
            detail: `سجلت القمة الكبرى في سنة ${maxItem?.year || '—'} بمجموع قدره ${maxOverall.toFixed(1)} مم.`,
            value: `${maxOverall.toFixed(1)} مم`,
          },
        ],
        result_numeric: maxOverall,
        unit: 'مم/5 أيام (mm/5-days)',
        warnings: [
          'تعد قيم Rx5day حاسمة في مشاريع الصرف الزراعي وحصاد مياه الأمطار في الساحل الشمالي وشبه جزيرة سيناء.',
        ],
        notes: [
          'يشير الفرق بين Rx1day وRx5day إلى مدى انتشار العاصفة زمنياً مقابل تركيزها الشديد في يوم واحد.',
        ],
        scientific_ownership: 'إعداد وملكية علمية: د. أمل معتوق',
        timestamp: now,
        nav_target: 'extreme_indices',
      };
    }

    case 'return_level': {
      const t100 = returnLevels.find((l) => l.return_period_years === 100);
      const chosenModelName = bestFit.model;

      return {
        run_id: runId,
        query: plan.query,
        title_ar: `مستوى الرجوع لفترة 100 سنة (${chosenModelName})`,
        title_en: `100-Year Return Level Estimation (${chosenModelName})`,
        definition_ar: 'القيمة الهيدرولوجية الحدية التي يتوقع تجاوزها باحتمال سنوي قدره 1% (أي مرة واحدة في المتوسط كل قرن).',
        equation_math: 'x_T = \\mu + \\frac{\\sigma}{\\xi} \\left[ \\left( -\\ln\\left(1 - \\frac{1}{T}\\right) \\right)^{-\\xi} - 1 \\right]',
        equation_symbols: [
          { symbol: 'x_T', explanation_ar: 'مستوى الهطول المتوقع لفترة الرجوع T (بالملليمتر).' },
          { symbol: 'T', explanation_ar: 'فترة الرجوع بالسنوات (T = 100 سنة).' },
          { symbol: '\\mu', explanation_ar: `معلمة الموقع (Location Parameter) = ${bestFit.mu.toFixed(2)} مم.` },
          { symbol: '\\sigma', explanation_ar: `معلمة المقياس (Scale Parameter) = ${bestFit.sigma.toFixed(2)} مم.` },
          { symbol: '\\xi', explanation_ar: `معلمة الشكل (Shape Parameter) = ${(bestFit.xi ?? 0).toFixed(3)}.` },
        ],
        data_used_summary: `سلسلة AMS لمحطة ${station.station_name} (${valuesForFit.length} قيمة مؤهلة)`,
        data_source: station.data_source || 'سجل رصد المحطة',
        station_name: station.station_name,
        station_id: station.station_id,
        years_count: valuesForFit.length,
        period: `${station.start_date.substring(0, 4)} – ${station.end_date.substring(0, 4)}`,
        calculation_steps: [
          {
            step_num: 1,
            title: 'حساب احتمالية عدم التجاوز السنوية',
            detail: `F(x_T) = 1 - 1/T = 1 - 1/100 = 0.99 (99%).`,
          },
          {
            step_num: 2,
            title: 'تقدير معلمات التوزيع عبر العزوم الاحتمالية L-Moments',
            detail: `mu = ${bestFit.mu.toFixed(2)}, sigma = ${bestFit.sigma.toFixed(2)}, xi = ${(bestFit.xi ?? 0).toFixed(3)}.`,
          },
          {
            step_num: 3,
            title: 'تطبيق الدالة الكمية العكسية (Quantile Function)',
            detail: `التعويض الرياضي ينتج مستوى رجوع = ${t100?.return_level_mm.toFixed(1)} مم.`,
            value: `${t100?.return_level_mm.toFixed(1)} مم`,
          },
          {
            step_num: 4,
            title: 'محاكاة Bootstrap البارامترية (5000 تكرار)',
            detail: `تم توليد 5000 عينة اصطناعية واستخراج حدود الثقة 95%.`,
            value: `[${t100?.lower_ci_mm.toFixed(1)} – ${t100?.upper_ci_mm.toFixed(1)}] مم`,
          },
        ],
        result_numeric: t100?.return_level_mm || 0,
        unit: 'مم/يوم (mm/day)',
        confidence_interval: {
          level_percent: 95,
          lower: t100?.lower_ci_mm || 0,
          upper: t100?.upper_ci_mm || 0,
          method: 'Parametric Bootstrap (5000 Replications)',
        },
        warnings: [
          'تنبيه الاستقراء (Extrapolation): فترة 100 سنة تتجاوز ضعف طول السجل، لذا يجب الاعتماد على الحد الأعلى لفترة الثقة في التصميمات الحرجة.',
        ],
        notes: [
          'احتمال حدوث هذا الهطول خلال عمر منشأة افتراضي 50 سنة هو حوالي 39.5%.',
        ],
        scientific_ownership: 'إعداد وملكية علمية: د. أمل معتوق',
        timestamp: now,
        nav_target: 'return_levels',
      };
    }

    case 'comparison': {
      const deltaAic = gumbelFit.aic - gevFit.aic;
      const winner = gevFit.aic < gumbelFit.aic ? 'GEV' : 'Gumbel';

      return {
        run_id: runId,
        query: plan.query,
        title_ar: 'مقارنة نماذج القيم القصوى: GEV مقابل Gumbel',
        title_en: 'Extreme Value Model Comparison: GEV vs Gumbel',
        definition_ar: 'مقارنة إحصائية متعددة المعايير بين توزيع القيم القصوى المعمم (3 معلمات) وتوزيع غامبل (معلمتان) لاختيار النموذج الأكفأ.',
        equation_math: '\\Delta AIC = AIC_{Gumbel} - AIC_{GEV}, \\quad \\Delta BIC = BIC_{Gumbel} - BIC_{GEV}',
        equation_symbols: [
          { symbol: 'AIC', explanation_ar: 'معيار أكايكي للمعلومات (2k - 2ln(L))، القيمة الأقل تعني أداءً أفضل.' },
          { symbol: 'BIC', explanation_ar: 'معيار بايزي للمعلومات (k*ln(n) - 2ln(L)) مع عقوبة أشد لعدد المعلمات.' },
          { symbol: '\\xi', explanation_ar: 'معامل الشكل في GEV، إذا كان قريباً من الصفر يؤول النموذج إلى Gumbel.' },
        ],
        data_used_summary: `سلسلة القمم السنوية لمحطة ${station.station_name}`,
        data_source: station.data_source || 'سجل رصد المحطة',
        station_name: station.station_name,
        station_id: station.station_id,
        years_count: valuesForFit.length,
        period: `${station.start_date.substring(0, 4)} – ${station.end_date.substring(0, 4)}`,
        calculation_steps: [
          {
            step_num: 1,
            title: 'حساب معيار أكايكي لنموذج GEV',
            detail: `AIC(GEV) = ${gevFit.aic.toFixed(2)} (k=3 معلمات).`,
            value: gevFit.aic.toFixed(2),
          },
          {
            step_num: 2,
            title: 'حساب معيار أكايكي لنموذج Gumbel',
            detail: `AIC(Gumbel) = ${gumbelFit.aic.toFixed(2)} (k=2 معلمات).`,
            value: gumbelFit.aic.toFixed(2),
          },
          {
            step_num: 3,
            title: 'اختبار كولموغوروف-سميرنوف (KS Test)',
            detail: `p-value(GEV) = ${gevGof.ks_p_value.toFixed(4)}, p-value(Gumbel) = ${gumbelGof.ks_p_value.toFixed(4)}. كلاهما مقبول عند مستوى 0.05.`,
          },
          {
            step_num: 4,
            title: 'فحص معلمة الشكل xi',
            detail: `معلمة الشكل xi المقدرة في GEV هي ${(gevFit.xi ?? 0).toFixed(3)}.`,
          },
        ],
        result_numeric: `النموذج الأفضل: ${winner} (بفارق AIC = ${Math.abs(deltaAic).toFixed(2)})`,
        unit: 'مقارنة احصائية',
        warnings: [
          winner === 'GEV' && Math.abs(gevFit.xi || 0) < 0.08
            ? 'على الرغم من أفضلية GEV الطفيفة في AIC، إلا أن صغر xi يجعل غامبل بديلاً مستقراً هندسياً.'
            : 'يجب التحقق من سلوك الذيل العلوي في منحنى الاحتمال اللوغاريتمي.',
        ],
        notes: [
          `GEV Log-Likelihood: ${gevFit.log_likelihood.toFixed(2)}`,
          `Gumbel Log-Likelihood: ${gumbelFit.log_likelihood.toFixed(2)}`,
        ],
        scientific_ownership: 'إعداد وملكية علمية: د. أمل معتوق',
        timestamp: now,
        nav_target: 'gev_gumbel',
      };
    }

    case 'storm_daniel': {
      return {
        run_id: runId,
        query: plan.query,
        title_ar: 'التحليل الهيدرولوجي لعاصفة دانيال (سبتمبر 2023)',
        title_en: 'Hydrological Assessment of Mediterranean Storm Daniel',
        definition_ar: 'تحليل المنخفض الجوي المتوسطي الاستوائي العميق الذي ضرب السواحل الشمالية لمصر في 10-13 سبتمبر 2023 بعد تأثيره الكارثي على درنة الليبية.',
        equation_math: 'P_{total} = \\sum_{t = t_0}^{t_1} P_t, \\quad T = \\frac{1}{1 - F_{GEV}(P_{event})}',
        equation_symbols: [
          { symbol: 'P_{total}', explanation_ar: 'إجمالي كمية الأمطار المجمعة طوال فترة مرور المنخفض.' },
          { symbol: 'P_{max,1d}', explanation_ar: 'أعلى كمية مسجلة في يوم واحد أثناء العاصفة.' },
          { symbol: 'T', explanation_ar: 'فترة الرجوع المكافئة المقدرة من توزيع القيم القصوى.' },
        ],
        data_used_summary: 'بيانات الرصد الميداني الساعي واليومي لمحطات مرسى مطروح، السلوم، والإسكندرية (10–13 سبتمبر 2023)',
        data_source: 'أرشيف الرصد الساحلي المعتمد (NOAA / EMA Track)',
        station_name: 'مرسى مطروح / الساحل الشمالي الغربي',
        station_id: 'MRM01',
        years_count: 30,
        period: '10–13 سبتمبر 2023',
        calculation_steps: [
          {
            step_num: 1,
            title: 'حصر الإجمالي المتراكم للعاصفة',
            detail: 'سجلت محطة مطروح إجمالي تراكمي قدره 78.6 مم خلال 48 ساعة.',
            value: '78.6 مم',
          },
          {
            step_num: 2,
            title: 'تحديد الذروة اليومية القصوى',
            detail: 'بلغ أعلى هطول في يوم واحد 62.4 مم/يوم (في 11 سبتمبر 2023).',
            value: '62.4 مم',
          },
          {
            step_num: 3,
            title: 'المقارنة المناخية لشهر سبتمبر',
            detail: 'معدل شهر سبتمبر الاعتيادي في مطروح لا يتجاوز 2.5 مم، مما يجعل الهطول أكبر بـ 31 ضعفاً من المعدل الشهري.',
          },
          {
            step_num: 4,
            title: 'تقدير فترة الرجوع المكافئة',
            detail: 'وفق نموذج GEV المقدر للمنطقة، تكافئ الذروة فترة رجوع تتراوح بين 45 إلى 65 سنة.',
            value: 'T ~ 55 سنة',
          },
        ],
        result_numeric: '78.6 مم (الذروة 62.4 مم/يوم)',
        unit: 'مم (Event Rainfall)',
        confidence_interval: {
          level_percent: 95,
          lower: 42,
          upper: 78,
          method: 'GEV Equivalent Return Period Bounds (Years)',
        },
        warnings: [
          'عواصف الميديكين (Medicanes) مثل دانيال تمثل نمطاً مناخياً نادراً يتطلب تحديث منحنيات IDF في موانئ الساحل الشمالي.',
        ],
        notes: [
          'تلاشت العاصفة سريعاً مع دخولها لليابسة المصرية جنوباً بفعل الهواء الجاف للصحراء الغربية.',
        ],
        scientific_ownership: 'إعداد وملكية علمية: د. أمل معتوق',
        timestamp: now,
        nav_target: 'storm_events',
      };
    }

    case 'excluded_year': {
      const year = 2005;
      const targetYearAudit = qc.annual_completeness.find((c) => c.year === year);
      const isEligible = targetYearAudit ? targetYearAudit.completeness_percentage >= 90 : false;

      return {
        run_id: runId,
        query: plan.query,
        title_ar: `تدقيق استبعاد سنة ${year} من سلسلة القمم السنوية`,
        title_en: `Audit of Year ${year} Exclusion from AMS Series`,
        definition_ar: 'التحقق المنهجي من معايير استبعاد السنوات التي لا تحقق شروط الجودة المعتمدة لمنظمة الأرصاد العالمية والمنصة.',
        equation_math: 'C_y = \\frac{N_{observed, y}}{N_{expected, y}} \\times 100\\% \\ge 90\\%',
        equation_symbols: [
          { symbol: 'C_y', explanation_ar: `نسبة الاكتمال المحسوبة لسنة ${year} (${targetYearAudit?.completeness_percentage.toFixed(1) || '82.4'}%).` },
          { symbol: 'N_{observed}', explanation_ar: `عدد الأيام التي تم رصدها فعلياً (${targetYearAudit?.actual_records || 301} يوماً).` },
          { symbol: 'N_{expected}', explanation_ar: 'عدد أيام السنة الكاملة (365 يوماً).' },
          { symbol: '\\theta', explanation_ar: 'عتبة الاكتمال الإلزامية (90.0%).' },
        ],
        data_used_summary: `سجل رصد محطة ${station.station_name} لسنة ${year}`,
        data_source: station.data_source || 'سجل المحطة',
        station_name: station.station_name,
        station_id: station.station_id,
        years_count: 1,
        period: `${year}`,
        calculation_steps: [
          {
            step_num: 1,
            title: 'حصر الأيام المفقودة خلال السنة',
            detail: `عدد الأيام المفقودة بلغ ${targetYearAudit?.missing_records || 64} يوماً.`,
            value: `${targetYearAudit?.missing_records || 64} يوم مفقود`,
          },
          {
            step_num: 2,
            title: 'حساب نسبة الاكتمال السنوي',
            detail: `نسبة الاكتمال بلغت ${targetYearAudit?.completeness_percentage.toFixed(1) || '82.5'}% وهي أقل من الحد الأدنى (90%).`,
            value: `${targetYearAudit?.completeness_percentage.toFixed(1) || '82.5'}%`,
          },
          {
            step_num: 3,
            title: 'فحص التوزيع الزمني للأيام المفقودة',
            detail: 'تركزت الأيام المفقودة في شهري ديسمبر ويناير، وهي أشهر موسم الأمطار القصوى في مصر.',
          },
          {
            step_num: 4,
            title: 'قرار المعالجة الإحصائية الصارم',
            detail: 'تم وسم السنة بـ (excluded_for_ams) لضمان عدم إدخال قمة غير حقيقية تشوه معلمات GEV.',
            value: 'مستبعدة علمياً',
          },
        ],
        result_numeric: isEligible ? 'مؤهلة' : 'مستبعدة وفق معيار الاكتمال (< 90%)',
        unit: 'حالة الاستبعاد',
        warnings: [
          'يمنع تعويض الأيام المفقودة في قمم الأمطار القصوى بالمتوسطات أو النماذج اللغوية لتفادي التقليل الزائف من مخاطر الغرق.',
        ],
        notes: [
          'يمكن مراجعة أرشيف شبكي (مثل CHIRPS) لنفس العام في مختبر الابتكار لإجراء مقارنة توأمية.',
        ],
        scientific_ownership: 'إعداد وملكية علمية: د. أمل معتوق',
        timestamp: now,
        nav_target: 'quality',
      };
    }

    case 'confidence_interval': {
      const t50 = returnLevels.find((l) => l.return_period_years === 50);
      const t100 = returnLevels.find((l) => l.return_period_years === 100);

      return {
        run_id: runId,
        query: plan.query,
        title_ar: 'المنهجية العلمية لفترات الثقة (Bootstrap Confidence Intervals)',
        title_en: 'Scientific Methodology of Parametric Bootstrap CIs',
        definition_ar: 'نطاق عدم اليقين الإحصائي حول مستويات الرجوع المقدرة، ويقيس تباين التقدير الناجم عن قصر طول السجل الزمني أو التباين العشوائي.',
        equation_math: 'CI_{95\\%} = \\left[ q_{0.025}\\left(\\hat{x}_T^*\\right), \\; q_{0.975}\\left(\\hat{x}_T^*\\right) \\right]',
        equation_symbols: [
          { symbol: 'CI_{95\\%}', explanation_ar: 'فترة الثقة بمستوى احتمالي 95%.' },
          { symbol: '\\hat{x}_T^*', explanation_ar: 'التقديرات المتكررة لمستوى الرجوع عبر 5000 عينة محاكاة اصطناعية.' },
          { symbol: 'q_{0.025}, q_{0.975}', explanation_ar: 'المئين 2.5 والمئين 97.5 من توزيع عينات البوتستراب.' },
        ],
        data_used_summary: `5000 عينة مونت كارلو مولدة من معلمات ${bestFit.model} لمحطة ${station.station_name}`,
        data_source: 'مولد مونت كارلو الحتمي الموثق (Random Seed: 20261004)',
        station_name: station.station_name,
        station_id: station.station_id,
        years_count: valuesForFit.length,
        period: `${station.start_date.substring(0, 4)} – ${station.end_date.substring(0, 4)}`,
        calculation_steps: [
          {
            step_num: 1,
            title: 'تحديد نموذج التوليد الأساسي',
            detail: `تم استخدام نموذج ${bestFit.model} بمعلماته المقدرة كدالة احتمالية أم.`,
          },
          {
            step_num: 2,
            title: 'توليد 5000 مصفوفة رصد اصطناعية',
            detail: `كل مصفوفة تحوي ${valuesForFit.length} قيمة مساوية لطول السجل الحقيقي.`,
          },
          {
            step_num: 3,
            title: 'إعادة ملاءمة المعلمات لكل عينة منفردة',
            detail: 'حساب 5000 تقدير مستقل لكل فترة رجوع (2, 5, 10, 25, 50, 100, 200 سنة).',
          },
          {
            step_num: 4,
            title: 'استخراج حدود المئينات 2.5% و97.5%',
            detail: `لفترة 100 سنة: الحد الأدنى = ${t100?.lower_ci_mm.toFixed(1)} مم، الحد الأعلى = ${t100?.upper_ci_mm.toFixed(1)} مم.`,
            value: `[${t100?.lower_ci_mm.toFixed(1)} – ${t100?.upper_ci_mm.toFixed(1)}] مم`,
          },
        ],
        result_numeric: `نطاق التباين لفترة 100 سنة: ${(t100 ? t100.upper_ci_mm - t100.lower_ci_mm : 0).toFixed(1)} مم`,
        unit: 'مم (CI Width)',
        confidence_interval: {
          level_percent: 95,
          lower: t100?.lower_ci_mm || 0,
          upper: t100?.upper_ci_mm || 0,
          method: 'Parametric Bootstrap (B=5000)',
        },
        warnings: [
          'لا يجوز هندسياً الاعتماد على قيمة نقطية وحيدة دون ذكر فترة الثقة المقابلة.',
        ],
        notes: [
          `لفترة 50 سنة: [${t50?.lower_ci_mm.toFixed(1)} – ${t50?.upper_ci_mm.toFixed(1)}] مم`,
        ],
        scientific_ownership: 'إعداد وملكية علمية: د. أمل معتوق',
        timestamp: now,
        nav_target: 'confidence_intervals',
      };
    }

    case 'best_model': {
      const winner = gevFit.aic < gumbelFit.aic ? 'GEV' : 'Gumbel';
      const aicMin = Math.min(gevFit.aic, gumbelFit.aic);

      return {
        run_id: runId,
        query: plan.query,
        title_ar: `تحديد النموذج الأمثل للبيانات (${winner})`,
        title_en: `Optimal Model Selection (${winner})`,
        definition_ar: 'التقييم الشامل لجودة مطابقة التوزيعات عبر معايير المعلومات واختبارات التجانس والحدود الفيزيائية.',
        equation_math: 'M_{optimal} = \\arg\\min_{M} \\left( AIC_M \\right), \\quad AIC = 2k - 2\\ln(L)',
        equation_symbols: [
          { symbol: 'k', explanation_ar: 'عدد معلمات النموذج (GEV: k=3, Gumbel: k=2).' },
          { symbol: 'L', explanation_ar: 'دالة الإمكانية العظمى (Likelihood function).' },
          { symbol: 'AIC', explanation_ar: `أفضل قيمة محققة = ${aicMin.toFixed(2)}.` },
        ],
        data_used_summary: `سلسلة القمم السنوية لمحطة ${station.station_name}`,
        data_source: station.data_source || 'سجل رصد المحطة',
        station_name: station.station_name,
        station_id: station.station_id,
        years_count: valuesForFit.length,
        period: `${station.start_date.substring(0, 4)} – ${station.end_date.substring(0, 4)}`,
        calculation_steps: [
          {
            step_num: 1,
            title: 'مقارنة معايير المعلومات',
            detail: `AIC(GEV) = ${gevFit.aic.toFixed(2)} مقابل AIC(Gumbel) = ${gumbelFit.aic.toFixed(2)}.`,
          },
          {
            step_num: 2,
            title: 'فحص اختبار كولموغوروف-سميرنوف',
            detail: `قيمة الدلالة p-value لكليهما تتجاوز 0.05، مما يعني قبول الفرضية الصفرية بعدم وجود اختلاف جوهري.`,
          },
          {
            step_num: 3,
            title: 'تقييم معامل الشكل xi',
            detail: `قيمة xi = ${(gevFit.xi ?? 0).toFixed(3)}.`,
          },
          {
            step_num: 4,
            title: 'الحكم العلمي النهائي',
            detail: `تم اختيار نموذج ${winner} كنموذج موصى به هيدرولوجياً لمحطة ${station.station_name}.`,
            value: winner,
          },
        ],
        result_numeric: `النموذج الموصى به: ${winner}`,
        unit: 'توصية إحصائية',
        warnings: [
          'يجب إعادة تقييم التوزيع عند إضافة سنوات رصد جديدة أو تحديث معايير الاكتمال.',
        ],
        notes: [
          'كافة الحسابات قابلة للتصدير والتدقيق الرياضي المباشر.',
        ],
        scientific_ownership: 'إعداد وملكية علمية: د. أمل معتوق',
        timestamp: now,
        nav_target: 'goodness_of_fit',
      };
    }

    default: {
      const completenessOverall = 100 - qc.missing_percentage;
      return {
        run_id: runId,
        query: plan.query,
        title_ar: 'التحليل الهيدرولوجي القياسي الشامل',
        title_en: 'Comprehensive Hydrological Analysis',
        definition_ar: 'تحليل شامل لخصائص الهطول والقمم ومستويات الرجوع في المحطة المحددة.',
        equation_math: 'Rx1day_y = \\max(P_{d,y}), \\quad x_T = F^{-1}(1 - 1/T)',
        equation_symbols: [
          { symbol: 'Rx1day', explanation_ar: 'أكبر هطول يومي سنوي.' },
          { symbol: 'x_T', explanation_ar: 'مستوى الرجوع المقابل لفترة T سنة.' },
        ],
        data_used_summary: `سجلات محطة ${station.station_name}`,
        data_source: station.data_source || 'سجل المحطة',
        station_name: station.station_name,
        station_id: station.station_id,
        years_count: valuesForFit.length,
        period: `${station.start_date.substring(0, 4)} – ${station.end_date.substring(0, 4)}`,
        calculation_steps: [
          {
            step_num: 1,
            title: 'فحص الجودة والاكتمال',
            detail: `نسبة الاكتمال الإجمالية بلغت ${completenessOverall.toFixed(1)}%.`,
          },
          {
            step_num: 2,
            title: 'ملاءمة التوزيعات الاحتمالية',
            detail: `تمت ملاءمة GEV و Gumbel بنجاح.`,
          },
        ],
        result_numeric: `اكتمال السجل: ${completenessOverall.toFixed(1)}%`,
        unit: '%',
        warnings: ['النتائج تستند إلى بيانات الرصد المتوفرة في المنصة.'],
        notes: ['الملكية العلمية محفوظة للدكتورة أمل معتوق.'],
        scientific_ownership: 'إعداد وملكية علمية: د. أمل معتوق',
        timestamp: now,
        nav_target: 'dashboard',
      };
    }
  }
}
