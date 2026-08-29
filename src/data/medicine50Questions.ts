import { Question } from '../types';

export const ORIGINAL_50_MEDICINE_QUESTIONS: Question[] = [
  // --- CARDIOLOGY (Q1 - Q10) ---
  {
    id: 'med_50_q1',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Cardiology & Vascular Medicine',
    stem: 'A 55-year-old man presents with retrosternal chest pain on exertion, relieved by rest within 5 minutes. No sweating or nausea. Family history of coronary artery disease.',
    labTable: [
      { test: 'Total cholesterol', result: '6.8 mmol/L', range: '<5.0 mmol/L', abnormal: true },
      { test: 'LDL', result: '4.2 mmol/L', range: '<3.0 mmol/L', abnormal: true },
      { test: 'HDL', result: '1.0 mmol/L', range: '>1.2 mmol/L', abnormal: true },
      { test: 'Triglycerides', result: '2.5 mmol/L', range: '<1.7 mmol/L', abnormal: true },
      { test: 'Troponin I', result: '<0.04 ng/mL', range: '<0.04 ng/mL', abnormal: false }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Acute myocardial infarction', 'Stable angina pectoris', 'Acute pericarditis', 'Pulmonary embolism', 'Aortic dissection'],
    optionsEn: ['Acute myocardial infarction', 'Stable angina pectoris', 'Acute pericarditis', 'Pulmonary embolism', 'Aortic dissection'],
    correctIndex: 1,
    explanationAr: 'Exertional chest pain relieved by rest with normal troponin indicates stable angina due to coronary artery stenosis.',
    explanationEn: 'Exertional chest pain relieved by rest with normal troponin indicates stable angina due to coronary artery stenosis.',
    explainWrong: [
      'Troponin is normal with no acute ECG changes.',
      'Stable angina pectoris is correct.',
      'Pericarditis pain is positional and pleuritic.',
      'PE would present with dyspnea and tachycardia.',
      'Aortic dissection causes sudden, tearing back pain.'
    ],
    difficulty: 'متوسط',
    reference: 'NICE CG126 - Stable Angina Management',
    lang: 'en'
  },
  {
    id: 'med_50_q2',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Cardiology & Vascular Medicine',
    stem: 'A 68-year-old woman presents with palpitations, dizziness, and recurrent syncope. ECG shows severe bradycardia (38 bpm) with P waves not associated with QRS complexes.',
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Atrial fibrillation', 'Third-degree AV block', 'Ventricular tachycardia', 'Sick sinus syndrome', 'Chronic pulmonary embolism'],
    optionsEn: ['Atrial fibrillation', 'Third-degree AV block', 'Ventricular tachycardia', 'Sick sinus syndrome', 'Chronic pulmonary embolism'],
    correctIndex: 1,
    explanationAr: 'Dissociated P waves and QRS complexes with severe bradycardia indicate complete heart block.',
    explanationEn: 'Dissociated P waves and QRS complexes with severe bradycardia indicate complete heart block.',
    explainWrong: [
      'AF shows no organized P waves.',
      'Third-degree AV block is correct.',
      'VT has a rapid rate >100 bpm.',
      'Sick sinus shows alternating tachycardia and bradycardia.',
      'Chronic PE does not cause this ECG pattern.'
    ],
    difficulty: 'صعب',
    reference: 'ESC Guidelines on Cardiac Pacing',
    lang: 'en'
  },
  {
    id: 'med_50_q3',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Cardiology & Vascular Medicine',
    stem: 'A 32-year-old man presents with acute left-sided chest pain worsened by inspiration and relieved by leaning forward, with mild fever.',
    labTable: [
      { test: 'CRP', result: '45 mg/L', range: '<5 mg/L', abnormal: true },
      { test: 'Troponin', result: 'Normal', range: '<0.04 ng/mL', abnormal: false },
      { test: 'ECG', result: 'Diffuse ST elevation with PR depression', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Anterior myocardial infarction', 'Acute pericarditis', 'Pulmonary embolism', 'Pleuritis', 'Aortic dissection'],
    optionsEn: ['Anterior myocardial infarction', 'Acute pericarditis', 'Pulmonary embolism', 'Pleuritis', 'Aortic dissection'],
    correctIndex: 1,
    explanationAr: 'Positional chest pain relieved by leaning forward with diffuse ST elevation and PR depression is classic for acute pericarditis.',
    explanationEn: 'Positional chest pain relieved by leaning forward with diffuse ST elevation and PR depression is classic for acute pericarditis.',
    explainWrong: [
      'MI pain is not positional with localized ST elevation.',
      'Acute pericarditis is correct.',
      'PE causes dyspnea and hypoxia.',
      'Pleuritis does not cause characteristic ECG changes.',
      'Dissection causes severe tearing back pain.'
    ],
    difficulty: 'سهل',
    reference: 'ESC Guidelines on Pericardial Diseases',
    lang: 'en'
  },
  {
    id: 'med_50_q4',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Cardiology & Vascular Medicine',
    stem: 'A 60-year-old man presents with progressive dyspnea and peripheral edema. Examination reveals pulmonary crackles, elevated JVP, and an S3 gallop.',
    labTable: [
      { test: 'BNP', result: '1200 pg/mL', range: '<100 pg/mL', abnormal: true },
      { test: 'Troponin', result: 'Normal', range: '<0.04 ng/mL', abnormal: false },
      { test: 'Echocardiogram', result: 'Ejection fraction 35%', range: '50-70%', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Acute pulmonary edema', 'Chronic systolic heart failure', 'COPD', 'Acute pulmonary embolism', 'Myocarditis'],
    optionsEn: ['Acute pulmonary edema', 'Chronic systolic heart failure', 'COPD', 'Acute pulmonary embolism', 'Myocarditis'],
    correctIndex: 1,
    explanationAr: 'Progressive dyspnea, edema, elevated BNP, and reduced EF indicate chronic systolic heart failure.',
    explanationEn: 'Progressive dyspnea, edema, elevated BNP, and reduced EF indicate chronic systolic heart failure.',
    explainWrong: [
      'Acute edema occurs suddenly, not progressively.',
      'Chronic systolic heart failure is correct.',
      'COPD shows wheeze and hyperinflation.',
      'PE presents acutely with hypoxia.',
      'Myocarditis usually follows viral infection.'
    ],
    difficulty: 'متوسط',
    reference: 'NICE NG106 - Chronic Heart Failure',
    lang: 'en'
  },
  {
    id: 'med_50_q5',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Cardiology & Vascular Medicine',
    stem: 'A 45-year-old woman experiences sudden-onset palpitations that start and stop abruptly, lasting several minutes. ECG during episode shows regular tachycardia at 180 bpm with no visible P waves.',
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Atrial fibrillation', 'Paroxysmal supraventricular tachycardia (PSVT)', 'Ventricular tachycardia', 'Ventricular fibrillation', 'Multifocal atrial tachycardia'],
    optionsEn: ['Atrial fibrillation', 'Paroxysmal supraventricular tachycardia (PSVT)', 'Ventricular tachycardia', 'Ventricular fibrillation', 'Multifocal atrial tachycardia'],
    correctIndex: 1,
    explanationAr: 'Abrupt onset/offset with regular tachycardia and absent P waves is characteristic of PSVT due to re-entry.',
    explanationEn: 'Abrupt onset/offset with regular tachycardia and absent P waves is characteristic of PSVT due to re-entry.',
    explainWrong: [
      'AF has an irregularly irregular rhythm.',
      'Paroxysmal supraventricular tachycardia (PSVT) is correct.',
      'VT usually occurs in structural heart disease.',
      'VF causes immediate loss of consciousness.',
      'MAT shows varying P wave morphologies.'
    ],
    difficulty: 'صعب',
    reference: 'ESC Guidelines for Supraventricular Tachycardia',
    lang: 'en'
  },
  {
    id: 'med_50_q6',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Cardiology & Vascular Medicine',
    stem: 'A 70-year-old man experiences recurrent syncope on standing. Systolic BP drops from 140 to 90 mmHg on standing.',
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Orthostatic hypotension', 'AV block', 'Sick sinus syndrome', 'Vasovagal syncope', 'Postprandial hypotension'],
    optionsEn: ['Orthostatic hypotension', 'AV block', 'Sick sinus syndrome', 'Vasovagal syncope', 'Postprandial hypotension'],
    correctIndex: 0,
    explanationAr: 'A drop of >20 mmHg systolic on standing with symptoms indicates orthostatic hypotension.',
    explanationEn: 'A drop of >20 mmHg systolic on standing with symptoms indicates orthostatic hypotension.',
    explainWrong: [
      'Orthostatic hypotension is correct.',
      'AV block causes bradycardia unrelated to posture.',
      'Sick sinus shows alternating tachy/brady.',
      'Vasovagal is preceded by prodromal symptoms.',
      'Postprandial occurs within 2 hours of eating.'
    ],
    difficulty: 'متوسط',
    reference: 'NICE CG109 - Syncope Management',
    lang: 'en'
  },
  {
    id: 'med_50_q7',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Cardiology & Vascular Medicine',
    stem: 'A 28-year-old man presents with acute chest pain and dyspnea after a long-haul flight. He has a history of previous leg fracture.',
    labTable: [
      { test: 'D-dimer', result: 'Elevated', range: '<500 ng/mL', abnormal: true },
      { test: 'Troponin', result: 'Normal', range: '<0.04 ng/mL', abnormal: false },
      { test: 'ABG', result: 'Mild hypoxia', range: 'PaO2 >10 kPa', abnormal: true }
    ],
    questionAr: 'What is the most appropriate diagnostic investigation?',
    questionEn: 'What is the most appropriate diagnostic investigation?',
    options: ['Chest X-ray', 'CT pulmonary angiography (CTPA)', 'Echocardiogram', 'Conventional pulmonary angiography', 'V/Q scan'],
    optionsEn: ['Chest X-ray', 'CT pulmonary angiography (CTPA)', 'Echocardiogram', 'Conventional pulmonary angiography', 'V/Q scan'],
    correctIndex: 1,
    explanationAr: 'In a patient with high pre-test probability for PE (long travel, previous fracture, acute symptoms), CTPA is the investigation of choice.',
    explanationEn: 'In a patient with high pre-test probability for PE (long travel, previous fracture, acute symptoms), CTPA is the investigation of choice.',
    explainWrong: [
      'CXR is often normal in PE.',
      'CTPA is the gold standard imaging choice.',
      'Echo shows signs of right heart strain only.',
      'Conventional angiography is invasive.',
      'V/Q scan is less specific.'
    ],
    difficulty: 'صعب',
    reference: 'NICE NG158 - Venous Thromboembolic Diseases',
    lang: 'en'
  },
  {
    id: 'med_50_q8',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Cardiology & Vascular Medicine',
    stem: 'A 50-year-old man presents with 20 minutes of resting chest pain with sweating and nausea. ECG shows ST elevation in V1-V4.',
    labTable: [
      { test: 'Troponin I', result: '5.2 ng/mL', range: '<0.04 ng/mL', abnormal: true },
      { test: 'CK-MB', result: '45 U/L', range: '<25 U/L', abnormal: true }
    ],
    questionAr: 'What is the most urgent management step?',
    questionEn: 'What is the most urgent management step?',
    options: ['Aspirin and observation', 'Primary PCI', 'Morphine only', 'Intravenous anticoagulation', 'Echocardiogram first'],
    optionsEn: ['Aspirin and observation', 'Primary PCI', 'Morphine only', 'Intravenous anticoagulation', 'Echocardiogram first'],
    correctIndex: 1,
    explanationAr: 'Anterior ST elevation with elevated troponin indicates an acute anterior STEMI requiring PCI within 90-120 minutes.',
    explanationEn: 'Anterior ST elevation with elevated troponin indicates an acute anterior STEMI requiring PCI within 90-120 minutes.',
    explainWrong: [
      'Aspirin alone does not achieve reperfusion.',
      'Primary PCI is the correct urgent step.',
      'Morphine is symptomatic only.',
      'Anticoagulation does not open the occluded artery.',
      'Echo delays emergency catheterization.'
    ],
    difficulty: 'سهل',
    reference: 'NICE CG167 - Acute Coronary Syndromes',
    lang: 'en'
  },
  {
    id: 'med_50_q9',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Cardiology & Vascular Medicine',
    stem: 'A 62-year-old woman complains of paroxysmal nocturnal dyspnea with dry cough, improving on sitting up.',
    labTable: [
      { test: 'BNP', result: '850 pg/mL', range: '<100 pg/mL', abnormal: true },
      { test: 'CXR', result: 'Pulmonary congestion with Kerley B lines', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Cardiac asthma (left heart failure)', 'Bronchial asthma', 'COPD', 'Pulmonary embolism', 'Acute bronchitis'],
    optionsEn: ['Cardiac asthma (left heart failure)', 'Bronchial asthma', 'COPD', 'Pulmonary embolism', 'Acute bronchitis'],
    correctIndex: 0,
    explanationAr: 'Paroxysmal nocturnal dyspnea improving with sitting, elevated BNP, and Kerley B lines indicate pulmonary edema of cardiac origin.',
    explanationEn: 'Paroxysmal nocturnal dyspnea improving with sitting, elevated BNP, and Kerley B lines indicate pulmonary edema of cardiac origin.',
    explainWrong: [
      'Cardiac asthma (left heart failure) is correct.',
      'Asthma shows wheeze and hyperinflation with normal BNP.',
      'COPD does not show pulmonary congestion.',
      'PE occurs acutely and is not nocturnal.',
      'Bronchitis causes cough and sputum with normal BNP.'
    ],
    difficulty: 'صعب',
    reference: 'ESC Guidelines on Heart Failure',
    lang: 'en'
  },
  {
    id: 'med_50_q10',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Cardiology & Vascular Medicine',
    stem: 'A 75-year-old man presents with resting chest pain, hypotension (85/50 mmHg), and signs of cardiogenic shock.',
    labTable: [
      { test: 'Troponin I', result: '25 ng/mL', range: '<0.04 ng/mL', abnormal: true },
      { test: 'ECG', result: 'ST elevation in II, III, aVF', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Inferior STEMI with cardiogenic shock', 'Massive pulmonary embolism', 'Purulent pericarditis', 'Aortic rupture', 'Cardiac tamponade'],
    optionsEn: ['Inferior STEMI with cardiogenic shock', 'Massive pulmonary embolism', 'Purulent pericarditis', 'Aortic rupture', 'Cardiac tamponade'],
    correctIndex: 0,
    explanationAr: 'Inferior STEMI with severe hypotension and markedly elevated troponin indicates cardiogenic shock requiring urgent intervention.',
    explanationEn: 'Inferior STEMI with severe hypotension and markedly elevated troponin indicates cardiogenic shock requiring urgent intervention.',
    explainWrong: [
      'Inferior STEMI with cardiogenic shock is correct.',
      'PE does not cause this degree of troponin elevation.',
      'Pericarditis does not cause this elevation.',
      'Aortic rupture causes back pain.',
      'Tamponade shows elevated JVP.'
    ],
    difficulty: 'صعب',
    reference: 'ESC Guidelines on Acute Coronary Syndromes',
    lang: 'en'
  },

  // --- GASTROENTEROLOGY (Q11 - Q18) ---
  {
    id: 'med_50_q11',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Gastroenterology & Hepatology',
    stem: 'A 45-year-old woman presents with right upper quadrant pain, nausea, and vomiting, worsened by fatty meals.',
    labTable: [
      { test: 'Bilirubin', result: '1.8 mg/dL', range: '<1.2 mg/dL', abnormal: true },
      { test: 'ALP', result: '350 U/L', range: '30-120 U/L', abnormal: true },
      { test: 'GGT', result: '280 U/L', range: '<50 U/L', abnormal: true },
      { test: 'ALT', result: '45 U/L', range: '<35 U/L', abnormal: false }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Gallstone disease', 'Acute viral hepatitis', 'Wilson\'s disease', 'Cirrhosis', 'Pancreatic cancer'],
    optionsEn: ['Gallstone disease', 'Acute viral hepatitis', 'Wilson\'s disease', 'Cirrhosis', 'Pancreatic cancer'],
    correctIndex: 0,
    explanationAr: 'RUQ pain with cholestatic pattern (elevated ALP/GGT) suggests gallstone disease.',
    explanationEn: 'RUQ pain with cholestatic pattern (elevated ALP/GGT) suggests gallstone disease.',
    explainWrong: [
      'Gallstone disease is correct.',
      'Viral hepatitis shows elevated ALT/AST more than ALP.',
      'Wilson\'s disease presents with neurological signs.',
      'Cirrhosis is chronic, not acute.',
      'Pancreatic cancer typically involves painless jaundice.'
    ],
    difficulty: 'متوسط',
    reference: 'NICE CG188 - Gallstone Disease',
    lang: 'en'
  },
  {
    id: 'med_50_q12',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Gastroenterology & Hepatology',
    stem: 'A 55-year-old man presents with recurrent rectal bleeding, constipation, and pain on defecation. Examination shows bright red blood.',
    labTable: [
      { test: 'Haemoglobin', result: '10.5 g/dL', range: '13.0-17.0 g/dL', abnormal: true },
      { test: 'MCV', result: '78 fL', range: '80-100 fL', abnormal: true },
      { test: 'Ferritin', result: '15 ng/mL', range: '20-250 ng/mL', abnormal: true }
    ],
    questionAr: 'What is the most appropriate diagnostic test?',
    questionEn: 'What is the most appropriate diagnostic test?',
    options: ['Digital rectal examination only', 'Colonoscopy', 'Abdominal X-ray', 'Fecal occult blood test', 'CT abdomen'],
    optionsEn: ['Digital rectal examination only', 'Colonoscopy', 'Abdominal X-ray', 'Fecal occult blood test', 'CT abdomen'],
    correctIndex: 1,
    explanationAr: 'Rectal bleeding with iron deficiency anemia requires colonoscopy to exclude malignancy or polyps.',
    explanationEn: 'Rectal bleeding with iron deficiency anemia requires colonoscopy to exclude malignancy or polyps.',
    explainWrong: [
      'DRE does not identify proximal sources.',
      'Colonoscopy is correct.',
      'CXR does not show mucosal lesions.',
      'FOBT is redundant when overt bleeding is present.',
      'CT does not show surface mucosal lesions.'
    ],
    difficulty: 'صعب',
    reference: 'BSG Guidelines on Lower GI Bleeding',
    lang: 'en'
  },
  {
    id: 'med_50_q13',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Gastroenterology & Hepatology',
    stem: 'A 30-year-old woman presents with chronic diarrhea, abdominal pain, and bloating. Symptoms improve on a gluten-free diet.',
    labTable: [
      { test: 'Anti-tTG antibody', result: 'Positive', range: 'Negative', abnormal: true },
      { test: 'IgA', result: 'Normal', range: 'Normal', abnormal: false }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Irritable bowel syndrome', 'Celiac disease', 'Crohn\'s disease', 'Ulcerative colitis', 'Lactose intolerance'],
    optionsEn: ['Irritable bowel syndrome', 'Celiac disease', 'Crohn\'s disease', 'Ulcerative colitis', 'Lactose intolerance'],
    correctIndex: 1,
    explanationAr: 'Improvement on gluten-free diet with positive tTG antibodies indicates celiac disease.',
    explanationEn: 'Improvement on gluten-free diet with positive tTG antibodies indicates celiac disease.',
    explainWrong: [
      'IBS has no immunological markers.',
      'Celiac disease is correct.',
      'Crohn\'s is not gluten-related.',
      'UC causes bloody diarrhea.',
      'Lactose intolerance improves with lactose-free diet.'
    ],
    difficulty: 'متوسط',
    reference: 'NICE NG20 - Coeliac Disease',
    lang: 'en'
  },
  {
    id: 'med_50_q14',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Gastroenterology & Hepatology',
    stem: 'A 65-year-old man presents with sudden severe abdominal pain, nausea, vomiting, and absence of flatus. Abdomen is distended with high-pitched bowel sounds.',
    labTable: [
      { test: 'WBC', result: '15,000 /µL', range: '4,000-11,000 /µL', abnormal: true },
      { test: 'CRP', result: '120 mg/L', range: '<5 mg/L', abnormal: true },
      { test: 'Potassium', result: '3.0 mmol/L', range: '3.5-5.0 mmol/L', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Acute appendicitis', 'Acute intestinal obstruction', 'Acute pancreatitis', 'Perforated peptic ulcer', 'Acute cholecystitis'],
    optionsEn: ['Acute appendicitis', 'Acute intestinal obstruction', 'Acute pancreatitis', 'Perforated peptic ulcer', 'Acute cholecystitis'],
    correctIndex: 1,
    explanationAr: 'Sudden pain, vomiting, absent flatus, and high-pitched bowel sounds indicate intestinal obstruction.',
    explanationEn: 'Sudden pain, vomiting, absent flatus, and high-pitched bowel sounds indicate intestinal obstruction.',
    explainWrong: [
      'Appendicitis pain migrates to RLQ.',
      'Acute intestinal obstruction is correct.',
      'Pancreatitis causes constant epigastric pain.',
      'Perforated ulcer causes knife-like pain with rigid abdomen.',
      'Cholecystitis causes RUQ pain.'
    ],
    difficulty: 'صعب',
    reference: 'NICE Guidelines on Bowel Obstruction',
    lang: 'en'
  },
  {
    id: 'med_50_q15',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Gastroenterology & Hepatology',
    stem: 'A 28-year-old woman presents with recurrent bloody diarrhea, lower abdominal pain, and tenesmus.',
    labTable: [
      { test: 'CRP', result: '45 mg/L', range: '<5 mg/L', abnormal: true },
      { test: 'ESR', result: '35 mm/hr', range: '<20 mm/hr', abnormal: true },
      { test: 'Colonoscopy', result: 'Continuous ulceration in rectum and left colon', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Crohn\'s disease', 'Ulcerative colitis', 'Infectious colitis', 'Diverticular disease', 'Colon cancer'],
    optionsEn: ['Crohn\'s disease', 'Ulcerative colitis', 'Infectious colitis', 'Diverticular disease', 'Colon cancer'],
    correctIndex: 1,
    explanationAr: 'Bloody diarrhea with continuous colonic ulceration indicates ulcerative colitis.',
    explanationEn: 'Bloody diarrhea with continuous colonic ulceration indicates ulcerative colitis.',
    explainWrong: [
      'Crohn\'s shows skip lesions and transmural involvement.',
      'Ulcerative colitis is correct.',
      'Infectious colitis is usually self-limiting acute.',
      'Diverticular disease occurs in older adults.',
      'Colon cancer presents as a mass.'
    ],
    difficulty: 'متوسط',
    reference: 'BSG Guidelines on IBD',
    lang: 'en'
  },
  {
    id: 'med_50_q16',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Gastroenterology & Hepatology',
    stem: 'A 45-year-old man presents with chronic diarrhea, steatorrhea, weight loss, edema, and arthralgia.',
    labTable: [
      { test: 'Albumin', result: '2.5 g/dL', range: '3.5-5.0 g/dL', abnormal: true },
      { test: 'Calcium', result: '7.8 mg/dL', range: '8.5-10.2 mg/dL', abnormal: true },
      { test: 'Duodenal biopsy', result: 'PAS-positive macrophages & villous atrophy', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Refractory celiac disease', 'Whipple\'s disease', 'Intestinal lymphoma', 'Crohn\'s disease', 'Inflammatory bowel disease'],
    optionsEn: ['Refractory celiac disease', 'Whipple\'s disease', 'Intestinal lymphoma', 'Crohn\'s disease', 'Inflammatory bowel disease'],
    correctIndex: 1,
    explanationAr: 'Steatorrhea, weight loss, arthralgia with villous atrophy & PAS-positive macrophages suggests Whipple\'s disease.',
    explanationEn: 'Steatorrhea, weight loss, arthralgia with villous atrophy & PAS-positive macrophages suggests Whipple\'s disease.',
    explainWrong: [
      'Celiac lacks PAS-positive macrophages and arthralgia.',
      'Whipple\'s disease is correct.',
      'Lymphoma presents differently.',
      'Crohn\'s shows transmural non-caseating granulomas.',
      'IBD rarely causes severe steatorrhea.'
    ],
    difficulty: 'صعب',
    reference: 'Harrison\'s Principles of Internal Medicine - Malabsorption',
    lang: 'en'
  },
  {
    id: 'med_50_q17',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Gastroenterology & Hepatology',
    stem: 'A 60-year-old woman presents with chronic constipation, lower abdominal pain, and a palpable firm mass in the left lower quadrant.',
    labTable: [
      { test: 'Haemoglobin', result: '10.0 g/dL', range: '12.0-16.0 g/dL', abnormal: true },
      { test: 'Ferritin', result: '10 ng/mL', range: '20-250 ng/mL', abnormal: true },
      { test: 'Fecal occult blood', result: 'Positive', range: 'Negative', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Colon cancer', 'Diverticular disease', 'Colonic stricture', 'Internal hemorrhoids', 'Fibroid'],
    optionsEn: ['Colon cancer', 'Diverticular disease', 'Colonic stricture', 'Internal hemorrhoids', 'Fibroid'],
    correctIndex: 0,
    explanationAr: 'Left lower quadrant mass with iron deficiency anemia and positive FOBT suggests colon cancer.',
    explanationEn: 'Left lower quadrant mass with iron deficiency anemia and positive FOBT suggests colon cancer.',
    explainWrong: [
      'Colon cancer is correct.',
      'Diverticular disease usually does not cause a firm mass.',
      'Stricture does not cause a mass.',
      'Hemorrhoids do not cause an abdominal mass.',
      'Fibroids are uterine.'
    ],
    difficulty: 'متوسط',
    reference: 'NICE NG12 - Suspected Cancer Referral',
    lang: 'en'
  },
  {
    id: 'med_50_q18',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Gastroenterology & Hepatology',
    stem: 'A 22-year-old man presents with periumbilical pain migrating to the right lower quadrant with nausea and fever.',
    labTable: [
      { test: 'WBC', result: '14,000 /µL', range: '4,000-11,000 /µL', abnormal: true },
      { test: 'CRP', result: '80 mg/L', range: '<5 mg/L', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Acute appendicitis', 'Acute cholecystitis', 'Acute pancreatitis', 'Ulcerative colitis', 'Incarcerated inguinal hernia'],
    optionsEn: ['Acute appendicitis', 'Acute cholecystitis', 'Acute pancreatitis', 'Ulcerative colitis', 'Incarcerated inguinal hernia'],
    correctIndex: 0,
    explanationAr: 'Pain migrating from periumbilical to RLQ with fever and elevated WBC indicates appendicitis.',
    explanationEn: 'Pain migrating from periumbilical to RLQ with fever and elevated WBC indicates appendicitis.',
    explainWrong: [
      'Acute appendicitis is correct.',
      'Cholecystitis causes RUQ pain.',
      'Pancreatitis causes epigastric pain radiating to back.',
      'Colitis causes bloody diarrhea.',
      'Hernia presents as a groin mass.'
    ],
    difficulty: 'سهل',
    reference: 'WSES Guidelines for Acute Appendicitis',
    lang: 'en'
  },

  // --- ENDOCRINOLOGY (Q19 - Q26) ---
  {
    id: 'med_50_q19',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Endocrinology & Diabetes',
    stem: 'A 35-year-old woman presents with severe hunger, sweating, tremors, and palpitations before meals, relieved by eating.',
    labTable: [
      { test: 'Fasting glucose', result: '70 mg/dL', range: '70-99 mg/dL', abnormal: false },
      { test: 'Glucose during episode', result: '50 mg/dL', range: '70-99 mg/dL', abnormal: true },
      { test: 'Insulin', result: '25 µU/mL', range: '<3 µU/mL during hypoglycemia', abnormal: true },
      { test: 'C-peptide', result: 'Elevated', range: 'Low during hypoglycemia', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Type 1 diabetes', 'Insulinoma', 'Type 2 diabetes', 'Functional hypoglycemia', 'Drug-induced hypoglycemia'],
    optionsEn: ['Type 1 diabetes', 'Insulinoma', 'Type 2 diabetes', 'Functional hypoglycemia', 'Drug-induced hypoglycemia'],
    correctIndex: 1,
    explanationAr: 'Hypoglycemia with elevated insulin and C-peptide indicates endogenous insulin overproduction (insulinoma).',
    explanationEn: 'Hypoglycemia with elevated insulin and C-peptide indicates endogenous insulin overproduction (insulinoma).',
    explainWrong: [
      'Type 1 causes hyperglycemia.',
      'Insulinoma is correct.',
      'Type 2 causes hyperglycemia.',
      'Functional hypoglycemia has low C-peptide.',
      'Exogenous insulin shows high insulin with low C-peptide.'
    ],
    difficulty: 'متوسط',
    reference: 'Endocrine Society Guideline on Hypoglycemia',
    lang: 'en'
  },
  {
    id: 'med_50_q20',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Endocrinology & Diabetes',
    stem: 'A 50-year-old man presents with hypertension, muscle weakness, fatigue, and polydipsia with polyuria.',
    labTable: [
      { test: 'Sodium', result: '148 mmol/L', range: '135-145 mmol/L', abnormal: true },
      { test: 'Potassium', result: '2.8 mmol/L', range: '3.5-5.0 mmol/L', abnormal: true },
      { test: 'Aldosterone', result: 'Elevated', range: 'Normal', abnormal: true },
      { test: 'Renin', result: 'Low', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Primary hyperaldosteronism (Conn\'s syndrome)', 'Hypercortisolism', 'Pheochromocytoma', 'Renal artery stenosis', 'Addison\'s disease'],
    optionsEn: ['Primary hyperaldosteronism (Conn\'s syndrome)', 'Hypercortisolism', 'Pheochromocytoma', 'Renal artery stenosis', 'Addison\'s disease'],
    correctIndex: 0,
    explanationAr: 'Hypertension with hypokalemia, elevated aldosterone, and low renin indicates primary hyperaldosteronism.',
    explanationEn: 'Hypertension with hypokalemia, elevated aldosterone, and low renin indicates primary hyperaldosteronism.',
    explainWrong: [
      'Primary hyperaldosteronism (Conn\'s syndrome) is correct.',
      'Hypercortisolism causes truncal obesity.',
      'Pheochromocytoma causes paroxysmal hypertension.',
      'Renal artery stenosis shows elevated renin.',
      'Addison\'s causes hyponatremia and hyperkalemia.'
    ],
    difficulty: 'صعب',
    reference: 'Endocrine Society Guidelines on Primary Aldosteronism',
    lang: 'en'
  },
  {
    id: 'med_50_q21',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Endocrinology & Thyroid',
    stem: 'A 42-year-old woman presents with proptosis, weight loss, tachycardia, and hand tremors.',
    labTable: [
      { test: 'TSH', result: '<0.01 mU/L', range: '0.4-4.0 mU/L', abnormal: true },
      { test: 'Free T4', result: '35 pmol/L', range: '9-25 pmol/L', abnormal: true },
      { test: 'Free T3', result: '12 pmol/L', range: '3.5-7.8 pmol/L', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Graves\' disease', 'Subacute thyroiditis', 'TSH-secreting pituitary adenoma', 'Hypothyroidism', 'Toxic nodule'],
    optionsEn: ['Graves\' disease', 'Subacute thyroiditis', 'TSH-secreting pituitary adenoma', 'Hypothyroidism', 'Toxic nodule'],
    correctIndex: 0,
    explanationAr: 'Proptosis, weight loss, with suppressed TSH and elevated T4/T3 indicates Graves\' disease.',
    explanationEn: 'Proptosis, weight loss, with suppressed TSH and elevated T4/T3 indicates Graves\' disease.',
    explainWrong: [
      'Graves\' disease is correct.',
      'Subacute thyroiditis causes pain.',
      'Pituitary adenoma shows elevated TSH with elevated T4.',
      'Hypothyroidism shows elevated TSH and low T4.',
      'Toxic nodule does not cause proptosis.'
    ],
    difficulty: 'متوسط',
    reference: 'ATA Guidelines for Hyperthyroidism',
    lang: 'en'
  },
  {
    id: 'med_50_q22',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Endocrinology & Pituitary',
    stem: 'A 25-year-old woman presents with amenorrhea, galactorrhea, and chronic headache.',
    labTable: [
      { test: 'Prolactin', result: '150 ng/mL', range: '<25 ng/mL', abnormal: true },
      { test: 'TSH', result: 'Normal', range: 'Normal', abnormal: false },
      { test: 'FSH', result: 'Low', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Prolactinoma', 'Polycystic ovary syndrome', 'Primary hypothyroidism', 'Cushing\'s syndrome', 'Drug-induced hyperprolactinemia'],
    optionsEn: ['Prolactinoma', 'Polycystic ovary syndrome', 'Primary hypothyroidism', 'Cushing\'s syndrome', 'Drug-induced hyperprolactinemia'],
    correctIndex: 0,
    explanationAr: 'Elevated prolactin (>100 ng/mL) with symptoms and no drug history indicates a prolactinoma.',
    explanationEn: 'Elevated prolactin (>100 ng/mL) with symptoms and no drug history indicates a prolactinoma.',
    explainWrong: [
      'Prolactinoma is correct.',
      'PCOS does not cause elevated prolactin >100.',
      'Hypothyroidism shows elevated TSH.',
      'Cushing\'s shows obesity and striae.',
      'Drug-induced rarely exceeds 100 ng/mL.'
    ],
    difficulty: 'صعب',
    reference: 'Endocrine Society Guidelines on Hyperprolactinemia',
    lang: 'en'
  },
  {
    id: 'med_50_q23',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Endocrinology & Thyroid',
    stem: 'A 60-year-old man presents with generalized weakness, constipation, cold intolerance, and progressive weight gain.',
    labTable: [
      { test: 'TSH', result: '25 mU/L', range: '0.4-4.0 mU/L', abnormal: true },
      { test: 'Free T4', result: '6 pmol/L', range: '9-25 pmol/L', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Primary hypothyroidism', 'Pituitary insufficiency', 'Hyperthyroidism', 'Acute thyroiditis', 'Benign thyroid nodule'],
    optionsEn: ['Primary hypothyroidism', 'Pituitary insufficiency', 'Hyperthyroidism', 'Acute thyroiditis', 'Benign thyroid nodule'],
    correctIndex: 0,
    explanationAr: 'Elevated TSH with low T4 indicates primary hypothyroidism.',
    explanationEn: 'Elevated TSH with low T4 indicates primary hypothyroidism.',
    explainWrong: [
      'Primary hypothyroidism is correct.',
      'Pituitary insufficiency shows low TSH with low T4.',
      'Hyperthyroidism shows low TSH with high T4.',
      'Acute thyroiditis causes pain.',
      'Benign nodule does not affect function.'
    ],
    difficulty: 'متوسط',
    reference: 'ATA Guidelines for Hypothyroidism',
    lang: 'en'
  },
  {
    id: 'med_50_q24',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Endocrinology & Bone',
    stem: 'A 55-year-old woman presents with bone pain, constipation, fatigue, and weight loss. History of recurrent renal stones.',
    labTable: [
      { test: 'Calcium', result: '12.0 mg/dL', range: '8.5-10.2 mg/dL', abnormal: true },
      { test: 'Phosphorus', result: '2.0 mg/dL', range: '2.5-4.5 mg/dL', abnormal: true },
      { test: 'PTH', result: '120 pg/mL', range: '15-65 pg/mL', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Primary hyperparathyroidism', 'Malignant hypercalcemia', 'Paget\'s disease', 'Vitamin D deficiency', 'Sarcoidosis'],
    optionsEn: ['Primary hyperparathyroidism', 'Malignant hypercalcemia', 'Paget\'s disease', 'Vitamin D deficiency', 'Sarcoidosis'],
    correctIndex: 0,
    explanationAr: 'Hypercalcemia, hypophosphatemia, and elevated PTH indicate primary hyperparathyroidism.',
    explanationEn: 'Hypercalcemia, hypophosphatemia, and elevated PTH indicate primary hyperparathyroidism.',
    explainWrong: [
      'Primary hyperparathyroidism is correct.',
      'Malignant hypercalcemia shows suppressed PTH.',
      'Paget\'s shows elevated alkaline phosphatase.',
      'Vitamin D deficiency causes hypocalcemia.',
      'Sarcoidosis suppresses serum PTH.'
    ],
    difficulty: 'صعب',
    reference: 'AACE Guidelines on Primary Hyperparathyroidism',
    lang: 'en'
  },
  {
    id: 'med_50_q25',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Endocrinology & Diabetes',
    stem: 'A 65-year-old man presents with polydipsia, polyuria, and unintentional weight loss.',
    labTable: [
      { test: 'Fasting glucose', result: '180 mg/dL', range: '70-99 mg/dL', abnormal: true },
      { test: 'HbA1c', result: '8.5%', range: '<5.7%', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Type 2 diabetes mellitus', 'Type 1 diabetes mellitus', 'Diabetes insipidus', 'Adrenal hyperglycemia', 'Metabolic syndrome'],
    optionsEn: ['Type 2 diabetes mellitus', 'Type 1 diabetes mellitus', 'Diabetes insipidus', 'Adrenal hyperglycemia', 'Metabolic syndrome'],
    correctIndex: 0,
    explanationAr: 'Polydipsia, polyuria, weight loss with elevated glucose and HbA1c >6.5% indicates Type 2 diabetes.',
    explanationEn: 'Polydipsia, polyuria, weight loss with elevated glucose and HbA1c >6.5% indicates Type 2 diabetes.',
    explainWrong: [
      'Type 2 diabetes mellitus is correct.',
      'Type 1 usually presents at a younger age.',
      'DI shows normal glucose.',
      'Adrenal hyperglycemia is rare.',
      'Metabolic syndrome does not cause this degree of hyperglycemia.'
    ],
    difficulty: 'متوسط',
    reference: 'ADA Standards of Care in Diabetes',
    lang: 'en'
  },
  {
    id: 'med_50_q26',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Endocrinology & Adrenal',
    stem: 'A 20-year-old man presents with paroxysmal severe headache, palpitations, sweating, and sudden severe hypertension.',
    labTable: [
      { test: 'Urinary metanephrines', result: 'Elevated', range: 'Normal', abnormal: true },
      { test: 'Plasma catecholamines', result: 'Elevated', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Pheochromocytoma', 'Renal artery stenosis', 'Hyperaldosteronism', 'Cushing\'s syndrome', 'Graves\' disease'],
    optionsEn: ['Pheochromocytoma', 'Renal artery stenosis', 'Hyperaldosteronism', 'Cushing\'s syndrome', 'Graves\' disease'],
    correctIndex: 0,
    explanationAr: 'Paroxysmal hypertension with headache, palpitations, and elevated catecholamines indicates pheochromocytoma.',
    explanationEn: 'Paroxysmal hypertension with headache, palpitations, and elevated catecholamines indicates pheochromocytoma.',
    explainWrong: [
      'Pheochromocytoma is correct.',
      'Renal artery stenosis causes sustained hypertension.',
      'Hyperaldosteronism causes hypokalemia.',
      'Cushing\'s causes truncal obesity.',
      'Graves\' causes hyperthyroidism.'
    ],
    difficulty: 'صعب',
    reference: 'Endocrine Society Guidelines on Pheochromocytoma',
    lang: 'en'
  },

  // --- RESPIRATORY (Q27 - Q33) ---
  {
    id: 'med_50_q27',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Respiratory Medicine',
    stem: 'A 24-year-old man presents with recurrent wheezing, dyspnea, and nocturnal cough, improving with bronchodilators.',
    labTable: [
      { test: 'IgE', result: 'Elevated', range: '<100 IU/mL', abnormal: true },
      { test: 'Eosinophils', result: '8%', range: '1-4%', abnormal: true },
      { test: 'Methacholine challenge', result: 'Positive', range: 'Negative', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Asthma', 'COPD', 'Cystic fibrosis', 'Acute bronchitis', 'Pulmonary fibrosis'],
    optionsEn: ['Asthma', 'COPD', 'Cystic fibrosis', 'Acute bronchitis', 'Pulmonary fibrosis'],
    correctIndex: 0,
    explanationAr: 'Recurrent wheeze improving with bronchodilators and elevated IgE indicates asthma.',
    explanationEn: 'Recurrent wheeze improving with bronchodilators and elevated IgE indicates asthma.',
    explainWrong: [
      'Asthma is correct.',
      'COPD occurs in smokers.',
      'CF presents with steatorrhea.',
      'Acute bronchitis is temporary.',
      'Fibrosis causes dry crackles.'
    ],
    difficulty: 'متوسط',
    reference: 'GINA Strategy for Asthma',
    lang: 'en'
  },
  {
    id: 'med_50_q28',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Respiratory Medicine',
    stem: 'A 68-year-old man, 40-pack-year smoker, presents with progressive dyspnea and chronic cough with sputum.',
    labTable: [
      { test: 'FEV1', result: '45% predicted', range: '>80%', abnormal: true },
      { test: 'FEV1/FVC ratio', result: '55%', range: '>70%', abnormal: true },
      { test: 'CXR', result: 'Hyperinflation', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['COPD', 'Asthma', 'Pulmonary fibrosis', 'Pulmonary tuberculosis', 'Interstitial pneumonia'],
    optionsEn: ['COPD', 'Asthma', 'Pulmonary fibrosis', 'Pulmonary tuberculosis', 'Interstitial pneumonia'],
    correctIndex: 0,
    explanationAr: 'Chronic smoking with irreversible airflow obstruction (FEV1/FVC <70%) and hyperinflation indicates COPD.',
    explanationEn: 'Chronic smoking with irreversible airflow obstruction (FEV1/FVC <70%) and hyperinflation indicates COPD.',
    explainWrong: [
      'COPD is correct.',
      'Asthma is reversible with bronchodilator testing.',
      'Fibrosis shows restrictive pattern.',
      'TB shows apical lesions.',
      'Interstitial pneumonia shows restrictive pattern.'
    ],
    difficulty: 'صعب',
    reference: 'GOLD Strategy for COPD',
    lang: 'en'
  },
  {
    id: 'med_50_q29',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Respiratory Medicine',
    stem: 'A 40-year-old woman presents with dry cough, dyspnea, persistent fever, arthralgia, and mediastinal lymphadenopathy.',
    labTable: [
      { test: 'ACE', result: '150 U/L', range: '8-52 U/L', abnormal: true },
      { test: 'Calcium', result: '11.0 mg/dL', range: '8.5-10.2 mg/dL', abnormal: true },
      { test: 'CXR', result: 'Bilateral hilar lymphadenopathy', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Sarcoidosis', 'Pulmonary tuberculosis', 'Lung cancer', 'Interstitial pneumonia', 'Idiopathic pulmonary fibrosis'],
    optionsEn: ['Sarcoidosis', 'Pulmonary tuberculosis', 'Lung cancer', 'Interstitial pneumonia', 'Idiopathic pulmonary fibrosis'],
    correctIndex: 0,
    explanationAr: 'Bilateral hilar lymphadenopathy, hypercalcemia, and elevated ACE indicate sarcoidosis.',
    explanationEn: 'Bilateral hilar lymphadenopathy, hypercalcemia, and elevated ACE indicate sarcoidosis.',
    explainWrong: [
      'Sarcoidosis is correct.',
      'TB shows apical lesions.',
      'Lung cancer shows a mass.',
      'Interstitial pneumonia does not cause hilar adenopathy.',
      'IPF occurs in older adults.'
    ],
    difficulty: 'متوسط',
    reference: 'BTS Statement on Pulmonary Sarcoidosis',
    lang: 'en'
  },
  {
    id: 'med_50_q30',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Respiratory & Oncology',
    stem: 'A 55-year-old man presents with hemoptysis, dyspnea, and weight loss. Long history of smoking.',
    labTable: [
      { test: 'CXR', result: 'Right upper lobe mass', range: 'Normal', abnormal: true },
      { test: 'Biopsy', result: 'Small undifferentiated neuroendocrine cells', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Small cell lung cancer', 'Non-small cell lung cancer', 'Carcinoid tumor', 'Pulmonary tuberculosis', 'Fungal infection'],
    optionsEn: ['Small cell lung cancer', 'Non-small cell lung cancer', 'Carcinoid tumor', 'Pulmonary tuberculosis', 'Fungal infection'],
    correctIndex: 0,
    explanationAr: 'Central hilar mass with small cells and smoking history indicates small cell lung cancer.',
    explanationEn: 'Central hilar mass with small cells and smoking history indicates small cell lung cancer.',
    explainWrong: [
      'Small cell lung cancer is correct.',
      'NSCLC shows larger cells or glands.',
      'Carcinoid grows slowly.',
      'TB shows caseating granulomas.',
      'Fungal infection shows hyphae.'
    ],
    difficulty: 'صعب',
    reference: 'NICE NG122 - Lung Cancer',
    lang: 'en'
  },
  {
    id: 'med_50_q31',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Respiratory Medicine',
    stem: 'A 30-year-old woman presents with recurrent pneumonias, chronic sinusitis, and elevated sweat chloride.',
    labTable: [
      { test: 'Sweat chloride', result: '80 mmol/L', range: '<29 mmol/L', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Cystic fibrosis', 'Severe asthma', 'COPD', 'Alpha-1 antitrypsin deficiency', 'Pulmonary fibrosis'],
    optionsEn: ['Cystic fibrosis', 'Severe asthma', 'COPD', 'Alpha-1 antitrypsin deficiency', 'Pulmonary fibrosis'],
    correctIndex: 0,
    explanationAr: 'Recurrent respiratory infections with elevated sweat chloride indicates cystic fibrosis.',
    explanationEn: 'Recurrent respiratory infections with elevated sweat chloride indicates cystic fibrosis.',
    explainWrong: [
      'Cystic fibrosis is correct.',
      'Asthma does not elevate sweat chloride.',
      'COPD occurs in smokers.',
      'Alpha-1 antitrypsin causes early emphysema.',
      'Fibrosis does not affect chloride.'
    ],
    difficulty: 'متوسط',
    reference: 'Cystic Fibrosis Foundation Guidelines',
    lang: 'en'
  },
  {
    id: 'med_50_q32',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Respiratory Medicine',
    stem: 'A 45-year-old man presents with acute dyspnea, fever, and productive cough with green sputum, 3 days after a cold.',
    labTable: [
      { test: 'WBC', result: '15,000 /µL', range: '4,000-11,000 /µL', abnormal: true },
      { test: 'CXR', result: 'Right lower lobe infiltrate', range: 'Clear', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Bacterial pneumonia', 'Viral pneumonia', 'Pulmonary embolism', 'Acute bronchitis', 'Pulmonary tuberculosis'],
    optionsEn: ['Bacterial pneumonia', 'Viral pneumonia', 'Pulmonary embolism', 'Acute bronchitis', 'Pulmonary tuberculosis'],
    correctIndex: 0,
    explanationAr: 'Fever, productive cough, infiltrate, and elevated WBC indicate bacterial pneumonia.',
    explanationEn: 'Fever, productive cough, infiltrate, and elevated WBC indicate bacterial pneumonia.',
    explainWrong: [
      'Bacterial pneumonia is correct.',
      'Viral shows upper respiratory symptoms.',
      'PE occurs suddenly with hypoxia.',
      'Bronchitis does not show infiltrate.',
      'TB is chronic with weight loss.'
    ],
    difficulty: 'سهل',
    reference: 'BTS Guidelines for Pneumonia',
    lang: 'en'
  },
  {
    id: 'med_50_q33',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Respiratory Medicine',
    stem: 'A 32-year-old tall, thin man presents with recurrent spontaneous pneumothorax.',
    labTable: [
      { test: 'CXR', result: 'Right-sided pneumothorax 30%', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Primary spontaneous pneumothorax', 'Secondary pneumothorax', 'Traumatic pneumothorax', 'Pleural effusion', 'Pneumomediastinum'],
    optionsEn: ['Primary spontaneous pneumothorax', 'Secondary pneumothorax', 'Traumatic pneumothorax', 'Pleural effusion', 'Pneumomediastinum'],
    correctIndex: 0,
    explanationAr: 'Spontaneous pneumothorax in a tall, thin young man indicates primary spontaneous pneumothorax.',
    explanationEn: 'Spontaneous pneumothorax in a tall, thin young man indicates primary spontaneous pneumothorax.',
    explainWrong: [
      'Primary spontaneous pneumothorax is correct.',
      'Secondary occurs in COPD patients.',
      'Traumatic follows trauma.',
      'Effusion shows fluid collection.',
      'Pneumomediastinum shows air in mediastinum.'
    ],
    difficulty: 'صعب',
    reference: 'BTS Guidelines for Pneumothorax',
    lang: 'en'
  },

  // --- NEPHROLOGY (Q34 - Q38) ---
  {
    id: 'med_50_q34',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Nephrology & Renal Medicine',
    stem: 'A 45-year-old woman presents with edema, frothy urine, and hypertension.',
    labTable: [
      { test: 'Urine protein', result: '5 g/24h', range: '<0.15 g/24h', abnormal: true },
      { test: 'Albumin', result: '2.5 g/dL', range: '3.5-5.0 g/dL', abnormal: true },
      { test: 'Creatinine', result: '1.2 mg/dL', range: '0.6-1.1 mg/dL', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Nephrotic syndrome', 'Acute glomerulonephritis', 'Chronic renal failure', 'Interstitial nephritis', 'Diabetic nephropathy'],
    optionsEn: ['Nephrotic syndrome', 'Acute glomerulonephritis', 'Chronic renal failure', 'Interstitial nephritis', 'Diabetic nephropathy'],
    correctIndex: 0,
    explanationAr: 'Proteinuria >3.5 g/day with hypoalbuminemia and edema indicates nephrotic syndrome.',
    explanationEn: 'Proteinuria >3.5 g/day with hypoalbuminemia and edema indicates nephrotic syndrome.',
    explainWrong: [
      'Nephrotic syndrome is correct.',
      'AGN presents with hematuria.',
      'CRF shows elevated creatinine.',
      'Interstitial nephritis presents with fever and pain.',
      'Diabetic nephropathy occurs with long-standing diabetes.'
    ],
    difficulty: 'متوسط',
    reference: 'KDIGO Guidelines for Glomerulonephritis',
    lang: 'en'
  },
  {
    id: 'med_50_q35',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Nephrology & Renal Medicine',
    stem: 'A 65-year-old man presents with hematuria, flank pain, and difficulty urinating.',
    labTable: [
      { test: 'CT scan', result: 'Ureteric stone', range: 'No stone', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Renal stone', 'Bladder cancer', 'Acute prostatitis', 'Ureteral stricture', 'Urinary tract infection'],
    optionsEn: ['Renal stone', 'Bladder cancer', 'Acute prostatitis', 'Ureteral stricture', 'Urinary tract infection'],
    correctIndex: 0,
    explanationAr: 'Flank pain with hematuria and stone on CT indicates renal/ureteric stone.',
    explanationEn: 'Flank pain with hematuria and stone on CT indicates renal/ureteric stone.',
    explainWrong: [
      'Renal stone is correct.',
      'Bladder cancer causes painless hematuria.',
      'Prostatitis causes fever and perineal pain.',
      'Stricture does not show a stone.',
      'UTI causes cloudy urine and fever.'
    ],
    difficulty: 'صعب',
    reference: 'EAU Guidelines on Urolithiasis',
    lang: 'en'
  },
  {
    id: 'med_50_q36',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Nephrology & Renal Medicine',
    stem: 'A 28-year-old woman presents with hematuria, edema, and hypertension following a viral infection.',
    labTable: [
      { test: 'Urine protein', result: '2 g/24h', range: '<0.15 g/24h', abnormal: true },
      { test: 'Creatinine', result: '1.5 mg/dL', range: '0.6-1.1 mg/dL', abnormal: true },
      { test: 'Renal biopsy', result: 'IgG and C3 deposits', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Post-infectious glomerulonephritis', 'Nephrotic syndrome', 'Interstitial nephritis', 'IgA nephropathy', 'Vasculitis'],
    optionsEn: ['Post-infectious glomerulonephritis', 'Nephrotic syndrome', 'Interstitial nephritis', 'IgA nephropathy', 'Vasculitis'],
    correctIndex: 0,
    explanationAr: 'Hematuria and edema post-infection with IgG/C3 deposits indicate post-infectious GN.',
    explanationEn: 'Hematuria and edema post-infection with IgG/C3 deposits indicate post-infectious GN.',
    explainWrong: [
      'Post-infectious glomerulonephritis is correct.',
      'NS shows protein >3.5 g/day.',
      'Interstitial nephritis does not show immune deposits.',
      'IgA occurs after upper respiratory infection.',
      'Vasculitis presents with systemic features.'
    ],
    difficulty: 'متوسط',
    reference: 'KDIGO Guidelines for Glomerular Diseases',
    lang: 'en'
  },
  {
    id: 'med_50_q37',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Nephrology & Renal Medicine',
    stem: 'A 70-year-old man presents with progressive renal failure, anemia, hyperphosphatemia, and hypocalcemia.',
    labTable: [
      { test: 'Creatinine', result: '4.5 mg/dL', range: '0.6-1.1 mg/dL', abnormal: true },
      { test: 'GFR', result: '15 mL/min', range: '>90 mL/min', abnormal: true },
      { test: 'PTH', result: 'Elevated', range: '15-65 pg/mL', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Stage 5 chronic kidney disease', 'Acute kidney injury', 'Diabetic nephropathy', 'Glomerulonephritis', 'Polycystic kidney disease'],
    optionsEn: ['Stage 5 chronic kidney disease', 'Acute kidney injury', 'Diabetic nephropathy', 'Glomerulonephritis', 'Polycystic kidney disease'],
    correctIndex: 0,
    explanationAr: 'GFR <15 with hyperphosphatemia and functional impairment indicates end-stage renal disease.',
    explanationEn: 'GFR <15 with hyperphosphatemia and functional impairment indicates end-stage renal disease.',
    explainWrong: [
      'Stage 5 chronic kidney disease is correct.',
      'AKI occurs suddenly.',
      'Diabetic nephropathy occurs with long-standing diabetes.',
      'GN shows proteinuria and hematuria.',
      'PKD shows cysts on imaging.'
    ],
    difficulty: 'صعب',
    reference: 'KDIGO Guidelines for CKD',
    lang: 'en'
  },
  {
    id: 'med_50_q38',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Nephrology & Renal Medicine',
    stem: 'A 50-year-old woman presents with burning on urination, frequency, and cloudy, foul-smelling urine.',
    labTable: [
      { test: 'Urinalysis', result: 'Positive nitrites, WBCs', range: 'Negative', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Urinary tract infection', 'Renal stone', 'Interstitial cystitis', 'Bladder cancer', 'Vaginitis'],
    optionsEn: ['Urinary tract infection', 'Renal stone', 'Interstitial cystitis', 'Bladder cancer', 'Vaginitis'],
    correctIndex: 0,
    explanationAr: 'Burning, frequency, cloudy urine with positive nitrites indicates UTI.',
    explanationEn: 'Burning, frequency, cloudy urine with positive nitrites indicates UTI.',
    explainWrong: [
      'Urinary tract infection is correct.',
      'Stone causes pain, not just burning.',
      'Interstitial cystitis causes chronic pain.',
      'Bladder cancer causes hematuria.',
      'Vaginitis causes itching and discharge.'
    ],
    difficulty: 'متوسط',
    reference: 'NICE NG109 - UTI Prescribing',
    lang: 'en'
  },

  // --- NEUROLOGY (Q39 - Q42) ---
  {
    id: 'med_50_q39',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Neurology',
    stem: 'A 60-year-old man presents with resting tremor, muscle rigidity, and bradykinesia.',
    labTable: [
      { test: 'Brain imaging', result: 'Normal', range: 'Normal', abnormal: false }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Parkinson\'s disease', 'Essential tremor', 'Multiple system atrophy', 'Huntington\'s disease', 'Stroke'],
    optionsEn: ['Parkinson\'s disease', 'Essential tremor', 'Multiple system atrophy', 'Huntington\'s disease', 'Stroke'],
    correctIndex: 0,
    explanationAr: 'Resting tremor, rigidity, and bradykinesia form the Parkinsonian triad.',
    explanationEn: 'Resting tremor, rigidity, and bradykinesia form the Parkinsonian triad.',
    explainWrong: [
      'Parkinson\'s disease is correct.',
      'Essential tremor occurs during action.',
      'MSA shows ataxia.',
      'Huntington\'s shows chorea.',
      'Stroke occurs suddenly.'
    ],
    difficulty: 'متوسط',
    reference: 'NICE NG71 - Parkinson\'s Disease',
    lang: 'en'
  },
  {
    id: 'med_50_q40',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Neurology',
    stem: 'A 35-year-old woman presents with recurrent unilateral throbbing headaches with nausea, photophobia, and visual flashes.',
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Migraine with aura', 'Cluster headache', 'Tension headache', 'Sinus headache', 'Tension-type headache'],
    optionsEn: ['Migraine with aura', 'Cluster headache', 'Tension headache', 'Sinus headache', 'Tension-type headache'],
    correctIndex: 0,
    explanationAr: 'Throbbing headache with visual aura, nausea, and photophobia indicates migraine with aura.',
    explanationEn: 'Throbbing headache with visual aura, nausea, and photophobia indicates migraine with aura.',
    explainWrong: [
      'Migraine with aura is correct.',
      'Cluster causes eye redness.',
      'Tension causes band-like pain.',
      'Sinus causes nasal congestion.',
      'Tension does not cause nausea.'
    ],
    difficulty: 'صعب',
    reference: 'IHS Classification of Headache Disorders',
    lang: 'en'
  },
  {
    id: 'med_50_q41',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Neurology',
    stem: 'A 45-year-old man presents with sudden-onset left-sided weakness, facial droop, and speech difficulty.',
    labTable: [
      { test: 'CT brain', result: 'No hemorrhage', range: 'Normal', abnormal: false }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Ischemic stroke', 'Hemorrhagic stroke', 'TIA', 'Brain tumor', 'Multiple sclerosis'],
    optionsEn: ['Ischemic stroke', 'Hemorrhagic stroke', 'TIA', 'Brain tumor', 'Multiple sclerosis'],
    correctIndex: 0,
    explanationAr: 'Sudden weakness with normal CT (no bleed) indicates ischemic stroke.',
    explanationEn: 'Sudden weakness with normal CT (no bleed) indicates ischemic stroke.',
    explainWrong: [
      'Ischemic stroke is correct.',
      'Hemorrhagic shows blood on CT.',
      'TIA resolves within 24 hours.',
      'Tumor shows a mass.',
      'MS shows multiple lesions.'
    ],
    difficulty: 'متوسط',
    reference: 'AHA/ASA Stroke Guidelines',
    lang: 'en'
  },
  {
    id: 'med_50_q42',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Neurology',
    stem: 'A 30-year-old woman presents with sudden loss of consciousness, tonic-clonic movements, and lip-smacking, lasting 1-2 minutes, followed by confusion.',
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Generalized tonic-clonic seizure', 'Vasovagal syncope', 'Migraine', 'Multiple sclerosis', 'Acute psychosis'],
    optionsEn: ['Generalized tonic-clonic seizure', 'Vasovagal syncope', 'Migraine', 'Multiple sclerosis', 'Acute psychosis'],
    correctIndex: 0,
    explanationAr: 'Seizure activity with loss of consciousness and post-ictal confusion indicates a generalized seizure.',
    explanationEn: 'Seizure activity with loss of consciousness and post-ictal confusion indicates a generalized seizure.',
    explainWrong: [
      'Generalized tonic-clonic seizure is correct.',
      'Vasovagal does not cause convulsions.',
      'Migraine does not cause loss of consciousness.',
      'MS does not cause generalized seizures.',
      'Psychosis does not follow seizure pattern.'
    ],
    difficulty: 'صعب',
    reference: 'NICE NG217 - Epilepsies',
    lang: 'en'
  },

  // --- RHEUMATOLOGY (Q43 - Q46) ---
  {
    id: 'med_50_q43',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Rheumatology & Autoimmune',
    stem: 'A 40-year-old woman presents with joint pain and swelling in the hands and feet, with morning stiffness lasting >1 hour.',
    labTable: [
      { test: 'Rheumatoid factor', result: 'Positive', range: 'Negative', abnormal: true },
      { test: 'Anti-CCP', result: 'Positive', range: 'Negative', abnormal: true },
      { test: 'ESR', result: '45 mm/hr', range: '<20 mm/hr', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Rheumatoid arthritis', 'Osteoarthritis', 'Gout', 'Psoriatic arthritis', 'Systemic lupus erythematosus'],
    optionsEn: ['Rheumatoid arthritis', 'Osteoarthritis', 'Gout', 'Psoriatic arthritis', 'Systemic lupus erythematosus'],
    correctIndex: 0,
    explanationAr: 'Morning stiffness >60 min with positive RF and anti-CCP indicates RA.',
    explanationEn: 'Morning stiffness >60 min with positive RF and anti-CCP indicates RA.',
    explainWrong: [
      'Rheumatoid arthritis is correct.',
      'OA does not cause prolonged stiffness.',
      'Gout is acute and sudden.',
      'Psoriatic is associated with psoriasis.',
      'SLE shows systemic features.'
    ],
    difficulty: 'متوسط',
    reference: 'ACR/EULAR Rheumatoid Arthritis Criteria',
    lang: 'en'
  },
  {
    id: 'med_50_q44',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Rheumatology & Autoimmune',
    stem: 'A 35-year-old man presents with chronic lower back pain, worse with rest and improving with exercise, with morning stiffness.',
    labTable: [
      { test: 'HLA-B27', result: 'Positive', range: 'Negative', abnormal: true },
      { test: 'ESR', result: '40 mm/hr', range: '<20 mm/hr', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Ankylosing spondylitis', 'Sciatica', 'Disc herniation', 'Osteoporosis', 'Osteomyelitis'],
    optionsEn: ['Ankylosing spondylitis', 'Sciatica', 'Disc herniation', 'Osteoporosis', 'Osteomyelitis'],
    correctIndex: 0,
    explanationAr: 'Inflammatory back pain with HLA-B27 positivity indicates ankylosing spondylitis.',
    explanationEn: 'Inflammatory back pain with HLA-B27 positivity indicates ankylosing spondylitis.',
    explainWrong: [
      'Ankylosing spondylitis is correct.',
      'Sciatica pain radiates to the leg.',
      'Disc herniation worsens with movement.',
      'Osteoporosis does not cause morning stiffness.',
      'Osteomyelitis causes fever and local pain.'
    ],
    difficulty: 'صعب',
    reference: 'ASAS Criteria for Spondyloarthritis',
    lang: 'en'
  },
  {
    id: 'med_50_q45',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Rheumatology & Autoimmune',
    stem: 'A 25-year-old woman presents with malar rash, arthralgia, and photosensitivity.',
    labTable: [
      { test: 'ANA', result: 'Positive', range: 'Negative', abnormal: true },
      { test: 'Anti-dsDNA', result: 'Positive', range: 'Negative', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Systemic lupus erythematosus', 'Rheumatoid arthritis', 'Scleroderma', 'Sjögren\'s syndrome', 'Vasculitis'],
    optionsEn: ['Systemic lupus erythematosus', 'Rheumatoid arthritis', 'Scleroderma', 'Sjögren\'s syndrome', 'Vasculitis'],
    correctIndex: 0,
    explanationAr: 'Malar rash, arthralgia, photosensitivity with positive ANA and anti-dsDNA indicates SLE.',
    explanationEn: 'Malar rash, arthralgia, photosensitivity with positive ANA and anti-dsDNA indicates SLE.',
    explainWrong: [
      'Systemic lupus erythematosus is correct.',
      'RA shows rheumatoid factor.',
      'Scleroderma shows skin thickening.',
      'Sjögren\'s shows dry eyes and mouth.',
      'Vasculitis shows vascular features.'
    ],
    difficulty: 'متوسط',
    reference: 'EULAR/ACR Criteria for SLE',
    lang: 'en'
  },
  {
    id: 'med_50_q46',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Rheumatology & Autoimmune',
    stem: 'A 50-year-old man presents with sudden severe pain, redness, and swelling of the first metatarsophalangeal joint.',
    labTable: [
      { test: 'Uric acid', result: '9.0 mg/dL', range: '3.5-7.2 mg/dL', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Gout', 'Septic arthritis', 'Osteoarthritis', 'Rheumatoid arthritis', 'Pseudogout'],
    optionsEn: ['Gout', 'Septic arthritis', 'Osteoarthritis', 'Rheumatoid arthritis', 'Pseudogout'],
    correctIndex: 0,
    explanationAr: 'Acute MTP joint pain with elevated uric acid indicates gout.',
    explanationEn: 'Acute MTP joint pain with elevated uric acid indicates gout.',
    explainWrong: [
      'Gout is correct.',
      'Septic shows fever.',
      'OA is chronic, not acute.',
      'RA is symmetrical.',
      'Pseudogout is rare in MTP.'
    ],
    difficulty: 'صعب',
    reference: 'EULAR Recommendations for Gout',
    lang: 'en'
  },

  // --- INFECTIOUS DISEASE (Q47 - Q50) ---
  {
    id: 'med_50_q47',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Infectious Diseases',
    stem: 'A 30-year-old man presents with fever, cough, night sweats, weight loss, and hemoptysis.',
    labTable: [
      { test: 'Tuberculin test', result: '15 mm induration', range: '<5 mm', abnormal: true },
      { test: 'CXR', result: 'Right upper lobe lesion', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Pulmonary tuberculosis', 'Lung cancer', 'Bacterial pneumonia', 'Fungal pneumonia', 'Sarcoidosis'],
    optionsEn: ['Pulmonary tuberculosis', 'Lung cancer', 'Bacterial pneumonia', 'Fungal pneumonia', 'Sarcoidosis'],
    correctIndex: 0,
    explanationAr: 'Fever, night sweats, hemoptysis, apical lesion, and positive tuberculin test indicate TB.',
    explanationEn: 'Fever, night sweats, hemoptysis, apical lesion, and positive tuberculin test indicate TB.',
    explainWrong: [
      'Pulmonary tuberculosis is correct.',
      'Cancer occurs in older adults.',
      'Bacterial is acute, not chronic.',
      'Fungal occurs in immunocompromised.',
      'Sarcoidosis shows negative tuberculin test.'
    ],
    difficulty: 'متوسط',
    reference: 'WHO Guidelines on Tuberculosis',
    lang: 'en'
  },
  {
    id: 'med_50_q48',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Infectious Diseases',
    stem: 'A 25-year-old woman presents with fever, headache, neck stiffness, and photophobia after a cold.',
    labTable: [
      { test: 'CSF analysis', result: 'WBC 500/µL (85% lymphocytes), protein elevated, glucose normal', range: '<5/µL', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Viral meningitis', 'Bacterial meningitis', 'Viral encephalitis', 'Brain tumor', 'Brain abscess'],
    optionsEn: ['Viral meningitis', 'Bacterial meningitis', 'Viral encephalitis', 'Brain tumor', 'Brain abscess'],
    correctIndex: 0,
    explanationAr: 'Fever, meningism with CSF showing lymphocytosis and normal glucose indicates viral meningitis.',
    explanationEn: 'Fever, meningism with CSF showing lymphocytosis and normal glucose indicates viral meningitis.',
    explainWrong: [
      'Viral meningitis is correct.',
      'Bacterial shows low glucose and polymorphs.',
      'Encephalitis causes altered consciousness.',
      'Tumor does not cause fever.',
      'Abscess shows focal deficits.'
    ],
    difficulty: 'صعب',
    reference: 'IDSA Guidelines for Meningitis',
    lang: 'en'
  },
  {
    id: 'med_50_q49',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Infectious Diseases',
    stem: 'A 40-year-old man presents with fever, chills, arthralgia, and a maculopapular rash on the trunk. He recently returned from a tropical country.',
    labTable: [
      { test: 'Blood film', result: 'Plasmodium falciparum trophozoites identified', range: 'Negative', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Malaria', 'Dengue fever', 'Typhoid fever', 'Leptospirosis', 'HIV seroconversion'],
    optionsEn: ['Malaria', 'Dengue fever', 'Typhoid fever', 'Leptospirosis', 'HIV seroconversion'],
    correctIndex: 0,
    explanationAr: 'Fever, chills, arthralgia, rash with malaria parasites on blood film indicates malaria.',
    explanationEn: 'Fever, chills, arthralgia, rash with malaria parasites on blood film indicates malaria.',
    explainWrong: [
      'Malaria is correct.',
      'Dengue shows thrombocytopenia.',
      'Typhoid shows rose spots.',
      'Leptospirosis shows jaundice.',
      'HIV shows lymphadenopathy.'
    ],
    difficulty: 'متوسط',
    reference: 'WHO Guidelines for Malaria',
    lang: 'en'
  },
  {
    id: 'med_50_q50',
    specialtyId: 'medicine',
    councilId: 'medical',
    category: 'Infectious Diseases',
    stem: 'A 55-year-old man with diabetes presents with fever, right flank pain, and dysuria. He has a history of recurrent UTIs.',
    labTable: [
      { test: 'Urine culture', result: 'Klebsiella pneumoniae', range: 'No growth', abnormal: true },
      { test: 'CT scan', result: 'Renal abscess', range: 'Normal', abnormal: true }
    ],
    questionAr: 'What is the most likely diagnosis?',
    questionEn: 'What is the most likely diagnosis?',
    options: ['Renal abscess with bacteremia', 'Pyelonephritis', 'Renal stone', 'Renal cell carcinoma', 'Polycystic kidney disease'],
    optionsEn: ['Renal abscess with bacteremia', 'Pyelonephritis', 'Renal stone', 'Renal cell carcinoma', 'Polycystic kidney disease'],
    correctIndex: 0,
    explanationAr: 'Fever, flank pain, recurrent UTIs, and abscess on CT in a diabetic patient indicates renal abscess.',
    explanationEn: 'Fever, flank pain, recurrent UTIs, and abscess on CT in a diabetic patient indicates renal abscess.',
    explainWrong: [
      'Renal abscess with bacteremia is correct.',
      'Pyelonephritis does not show an abscess collection.',
      'Stone does not show an abscess.',
      'RCC shows a solid mass.',
      'PKD shows bilateral cysts.'
    ],
    difficulty: 'صعب',
    reference: 'IDSA Guidelines for Complicated UTIs',
    lang: 'en'
  }
];
