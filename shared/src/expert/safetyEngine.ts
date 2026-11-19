import type { WorkingMemory, SafetyAlert } from './types.js';

export function evaluateSafetyConditions(memory: WorkingMemory): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];

  // 1. Critical EV Traction Battery Thermal Hazard (EV04)
  if (memory['ev_battery_thermal_runaway_detected']?.value === true || memory['ev_battery_thermal_hazard']?.value === true) {
    alerts.push({
      severity: 'CRITICAL',
      headline: 'CRITICAL SAFETY ALERT: Potential Traction Battery Thermal Runaway / Fire Hazard',
      instructions: [
        'STOP AND EVACUATE THE VEHICLE IMMEDIATELY to at least 15 meters (50 feet) away.',
        'DO NOT attempt to extinguish a high-voltage lithium battery fire with personal fire extinguishers.',
        'CALL EMERGENCY SERVICES (911 / 112) immediately and inform responders that an electric/hybrid vehicle traction battery is involved.',
        'Keep all bystanders clear of smoke and vapors; lithium battery smoke contains hydrogen fluoride and toxic gases.',
      ],
      safeToDrive: false,
      immediateActionRequired: true,
      emergencyCallRecommended: true,
      triggeringFactOrRule: 'ev_battery_thermal_runaway_detected',
    });
  }

  // 2. Critical Hydraulic Brake Failure (BR01)
  if (memory['brake_pedal_sinks_under_holding_pressure']?.value === true) {
    alerts.push({
      severity: 'CRITICAL',
      headline: 'CRITICAL SAFETY ALERT: Hydraulic Brake Failure / Pedal Sinking to Floor',
      instructions: [
        'DO NOT DRIVE THIS VEHICLE UNDER ANY CIRCUMSTANCES.',
        'A sinking brake pedal indicates severe hydraulic pressure loss or internal master cylinder bypass.',
        'The vehicle cannot be safely stopped in traffic and may experience total brake failure without warning.',
        'Have vehicle towed immediately by a professional flatbed carrier to a certified brake repair facility.',
      ],
      safeToDrive: false,
      immediateActionRequired: true,
      emergencyCallRecommended: false,
      triggeringFactOrRule: 'brake_pedal_sinks_under_holding_pressure',
    });
  }

  // 3. Dangerously Low Engine Oil Pressure (TH06)
  if (
    memory['oil_pressure_light_on']?.value === true ||
    (typeof memory['oil_pressure_psi_warm_idle']?.value === 'number' &&
      Number(memory['oil_pressure_psi_warm_idle'].value) < 8)
  ) {
    alerts.push({
      severity: 'CRITICAL',
      headline: 'CRITICAL ENGINE ALERT: Zero / Dangerously Low Engine Oil Pressure',
      instructions: [
        'SHUT ENGINE OFF IMMEDIATELY. Do not allow engine to idle even for a few seconds.',
        'Check engine oil level on dipstick. If bone dry, do not start engine.',
        'Running an engine without hydrodynamic oil pressure destroys crankshaft bearings and camshafts within 30 to 60 seconds.',
        'Arrange towing to an automotive repair shop for mechanical oil pressure verification.',
      ],
      safeToDrive: false,
      immediateActionRequired: true,
      emergencyCallRecommended: false,
      triggeringFactOrRule: 'oil_pressure_light_on',
    });
  }

  // 4. Critical Coolant Circulation Failure / Overheating (TH04)
  if (memory['coolant_circulation_blocked']?.value === true && memory['engine_overheating']?.value === true) {
    alerts.push({
      severity: 'CRITICAL',
      headline: 'CRITICAL OVERHEATING ALERT: Severe Coolant Flow Blockage',
      instructions: [
        'Turn off the engine immediately. Do not attempt to drive to the next exit.',
        'Extreme temperature differentials will warp cylinder heads, blow head gaskets, and crack engine blocks.',
        'NEVER attempt to remove radiator or coolant reservoir cap while engine is hot; boiling coolant will spray under high pressure causing severe scald burns.',
        'Allow engine to cool completely for at least 1 hour before inspecting fluid levels.',
      ],
      safeToDrive: false,
      immediateActionRequired: true,
      emergencyCallRecommended: false,
      triggeringFactOrRule: 'coolant_circulation_blocked',
    });
  }

  // 5. High-Voltage Isolation Loss (EV03)
  if (memory['hv_isolation_loss_logged']?.value === true) {
    alerts.push({
      severity: 'CRITICAL',
      headline: 'HIGH VOLTAGE DANGER: High-Voltage Isolation Breakdown Detected',
      instructions: [
        'DANGER: Do not touch any high-voltage orange wiring harnesses, charging port components, or battery casing.',
        'Galvanic isolation between the 400V-800V DC high voltage bus and the vehicle chassis has degraded.',
        'Do not plug vehicle into external charging equipment.',
        'Have vehicle serviced exclusively by a qualified high-voltage certified EV technician using Class 0 rated insulated gloves and tools.',
      ],
      safeToDrive: false,
      immediateActionRequired: true,
      emergencyCallRecommended: false,
      triggeringFactOrRule: 'hv_isolation_loss_logged',
    });
  }

  // 6. Flashing Check Engine Light (Active Severe Catalyst Damaging Misfire) (EN01)
  if (memory['check_engine_light_flashing']?.value === true) {
    alerts.push({
      severity: 'HIGH',
      headline: 'URGENT ENGINE WARNING: Flashing Check Engine Light (Severe Misfire)',
      instructions: [
        'Reduce engine speed immediately and avoid heavy acceleration.',
        'A flashing check engine light indicates raw unburned fuel is entering the exhaust system.',
        'Raw fuel will superheat the catalytic converter past 900°C (1,600°F), risking catalytic converter meltdown and possible undercarriage fire.',
        'Drive gently to the nearest repair facility or stop and arrange transport.',
      ],
      safeToDrive: false,
      immediateActionRequired: true,
      emergencyCallRecommended: false,
      triggeringFactOrRule: 'check_engine_light_flashing',
    });
  }

  // 7. Severe Ball Joint / Suspension Play (CH04)
  if (memory['suspension_joint_play_detected']?.value === true) {
    alerts.push({
      severity: 'HIGH',
      headline: 'SUSPENSION SAFETY WARNING: Excessive Ball Joint Free Play',
      instructions: [
        'Avoid high speed driving and rough roads.',
        'Excessive ball joint play carries the risk of ball stud separation from its socket.',
        'Ball joint detachment causes immediate collapse of the front wheel and total loss of steering control.',
        'Inspect and replace worn ball joints before continued operation.',
      ],
      safeToDrive: false,
      immediateActionRequired: true,
      emergencyCallRecommended: false,
      triggeringFactOrRule: 'suspension_joint_play_detected',
    });
  }

  // 8. Brake Friction Material Depleted (BR04)
  if (
    typeof memory['brake_pad_thickness_mm']?.value === 'number' &&
    Number(memory['brake_pad_thickness_mm'].value) <= 2
  ) {
    alerts.push({
      severity: 'HIGH',
      headline: 'BRAKE WEAR WARNING: Brake Pads Worn Past Safe Minimum (< 2 mm)',
      instructions: [
        'Brake pad friction material is exhausted. Steel backing plates are contacting or close to contacting brake rotors.',
        'Stopping distances are severely compromised, and friction heat buildup may cause brake fade or pad ejection.',
        'Replace front and rear brake pads and inspect brake rotors before continued vehicle use.',
      ],
      safeToDrive: false,
      immediateActionRequired: true,
      emergencyCallRecommended: false,
      triggeringFactOrRule: 'brake_pad_thickness_mm',
    });
  }

  return alerts;
}
