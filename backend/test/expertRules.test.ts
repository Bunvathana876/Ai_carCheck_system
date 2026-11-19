import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIAGNOSTIC_RULES_CATALOG,
  runInference,
  type Fact,
  type VehicleEntity,
  type WorkingMemory,
} from '@voltguard/shared/expert';

// Baseline Vehicles for testing
const GASOLINE_CAR: VehicleEntity = {
  id: 'veh-gas',
  manufacturer: 'Toyota',
  model: 'Camry',
  year: 2021,
  powertrain: 'gasoline',
  engineType: '2.5L I4',
  transmission: 'automatic',
  mileageKm: 50000,
};

const MANUAL_GAS_CAR: VehicleEntity = {
  id: 'veh-manual-gas',
  manufacturer: 'Honda',
  model: 'Civic',
  year: 2020,
  powertrain: 'gasoline',
  engineType: '1.5L Turbo',
  transmission: 'manual',
  mileageKm: 40000,
};

const DIESEL_TRUCK: VehicleEntity = {
  id: 'veh-diesel',
  manufacturer: 'Ford',
  model: 'F-250',
  year: 2022,
  powertrain: 'diesel',
  engineType: '6.7L V8',
  transmission: 'automatic',
  mileageKm: 80000,
};

const EV_CAR: VehicleEntity = {
  id: 'veh-ev',
  manufacturer: 'Voltguard',
  model: 'GT-4',
  year: 2024,
  powertrain: 'electric',
  engineType: 'Dual Motor',
  transmission: 'direct_drive',
  mileageKm: 25000,
};

const HYBRID_CAR: VehicleEntity = {
  id: 'veh-hybrid',
  manufacturer: 'Toyota',
  model: 'Prius',
  year: 2023,
  powertrain: 'hybrid',
  engineType: '2.0L Hybrid',
  transmission: 'cvt',
  mileageKm: 30000,
};

function getCompatibleVehicle(powertrains: string[], transmissions?: string[]): VehicleEntity {
  if (transmissions?.includes('manual') && !transmissions.includes('automatic')) return MANUAL_GAS_CAR;
  if (powertrains.includes('electric') && !powertrains.includes('gasoline')) return EV_CAR;
  if (powertrains.includes('diesel') && !powertrains.includes('gasoline')) return DIESEL_TRUCK;
  if (powertrains.includes('hybrid') && !powertrains.includes('gasoline')) return HYBRID_CAR;
  return GASOLINE_CAR;
}

