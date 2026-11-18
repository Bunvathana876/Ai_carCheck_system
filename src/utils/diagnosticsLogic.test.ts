import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePackSummary,
  formatDisplayDate,
  getTabCallout,
  getWeekDays,
  shiftIsoDateByDays,
  sortOrFilterModules,
} from './diagnosticsLogic';
import { INITIAL_BATTERY_MODULES } from '../data/mockDiagnostics';

test('calculatePackSummary reflects all modules active at 78% charge', () => {
  const summary = calculatePackSummary(INITIAL_BATTERY_MODULES, 78, 412);
  assert.equal(summary.totalModules, 4);
  assert.equal(summary.activeModules, 4);
  assert.equal(summary.effectiveChargePercent, 78);
  assert.equal(summary.estimatedRangeKm, 412);
  assert.equal(summary.averageSoh, 97.5);
});

test('calculatePackSummary updates charge and active count when modules are switched off', () => {
  const modified = INITIAL_BATTERY_MODULES.map((m, idx) =>
    idx === 0 ? { ...m, enabled: false } : m
  );
  const summary = calculatePackSummary(modified, 78, 412);
  assert.equal(summary.activeModules, 3);
  assert.equal(summary.effectiveChargePercent, 59);
  assert.equal(summary.estimatedRangeKm, 309);
});

test('calculatePackSummary handles all modules disabled safely', () => {
  const disabledAll = INITIAL_BATTERY_MODULES.map((m) => ({
    ...m,
    enabled: false,
  }));
  const summary = calculatePackSummary(disabledAll, 78, 412);
  assert.equal(summary.activeModules, 0);
  assert.equal(summary.effectiveChargePercent, 0);
  assert.equal(summary.averageSoh, 0);
});

test('getWeekDays returns Monday to Sunday containing May 16, 2026', () => {
  const week = getWeekDays('2026-05-16');
  assert.equal(week.length, 7);
  assert.equal(week[0].isoDate, '2026-05-11');
  assert.equal(week[0].weekdayShort, 'Mon');
  assert.equal(week[5].isoDate, '2026-05-16');
  assert.equal(week[5].weekdayShort, 'Sat');
  assert.equal(week[6].isoDate, '2026-05-17');
  assert.equal(week[6].weekdayShort, 'Sun');
});

test('shiftIsoDateByDays shifts forward and backward by 7 days cleanly', () => {
  const nextWeek = shiftIsoDateByDays('2026-05-16', 7);
  assert.equal(nextWeek, '2026-05-23');
  assert.equal(formatDisplayDate(nextWeek), 'May 23, 2026');

  const prevWeek = shiftIsoDateByDays('2026-05-16', -7);
  assert.equal(prevWeek, '2026-05-09');
  assert.equal(formatDisplayDate(prevWeek), 'May 9, 2026');
});

test('getTabCallout switches callouts cleanly per diagnostic tab', () => {
  const summary = calculatePackSummary(INITIAL_BATTERY_MODULES, 78, 412);
  const battery = getTabCallout('battery', summary, 72, 45);
  assert.equal(battery.primaryValue, '78%');
  assert.equal(battery.primaryLabel, 'charge');

  const drivetrain = getTabCallout('drivetrain', summary, 72, 45);
  assert.equal(drivetrain.primaryValue, '72%');
  assert.equal(drivetrain.primaryLabel, 'health');

  const thermal = getTabCallout('thermal', summary, 72, 45);
  assert.equal(thermal.primaryLabel, 'coolant');
});

test('sortOrFilterModules filters active and sorts warmest first', () => {
  const withDisabled = INITIAL_BATTERY_MODULES.map((m) =>
    m.id === 'mod-b1' ? { ...m, enabled: false } : m
  );
  assert.equal(sortOrFilterModules(withDisabled, 'active').length, 3);
  const warmest = sortOrFilterModules(INITIAL_BATTERY_MODULES, 'warmest');
  assert.equal(warmest[0].id, 'mod-d4');
  assert.equal(warmest[0].temperatureC, 33.0);
});
