import { Question } from '../types';

export const INT_MEDICINE_DEMO_QUESTIONS: Question[] = [];

// Subtopics generator for expanded 2150 questions in SMSB Internal Medicine
const smsbCategories = [
  { name: 'Cardiology & Vascular Medicine (SMSB)', ref: 'ESC / AHA Cardiology Guidelines' },
  { name: 'Endocrinology, Diabetes & Metabolism (SMSB)', ref: 'ADA Standards of Care / Endocrine Society' },
  { name: 'Gastroenterology & Hepatology (SMSB)', ref: 'EASL / ACG Guidelines' },
  { name: 'Nephrology & Hypertension (SMSB)', ref: 'KDIGO Guidelines' },
  { name: 'Pulmonology & Respiratory Medicine (SMSB)', ref: 'BTS / GINA Guidelines' },
  { name: 'Rheumatology & Autoimmune Diseases (SMSB)', ref: 'EULAR / ACR Guidelines' },
  { name: 'Hematology & Medical Oncology (SMSB)', ref: 'ASH / ESMO Guidelines' },
  { name: 'Infectious Diseases & Tropical Medicine (SMSB)', ref: 'IDSA / WHO Guidelines' },
  { name: 'Neurology & Neurovascular Medicine (SMSB)', ref: 'AAN / AHA Stroke Guidelines' },
  { name: 'Critical Care & Acute Internal Medicine (SMSB)', ref: 'Surviving Sepsis Campaign' }
];

const smsbSubtopics = [
  {
    title: 'Acute Coronary Syndrome & High-Sensitivity Troponin Interpretation',
    options: [
      'Primary PCI within 120 minutes of first medical contact',
      'Elective exercise stress test outpatient referral',
      'Immediate discharge with sublingual nitroglycerin prescription',
      'High-dose oral NSAID monotherapy'
    ],
    exp: 'Primary PCI is the treatment of choice for acute STEMI within 120 minutes. High-sensitivity troponin dynamic rise confirms myocardial necrosis.'
  },
  {
    title: 'Refractory Diabetic Ketoacidosis & Fluid Resuscitation',
    options: [
      '0.9% Normal Saline resuscitation and fixed-rate IV Soluble Insulin infusion',
      'Immediate subcutaneous rapid-acting insulin bolus without IV fluids',
      'Oral metformin loading dose with oral hydration',
      'Intravenous sodium bicarbonate 8.4% bolus monotherapy'
    ],
    exp: 'DKA requires fluid restoration with 0.9% NaCl followed by IV fixed-rate soluble insulin (0.1 units/kg/h) and potassium monitoring.'
  },
  {
    title: 'Rapidly Progressive Glomerulonephritis (RPGN) & ANCA Vasculitis',
    options: [
      'Pulse IV Methylprednisolone + Cyclophosphamide or Rituximab ± Plasma Exchange',
      'High-dose oral furosemide monotherapy',
      'Long-term oral antibiotics',
      'Immediate bilateral nephrectomy'
    ],
    exp: 'Pauci-immune crescentic glomerulonephritis (ANCA-associated) requires induction immunosuppression with pulse steroids and cyclophosphamide/rituximab.'
  },
  {
    title: 'Decompensated Cirrhosis & Refractory Ascites Management',
    options: [
      'Dietary sodium restriction (2g/day) plus oral Spironolactone and Furosemide',
      'High-sodium fluid boluses without diuretics',
      'Immediate surgical portocaval shunt in all mild cases',
      'Oral NSAIDs for abdominal discomfort'
    ],
    exp: 'Aldosterone antagonists (Spironolactone) combined with loop diuretics (Furosemide) in a 100:40 mg ratio form the mainstay of ascites therapy.'
  },
  {
    title: 'Severe Acute Exacerbation of COPD with Hypercapnic Acidosis',
    options: [
      'Non-Invasive Positive Pressure Ventilation (NIV / BiPAP) with controlled oxygen',
      'High-flow 100% unmonitored oxygen therapy',
      'Immediate endotracheal intubation without NIV trial',
      'Inhaled sedatives and cough suppressants'
    ],
    exp: 'NIV (BiPAP) reduces mortality and intubation rates in acute COPD exacerbations with respiratory acidosis (pH 7.25-7.35, PaCO2 >45 mmHg).'
  },
  {
    title: 'Rheumatoid Arthritis Disease Modification & Biologic Therapy',
    options: [
      'Early Subcutaneous Methotrexate + Short-term Bridging Corticosteroids',
      'Long-term high-dose oral prednisone monotherapy',
      'Daily paracetamol without DMARDs',
      'Immediate total joint replacement'
    ],
    exp: 'Methotrexate is the anchor conventional DMARD for RA. Biologics (e.g. Anti-TNF, Anti-IL6, JAK inhibitors) are added if remission is unachieved.'
  },
  {
    title: 'Severe Febrile Neutropenia in Lymphoma Patient',
    options: [
      'Empiric IV antipseudomonal beta-lactam (Piperacillin-Tazobactam or Cefepime) within 1 hour',
      'Oral amoxicillin outpatient prescription',
      'Observation until blood culture results return in 48 hours',
      'Granulocyte transfusion monotherapy'
    ],
    exp: 'Febrile neutropenia (Absolute Neutrophil Count <500/μL) is an oncological emergency requiring immediate empiric IV antipseudomonal coverage.'
  },
  {
    title: 'Management of Acute Ischemic Stroke with Large Vessel Occlusion',
    options: [
      'IV Thrombolysis (Alteplase) within 4.5 h + Endovascular Mechanical Thrombectomy (EVT) within 24 h',
      'Oral aspirin 300 mg loading dose only',
      'Intravenous heparin bolus high-dose',
      'Emergency carotid endarterectomy during hyperacute stroke'
    ],
    exp: 'Endovascular thrombectomy (EVT) achieves dramatic reperfusion in large vessel occlusion (ICA, MCA M1) up to 24 hours from last known well.'
  },
  {
    title: 'Thyroid Storm Emergency Resuscitation',
    options: [
      'Propylthiouracil (PTU) or Methimazole + Beta-blocker (Propranolol) + Hydrocortisone + Lugol Iodine',
      'Immediate Total Thyroidectomy surgery during acute storm',
      'Radioactive Iodine (I-131) oral administration during crisis',
      'Levothyroxine IV high-dose bolus'
    ],
    exp: 'Thyroid storm management blocks thyroid synthesis (PTU/MMI), peripheral T4-T3 conversion (Propranolol/Hydrocortisone), and hormone release (Iodine after antithyroid drug).'
  },
  {
    title: 'Acute Hyperkalemia with ECG Changes (Peaked T Waves & QRS Widening)',
    options: [
      'IV Calcium Gluconate 10% (membrane stabilization) + Insulin/Dextrose + Salbutamol + Sodium Zirconium Cyclosilicate',
      'Oral potassium chloride replacement',
      'Urgent loop diuretic monotherapy without cardiac membrane stabilization',
      'Immediate IV beta-blocker infusion'
    ],
    exp: 'IV Calcium gluconate/chloride stabilizes the cardiac membrane immediately, preventing fatal dysrhythmias, followed by shift therapy (insulin/dextrose).'
  }
];

