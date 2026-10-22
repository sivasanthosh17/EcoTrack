import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateKPIStatus, getGoalDirection } from '../controllers/kpiController.js';

test('goal direction defaults by category when a KPI has none set', () => {
  assert.equal(getGoalDirection('Renewable Energy'), 'higher');
  assert.equal(getGoalDirection('Energy'), 'lower');
  assert.equal(getGoalDirection('Waste'), 'lower');
});

test('a KPI\'s own goal direction overrides the category default', () => {
  assert.equal(getGoalDirection('Waste', 'higher'), 'higher');
  assert.equal(getGoalDirection('Renewable Energy', 'lower'), 'lower');
});

test('lower-is-better KPIs: at or under target is achieved', () => {
  assert.equal(calculateKPIStatus('Energy', 92, 100), 'Achieved');
  assert.equal(calculateKPIStatus('Energy', 125000, 115000), 'At Risk');
  assert.equal(calculateKPIStatus('Energy', 130000, 115000), 'Off Track');
});

test('higher-is-better KPIs: under target is not achieved', () => {
  // Waste segregation rate: 62% against a 75% target
  assert.equal(calculateKPIStatus('Waste', 62, 75, 'higher'), 'At Risk');
  assert.equal(calculateKPIStatus('Waste', 75, 75, 'higher'), 'Achieved');
  assert.equal(calculateKPIStatus('Waste', 66, 75, 'higher'), 'On Track');
  assert.equal(calculateKPIStatus('Waste', 40, 75, 'higher'), 'Off Track');
});

test('a KPI with no measurement is pending', () => {
  assert.equal(calculateKPIStatus('Energy', null, 100), 'Pending Data');
});