// Map each rule ID to positive facts that satisfy its required conditions
const RULE_POSITIVE_FACTS: Record<string, Record<string, string | number | boolean>> = {
  EL01: { engine_crank_status: 'slow_crank', battery_resting_voltage_v: 12.1, lights_dim_on_crank: true },
  EL02: { battery_discharges_overnight: true, parasitic_draw_ma: 120 },
  EL03: { battery_warning_light_on: true, charging_voltage_v: 12.8 },
  EL04: { engine_crank_status: 'no_crank', starter_control_signal_present: false },
  EL05: { engine_crank_status: 'no_crank', starter_control_signal_present: true },
  EL06: { battery_post_clamp_voltage_drop_exceeded: true, engine_crank_status: 'slow_crank' },
  EL07: { fuse_continuity_open: true, accessory_circuit_dead: true },
  EL08: { ground_voltage_drop_v: 0.45 },

  EN01: { misfire_detected: true, check_engine_light_flashing: true },
  EN02: { fuel_pressure_low: true, crank_no_start: true },
  EN03: { rough_idle: true, long_term_fuel_trim_percent: 18 },
  EN04: { maf_sensor_reading_implausible: true, acceleration_hesitation: true },
  EN05: { o2_heater_dtc_present: true, check_engine_light_on: true },
  EN06: { downstream_o2_rapid_switching: true, check_engine_light_on: true },
  EN07: { electronic_throttle_fault_active: true, acceleration_hesitation: true },
  EN08: { crank_rpm_signal_missing: true, intermittent_stall: true },
  EN09: { evap_leak_dtc_present: true, check_engine_light_on: true },
  EN10: { cylinder_compression_variance_percent: 28, rough_idle: true },

  TH01: { cooling_pressure_decay_verified: true, coolant_level_dropping: true },
  TH02: { cooling_fan_inoperative: true, engine_overheating: true },
  TH03: { thermostat_stuck_open_symptoms: true, slow_engine_warmup: true },
  TH04: { coolant_circulation_blocked: true, engine_overheating: true },
  TH05: { water_pump_leak_or_play: true, coolant_level_dropping: true },
  TH06: { oil_pressure_light_on: true, oil_pressure_psi_warm_idle: 4 },
  TH07: { ac_blowing_warm: true, ac_compressor_fails_to_engage: true },

  BR01: { brake_pedal_sinks_under_holding_pressure: true, brake_pedal_spongy: true },
  BR02: { brake_booster_assist_lost: true, brake_pedal_hard: true },
  BR03: { abs_sensor_dtc_present: true, abs_warning_light_on: true },
  BR04: { brake_pad_thickness_mm: 1.5, brake_grinding_noise: true },
  BR05: { brake_caliper_seized_or_restricted: true, brake_pulls_to_side: true },

  CH01: { tire_underinflation_psi: 10, tpms_light_illuminated: true },
  CH02: { tire_wear_pattern: 'alignment_wear', steering_pulls_straight_road: true },
  CH03: { wheel_balance_excessive: true, vibration_at_highway_speed: true },
  CH04: { suspension_joint_play_detected: true, clunk_noise_over_bumps: true },
  CH05: { eps_system_dtc_present: true, steering_assist_loss: true },
  CH06: { wheel_bearing_rough_or_loose: true, wheel_bearing_drone: true },

  DR01: { auto_trans_slip_verified: true, transmission_slipping: true },
  DR02: { manual_clutch_slip_verified: true, transmission_slipping: true },
  DR03: { shift_solenoid_dtc_present: true, harsh_gear_shifts: true },
  DR04: { clicking_sound_turning: true, cv_boot_torn_with_grease_loss: true },
  DR05: { driveline_u_joint_excessive_play: true, driveline_slack_clunk: true },

  DS01: { glow_plug_circuit_open: true, diesel_cold_start_hard: true },
  DS02: { diesel_rail_pressure_drop_verified: true, diesel_rail_pressure_drop: true },
  DS03: { dpf_differential_pressure_mbar: 160, dpf_soot_warning_on: true },

  EV01: { ev_onboard_charger_fault_confirmed: true, ev_charging_session_fails: true },
  EV02: { ev_auxiliary_12v_voltage_v: 10.5, ev_ready_mode_inhibited: true },
  EV03: { hv_isolation_loss_logged: true, hv_system_warning_on: true },
  EV04: { ev_battery_thermal_runaway_detected: true, ev_battery_thermal_hazard: true },
  EV05: { ev_inverter_phase_dtc_present: true, ev_propulsion_derated: true },
  EV06: { hybrid_battery_cooling_restricted: true, hybrid_system_warning_on: true },
};