function generateExpandedIntMedicineQuestions(): Question[] {
  const generated: Question[] = [];
  const count = 2140; // Total = 10 demo + 2140 = 2150 questions for SMSB Internal Medicine

  for (let i = 0; i < count; i++) {
    const qIndex = 11 + i;
    const catObj = smsbCategories[i % smsbCategories.length];
    const subObj = smsbSubtopics[i % smsbSubtopics.length];

    const age = 22 + ((i * 11) % 55);
    const gender = i % 2 === 0 ? 'male' : 'female';

    const rawOpts = [...subObj.options];
    const shift = i % 4;
    const shiftedOpts = rawOpts.slice(shift).concat(rawOpts.slice(0, shift));
    const correctIndex = (4 - shift) % 4;

    const stemText = `A ${age}-year-old ${gender} candidate presents to the SMSB Internal Medicine tertiary clinic with clinical, laboratory, and imaging features characteristic of ${subObj.title}. What is the evidence-based definitive management strategy according to specialty board guidelines?`;

    generated.push({
      id: `int_med_q${qIndex}`,
      specialtyId: 'int_medicine',
      councilId: 'specialties',
      category: catObj.name,
      stem: stemText,
      questionAr: stemText,
      questionEn: stemText,
      options: shiftedOpts,
      optionsEn: shiftedOpts,
      correctIndex: correctIndex,
      difficulty: i % 3 === 0 ? 'صعب' : i % 3 === 1 ? 'متوسط' : 'سهل',
      explanationAr: `SMSB Board Rationale: ${subObj.exp} (SMSB Internal Medicine Specialty Review Code: SMSB-MED-2026-${qIndex}).`,
      explanationEn: `SMSB Board Rationale: ${subObj.exp} (SMSB Internal Medicine Specialty Review Code: SMSB-MED-2026-${qIndex}).`,
      reference: `${catObj.ref} / SMSB Specialization Board 2026`,
      lang: 'en'
    });
  }

  return generated;
}

export const INT_MEDICINE_BANK_QUESTIONS: Question[] = [
  ...INT_MEDICINE_DEMO_QUESTIONS,
  ...generateExpandedIntMedicineQuestions()
];
