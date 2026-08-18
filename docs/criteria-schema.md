1) requires_study_partner 

- Type: tri boolean
- Recognition: "ongoing caregiver", "study partner", "care partner." Do not count a legally authorized representative. They may only be mentioned for consent. 
- Count: 3
- Real Phrasings: 
  - NCT06650527: "Caregivers must live with their care recipient" 
  - NCT05929703: "Family member or care partner available to be on-site in the hospital”

2) cognitive_scale

- Type: text
- Recognition: Cognitive scales, such as MMSE, MoCA, CDR, or multifactorial Memory Questionnaire Satisfaction Scale
- Count: 3
- Real Phrasings:
  - NCT05977088: “Clinical Dementia Rating Scale (CDR) score in the 1-2 range”
  - DRKS00038679: “People with an MMSE score of 24-30 points and an additional MoCA score of 0-23 points”

3) min_cognitive_score:

- Type: number
- Recogniton: Lower numeric boundary attached to a named cognitive scale
- Count: 2
- Real Phrasings:
  - NCT05977088: “Clinical Dementia Rating Scale (CDR) score in the 1-2 range”
  - DRKS00038679: “People with an MMSE score of 15-23 points”

4) max_cognitive_score:

- Type: number
- Recognition: Upper numeric boundary attached to a named cognitive scale
- Count: 3
- Real Phrasings:
  - **NCT05977088:** “Clinical Dementia Rating Scale (CDR) score in the 1-2 range”
  - **DRKS00038679:** “People with an MMSE score of 24-30 points”

5) excluded_conditions:

- Type: list
- Recogniton: Conditions, diseases, impairments, contraindications, or medical histories explicitly listed as exclusion criteria.
- Count: 16
- Real Phrasings: 
  - **NCT02763683:** “history of head trauma, major neurological or psychiatric diseases other than Parkinson disease and dementia”
  - **NCT06052163: "**Chronic liver disease; Renal insufficiency; Poorly managed hypertension"

6) excluded_medications:

- Type: list 
- Recognition: Named medications, medication classes, substances, or medication-use restrictions that exclude participation.
- Count: 9
- Real Phrasings: 
  - **NCT06052163:** “lithium, drugs with ototoxic potential, drugs with nephrotoxic potential, probenecid, and indomethacin”
  - **NCT07031687: "**anticholinergics, benzodiazepines, antipsychotics”

7) requires_imaging:

- Type: tri boolean
- Recognition: MRI, fMRI, PET, or another named imaging procedure counts.
- Count: 6
- Real Phrasings:
  - **NCT06052163:** “willingness and ability to complete all aspects of the study including assessments, neuropsychological testing, and MRI"
  - **NCT07031687:** “Receive multimodal imaging (sMRI, rs-fMRI, task-fMRI, DTI) and blood biomarker assessments”

8) requires_lumbar_puncture:

- Type: tri boolean
- Recognition: Lumbar puncture is explicitly required for enrollment or a study-specific procedure. 
- Count: 1
- Real Phrasings:
  - **NCT03621839:** “Lumbar punction collected in usual practice in the context of dementia diagnosis”
  - **NCT02763683:**  “The Lumbar Puncture is done on willing participants”

9) care_setting:

- Type: text
- Recognition: The document identifies where the participant lives, receives care, is recruited, or completes the study, such as hospital, home, memory clinic, community, or remote setting.
- Count: 8
- Real Phrasings:
  - **NCT07031687:** “Individuals recruited from neurology memory clinics or communities”
  - **NCT05929703:** “Anticipated length of hospital stay at least 72 hours”

10) age_requirement:

- Type: text
- Recognition: Minimum age, maximum age, age range
- Count: 20
- Real Phrasings:
  - **NCT05929703:** “At least 70 years of age”
  - **NCT07502560:** Age 76 years or older at the time of signing the informed consent”