// Map each rule ID to contradictory or invalidating facts
const RULE_CONTRADICTORY_FACTS: Record<string, Record<string, string | number | boolean>> = {
  EL01: { engine_crank_status: 'normal_crank', battery_resting_voltage_v: 12.8 },
  EL02: { battery_discharges_overnight: true, parasitic_draw_ma: 25 },
  EL03: { battery_warning_light_on: true, charging_voltage_v: 14.2 },
  EL04: { engine_crank_status: 'no_crank', starter_control_signal_present: true },
  EL05: { engine_crank_status: 'normal_crank', starter_control_signal_present: true },
  EL06: { battery_post_clamp_voltage_drop_exceeded: false },
  EL07: { fuse_continuity_open: false },
  EL08: { ground_voltage_drop_v: 0.05 },

  EN01: { misfire_detected: false },
  EN02: { fuel_pressure_low: false },
  EN03: { rough_idle: true, long_term_fuel_trim_percent: 2 },
  EN04: { maf_sensor_reading_implausible: false },
  EN05: { o2_heater_dtc_present: false },
  EN06: { downstream_o2_rapid_switching: false },
  EN07: { electronic_throttle_fault_active: false },
  EN08: { crank_rpm_signal_missing: false },
  EN09: { evap_leak_dtc_present: false },
  EN10: { cylinder_compression_variance_percent: 5 },

  TH01: { cooling_pressure_decay_verified: false },
  TH02: { cooling_fan_inoperative: false, engine_overheating: true },
  TH03: { thermostat_stuck_open_symptoms: true, engine_overheating: true },
  TH04: { coolant_circulation_blocked: false },
  TH05: { water_pump_leak_or_play: false },
  TH06: { oil_pressure_light_on: true, oil_pressure_psi_warm_idle: 25 },
  TH07: { ac_blowing_warm: false },

  BR01: { brake_pedal_sinks_under_holding_pressure: false },
  BR02: { brake_booster_assist_lost: false },
  BR03: { abs_sensor_dtc_present: false },
  BR04: { brake_pad_thickness_mm: 8 },
  BR05: { brake_caliper_seized_or_restricted: false },

  CH01: { tire_underinflation_psi: 1 },
  CH02: { tire_wear_pattern: 'even_wear' },
  CH03: { wheel_balance_excessive: false },
  CH04: { suspension_joint_play_detected: false },
  CH05: { eps_system_dtc_present: false },
  CH06: { wheel_bearing_rough_or_loose: false },

  DR01: { auto_trans_slip_verified: false },
  DR02: { manual_clutch_slip_verified: false },
  DR03: { shift_solenoid_dtc_present: false },
  DR04: { cv_boot_torn_with_grease_loss: false },
  DR05: { driveline_u_joint_excessive_play: false },

  DS01: { glow_plug_circuit_open: false },
  DS02: { diesel_rail_pressure_drop_verified: false },
  DS03: { dpf_differential_pressure_mbar: 20 },

  EV01: { ev_onboard_charger_fault_confirmed: false },
  EV02: { ev_auxiliary_12v_voltage_v: 12.8 },
  EV03: { hv_isolation_loss_logged: false },
  EV04: { ev_battery_thermal_runaway_detected: false },
  EV05: { ev_inverter_phase_dtc_present: false },
  EV06: { hybrid_battery_cooling_restricted: false },
};

function makeMemory(factsObj: Record<string, string | number | boolean>): WorkingMemory {
  const mem: WorkingMemory = {};
  for (const [code, value] of Object.entries(factsObj)) {
    mem[code] = {
      code,
      value,
      source: 'question_answer',
      timestamp: new Date().toISOString(),
    };
  }
  return mem;
}

test('RULE CATALOG VERIFICATION: exactly 50 unique rules defined', () => {
  assert.equal(DIAGNOSTIC_RULES_CATALOG.length, 50);
  const ids = new Set(DIAGNOSTIC_RULES_CATALOG.map((r) => r.ruleId));
  assert.equal(ids.size, 50);
});

// Run 50 positive matching scenarios
test('EXPERT SYSTEM: 50 positive matching rule scenarios', () => {
  for (const rule of DIAGNOSTIC_RULES_CATALOG) {
    const facts = RULE_POSITIVE_FACTS[rule.ruleId];
    assert.ok(facts, `Missing positive test facts for rule ${rule.ruleId}`);

    const vehicle = getCompatibleVehicle(rule.applicablePowertrains, rule.applicableTransmissions);
    const memory = makeMemory(facts);

    const result = runInference(vehicle, memory, DIAGNOSTIC_RULES_CATALOG);
    const match = result.hypotheses.find((h) => h.ruleId === rule.ruleId);

    assert.ok(
      match,
      `Rule ${rule.ruleId} failed to produce hypothesis on positive scenario.`
    );
    assert.ok(
      match.ruleMatchScore >= 50,
      `Rule ${rule.ruleId} match score too low (${match.ruleMatchScore}%) on positive scenario.`
    );
    assert.notEqual(
      match.confidence,
      'INSUFFICIENT',
      `Rule ${rule.ruleId} should have confidence higher than INSUFFICIENT.`
    );
  }
});

// Run 50 negative / contradictory scenarios
test('EXPERT SYSTEM: 50 negative / contradictory rule scenarios', () => {
  for (const rule of DIAGNOSTIC_RULES_CATALOG) {
    const facts = RULE_CONTRADICTORY_FACTS[rule.ruleId];
    assert.ok(facts, `Missing contradictory test facts for rule ${rule.ruleId}`);

    const vehicle = getCompatibleVehicle(rule.applicablePowertrains, rule.applicableTransmissions);
    const memory = makeMemory(facts);

    const result = runInference(vehicle, memory, DIAGNOSTIC_RULES_CATALOG);
    const match = result.hypotheses.find((h) => h.ruleId === rule.ruleId);

    if (match) {
      assert.equal(
        match.ruleMatchScore,
        0,
        `Rule ${rule.ruleId} should have score 0 on contradictory/negative scenario, got ${match.ruleMatchScore}%`
      );
    }
  }
});

