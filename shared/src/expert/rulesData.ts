import type { DiagnosticRule } from './types.js';

export const DIAGNOSTIC_RULES_CATALOG: DiagnosticRule[] = [
  // =========================================================================
  // CATEGORY A: STARTING AND ELECTRICAL SYSTEMS (8 RULES: EL01 - EL08)
  // =========================================================================

  {
    ruleId: 'EL01',
    title: 'Weak or Discharged 12V Battery',
    category: 'ELECTRICAL',
    description: 'Slow crank or no crank condition caused by low battery state of charge, internal plate sulfation, or cell degradation.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'engine_crank_status', operator: 'in', expectedValue: 'slow_crank' },
    ],
    optionalSupportingConditions: [
      { factCode: 'lights_dim_on_crank', expectedValue: true },
      { factCode: 'battery_resting_voltage_v', operator: '<', expectedValue: 12.4 },
      { factCode: 'battery_warning_light_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'battery_resting_voltage_v', operator: '>=', expectedValue: 12.7 },
      { factCode: 'engine_crank_status', expectedValue: 'normal_crank' },
    ],
    requiredMeasurements: [
      {
        parameter: 'Open Circuit Voltage',
        unit: 'V',
        normalRange: { min: 12.6, max: 12.8 },
        manufacturerSpecific: false,
        standardProcedure: 'Measure across battery posts with engine off after surface charge dissipation.',
      },
      {
        parameter: 'Loaded Cranking Voltage',
        unit: 'V',
        normalRange: { min: 9.6 },
        manufacturerSpecific: false,
        standardProcedure: 'Carbon pile load test at 50% CCA rating for 15 seconds at 21°C.',
      },
    ],
    possibleFaults: [
      {
        code: 'FLT_BATTERY_SULFATED',
        name: 'Sulfated or Discharged 12V Starter Battery',
        description: 'Internal chemical degradation or capacity loss preventing adequate starter inrush current.',
        systemCategory: 'ELECTRICAL',
      },
    ],
    suggestedFollowUpQuestions: ['Q_LIGHTS_DIM_ON_CRANK', 'Q_BATTERY_RESTING_VOLTAGE'],
    recommendedDiagnosticChecks: [
      'Perform conductive battery conductance test using automated tester (e.g., Midtronics).',
      'Inspect battery terminals for acidic lead-sulfate corrosion and clean with wire brush.',
      'Check electrolyte specific gravity with hydrometer if battery has removable vent caps.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'Starter motor current requirements (150A - 250A) cause severe voltage collapse when battery internal resistance is elevated or state of charge is under 50%.',
    alternativeExplanations: ['Corroded high-resistance battery cable clamp', 'Faulty starter motor with dragging internal armature'],
    sourceReferences: [
      {
        id: 'REF_EL01_1',
        sourceTitle: 'Bosch Automotive Handbook (10th Edition)',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Starter Batteries - State of Charge and Testing',
        publicationYear: 2018,
      },
      {
        id: 'REF_EL01_2',
        sourceTitle: 'ASE A6 Electrical/Electronic Systems Study Guide',
        sourceType: 'ASE_TRAINING',
        documentSection: 'Section B: Battery Diagnosis and Service',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EL02',
    title: 'Excessive Parasitic Electrical Current Draw',
    category: 'ELECTRICAL',
    description: 'Vehicle 12V battery discharges repeatedly after sitting parked due to stuck relays or control modules failing to enter low-power sleep mode.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'battery_discharges_overnight', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'parasitic_draw_ma', operator: '>', expectedValue: 50 },
      { factCode: 'battery_resting_voltage_v', operator: '<', expectedValue: 12.2 },
    ],
    contradictoryConditions: [
      { factCode: 'parasitic_draw_ma', operator: '<=', expectedValue: 35 },
    ],
    requiredMeasurements: [
      {
        parameter: 'Key-Off Parasitic Current',
        unit: 'mA',
        normalRange: { min: 10, max: 50 },
        manufacturerSpecific: false,
        standardProcedure: 'In-series DC milliamp measurement or fused circuit voltage drop after 30-minute bus sleep.',
      },
    ],
    possibleFaults: [
      {
        code: 'FLT_PARASITIC_MODULE_DRAW',
        name: 'Quiescent Current Drain (Awake Bus or Shorted Component)',
        description: 'Electronic control unit (BCM, telematics, aftermarket alarm) continuously drawing standby current.',
        systemCategory: 'ELECTRICAL',
      },
    ],
    suggestedFollowUpQuestions: ['Q_KEY_OFF_CURRENT_DRAW', 'Q_BATTERY_RESTING_VOLTAGE'],
    recommendedDiagnosticChecks: [
      'Allow CAN bus to enter full sleep state (latched hood, key fob 10m away for 45 minutes).',
      'Measure millivolt drop across individual blade fuses using a digital multimeter.',
      'Isolate aftermarket accessories, dashcams, and trailer wiring modules.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'A continuous draw above 50-75mA will deplete a standard 60Ah automotive battery below starting threshold within 36 to 72 hours.',
    alternativeExplanations: ['Internal battery cell self-discharge', 'Alternator diode bridge leakage to ground'],
    sourceReferences: [
      {
        id: 'REF_EL02_1',
        sourceTitle: 'SAE J240 - Life Test for Automotive Storage Batteries',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Parasitic Load and Self-Discharge Standards',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EL03',
    title: 'Charging System Malfunction (Alternator / Rectifier Fault)',
    category: 'ELECTRICAL',
    description: 'Alternator fails to supply necessary system voltage to recharge battery and power vehicle electrical loads during operation.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'battery_warning_light_on', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'charging_voltage_v', operator: '<', expectedValue: 13.5 },
      { factCode: 'lights_dimming', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'charging_voltage_v', operator: 'between', range: [13.8, 14.7] },
    ],
    requiredMeasurements: [
      {
        parameter: 'Running Charging Voltage',
        unit: 'V',
        normalRange: { min: 13.8, max: 14.8 },
        manufacturerSpecific: false,
        standardProcedure: 'Measure across battery posts at 1,500 engine RPM with headlights and cabin blower on high.',
      },
    ],
    possibleFaults: [
      {
        code: 'FLT_ALTERNATOR_FAILED',
        name: 'Alternator / Smart Generator Inoperative',
        description: 'Failed diode rectifier, worn brushes, or damaged internal solid-state voltage regulator.',
        systemCategory: 'ELECTRICAL',
      },
    ],
    suggestedFollowUpQuestions: ['Q_CHARGING_VOLTAGE', 'Q_LIGHTS_DIM_ON_CRANK'],
    recommendedDiagnosticChecks: [
      'Inspect serpentine accessory drive belt for slippage, glazing, or automatic tensioner failure.',
      'Check AC ripple voltage across battery with DMM in AC millivolts (max allowable <0.5V AC).',
      'Test LIN-bus / PWM field control command duty cycle from engine control module.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Vehicle electrical power will deplete rapidly from battery alone; vehicle may stall unexpectedly in traffic.',
    supportingExplanation: 'When generator output falls below open-circuit battery voltage, all vehicle electronics run solely off battery reserve, illuminating the cluster charging indicator.',
    alternativeExplanations: ['Broken serpentine drive belt', 'Blown high-current alternator fusible link'],
    sourceReferences: [
      {
        id: 'REF_EL03_1',
        sourceTitle: 'Toyota Technical Training - Charging Systems Course 522',
        sourceType: 'OEM_MANUAL',
        documentSection: 'Section 3: Alternator Output Testing',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EL04',
    title: 'Starter Control Circuit or Interlock Malfunction',
    category: 'ELECTRICAL',
    description: 'No crank condition with healthy battery where ignition switch or start signal is blocked by starter relay, neutral safety switch, or clutch interlock.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'engine_crank_status', expectedValue: 'no_crank' },
      { factCode: 'starter_control_signal_present', expectedValue: false },
    ],
    optionalSupportingConditions: [
      { factCode: 'battery_resting_voltage_v', operator: '>=', expectedValue: 12.4 },
      { factCode: 'lights_dim_on_crank', expectedValue: false },
    ],
    contradictoryConditions: [
      { factCode: 'starter_control_signal_present', expectedValue: true },
    ],
    possibleFaults: [
      {
        code: 'FLT_STARTER_INTERLOCK_OPEN',
        name: 'Starter Relay or Inhibitor Switch Circuit Open',
        description: 'Neutral safety switch, clutch pedal interlock, or starter relay coil circuit failure.',
        systemCategory: 'ELECTRICAL',
      },
    ],
    suggestedFollowUpQuestions: ['Q_STARTER_TERMINAL_50', 'Q_LIGHTS_DIM_ON_CRANK'],
    recommendedDiagnosticChecks: [
      'Verify shift lever is firmly in Park or Neutral; try starting in Neutral while wiggling selector.',
      'Swap starter relay with identical non-critical relay (e.g., horn or rear defogger).',
      'Check ignition switch START circuit contacts or push-button start authorization in BCM.',
    ],
    safetySeverity: 'MEDIUM',
    supportingExplanation: 'Absence of voltage at starter terminal 50 proves the starter motor is not receiving the command to crank, pointing upstream to safety switches or relay coils.',
    alternativeExplanations: ['Faulty immobilizer / transponder key handshake', 'Defective ignition switch contact'],
    sourceReferences: [
      {
        id: 'REF_EL04_1',
        sourceTitle: 'Ford Service Publication - Starting System Diagnosis',
        sourceType: 'OEM_MANUAL',
        documentSection: '303-06 Starting System: Pinpoint Test A',
      },
    ],
    validationStatus: 'EXPERT_REVIEW_PENDING',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EL05',
    title: 'Starter Motor or Internal Solenoid Failure',
    category: 'ELECTRICAL',
    description: 'No crank condition despite confirmed presence of both high-current +12V battery power and +12V starter engagement signal.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'engine_crank_status', expectedValue: 'no_crank' },
      { factCode: 'starter_control_signal_present', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'lights_dim_on_crank', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'engine_crank_status', expectedValue: 'normal_crank' },
    ],
    possibleFaults: [
      {
        code: 'FLT_STARTER_MOTOR_FAILED',
        name: 'Starter Motor Burnout / Solenoid Contact Wear',
        description: 'Worn commutator brushes, burned copper contact disc, or seized starter drive pinion.',
        systemCategory: 'ELECTRICAL',
      },
    ],
    suggestedFollowUpQuestions: ['Q_STARTER_TERMINAL_50', 'Q_LIGHTS_DIM_ON_CRANK'],
    recommendedDiagnosticChecks: [
      'Tap starter motor case gently with wood block while assistant engages start position.',
      'Measure voltage drop across starter motor power cable during crank attempt (<0.5V max).',
      'Verify engine crankshaft can be rotated manually with breaker bar to rule out mechanical hydro-lock.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'When verified battery power and terminal 50 ignition trigger reach the starter but it fails to rotate, the starter assembly itself has failed internally.',
    alternativeExplanations: ['Engine mechanically locked (seized bearing or liquid in combustion chamber)'],
    sourceReferences: [
      {
        id: 'REF_EL05_1',
        sourceTitle: 'Bosch Starting Systems Workshop Guide',
        sourceType: 'INDUSTRY_REFERENCE',
        documentSection: 'Direct-Drive and Planetary Reduction Starters',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EL06',
    title: 'High-Resistance Battery Terminal Connection',
    category: 'ELECTRICAL',
    description: 'Starting failure or erratic electrical performance caused by oxidation, corrosion, or loose physical clamping between battery posts and harness terminals.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'battery_post_clamp_voltage_drop_exceeded', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'lights_dim_on_crank', expectedValue: true },
      { factCode: 'engine_crank_status', operator: 'in', expectedValue: 'slow_crank' },
    ],
    contradictoryConditions: [
      { factCode: 'battery_post_clamp_voltage_drop_exceeded', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_TERMINAL_CORROSION',
        name: 'Oxidized / Corroded Battery Terminal Clamps',
        description: 'Micro-gap between lead post and copper clamp creating high-resistance voltage barrier under current.',
        systemCategory: 'ELECTRICAL',
      },
    ],
    suggestedFollowUpQuestions: ['Q_BATTERY_TERMINAL_VOLTAGE_DROP', 'Q_CRANK_BEHAVIOR'],
    recommendedDiagnosticChecks: [
      'Measure voltage directly between center of lead post and outer metal clamp during crank.',
      'Remove clamps, clean posts with wire terminal brush, apply dielectric grease, and torque to 5 Nm.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'Ohm’s law dictates that even 0.05 ohms of contact corrosion will drop 10 volts when 200 amps of starter current is attempted (V = I * R).',
    alternativeExplanations: ['Internal battery post weld fracture'],
    sourceReferences: [
      {
        id: 'REF_EL06_1',
        sourceTitle: 'ASE A6 Electrical Diagnostic Principles',
        sourceType: 'ASE_TRAINING',
        documentSection: 'Voltage Drop Testing across Connections',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EL07',
    title: 'Blown Circuit Fuse or Fusible Link Protection',
    category: 'ELECTRICAL',
    description: 'Specific vehicle electrical circuit is completely dead due to sacrificial thermal protection element blowing from over-current or short to ground.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'fuse_continuity_open', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'accessory_circuit_dead', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'fuse_continuity_open', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_FUSE_OPEN',
        name: 'Blown Automotive Blade Fuse or Fusible Link',
        description: 'Sacrificial metal fuse element melted to protect downstream wiring harness.',
        systemCategory: 'ELECTRICAL',
      },
    ],
    suggestedFollowUpQuestions: ['Q_CIRCUIT_FUSE_STATUS'],
    recommendedDiagnosticChecks: [
      'Locate fuse using owner manual / fuse box lid schematic.',
      'Test both test points on top of fuse with 12V test light connected to chassis ground.',
      'Inspect downstream circuit for pinched wires or shorted motors before installing new fuse.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'An open fuse creates infinite resistance and zero downstream voltage, isolating the target component entirely.',
    alternativeExplanations: ['Defective load device (motor, actuator, module)'],
    sourceReferences: [
      {
        id: 'REF_EL07_1',
        sourceTitle: 'SAE J1284 - Blade Type Automotive Fuses',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Characteristics and Diagnostic Test Procedures',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EL08',
    title: 'High-Resistance Chassis Ground Circuit',
    category: 'ELECTRICAL',
    description: 'Intermittent or bizarre multi-circuit electrical behavior caused by rusted, loose, or broken negative ground return straps.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'ground_voltage_drop_v', operator: '>', expectedValue: 0.25 },
    ],
    optionalSupportingConditions: [
      { factCode: 'lights_dimming', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'ground_voltage_drop_v', operator: '<=', expectedValue: 0.1 },
    ],
    possibleFaults: [
      {
        code: 'FLT_GROUND_STRAP_DEFECTIVE',
        name: 'Engine-to-Chassis Ground Strap Degradation',
        description: 'Oxidized, fractured, or loose ground strap causing voltage feedback through other sensors.',
        systemCategory: 'ELECTRICAL',
      },
    ],
    suggestedFollowUpQuestions: ['Q_GROUND_VOLTAGE_DROP'],
    recommendedDiagnosticChecks: [
      'Connect DMM between engine block metal and negative battery post during cranking.',
      'Attach temporary jumper cable between engine block and battery ground to check for symptom cure.',
      'Remove ground eyelet bolts, wire wheel painted/rusted mating surface to bare steel, and retorque.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'Current must return to the battery; high ground resistance forces current to seek alternative paths through transmission shift cables or sensitive sensor shields.',
    alternativeExplanations: ['Internal sensor reference ground driver failure in PCM'],
    sourceReferences: [
      {
        id: 'REF_EL08_1',
        sourceTitle: 'Delphi Technologies Diagnostic Fundamentals',
        sourceType: 'INDUSTRY_REFERENCE',
        documentSection: 'Ground Circuit Voltage Drop and Noise Reduction',
      },
    ],
    validationStatus: 'EXPERT_REVIEW_PENDING',
    version: '1.0.0',
    enabled: true,
  },

  // =========================================================================
  // CATEGORY B: GASOLINE ENGINE & PERFORMANCE (10 RULES: EN01 - EN10)
  // =========================================================================

  {
    ruleId: 'EN01',
    title: 'Ignition System Misfire (Coil-on-Plug or Spark Plug Defect)',
    category: 'GASOLINE_ENGINE',
    description: 'Failure to ignite fuel-air mixture in one or more cylinders due to carbon-fouled spark plug, worn gap, or dielectric coil breakdown.',
    applicablePowertrains: ['gasoline', 'hybrid'],
    requiredConditions: [
      { factCode: 'misfire_detected', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'check_engine_light_flashing', expectedValue: true },
      { factCode: 'rough_idle', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'misfire_detected', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_IGNITION_COIL_PLUG',
        name: 'Defective Ignition Coil Boot / Spark Plug Gap Erosion',
        description: 'Spark discharge tracking down ceramic insulator or failure of coil secondary winding.',
        systemCategory: 'GASOLINE_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_MIL_FLASHING'],
    recommendedDiagnosticChecks: [
      'Retrieve cylinder-specific misfire DTCs (P0301 through P0308).',
      'Swap suspect cylinder ignition coil with adjacent cylinder to observe if misfire moves.',
      'Inspect spark plug electrodes for fuel fouling, oil contamination, or excessive electrode gap.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Flashing check engine light indicates raw fuel entering exhaust. Cease hard driving immediately to prevent catalytic converter fire.',
    supportingExplanation: 'Under heavy combustion pressure, ignition voltage requirements double; weakened secondary insulation results in spark arc to cylinder head rather than across plug gap.',
    alternativeExplanations: ['Clogged fuel injector on misfiring cylinder', 'Low mechanical cylinder compression'],
    sourceReferences: [
      {
        id: 'REF_EN01_1',
        sourceTitle: 'SAE J1979 / ISO 15031-5 E/E Diagnostic Test Modes',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Misfire Monitoring Algorithms and Thresholds',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EN02',
    title: 'Fuel Delivery Starvation or Pressure Deficiency',
    category: 'GASOLINE_ENGINE',
    description: 'In-tank fuel pump weakness, clogged fuel filter, or faulty fuel pressure regulator resulting in lean combustion or crank-no-start.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'fuel_pressure_low', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'crank_no_start', expectedValue: true },
      { factCode: 'acceleration_hesitation', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'fuel_pressure_low', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_FUEL_PUMP_FAILED',
        name: 'Fuel Pump Impeller Wear or Clogged In-Tank Strainer',
        description: 'Electric fuel pump motor degradation unable to maintain rail pressure under engine demand.',
        systemCategory: 'GASOLINE_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_FUEL_PRESSURE_MEASURED'],
    recommendedDiagnosticChecks: [
      'Connect mechanical fuel pressure gauge to Schrader test valve on fuel rail.',
      'Test fuel pump volume delivery (minimum ~1 pint in 30 seconds into graduated beaker).',
      'Verify 12V supply and ground to fuel pump module during priming key cycle.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Never test fuel systems near open flames or ignition sources. Depressurize fuel rail before disconnecting lines.',
    supportingExplanation: 'Engines require stoichiometric air-fuel ratio (~14.7:1); inadequate fuel pressure causes lean air-fuel mix that fails to ignite reliably.',
    alternativeExplanations: ['Clogged external fuel filter', 'Defective fuel rail pressure sensor reporting false low pressure'],
    sourceReferences: [
      {
        id: 'REF_EN02_1',
        sourceTitle: 'Bosch Gasoline Engine Management',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Low-Pressure Fuel Supply Systems and Testing',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EN03',
    title: 'Unmetered Intake Manifold Air / Vacuum Leak',
    category: 'GASOLINE_ENGINE',
    description: 'Cracked vacuum hose, torn PCV diaphragm, or leaking intake manifold gasket introducing air unmeasured by the MAF sensor.',
    applicablePowertrains: ['gasoline', 'hybrid'],
    requiredConditions: [
      { factCode: 'rough_idle', expectedValue: true },
      { factCode: 'long_term_fuel_trim_percent', operator: '>', expectedValue: 12 },
    ],
    optionalSupportingConditions: [
      { factCode: 'check_engine_light_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'long_term_fuel_trim_percent', operator: '<=', expectedValue: 5 },
    ],
    possibleFaults: [
      {
        code: 'FLT_VACUUM_LEAK',
        name: 'Intake Manifold Gasket / PCV Line Vacuum Leak',
        description: 'Physical air leak allowing unmetered atmospheric air into intake plenum behind throttle plate.',
        systemCategory: 'GASOLINE_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_LONG_TERM_FUEL_TRIMS'],
    recommendedDiagnosticChecks: [
      'Perform automotive smoke machine test into intake manifold with throttle body plugged.',
      'Monitor live fuel trims at idle (high positive) versus 2,500 RPM (trims normalize to near 0%).',
      'Inspect brake booster vacuum hose and PCV check valve for cracks or hardening.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'Unmetered air skews the air-fuel ratio lean. At idle, manifold vacuum is highest (18-21 in-Hg), pulling in maximum air ratio; opening throttle reduces vacuum, lessening the leak effect.',
    alternativeExplanations: ['Faulty Mass Airflow Sensor under-reporting intake air', 'Exhaust manifold leak upstream of O2 sensor'],
    sourceReferences: [
      {
        id: 'REF_EN03_1',
        sourceTitle: 'NHTSA / EPA OBD-II Fuel Trim System Diagnostic Guide',
        sourceType: 'GOV_SAFETY_STANDARD',
        documentSection: 'Fuel System Trim Diagnostics (DTC P0171 / P0174)',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EN04',
    title: 'Mass Airflow (MAF) Sensor or Circuit Inaccuracy',
    category: 'GASOLINE_ENGINE',
    description: 'Contaminated hot-wire element or damaged MAF circuit reporting incorrect intake air volume to engine control computer.',
    applicablePowertrains: ['gasoline', 'hybrid'],
    requiredConditions: [
      { factCode: 'maf_sensor_reading_implausible', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'acceleration_hesitation', expectedValue: true },
      { factCode: 'check_engine_light_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'maf_sensor_reading_implausible', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_MAF_CONTAMINATED',
        name: 'Oil / Dust Contaminated Mass Airflow Sensor',
        description: 'Insulating film on platinum sensing wire causing delayed and dampened air measurement signal.',
        systemCategory: 'GASOLINE_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_MAF_SENSOR_PLAUSIBILITY'],
    recommendedDiagnosticChecks: [
      'Inspect MAF hot wire through bore for lint or baked-on engine oil mist.',
      'Clean exclusively using non-residue electronic MAF sensor aerosol cleaner (never touch wire).',
      'Perform full throttle acceleration test logging peak g/s against engine redline spec.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'The ECU calculates base injector pulse width directly from air mass flow; false low readings cause lean hesitation during throttle snap.',
    alternativeExplanations: ['Aftermarket cold air intake causing turbulent non-laminar airflow across sensor'],
    sourceReferences: [
      {
        id: 'REF_EN04_1',
        sourceTitle: 'General Motors Powertrain DTC P0101 Diagnostic Procedure',
        sourceType: 'OEM_MANUAL',
        documentSection: 'Engine Controls - MAF Sensor System Performance',
      },
    ],
    validationStatus: 'EXPERT_REVIEW_PENDING',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EN05',
    title: 'Heated Oxygen Sensor (HO2S) Heater Circuit Fault',
    category: 'GASOLINE_ENGINE',
    description: 'Internal ceramic heating element in O2 sensor open-circuit or shorted, preventing rapid closed-loop fuel control activation.',
    applicablePowertrains: ['gasoline', 'hybrid'],
    requiredConditions: [
      { factCode: 'o2_heater_dtc_present', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'check_engine_light_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'o2_heater_dtc_present', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_O2_HEATER_BURNOUT',
        name: 'Oxygen Sensor Internal Heating Element Failure',
        description: 'Burned out internal resistor heater failing to maintain 600°F (315°C) operating temp.',
        systemCategory: 'GASOLINE_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_O2_HEATER_CIRCUIT_DTC'],
    recommendedDiagnosticChecks: [
      'Disconnect sensor harness and measure heater coil resistance across connector pins (typically 3-15 ohms).',
      'Verify 12V battery power feed to heater circuit and pulsed ground control from ECU.',
      'Inspect underside wire harness for melted insulation against exhaust downpipe.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'Oxygen sensors require high internal temperature for zirconia electrolyte ion exchange; without electric heating, warm-up is delayed, causing prolonged rich emissions.',
    alternativeExplanations: ['Blown O2 heater relay fuse in engine fuse block'],
    sourceReferences: [
      {
        id: 'REF_EN05_1',
        sourceTitle: 'EPA Clean Air Act OBD-II Regulations (40 CFR Part 86)',
        sourceType: 'GOV_SAFETY_STANDARD',
        documentSection: 'Subpart S: Oxygen Sensor Heater Circuit Monitoring',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EN06',
    title: 'Catalytic Converter Degradation (Below Efficiency Threshold)',
    category: 'GASOLINE_ENGINE',
    description: 'Three-way catalytic converter noble metal washcoat depleted or thermal meltdown, setting DTC P0420 / P0430.',
    applicablePowertrains: ['gasoline', 'hybrid'],
    requiredConditions: [
      { factCode: 'downstream_o2_rapid_switching', expectedValue: true },
      { factCode: 'check_engine_light_on', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'misfire_detected', expectedValue: false },
    ],
    contradictoryConditions: [
      { factCode: 'downstream_o2_rapid_switching', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_CATALYST_DEPLETED',
        name: 'Three-Way Catalytic Converter Substrate Depletion',
        description: 'Exhaust catalyst oxygen storage capacity (OSC) degraded below legal emissions compliance threshold.',
        systemCategory: 'GASOLINE_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_CATALYST_DOWNSTREAM_O2_SWITCHING'],
    recommendedDiagnosticChecks: [
      'Inspect exhaust pipe between engine and rear O2 sensor with smoke machine to rule out exhaust pinholes.',
      'Check temperature delta between catalyst inlet and outlet with infrared thermometer (outlet should be 20-50°C warmer).',
      'Review history to ensure previous engine misfires or oil burning did not poison ceramic substrate.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'A functioning catalytic converter buffers oxygen; downstream O2 sensor output should be smooth. If downstream mirrors upstream cycling, oxygen storage capacity is depleted.',
    alternativeExplanations: ['Exhaust leak sucking in ambient air near downstream O2 sensor', 'Defective downstream O2 sensor'],
    sourceReferences: [
      {
        id: 'REF_EN06_1',
        sourceTitle: 'SAE J2832 Diagnostic Verification for Catalyst Systems',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Catalytic Converter Efficiency Monitoring Procedures',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EN07',
    title: 'Electronic Throttle Control (Drive-by-Wire) Malfunction',
    category: 'GASOLINE_ENGINE',
    description: 'Correlation discrepancy between accelerator pedal position (APP) sensors and throttle body position (TPS) sensors triggering failsafe limp-home mode.',
    applicablePowertrains: ['gasoline', 'hybrid'],
    requiredConditions: [
      { factCode: 'electronic_throttle_fault_active', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'acceleration_hesitation', expectedValue: true },
      { factCode: 'check_engine_light_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'electronic_throttle_fault_active', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_THROTTLE_BODY_ACTUATOR',
        name: 'Electronic Throttle Body Actuator / TPS Correlation Error',
        description: 'Carbon binding of throttle butterfly plate or resistor wear in dual potentiometer tracks.',
        systemCategory: 'GASOLINE_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_ELECTRONIC_THROTTLE_LIMP'],
    recommendedDiagnosticChecks: [
      'Inspect throttle body bore for heavy black PCV carbon sludge causing butterfly plate sticking.',
      'Graph dual TPS voltages on oscilloscope while gently operating throttle pedal; check for signal dropout.',
      'Perform electronic throttle plate position relearn procedure using bi-directional scan tool.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Vehicle operates under severely reduced power mode. Merge off active highway into a safe area immediately.',
    supportingExplanation: 'Automotive safety integrity standards mandate dual redundant sensors for drive-by-wire; any divergence between sensor 1 and sensor 2 immediately forces engine into spring-loaded idle limp mode.',
    alternativeExplanations: ['Accelerator pedal position sensor (APP) foot pedal module assembly failure'],
    sourceReferences: [
      {
        id: 'REF_EN07_1',
        sourceTitle: 'ISO 26262 Road Vehicles - Functional Safety',
        sourceType: 'GOV_SAFETY_STANDARD',
        documentSection: 'Part 3: Hazard Analysis and Risk Assessment for E-Gas Systems',
      },
    ],
    validationStatus: 'EXPERT_REVIEW_PENDING',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EN08',
    title: 'Crankshaft Position (CKP) Sensor Signal Dropout',
    category: 'GASOLINE_ENGINE',
    description: 'Loss of engine RPM timing signal caused by intermittent Hall-effect or variable reluctance crankshaft position sensor failure, causing sudden engine stalling.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'crank_rpm_signal_missing', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'intermittent_stall', expectedValue: true },
      { factCode: 'crank_no_start', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'crank_rpm_signal_missing', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_CKP_SENSOR_OPEN',
        name: 'Crankshaft Position Sensor Thermal Breakdown',
        description: 'Internal sensor coil winding expands and opens circuit when hot, losing engine angle signal.',
        systemCategory: 'GASOLINE_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_CRANK_SENSOR_RPM_SIGNAL'],
    recommendedDiagnosticChecks: [
      'Observe live scan tool engine RPM parameter while cranking during stall condition.',
      'Check signal waveform with digital storage oscilloscope at sensor connector (look for missing teeth pulses).',
      'Inspect sensor tip for metal shaving accumulation or contact damage against reluctor ring.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Engine stalling without warning while in motion causes loss of power steering and power brake vacuum.',
    supportingExplanation: 'The ECU cannot trigger fuel injection pulses or ignition spark without precise crankshaft rotational velocity and TDC reference data.',
    alternativeExplanations: ['Damaged or missing teeth on flywheel / flexplate reluctor wheel'],
    sourceReferences: [
      {
        id: 'REF_EN08_1',
        sourceTitle: 'Bosch Automotive Electronics',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Engine Speed and Crankshaft Angle Sensing',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EN09',
    title: 'Evaporative Emission (EVAP) Vapor Leak or Purge Valve Fault',
    category: 'GASOLINE_ENGINE',
    description: 'Fuel tank vapor containment system failing sealed decay pressure test, or canister purge solenoid leaking vacuum continuously.',
    applicablePowertrains: ['gasoline', 'hybrid'],
    requiredConditions: [
      { factCode: 'evap_leak_dtc_present', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'check_engine_light_on', expectedValue: true },
      { factCode: 'fuel_odor_detected', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'evap_leak_dtc_present', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_EVAP_PURGE_LEAK',
        name: 'EVAP Purge Solenoid Valve Stuck Open / Vent Valve Defect',
        description: 'Vapor purge valve failing to seal completely when unpowered, drawing continuous fuel vapors.',
        systemCategory: 'GASOLINE_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_EVAP_SYSTEM_LEAK_DTC'],
    recommendedDiagnosticChecks: [
      'Remove purge solenoid and attempt to blow air through it; valve must be hermetically sealed with 0V applied.',
      'Perform nitrogen smoke test into EVAP service port at 0.5 psi with vent valve commanded shut.',
      'Inspect fuel filler cap rubber o-ring seal for dry rot cracks or loose ratchet engagement.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'The EVAP system prevents hydrocarbon fuel vapor escape; leaks as small as 0.020 inches (0.5mm) trigger OBD-II P0456 diagnostic fault codes.',
    alternativeExplanations: ['Loose fuel filler neck clamp', 'Cracked carbon canister body'],
    sourceReferences: [
      {
        id: 'REF_EN09_1',
        sourceTitle: 'EPA OBD-II System Specification for Evaporative Emissions',
        sourceType: 'GOV_SAFETY_STANDARD',
        documentSection: 'EVAP Leak Detection Methods and Criteria',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EN10',
    title: 'Internal Engine Mechanical or Cylinder Compression Loss',
    category: 'GASOLINE_ENGINE',
    description: 'Severe combustion pressure loss due to burned exhaust valves, blown head gasket, piston ring wear, or jumped valve timing.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'cylinder_compression_variance_percent', operator: '>', expectedValue: 20 },
    ],
    optionalSupportingConditions: [
      { factCode: 'crank_no_start', expectedValue: true },
      { factCode: 'rough_idle', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'cylinder_compression_variance_percent', operator: '<=', expectedValue: 10 },
    ],
    possibleFaults: [
      {
        code: 'FLT_MECHANICAL_COMPRESSION_LOSS',
        name: 'Burned Exhaust Valve or Cylinder Head Gasket Breach',
        description: 'Physical breach in combustion chamber preventing compression pressure development.',
        systemCategory: 'GASOLINE_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_CYLINDER_COMPRESSION_VARIANCE'],
    recommendedDiagnosticChecks: [
      'Perform cylinder leak-down test with compressed air at TDC to listen for air escape at intake, exhaust, or oil cap.',
      'Check for combustion gasses in cooling system using chemical block tester fluid.',
      'Inspect valve timing marks on camshaft sprockets and harmonic balancer.',
    ],
    safetySeverity: 'HIGH',
    supportingExplanation: 'Internal combustion requires minimum 120-150 psi cranking pressure to generate heat of compression for ignition; low compression directly prevents combustion.',
    alternativeExplanations: ['Jumped timing belt/chain altering valve closing events'],
    sourceReferences: [
      {
        id: 'REF_EN10_1',
        sourceTitle: 'ASE A1 Engine Repair Study Reference',
        sourceType: 'ASE_TRAINING',
        documentSection: 'Cylinder Leakage and Compression Diagnosis',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  // =========================================================================
  // CATEGORY C: COOLING, LUBRICATION, AND CLIMATE (7 RULES: TH01 - TH07)
  // =========================================================================

  {
    ruleId: 'TH01',
    title: 'External or Internal Engine Coolant Leakage',
    category: 'COOLING_LUBRICATION',
    description: 'Loss of cooling system fluid capacity through fractured radiator seams, degraded hoses, heater core, or head gasket.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'cooling_pressure_decay_verified', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'coolant_level_dropping', expectedValue: true },
      { factCode: 'engine_overheating', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'cooling_pressure_decay_verified', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_COOLANT_LEAK_EXTERNAL',
        name: 'Radiator Tank Crimp Seam / Coolant Hose Rupture',
        description: 'Loss of closed cooling system integrity allowing liquid coolant to escape under thermal pressure.',
        systemCategory: 'COOLING_LUBRICATION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_COOLING_SYSTEM_PRESSURE_TEST'],
    recommendedDiagnosticChecks: [
      'Pressurize cold cooling system to 15-18 psi using manual radiator pressure pump.',
      'Inspect plastic radiator side tank crimp seams, thermostat housing, and water pump for crusty residues.',
      'Add fluorescent UV dye to coolant and inspect with blacklight in dark bay.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Do not continue driving with coolant loss; complete fluid depletion will warp cylinder heads within minutes.',
    supportingExplanation: 'Pressurization raises the boiling point of coolant from 100°C to over 125°C; leaks cause loss of pressure and rapid vapor boil-over.',
    alternativeExplanations: ['Faulty radiator pressure cap releasing fluid prematurely into overflow tank'],
    sourceReferences: [
      {
        id: 'REF_TH01_1',
        sourceTitle: 'Gates Heavy Duty Cooling System Manual',
        sourceType: 'INDUSTRY_REFERENCE',
        documentSection: 'Pressure Testing and Failure Analysis of Cooling Hoses',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'TH02',
    title: 'Radiator Cooling Fan Assembly or Relay Malfunction',
    category: 'COOLING_LUBRICATION',
    description: 'Electric cooling fan inoperative when vehicle is idling in traffic or operating under heavy heat load.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'cooling_fan_inoperative', expectedValue: true },
      { factCode: 'engine_overheating', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'ac_blowing_warm', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'cooling_fan_inoperative', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_COOLING_FAN_MOTOR',
        name: 'Electric Radiator Cooling Fan Motor or Resistor Defect',
        description: 'Open fan motor armature windings, blown high-current fan fuse, or failed fan speed control module.',
        systemCategory: 'COOLING_LUBRICATION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_RADIATOR_FAN_OPERATION'],
    recommendedDiagnosticChecks: [
      'Turn A/C switch to MAX cold in cabin; verify if radiator fan engages immediately as required by climate control.',
      'Supply fused 12V direct power and ground to cooling fan motor pigtail to test motor spin.',
      'Check engine coolant temperature sensor (ECT) live reading on scan tool.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Overheating in traffic will damage cylinder heads. Pull over safely and shut engine off immediately.',
    supportingExplanation: 'At highway speeds, vehicle ram air cools the radiator; at low speeds and idle, electric fans are the sole mechanism drawing air across the core.',
    alternativeExplanations: ['Blown cooling fan maxi-fuse', 'Defective engine coolant temperature sensor reporting false low temp'],
    sourceReferences: [
      {
        id: 'REF_TH02_1',
        sourceTitle: 'Honda Service Information - Cooling System Controls',
        sourceType: 'OEM_MANUAL',
        documentSection: 'Radiator and Condenser Fan Circuit Troubleshooting',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'TH03',
    title: 'Thermostat Stuck in Open Position',
    category: 'COOLING_LUBRICATION',
    description: 'Engine coolant thermostat valve jammed open, allowing full flow to radiator and preventing engine from achieving operating temperature.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'thermostat_stuck_open_symptoms', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'slow_engine_warmup', expectedValue: true },
      { factCode: 'check_engine_light_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'engine_overheating', expectedValue: true },
    ],
    possibleFaults: [
      {
        code: 'FLT_THERMOSTAT_STUCK_OPEN',
        name: 'Thermostat Valve Mechanically Stuck Open',
        description: 'Failed internal wax pellet or cocked valve assembly allowing continuous radiator circulation.',
        systemCategory: 'COOLING_LUBRICATION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_ENGINE_RUNS_COLD_P0128'],
    recommendedDiagnosticChecks: [
      'Monitor ECT rise time from cold start with scan tool; verify if temperature stabilizes below 75°C (167°F).',
      'Feel upper radiator hose during warm-up; it should remain cool until thermostat reaches 88°C and pops open.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'Modern ECUs monitor time-to-temperature; failure to reach target operating temperature within calibrated time sets OBD-II code P0128 and increases fuel consumption.',
    alternativeExplanations: ['Defective Engine Coolant Temperature (ECT) sensor reading low'],
    sourceReferences: [
      {
        id: 'REF_TH03_1',
        sourceTitle: 'SAE J2234 Automotive Thermostat Specifications',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Valve Opening Temperatures and Flow Performance',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'TH04',
    title: 'Restricted Coolant Circulation or Thermostat Stuck Closed',
    category: 'COOLING_LUBRICATION',
    description: 'Engine overheats rapidly under load with hot engine block while radiator return hose remains cool due to blocked thermostat or plugged radiator core.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'coolant_circulation_blocked', expectedValue: true },
      { factCode: 'engine_overheating', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'cooling_pressure_decay_verified', expectedValue: false },
    ],
    contradictoryConditions: [
      { factCode: 'coolant_circulation_blocked', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_THERMOSTAT_STUCK_CLOSED',
        name: 'Thermostat Stuck Closed / Blocked Radiator Core',
        description: 'Wax pellet loss of seal preventing valve opening, or silicate solder bloom clogging radiator tubes.',
        systemCategory: 'COOLING_LUBRICATION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_RADIATOR_HOSES_TEMP_SPLIT'],
    recommendedDiagnosticChecks: [
      'Measure thermal gradient across radiator face using thermal imaging camera or infrared thermometer.',
      'Remove thermostat and perform hot water beaker test with thermometer to confirm opening temperature.',
    ],
    safetySeverity: 'CRITICAL',
    safetyGuidance: 'CRITICAL OVERHEATING: Cylinder head gasket failure or engine seizure will occur within minutes. Stop engine immediately!',
    supportingExplanation: 'When circulation is obstructed, heat produced in combustion chambers cannot be transferred to the ambient air heat exchanger, causing thermal runaway in the cylinder head.',
    alternativeExplanations: ['Water pump impeller slipping on drive shaft'],
    sourceReferences: [
      {
        id: 'REF_TH04_1',
        sourceTitle: 'ASE A1 / A8 Automotive Temperature Control',
        sourceType: 'ASE_TRAINING',
        documentSection: 'Thermal Management and Circulation Diagnostics',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'TH05',
    title: 'Engine Coolant Pump Mechanical or Bearing Failure',
    category: 'COOLING_LUBRICATION',
    description: 'Coolant circulation pump failing due to worn mechanical face seal, bearing looseness, or plastic impeller separation from steel drive shaft.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'water_pump_leak_or_play', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'engine_overheating', expectedValue: true },
      { factCode: 'coolant_level_dropping', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'water_pump_leak_or_play', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_WATER_PUMP_FAILED',
        name: 'Centrifugal Coolant Pump Mechanical Failure',
        description: 'Shaft bearing degradation or internal plastic impeller corrosion / hub slip.',
        systemCategory: 'COOLING_LUBRICATION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_WATER_PUMP_WEEP_PLAY'],
    recommendedDiagnosticChecks: [
      'Remove drive belt and grasp water pump pulley; check for radial or axial movement (>0.05 mm is unacceptable).',
      'Inspect weep hole cavity below pump shaft bearing for dried coolant residue stains.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Water pump bearing seizure can snap the accessory or timing belt, causing instantaneous engine destruction on interference engines.',
    supportingExplanation: 'A loose water pump bearing allows mechanical shaft seal deflection, leading to sudden coolant loss or drive belt detachment.',
    alternativeExplanations: ['Loose accessory drive belt tensioner'],
    sourceReferences: [
      {
        id: 'REF_TH05_1',
        sourceTitle: 'SKF Vehicle Service Market - Water Pump Failure Diagnosis',
        sourceType: 'INDUSTRY_REFERENCE',
        documentSection: 'Dynamic Seal Wear and Bearing Loading',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'TH06',
    title: 'Dangerously Low Engine Lubrication Oil Pressure',
    category: 'COOLING_LUBRICATION',
    description: 'Insufficient hydrodynamic engine oil pressure to journal bearings, camshafts, and hydraulic lifters.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    requiredConditions: [
      { factCode: 'oil_pressure_light_on', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'oil_pressure_psi_warm_idle', operator: '<', expectedValue: 8 },
    ],
    contradictoryConditions: [
      { factCode: 'oil_pressure_psi_warm_idle', operator: '>=', expectedValue: 15 },
    ],
    possibleFaults: [
      {
        code: 'FLT_OIL_STARVATION',
        name: 'Critical Engine Oil Pressure Depletion',
        description: 'Severe oil pump wear, stuck pressure relief valve, sludge clogged oil pickup tube, or low oil volume.',
        systemCategory: 'COOLING_LUBRICATION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_OIL_PRESSURE_MEASURED_PSI'],
    recommendedDiagnosticChecks: [
      'STOP ENGINE IMMEDIATELY. Check oil dipstick level before touching any electrical tools.',
      'Install calibrated mechanical oil pressure test gauge into oil pressure switch galley.',
      'Inspect oil filter for metal flakes or collapsed filter element pleats.',
    ],
    safetySeverity: 'CRITICAL',
    safetyGuidance: 'DO NOT DRIVE OR RUN ENGINE! Operating an engine with low oil pressure will destroy crankshaft bearings, connecting rods, and camshafts in under 60 seconds.',
    supportingExplanation: 'Engine journal bearings rely on hydrodynamic wedge oil pressure to prevent metal-on-metal contact; pressure loss causes immediate catastrophic friction welding and rod throwing.',
    alternativeExplanations: ['Defective oil pressure sending unit switch grounding out wire harness'],
    sourceReferences: [
      {
        id: 'REF_TH06_1',
        sourceTitle: 'SAE Technical Paper 980687 - Engine Lubrication Systems',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Journal Bearing Film Thickness and Pressure Requirements',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'TH07',
    title: 'Air Conditioning Refrigerant Circuit or Compressor Malfunction',
    category: 'COOLING_LUBRICATION',
    description: 'Cabin air conditioning system blowing warm air due to refrigerant loss (R134a/R1234yf), compressor clutch failure, or expansion valve blockage.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'ac_blowing_warm', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'ac_compressor_fails_to_engage', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'ac_blowing_warm', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_AC_REFRIGERANT_LOSS',
        name: 'AC System Refrigerant Leak or Compressor Clutch Open',
        description: 'Low-pressure cut-off switch open due to refrigerant gas loss or open magnetic clutch coil.',
        systemCategory: 'COOLING_LUBRICATION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_AC_COMPRESSOR_ENGAGEMENT'],
    recommendedDiagnosticChecks: [
      'Attach manifold gauge set to high and low service ports; read static pressures (should be ~70-100 psi at 21°C).',
      'Verify 12V is delivered to A/C compressor clutch relay and coil connector.',
      'Inspect A/C condenser face in front of radiator for rock punctures or oily residue.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'Air conditioning pressure switches prevent compressor operation when static pressure drops below 25-30 psi to protect the compressor from lubricating oil starvation.',
    alternativeExplanations: ['Faulty cabin temperature blend door actuator stuck on full heat position'],
    sourceReferences: [
      {
        id: 'REF_TH07_1',
        sourceTitle: 'EPA Section 609 MVAC Diagnostic Guidelines',
        sourceType: 'GOV_SAFETY_STANDARD',
        documentSection: 'Mobile Air Conditioning Leak Detection and Recovery',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  // =========================================================================
  // CATEGORY D: BRAKING SYSTEMS (5 RULES: BR01 - BR05)
  // =========================================================================

  {
    ruleId: 'BR01',
    title: 'Hydraulic Brake System Leakage or Master Cylinder Internal Bypass',
    category: 'BRAKING',
    description: 'Loss of hydraulic brake pressure causing soft pedal or pedal slowly sinking to floorboard while stopped.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'brake_pedal_sinks_under_holding_pressure', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'brake_pedal_spongy', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'brake_pedal_sinks_under_holding_pressure', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_MASTER_CYLINDER_BYPASS',
        name: 'Master Cylinder Primary Cup Piston Seal Leakage',
        description: 'Degraded rubber primary piston cup allowing high-pressure brake fluid to bypass internally to reservoir.',
        systemCategory: 'BRAKING',
      },
    ],
    suggestedFollowUpQuestions: ['Q_BRAKE_PEDAL_PUMP_PRESSURE'],
    recommendedDiagnosticChecks: [
      'Inspect brake fluid reservoir level; check for external fluid drips around wheel calipers and brake lines.',
      'Clamp flexible rubber brake hoses one by one with plastic hose pinchers to isolate master cylinder versus caliper piston bypass.',
    ],
    safetySeverity: 'CRITICAL',
    safetyGuidance: 'CRITICAL BRAKE SAFETY HAZARD: DO NOT DRIVE THE VEHICLE! Total loss of braking capability may occur without warning. Tow to repair facility.',
    supportingExplanation: 'Hydraulic brakes operate on Pascal’s principle requiring a hermetically sealed fluid column; internal cup bypass collapses hydraulic pressure holding calipers engaged.',
    alternativeExplanations: ['Ruptured brake hard line or punctured flexible caliper hose'],
    sourceReferences: [
      {
        id: 'REF_BR01_1',
        sourceTitle: 'FMVSS 135 - Passenger Car Brake Systems',
        sourceType: 'GOV_SAFETY_STANDARD',
        documentSection: 'Section S7: Hydraulic Failure and Pedal Reserve Distance',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'BR02',
    title: 'Brake Power Assist Malfunction (Vacuum Booster or Pump Fault)',
    category: 'BRAKING',
    description: 'Extremely hard brake pedal requiring high physical leg effort to achieve normal vehicle stopping deceleration.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'brake_booster_assist_lost', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'brake_pedal_hard', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'brake_booster_assist_lost', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_BRAKE_BOOSTER_FAILURE',
        name: 'Pneumatic Brake Booster Diaphragm Tear or Vacuum Loss',
        description: 'Loss of differential vacuum assist or mechanical vacuum pump failure.',
        systemCategory: 'BRAKING',
      },
    ],
    suggestedFollowUpQuestions: ['Q_BRAKE_BOOSTER_VACUUM'],
    recommendedDiagnosticChecks: [
      'Inspect one-way check valve on vacuum booster body; it must hold vacuum in one direction only.',
      'Connect vacuum gauge to booster feed hose (healthy gasoline engine produces 17-21 in-Hg vacuum).',
      'Listen for hissing air sound under dash near brake pedal pushrod when pedal is pressed.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Stopping distances will be substantially increased. Drive at low speed only if clearing roadway; repair before normal use.',
    supportingExplanation: 'Vacuum boosters multiply driver pedal force by 3 to 5 times; without vacuum assistance, human leg force alone cannot develop required hydraulic line pressures (1,000+ psi).',
    alternativeExplanations: ['Electric auxiliary vacuum pump failure on turbocharged/direct injection vehicles'],
    sourceReferences: [
      {
        id: 'REF_BR02_1',
        sourceTitle: 'Bosch Automotive Handbook - Braking Systems',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Vacuum Brake Boosters and Hydraulic Boost Systems',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'BR03',
    title: 'Anti-Lock Braking System (ABS) Electronic / Sensor Fault',
    category: 'BRAKING',
    description: 'ABS warning lamp illuminated due to wheel speed sensor open-circuit, tone ring missing teeth, or hydraulic modulator valve error.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'abs_sensor_dtc_present', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'abs_warning_light_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'abs_sensor_dtc_present', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_ABS_WHEEL_SPEED_SENSOR',
        name: 'Wheel Speed Sensor Circuit Discontinuity or Debris',
        description: 'Magnetic reluctance or active hall-effect sensor wiring damage or tone ring reluctor fracture.',
        systemCategory: 'BRAKING',
      },
    ],
    suggestedFollowUpQuestions: ['Q_ABS_WHEEL_SPEED_SENSOR_DTC'],
    recommendedDiagnosticChecks: [
      'Read live wheel speed values on scan tool while driving straight at 30 km/h; check for sensor dropout.',
      'Inspect wheel speed sensor harness near suspension knuckle for tension, chafing, or corrosion.',
      'Verify reluctor tone ring magnetic poles are intact and free of iron road grit.',
    ],
    safetySeverity: 'MEDIUM',
    safetyGuidance: 'Normal hydraulic braking remains functional, but anti-lock skid protection and electronic stability control (ESC) are disabled.',
    supportingExplanation: 'The ABS module requires continuous 4-wheel rotational frequency data; if one sensor signal fails, the ECU disables anti-skid intervention to prevent unintended valve pulsing.',
    alternativeExplanations: ['ABS hydraulic control unit (HCU) pump motor failure'],
    sourceReferences: [
      {
        id: 'REF_BR03_1',
        sourceTitle: 'NHTSA FMVSS 126 - Electronic Stability Control Systems',
        sourceType: 'GOV_SAFETY_STANDARD',
        documentSection: 'Diagnostic Fault Codes and Telltale Requirements',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'BR04',
    title: 'Severe Brake Friction Component Depletion (Metal-on-Metal)',
    category: 'BRAKING',
    description: 'Brake pad friction lining worn completely to steel backing plate, gouging brake rotor and drastically reducing braking coefficient.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'brake_pad_thickness_mm', operator: '<=', expectedValue: 2 },
    ],
    optionalSupportingConditions: [
      { factCode: 'brake_grinding_noise', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'brake_pad_thickness_mm', operator: '>=', expectedValue: 4 },
    ],
    possibleFaults: [
      {
        code: 'FLT_BRAKE_PAD_EXHAUSTED',
        name: 'Worn Out Brake Pad Friction Material and Scored Rotor',
        description: 'Steel pad backing plate directly contacting cast iron brake rotor disc.',
        systemCategory: 'BRAKING',
      },
    ],
    suggestedFollowUpQuestions: ['Q_BRAKE_PAD_LINING_THICKNESS'],
    recommendedDiagnosticChecks: [
      'Remove road wheels and visually inspect both inboard and outboard brake pad linings on all four wheels.',
      'Check brake rotor friction surfaces for deep concentric gouges, cracks, or heat discoloration.',
      'Verify caliper slide pins are free to prevent uneven single-pad premature wear.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Metal-on-metal friction generates extreme heat that can boil brake fluid, causing sudden total brake failure. Replace immediately.',
    supportingExplanation: 'Steel on cast iron has a friction coefficient ($\mu$) of less than 0.2 compared to 0.4+ for composite friction linings, and can cause brake pad backing plate ejection.',
    alternativeExplanations: ['Small gravel pebble wedged between brake rotor and metal splash dust shield'],
    sourceReferences: [
      {
        id: 'REF_BR04_1',
        sourceTitle: 'SAE J661 Brake Lining Quality Control Test Procedure',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Friction Coefficient and Wear Limits',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'BR05',
    title: 'Uneven Braking Force (Brake Caliper Seizure or Restriction)',
    category: 'BRAKING',
    description: 'Vehicle pulls violently to left or right when braking due to seized caliper slide pin, frozen piston, or restricted flexible brake hose.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'brake_caliper_seized_or_restricted', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'brake_pulls_to_side', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'brake_caliper_seized_or_restricted', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_CALIPER_SLIDE_SEIZED',
        name: 'Seized Brake Caliper Piston or Slide Pin Assembly',
        description: 'Corrosion on steel slide pin or internal caliper bore preventing clamping on one side.',
        systemCategory: 'BRAKING',
      },
    ],
    suggestedFollowUpQuestions: ['Q_CALIPER_SLIDE_PIN_SEIZED'],
    recommendedDiagnosticChecks: [
      'Measure brake rotor temperatures with infrared thermometer immediately following a drive; the dragging side will be 50-100°C hotter.',
      'Check caliper guide pins for smooth sliding; clean rust and lubricate with silicone brake grease.',
      'Inspect rubber brake hose for internal liner collapse acting as a one-way hydraulic check valve.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Vehicle will pull unexpectedly into oncoming traffic or shoulder during panic stops. Repair prior to driving.',
    supportingExplanation: 'Unequal torque application creates an asymmetric yaw moment around the vehicle’s vertical center of gravity during deceleration.',
    alternativeExplanations: ['Severely misaligned front steering toe or loose control arm bushing shifting under braking load'],
    sourceReferences: [
      {
        id: 'REF_BR05_1',
        sourceTitle: 'ASE A4 Suspension & Brakes Certification',
        sourceType: 'ASE_TRAINING',
        documentSection: 'Brake Pull and Asymmetric Friction Diagnostics',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  // =========================================================================
  // CATEGORY E: STEERING, SUSPENSION, AND TIRES (6 RULES: CH01 - CH06)
  // =========================================================================

  {
    ruleId: 'CH01',
    title: 'Low Tire Inflation Pressure (TPMS Trigger)',
    category: 'STEERING_SUSPENSION',
    description: 'Tire inflation pressure is 25% or more below vehicle manufacturer cold placard specification, reducing fuel economy, handling, and load capacity.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'tire_underinflation_psi', operator: '>=', expectedValue: 6 },
    ],
    optionalSupportingConditions: [
      { factCode: 'tpms_light_illuminated', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'tire_underinflation_psi', operator: '<=', expectedValue: 2 },
    ],
    possibleFaults: [
      {
        code: 'FLT_TIRE_UNDERINFLATED',
        name: 'Under-Inflated Pneumatic Tire (Slow Puncture or Valve Leak)',
        description: 'Puncture from screw/nail, leaking valve stem core, or seasonal ambient temperature drop.',
        systemCategory: 'STEERING_SUSPENSION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_COLD_TIRE_PRESSURE_DELTA'],
    recommendedDiagnosticChecks: [
      'Check tire pressures when cold using calibrated digital pencil or dial pressure gauge.',
      'Inflate to cold tire inflation pressure specified on driver door pillar placard (B-pillar).',
      'Submerge tire in water tank or spray soapy water on tread face and valve stem to locate micro-puncture.',
    ],
    safetySeverity: 'MEDIUM',
    safetyGuidance: 'Severely under-inflated tires generate excessive sidewall flex heat at highway speeds, risking catastrophic tire blowout.',
    supportingExplanation: 'Under-inflation shifts load to the outer tread shoulders, causes sluggish steering response, and drastically increases rolling resistance.',
    alternativeExplanations: ['Faulty TPMS sensor battery or wheel sensor programming loss'],
    sourceReferences: [
      {
        id: 'REF_CH01_1',
        sourceTitle: 'NHTSA Tire Safety and Tire Pressure Monitoring Regulations',
        sourceType: 'GOV_SAFETY_STANDARD',
        documentSection: 'FMVSS 138: Tire Pressure Monitoring Systems',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'CH02',
    title: 'Wheel Alignment or Suspension Geometry Deviation',
    category: 'STEERING_SUSPENSION',
    description: 'Incorrect camber, caster, or toe angles causing vehicle wander, steering pull on flat roads, and rapid asymmetric tire tread wear.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'tire_wear_pattern', expectedValue: 'alignment_wear' },
    ],
    optionalSupportingConditions: [
      { factCode: 'steering_pulls_straight_road', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'tire_wear_pattern', expectedValue: 'even_wear' },
    ],
    possibleFaults: [
      {
        code: 'FLT_ALIGNMENT_OUT_OF_SPEC',
        name: 'Front Wheel Toe / Camber Geometry Misalignment',
        description: 'Tie-rod adjustment slippage or bent suspension strut altering steering axis inclination.',
        systemCategory: 'STEERING_SUSPENSION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_TIRE_WEAR_PATTERN'],
    recommendedDiagnosticChecks: [
      'Perform 4-wheel optical computerized alignment check on laser alignment rack.',
      'Inspect steering tie-rod ends and lower control arm ball joints for impact bend or play.',
      'Check steering angle sensor zero-point calibration in electronic stability control module.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'Even 0.5 degrees of toe misalignment forces the tire to scrub sideways 10 meters for every kilometer driven, destroying tire tread within 5,000 km.',
    alternativeExplanations: ['Tire radial ply steer (internal belt separation)'],
    sourceReferences: [
      {
        id: 'REF_CH02_1',
        sourceTitle: 'Hunter Engineering Wheel Alignment Fundamentals',
        sourceType: 'INDUSTRY_REFERENCE',
        documentSection: 'Camber, Caster, and Toe Influence on Tire Scrub',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'CH03',
    title: 'Wheel and Tire Assembly Dynamic Imbalance or Runout',
    category: 'STEERING_SUSPENSION',
    description: 'Speed-sensitive mechanical vibration felt through steering wheel (front wheels) or chassis seat (rear wheels) peaking at 80 to 110 km/h.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'wheel_balance_excessive', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'vibration_at_highway_speed', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'wheel_balance_excessive', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_WHEEL_OUT_OF_BALANCE',
        name: 'Lost Wheel Balance Weight / Radial Tire Runout',
        description: 'Heavy spot on tire circumference creating dynamic centrifugal vibration at resonant speeds.',
        systemCategory: 'STEERING_SUSPENSION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_TIRE_WHEEL_BALANCE_TEST'],
    recommendedDiagnosticChecks: [
      'Balance all four wheels on high-speed dynamic wheel balancer.',
      'Perform road-force measurement with loaded roller to check for internal tire stiff-spot runout (>15 lbs is excessive).',
      'Inspect alloy wheels for bent inner lip caused by pothole impact.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'At 100 km/h, an automotive tire rotates roughly 14 times per second. An unbalance of just 25 grams produces several kilograms of centrifugal hammering force per revolution.',
    alternativeExplanations: ['Worn driveshaft CV axle joint or bent wheel hub flange'],
    sourceReferences: [
      {
        id: 'REF_CH03_1',
        sourceTitle: 'TMC Recommended Practice RP 214 - Wheel and Tire Balancing',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Static and Dynamic Balancing Standards',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'CH04',
    title: 'Suspension Ball Joint, Control Arm Bushing, or Sway Bar Link Wear',
    category: 'STEERING_SUSPENSION',
    description: 'Mechanical clunking or knocking noises when driving over small bumps or steering transitions caused by worn rubber bushings or loose ball joints.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'suspension_joint_play_detected', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'clunk_noise_over_bumps', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'suspension_joint_play_detected', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_BALL_JOINT_WORN',
        name: 'Lower Ball Joint / Control Arm Bushing Free Play',
        description: 'Loss of internal polymer seat in ball joint or tearing of bonded rubber control arm bushing.',
        systemCategory: 'STEERING_SUSPENSION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_SUSPENSION_BALL_JOINT_PLAY'],
    recommendedDiagnosticChecks: [
      'Unload suspension on frame lift; use pry bar between lower control arm and steering knuckle to measure ball joint axial play.',
      'Inspect rubber stabilizer bar (sway bar) end link ball cups for free lash or torn dust boots.',
      'Check front shock absorber strut top mount bearing for binding when turning steering lock-to-lock.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Severe ball joint failure can cause wheel assembly detachment while in motion, resulting in immediate loss of vehicle control.',
    supportingExplanation: 'Suspension components endure several tons of shock loading; torn dust boots allow road grit to abrade ball studs, creating mechanical looseness.',
    alternativeExplanations: ['Loose front subframe mounting bolts', 'Worn steering rack inner tie-rod socket'],
    sourceReferences: [
      {
        id: 'REF_CH04_1',
        sourceTitle: 'SAE J490 - Ball Stud and Socket Assemblies',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Wear Limits and Inspection Procedures',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'CH05',
    title: 'Electric or Hydraulic Power Steering Assist Malfunction',
    category: 'STEERING_SUSPENSION',
    description: 'Sudden or progressive loss of steering power assist, creating very heavy steering effort and illuminating steering system malfunction warning.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'eps_system_dtc_present', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'steering_assist_loss', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'eps_system_dtc_present', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_EPS_MOTOR_FAULT',
        name: 'Electronic Power Steering Motor / Torque Sensor Fault',
        description: 'EPS column/rack motor drive circuit open or torque sensor dual-channel divergence.',
        systemCategory: 'STEERING_SUSPENSION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_EPS_POWER_STEERING_DTC'],
    recommendedDiagnosticChecks: [
      'Scan EPS control module for trouble codes (e.g., torque sensor sub-circuit, EPS motor over-current).',
      'On hydraulic systems, check fluid level in reservoir and test hydraulic pump pressure with flow analyzer (minimum 1,200 psi).',
      'Inspect high-current 60A/80A EPS fuse in main engine fuse module.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'High steering effort makes emergency collision avoidance difficult. Service immediately.',
    supportingExplanation: 'Modern EPS units measure driver input torque on the torsion bar and command multi-phase brushless DC motor assist; safety circuits shut off assist upon any sensor disagreement.',
    alternativeExplanations: ['Binding front strut top bearing plate preventing free steering return'],
    sourceReferences: [
      {
        id: 'REF_CH05_1',
        sourceTitle: 'TRW Automotive Steering System Service Manual',
        sourceType: 'INDUSTRY_REFERENCE',
        documentSection: 'Column and Rack EPS Diagnostic Trees',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'CH06',
    title: 'Wheel Hub Bearing Assembly Wear or Spalling',
    category: 'STEERING_SUSPENSION',
    description: 'Growling, roaring, or low-frequency humming noise from road wheels that intensifies with vehicle road speed and alters pitch when swerving left/right.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'wheel_bearing_rough_or_loose', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'wheel_bearing_drone', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'wheel_bearing_rough_or_loose', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_WHEEL_BEARING_SPALLED',
        name: 'Wheel Hub Bearing Raceway Spalling or Brinelling',
        description: 'Fatigue flaking on hardened steel bearing race or ball rollers due to moisture ingress.',
        systemCategory: 'STEERING_SUSPENSION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_WHEEL_BEARING_PLAY_NOISE'],
    recommendedDiagnosticChecks: [
      'Safely raise vehicle; spin wheel by hand while holding suspension spring; feel for gravel-like vibration through coil.',
      'Grasp tire at 12 and 6 o’clock positions and rock firmly to check for play in hub assembly.',
      'Check bearing noise under road load: swerving right loads the left wheel bearing (noise increases) and unloads right.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Ignoring wheel bearing noise can result in bearing seizure or wheel hub separation at highway speed.',
    supportingExplanation: 'Pothole impacts or water seal failure causes micro-spalling of the bearing raceway; rollers bouncing over these pits create the characteristic drone that changes under lateral weight transfer.',
    alternativeExplanations: ['Cupped tire tread producing identical road roar'],
    sourceReferences: [
      {
        id: 'REF_CH06_1',
        sourceTitle: 'Timken Automotive Wheel Hub Service Guide',
        sourceType: 'INDUSTRY_REFERENCE',
        documentSection: 'Generation 3 Hub Bearing Diagnostic and Replacement Procedures',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  // =========================================================================
  // CATEGORY F: TRANSMISSION AND DRIVETRAIN (5 RULES: DR01 - DR05)
  // =========================================================================

  {
    ruleId: 'DR01',
    title: 'Automatic Transmission Internal Clutch or Band Slip',
    category: 'TRANSMISSION',
    description: 'Engine RPM climbs unexpectedly during acceleration without corresponding vehicle speed increase, indicating hydraulic pressure loss or burned friction plates.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    applicableTransmissions: ['automatic', 'cvt'],
    requiredConditions: [
      { factCode: 'auto_trans_slip_verified', expectedValue: true },
      { factCode: 'transmission_slipping', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'check_engine_light_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'auto_trans_slip_verified', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_AUTO_TRANS_SLIP',
        name: 'Worn Automatic Clutch Packs / Low Hydraulic Line Pressure',
        description: 'Friction material worn off multi-plate clutch packs or worn transmission oil pump.',
        systemCategory: 'TRANSMISSION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_AUTO_TRANS_SLIP_RATIO_DTC'],
    recommendedDiagnosticChecks: [
      'Check transmission fluid level and condition (burnt odor or dark opaque brown color indicates friction degradation).',
      'Scan TCM for gear ratio mismatch trouble codes (P0730 through P0735).',
      'Perform line pressure hydraulic gauge test at transmission test port during stall test.',
    ],
    safetySeverity: 'MEDIUM',
    supportingExplanation: 'Automatic gearboxes rely on hydraulic pressure to clamp multi-plate clutch packs; worn clutches or degraded ATF fluid with lost friction modifiers allows relative slippage between input and output shafts.',
    alternativeExplanations: ['Severely low automatic transmission fluid level starving oil pump pickup'],
    sourceReferences: [
      {
        id: 'REF_DR01_1',
        sourceTitle: 'ATRA (Automatic Transmission Rebuilders Association) Diagnostic Techbook',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Clutch Pack Slip and Ratio Code Diagnostics',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'DR02',
    title: 'Manual Transmission Friction Clutch Disc Slippage',
    category: 'TRANSMISSION',
    description: 'Engine speeds up under heavy throttle in high gear (4th/5th) while vehicle fails to accelerate due to glazed or worn friction clutch disc.',
    applicablePowertrains: ['gasoline', 'diesel'],
    applicableTransmissions: ['manual'],
    requiredConditions: [
      { factCode: 'manual_clutch_slip_verified', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'transmission_slipping', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'manual_clutch_slip_verified', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_MANUAL_CLUTCH_WORN',
        name: 'Manual Dry Clutch Disc Worn to Rivets',
        description: 'Friction lining thickness depleted or pressure plate diaphragm spring fatigue.',
        systemCategory: 'TRANSMISSION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_MANUAL_CLUTCH_SLIP_TEST'],
    recommendedDiagnosticChecks: [
      'Perform high-gear stall test (engage 4th gear at standstill with handbrake on, release clutch: healthy clutch stalls engine instantly).',
      'Check clutch pedal free-play and hydraulic master/slave cylinder operation.',
      'Inspect for engine rear main oil seal or transmission input shaft seal leak contaminating dry clutch disc.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'The clutch disc transfers engine torque to the transmission input shaft via friction clamp force from the pressure plate; worn friction lining reduces holding capacity below engine peak torque.',
    alternativeExplanations: ['Clutch hydraulic release mechanism binding, holding partial disengagement pressure'],
    sourceReferences: [
      {
        id: 'REF_DR02_1',
        sourceTitle: 'LuK / Schaeffler Clutch Technical Guide',
        sourceType: 'INDUSTRY_REFERENCE',
        documentSection: 'Dry Clutch Slippage and Flywheel Thermal Checking',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'DR03',
    title: 'Transmission Shift Solenoid or Valve Body Malfunction',
    category: 'TRANSMISSION',
    description: 'Harsh slamming between gears, missing specific gear ratios, or transmission locked into 3rd gear limp-home mode.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid'],
    applicableTransmissions: ['automatic', 'cvt'],
    requiredConditions: [
      { factCode: 'shift_solenoid_dtc_present', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'harsh_gear_shifts', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'shift_solenoid_dtc_present', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_SHIFT_SOLENOID_DEFECT',
        name: 'Electro-Hydraulic Shift Solenoid / Valve Body Sticking',
        description: 'Solenoid coil internal electrical open circuit or varnish/debris jamming spool valve in valve body.',
        systemCategory: 'TRANSMISSION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_SHIFT_SOLENOID_DTC'],
    recommendedDiagnosticChecks: [
      'Scan Transmission Control Module (TCM) for solenoid performance or circuit DTCs (P0750, P0755, P0760).',
      'Measure resistance of solenoid coil through transmission case external connector harness.',
      'Command solenoid actuation directly using bidirectional scan tool to listen for distinct mechanical click.',
    ],
    safetySeverity: 'MEDIUM',
    supportingExplanation: 'Transmission shift solenoids route pressurized ATF fluid to appropriate clutch drums; a stuck or non-energizing solenoid prevents hydraulic circuit pressure build.',
    alternativeExplanations: ['TCM computer driver transistor failure', 'Corroded external transmission harness connector'],
    sourceReferences: [
      {
        id: 'REF_DR03_1',
        sourceTitle: 'Allison Transmission - Electronic Controls Troubleshooting',
        sourceType: 'OEM_MANUAL',
        documentSection: 'Shift Solenoid Function and Diagnostic Trees',
      },
    ],
    validationStatus: 'EXPERT_REVIEW_PENDING',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'DR04',
    title: 'Constant Velocity (CV) Joint Mechanical Failure',
    category: 'TRANSMISSION',
    description: 'Rhythmic metallic clicking or popping noise heard from front wheels when accelerating while making sharp turns.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'clicking_sound_turning', expectedValue: true },
      { factCode: 'cv_boot_torn_with_grease_loss', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'vibration_at_highway_speed', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'cv_boot_torn_with_grease_loss', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_CV_JOINT_WORN',
        name: 'Outer CV Joint Ball Cage Wear / Grease Depletion',
        description: 'Loss of molybdenum disulfide grease and water/grit ingress causing deep brinelling on ball tracks.',
        systemCategory: 'TRANSMISSION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_CV_BOOT_TORN_GREASE'],
    recommendedDiagnosticChecks: [
      'Visually inspect rubber accordion CV joint boots for splits, tears, or loose metal retention clamps.',
      'Drive vehicle in tight figure-eight circles in an empty parking lot under light throttle; note noise side.',
      'Check front drive axle for radial backlash by turning axle shaft with vehicle on lift.',
    ],
    safetySeverity: 'MEDIUM',
    safetyGuidance: 'Total CV joint failure can result in drive axle separation, leaving vehicle stranded with loss of propulsion.',
    supportingExplanation: 'Outer Rzeppa CV joints operate at severe angles during steering; grease loss leads to rapid metal spalling on ball bearings and cage.',
    alternativeExplanations: ['Front wheel bearing noise (usually a continuous hum rather than click-click-click)'],
    sourceReferences: [
      {
        id: 'REF_DR04_1',
        sourceTitle: 'GKN Automotive Driveline Systems Handbook',
        sourceType: 'INDUSTRY_REFERENCE',
        documentSection: 'Constant Velocity Joint Failure Analysis',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'DR05',
    title: 'Driveline Mechanical Looseness (Universal Joint or Mount Wear)',
    category: 'TRANSMISSION',
    description: 'Metallic clunking noise felt through floorpan when shifting from Park to Drive/Reverse or when rapidly depressing and releasing the accelerator.',
    applicablePowertrains: ['gasoline', 'diesel', 'hybrid', 'electric'],
    requiredConditions: [
      { factCode: 'driveline_u_joint_excessive_play', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'driveline_slack_clunk', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'driveline_u_joint_excessive_play', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_U_JOINT_PLAY',
        name: 'Driveshaft Universal Joint Needle Bearing Spalling',
        description: 'Needle roller bearings disintegrated within U-joint trunnion cap, or torn rubber transmission mount.',
        systemCategory: 'TRANSMISSION',
      },
    ],
    suggestedFollowUpQuestions: ['Q_DRIVELINE_U_JOINT_PLAY'],
    recommendedDiagnosticChecks: [
      'With vehicle safely supported on lift in neutral, manually twist driveshaft back and forth.',
      'Inspect U-joint seal caps for red/brown oxide dust (tell-tale sign of dry needle bearing fretting).',
      'Pry on transmission rubber mount with lever to check for torn elastomeric rubber separation.',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'Reversing engine torque from positive driving torque to negative engine braking exposes rotational slack in worn universal cross journals.',
    alternativeExplanations: ['Excessive rear differential ring-and-pinion gear backlash'],
    sourceReferences: [
      {
        id: 'REF_DR05_1',
        sourceTitle: 'Dana Spicer Driveshaft Failure Analysis Guide',
        sourceType: 'INDUSTRY_REFERENCE',
        documentSection: 'Universal Joint Lubrication and Torsional Lash',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  // =========================================================================
  // CATEGORY G: DIESEL ENGINE SYSTEMS (3 RULES: DS01 - DS03)
  // =========================================================================

  {
    ruleId: 'DS01',
    title: 'Diesel Glow Plug or Preheating System Inoperative',
    category: 'DIESEL_ENGINE',
    description: 'Severe difficulty starting diesel engine in cold weather with prolonged cranking and white unburned fuel exhaust smoke.',
    applicablePowertrains: ['diesel'],
    requiredConditions: [
      { factCode: 'glow_plug_circuit_open', expectedValue: true },
      { factCode: 'diesel_cold_start_hard', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'check_engine_light_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'glow_plug_circuit_open', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_GLOW_PLUG_OPEN',
        name: 'Burned Glow Plug Heating Elements / Relay Failure',
        description: 'Open circuit in one or more ceramic/metallic glow plugs or failed preheating control unit.',
        systemCategory: 'DIESEL_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_DIESEL_GLOW_PLUG_RESISTANCE'],
    recommendedDiagnosticChecks: [
      'Measure resistance of each glow plug using DMM (nominal healthy plug is ~0.5 to 1.5 ohms; open is infinite).',
      'Test 12V output from glow plug control unit relay during pre-glow key cycle.',
      'Check cylinder preheating circuit fault codes (P0380, P0670 through P0676).',
    ],
    safetySeverity: 'LOW',
    supportingExplanation: 'Diesel engines rely on heat of compression to achieve auto-ignition temperature; in cold weather, cylinder block absorbs heat too quickly for compression alone to ignite fuel.',
    alternativeExplanations: ['Diesel fuel waxing / gelling in cold weather clogging fuel filter'],
    sourceReferences: [
      {
        id: 'REF_DS01_1',
        sourceTitle: 'Bosch Diesel-Engine Management Handbook',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Glow Plugs and Electronic Preheating Systems',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'DS02',
    title: 'Diesel Common Rail Fuel Pressure Deficit',
    category: 'DIESEL_ENGINE',
    description: 'Diesel engine shuts down abruptly under heavy acceleration or fails to start due to high-pressure fuel pump or rail regulator leakage.',
    applicablePowertrains: ['diesel'],
    requiredConditions: [
      { factCode: 'diesel_rail_pressure_drop_verified', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'diesel_rail_pressure_drop', expectedValue: true },
      { factCode: 'check_engine_light_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'diesel_rail_pressure_drop_verified', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_DIESEL_RAIL_PRESSURE',
        name: 'Common Rail High-Pressure Fuel Pump / Pressure Control Valve Leak',
        description: 'Internal leakage in high-pressure radial piston pump or injector excessive back-leakage.',
        systemCategory: 'DIESEL_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_DIESEL_COMMON_RAIL_PRESSURE'],
    recommendedDiagnosticChecks: [
      'Compare target rail pressure against actual measured rail pressure on live scan tool graph during acceleration.',
      'Perform common rail diesel injector back-leak (fuel return) quantity test with graduated test tubes.',
      'Inspect fuel filter canister for metal shavings indicating high-pressure pump internal roller destruction.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'High-pressure diesel systems exceed 2,000 bar (29,000 psi). NEVER touch or loosen fittings while running; high pressure fluid penetrates skin and enters bloodstream with lethal toxicity.',
    supportingExplanation: 'Common rail injectors require extreme injection pressure to atomize heavy diesel fuel; if rail pressure drops below 200 bar, the ECU halts injector pulsing to prevent combustion runaway.',
    alternativeExplanations: ['Severely clogged diesel fuel filter restricting low-pressure feed to high-pressure pump'],
    sourceReferences: [
      {
        id: 'REF_DS02_1',
        sourceTitle: 'Delphi Common Rail Diesel Fuel Injection Systems',
        sourceType: 'INDUSTRY_REFERENCE',
        documentSection: 'Pressure Regulation and Injector Backleak Testing',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'DS03',
    title: 'Diesel Particulate Filter (DPF) Soot Loading or Regeneration Failure',
    category: 'DIESEL_ENGINE',
    description: 'Exhaust DPF filter clogged with soot due to interrupted active regeneration cycles, driving vehicle into reduced power mode.',
    applicablePowertrains: ['diesel'],
    requiredConditions: [
      { factCode: 'dpf_differential_pressure_mbar', operator: '>', expectedValue: 120 },
    ],
    optionalSupportingConditions: [
      { factCode: 'dpf_soot_warning_on', expectedValue: true },
      { factCode: 'check_engine_light_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'dpf_differential_pressure_mbar', operator: '<=', expectedValue: 40 },
    ],
    possibleFaults: [
      {
        code: 'FLT_DPF_SOOT_SATURATED',
        name: 'Diesel Particulate Filter Soot Saturation',
        description: 'Exhaust ceramic honeycomb channels blocked by accumulated carbon soot particles.',
        systemCategory: 'DIESEL_ENGINE',
      },
    ],
    suggestedFollowUpQuestions: ['Q_DPF_DIFFERENTIAL_PRESSURE'],
    recommendedDiagnosticChecks: [
      'Read calculated soot mass (grams) and differential pressure on diagnostic scan tool.',
      'Verify exhaust temperature sensors (EGT) read accurately above 600°C needed for active regeneration.',
      'Initiate emergency service regeneration using bi-directional scan tool in a well-ventilated outdoor stall.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Excessive exhaust backpressure and thermal buildup in blocked DPF can cause an underbody vehicle fire if parked over dry grass.',
    supportingExplanation: 'Short urban driving cycles prevent exhaust gas from reaching temperatures required for passive soot burn-off; soot accumulates until differential pressure restricts engine breathing.',
    alternativeExplanations: ['Defective DPF differential pressure sensor reporting false high reading'],
    sourceReferences: [
      {
        id: 'REF_DS03_1',
        sourceTitle: 'EPA / CARB Heavy-Duty Diesel Aftertreatment Standards',
        sourceType: 'GOV_SAFETY_STANDARD',
        documentSection: 'DPF Soot Loading Limits and Regeneration Strategies',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  // =========================================================================
  // CATEGORY H: ELECTRIC AND HYBRID VEHICLES (6 RULES: EV01 - EV06)
  // =========================================================================

  {
    ruleId: 'EV01',
    title: 'EV AC/DC Charging System or Onboard Charger (OBC) Failure',
    category: 'EV_HYBRID',
    description: 'Electric vehicle refuses to accept charging session from Level 2 AC EVSE or DC fast charger due to pilot signal failure or internal OBC fault.',
    applicablePowertrains: ['electric', 'hybrid'],
    requiredConditions: [
      { factCode: 'ev_onboard_charger_fault_confirmed', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'ev_charging_session_fails', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'ev_onboard_charger_fault_confirmed', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_EV_OBC_FAILED',
        name: 'Onboard Charger Module (OBC) / Inlet Port Lock Actuator Defect',
        description: 'Internal AC-to-DC rectification failure or charge coupler locking solenoid failure.',
        systemCategory: 'EV_HYBRID',
      },
    ],
    suggestedFollowUpQuestions: ['Q_EV_CHARGER_INTERLOCK_FAULT'],
    recommendedDiagnosticChecks: [
      'Verify Control Pilot (CP) 1 kHz PWM communication and Proximity Detection (PP) resistance.',
      'Inspect charge inlet connector pins for burn marks, foreign debris, or bent signal pins.',
      'Attempt charging at a known-good external charging station to eliminate wallbox defects.',
    ],
    safetySeverity: 'MEDIUM',
    supportingExplanation: 'SAE J1772 and ISO 15118 protocol requires handshake and mechanical charge port locking before the vehicle closes safety contactors to energize high voltage.',
    alternativeExplanations: ['Faulty external charging station (EVSE) ground fault interrupt (GFI) trip'],
    sourceReferences: [
      {
        id: 'REF_EV01_1',
        sourceTitle: 'SAE J1772 - Electric Vehicle and Plug in Hybrid Electric Vehicle Conductive Charge Coupler',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Section 6: Control Pilot and Proximity Handshake Signals',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EV02',
    title: 'Depleted 12V Low-Voltage Auxiliary Battery Inhibiting EV READY Mode',
    category: 'EV_HYBRID',
    description: 'EV instrument cluster powers up partially but car will not enter READY drive mode because 12V auxiliary system cannot energize high-voltage contactors.',
    applicablePowertrains: ['electric', 'hybrid'],
    requiredConditions: [
      { factCode: 'ev_auxiliary_12v_voltage_v', operator: '<', expectedValue: 11.2 },
    ],
    optionalSupportingConditions: [
      { factCode: 'ev_ready_mode_inhibited', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'ev_auxiliary_12v_voltage_v', operator: '>=', expectedValue: 12.4 },
    ],
    possibleFaults: [
      {
        code: 'FLT_EV_12V_DEPLETED',
        name: 'Discharged 12V Auxiliary Battery',
        description: '12V auxiliary battery voltage insufficient to power Battery Management System (BMS) contactor coils.',
        systemCategory: 'EV_HYBRID',
      },
    ],
    suggestedFollowUpQuestions: ['Q_EV_12V_AUX_VOLTAGE_LOW'],
    recommendedDiagnosticChecks: [
      'Measure 12V auxiliary battery terminal voltage with DMM under load.',
      'Connect battery tender or jump pack to 12V auxiliary terminals; re-attempt powering vehicle to READY mode.',
      'Test high-voltage DC-to-DC converter output voltage (should supply ~14.0V once vehicle enters READY).',
    ],
    safetySeverity: 'MEDIUM',
    supportingExplanation: 'For safety, high-voltage traction batteries remain isolated behind open contactors when powered off. The low-voltage 12V system must power the ECU and close the heavy contactor coils.',
    alternativeExplanations: ['High-voltage interlock loop (HVIL) physical circuit open'],
    sourceReferences: [
      {
        id: 'REF_EV02_1',
        sourceTitle: 'Tesla Service Manual - Low Voltage Power System Architecture',
        sourceType: 'OEM_MANUAL',
        documentSection: '12V / 16V Auxiliary Power Distribution and Sleep Controls',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EV03',
    title: 'High-Voltage Battery Isolation System Fault',
    category: 'EV_HYBRID',
    description: 'BMS detection of electrical leakage / loss of dielectric isolation between high-voltage bus (positive or negative) and vehicle chassis ground.',
    applicablePowertrains: ['electric', 'hybrid'],
    requiredConditions: [
      { factCode: 'hv_isolation_loss_logged', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'hv_system_warning_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'hv_isolation_loss_logged', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_HV_ISOLATION_FAULT',
        name: 'High Voltage Isolation Breakdown (<100 Ohms/Volt)',
        description: 'Moisture ingress in high voltage connector, heater element degradation, or AC compressor motor winding insulation failure.',
        systemCategory: 'EV_HYBRID',
      },
    ],
    suggestedFollowUpQuestions: ['Q_HV_ISOLATION_RESISTANCE'],
    recommendedDiagnosticChecks: [
      'DANGER: High-voltage PPE (Class 0 1000V gloves) and certified safety equipment MANDATORY before opening vehicle.',
      'Check isolation resistance value in BMS data (minimum allowable is 100 ohms/volt or ~40 kohm on 400V system).',
      'Disconnect HV accessories one by one (electric A/C compressor, cabin PTC heater) while monitoring isolation resistance.',
    ],
    safetySeverity: 'CRITICAL',
    safetyGuidance: 'HIGH VOLTAGE SAFETY HAZARD: Never touch orange high-voltage cables or components. Vehicle carries lethal DC voltage. Certified technician only.',
    supportingExplanation: 'FMVSS 305 and UNECE R100 require complete galvanic isolation between high voltage power circuits and passenger cabin chassis to eliminate electrical shock hazards.',
    alternativeExplanations: ['Moisture condensation inside high-voltage charge port socket'],
    sourceReferences: [
      {
        id: 'REF_EV03_1',
        sourceTitle: 'FMVSS 305 - Electric-Powered Vehicles: Electrolyte Spillage and Electrical Shock Protection',
        sourceType: 'GOV_SAFETY_STANDARD',
        documentSection: 'Section S5.4: Electrical Isolation Requirements',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EV04',
    title: 'Critical Traction-Battery Thermal Hazard / Runaway Risk',
    category: 'EV_HYBRID',
    description: 'Dangerous battery pack overheating, cell thermal runaway warning, smoke, or sweet glycol/organic electrolyte odor detected from battery enclosure.',
    applicablePowertrains: ['electric', 'hybrid'],
    requiredConditions: [
      { factCode: 'ev_battery_thermal_runaway_detected', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'ev_battery_thermal_hazard', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'ev_battery_thermal_runaway_detected', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_HV_THERMAL_RUNAWAY',
        name: 'Lithium-Ion Cell Thermal Runaway / Internal Dendrite Short',
        description: 'Exothermic breakdown of lithium-ion battery separator generating self-sustaining heat and combustible gas venting.',
        systemCategory: 'EV_HYBRID',
      },
    ],
    suggestedFollowUpQuestions: ['Q_EV_BATTERY_THERMAL_RUNAWAY_SYMPTOMS'],
    recommendedDiagnosticChecks: [
      'IMMEDIATELY EVACUATE VEHICLE TO 50 FEET (15 METERS) SAFE DISTANCE. CALL EMERGENCY SERVICES (911 / 112).',
      'DO NOT APPROACH VEHICLE. Do not inhale smoke or vapors.',
      'Notify emergency responders of Lithium-Ion Traction Battery involvement.',
    ],
    safetySeverity: 'CRITICAL',
    safetyGuidance: 'CRITICAL LIFE SAFETY EMERGENCY: Traction battery fire risk! Park away from structures, evacuate all occupants immediately, and call emergency services.',
    supportingExplanation: 'Thermal runaway occurs when cell internal temperature exceeds ~150°C, decomposing cathode and release of oxygen; fires are self-oxidizing and can flare repeatedly.',
    alternativeExplanations: [
      'Severe external battery coolant heater or PTC cabin heater element failure emitting burning odor',
      'Road debris impact puncture on battery thermal shield without internal cell breach',
      'Exhaust heat shield failure or catalytic converter scorching floorpan on hybrid vehicles',
    ],
    sourceReferences: [
      {
        id: 'REF_EV04_1',
        sourceTitle: 'NFPA Emergency Field Guide - Alternative Fuel Vehicles',
        sourceType: 'GOV_SAFETY_STANDARD',
        documentSection: 'Section 4: High-Voltage Lithium-Ion Battery Hazards and Extinguishment',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EV05',
    title: 'Electric Traction Motor Inverter or Resolver Fault',
    category: 'EV_HYBRID',
    description: 'Electric vehicle acceleration severely limited ("Turtle Mode" displayed) caused by inverter phase current sensor fault, IGBT gate driver error, or motor position resolver failure.',
    applicablePowertrains: ['electric', 'hybrid'],
    requiredConditions: [
      { factCode: 'ev_inverter_phase_dtc_present', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'ev_propulsion_derated', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'ev_inverter_phase_dtc_present', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_INVERTER_PHASE_FAULT',
        name: 'Traction Inverter IGBT / Motor Resolver Discrepancy',
        description: 'Insulated Gate Bipolar Transistor (IGBT) phase short, over-temperature, or sine/cosine resolver drift.',
        systemCategory: 'EV_HYBRID',
      },
    ],
    suggestedFollowUpQuestions: ['Q_EV_INVERTER_MOTOR_DTC'],
    recommendedDiagnosticChecks: [
      'Read inverter fault codes and high-resolution freeze frame data on OEM diagnostic software.',
      'Check motor cooling circuit pump operation and coolant flow rate through inverter cold plate.',
      'Inspect 3-phase high voltage orange cable connections between inverter and motor for correct torque.',
    ],
    safetySeverity: 'HIGH',
    safetyGuidance: 'Vehicle propulsion power is derated; merge carefully off highway and avoid high-speed merging.',
    supportingExplanation: 'The traction inverter switches 400V/800V DC into 3-phase AC at frequencies up to 10 kHz; phase current sensors detect microsecond short circuits to prevent silicon destruction.',
    alternativeExplanations: ['Motor coolant temperature sensor failing and falsely triggering thermal protection'],
    sourceReferences: [
      {
        id: 'REF_EV05_1',
        sourceTitle: 'IEEE Transactions on Power Electronics - EV Traction Drives',
        sourceType: 'TECHNICAL_SOCIETY',
        documentSection: 'Inverter Fault Detection and Safe Torque Off Strategies',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },

  {
    ruleId: 'EV06',
    title: 'Hybrid High-Voltage Battery Cooling Airflow Restriction',
    category: 'EV_HYBRID',
    description: 'Hybrid vehicle displays master warning and disables electric drive assist due to thermal overheating caused by lint, dirt, or pet hair clogging the high-voltage battery cooling fan intake.',
    applicablePowertrains: ['hybrid'],
    requiredConditions: [
      { factCode: 'hybrid_battery_cooling_restricted', expectedValue: true },
    ],
    optionalSupportingConditions: [
      { factCode: 'hybrid_system_warning_on', expectedValue: true },
    ],
    contradictoryConditions: [
      { factCode: 'hybrid_battery_cooling_restricted', expectedValue: false },
    ],
    possibleFaults: [
      {
        code: 'FLT_HYBRID_FAN_CLOGGED',
        name: 'Hybrid Battery Cooling Fan Filter Blockage',
        description: 'Accumulation of lint or pet hair on rear-seat hybrid battery cooling fan intake grate.',
        systemCategory: 'EV_HYBRID',
      },
    ],
    suggestedFollowUpQuestions: ['Q_HYBRID_BATTERY_FAN_CLOGGED'],
    recommendedDiagnosticChecks: [
      'Inspect rear seat cooling intake duct (typically beside rear passenger seat bolster).',
      'Remove fan housing and clean squirrel-cage blower blades of lint accumulation.',
      'Monitor individual hybrid battery module temperatures and internal resistance on live scan tool.',
    ],
    safetySeverity: 'MEDIUM',
    supportingExplanation: 'Nickel-Metal Hydride (NiMH) and Lithium hybrid batteries generate heat during regenerative braking; without forced cabin airflow, internal resistance spikes and the hybrid ECU disables battery use.',
    alternativeExplanations: ['Hybrid battery cooling fan motor brushless driver failure'],
    sourceReferences: [
      {
        id: 'REF_EV06_1',
        sourceTitle: 'Toyota Hybrid System Diagnostic Guide - Prius / Camry Hybrid',
        sourceType: 'OEM_MANUAL',
        documentSection: 'Battery Thermal Management and Cooling Fan Inspection (DTC P0A82)',
      },
    ],
    validationStatus: 'VALIDATED',
    reviewedBy: 'Lead Diagnostic Specialist',
    reviewedAt: '2026-11-19',
    version: '1.0.0',
    enabled: true,
  },
];