test('VEHICLE COMPATIBILITY: combustion rules rejected on pure EV and EV rules rejected on ICE', () => {
  // Gasoline rule EN01 on EV
  const memEN01 = makeMemory(RULE_POSITIVE_FACTS.EN01);
  const resultEV = runInference(EV_CAR, memEN01, DIAGNOSTIC_RULES_CATALOG);
  assert.equal(resultEV.hypotheses.some((h) => h.ruleId === 'EN01'), false);

  // Diesel rule DS03 on Gasoline car
  const memDS03 = makeMemory(RULE_POSITIVE_FACTS.DS03);
  const resultGas = runInference(GASOLINE_CAR, memDS03, DIAGNOSTIC_RULES_CATALOG);
  assert.equal(resultGas.hypotheses.some((h) => h.ruleId === 'DS03'), false);

  // Manual transmission rule DR02 on Automatic car
  const memDR02 = makeMemory(RULE_POSITIVE_FACTS.DR02);
  const resultAuto = runInference(GASOLINE_CAR, memDR02, DIAGNOSTIC_RULES_CATALOG);
  assert.equal(resultAuto.hypotheses.some((h) => h.ruleId === 'DR02'), false);

  // EV traction battery rule EV04 on pure Diesel truck
  const memEV04 = makeMemory(RULE_POSITIVE_FACTS.EV04);
  const resultDiesel = runInference(DIESEL_TRUCK, memEV04, DIAGNOSTIC_RULES_CATALOG);
  assert.equal(resultDiesel.hypotheses.some((h) => h.ruleId === 'EV04'), false);
});

test('SAFETY ENGINE: urgent conditions trigger CRITICAL warnings and safeToDrive=false', () => {
  // Brake hydraulic failure (BR01)
  const brakeMemory = makeMemory({
    brake_pedal_sinks_under_holding_pressure: true,
  });
  const resultBrake = runInference(GASOLINE_CAR, brakeMemory, DIAGNOSTIC_RULES_CATALOG);
  assert.ok(resultBrake.safetyAlerts.length > 0);
  assert.equal(resultBrake.safetyAlerts[0].severity, 'CRITICAL');
  assert.equal(resultBrake.safetyAlerts[0].safeToDrive, false);
  assert.equal(resultBrake.status, 'SAFETY_HALTED');

  // EV thermal runaway (EV04)
  const evThermalMemory = makeMemory({
    ev_battery_thermal_runaway_detected: true,
  });
  const resultEV = runInference(EV_CAR, evThermalMemory, DIAGNOSTIC_RULES_CATALOG);
  assert.ok(resultEV.safetyAlerts.length > 0);
  assert.equal(resultEV.safetyAlerts[0].severity, 'CRITICAL');
  assert.equal(resultEV.safetyAlerts[0].emergencyCallRecommended, true);
  assert.equal(resultEV.status, 'SAFETY_HALTED');

  // Low engine oil pressure (TH06)
  const oilMemory = makeMemory({
    oil_pressure_light_on: true,
  });
  const resultOil = runInference(GASOLINE_CAR, oilMemory, DIAGNOSTIC_RULES_CATALOG);
  assert.ok(resultOil.safetyAlerts.length > 0);
  assert.equal(resultOil.safetyAlerts[0].severity, 'CRITICAL');
  assert.equal(resultOil.safetyAlerts[0].safeToDrive, false);
});

test('DETERMINISM: multiple evaluations with identical facts yield identical scores and order', () => {
  const memory = makeMemory({
    engine_crank_status: 'slow_crank',
    battery_resting_voltage_v: 12.1,
    lights_dim_on_crank: true,
  });

  const run1 = runInference(GASOLINE_CAR, memory, DIAGNOSTIC_RULES_CATALOG);
  const run2 = runInference(GASOLINE_CAR, memory, DIAGNOSTIC_RULES_CATALOG);

  assert.equal(run1.hypotheses.length, run2.hypotheses.length);
  for (let i = 0; i < run1.hypotheses.length; i++) {
    assert.equal(run1.hypotheses[i].ruleId, run2.hypotheses[i].ruleId);
    assert.equal(run1.hypotheses[i].ruleMatchScore, run2.hypotheses[i].ruleMatchScore);
    assert.equal(run1.hypotheses[i].confidence, run2.hypotheses[i].confidence);
  }
});
