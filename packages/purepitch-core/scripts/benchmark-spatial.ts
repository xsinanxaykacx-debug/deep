import { performance } from 'node:perf_hooks';
import { SpatialAnalyzer } from '../src/SpatialAnalyzer.js';
import { createFixtureState } from '../test/golden/fixture.js';

const analyzer = new SpatialAnalyzer();
const state = createFixtureState();

for (let i = 0; i < 100; i++) {
  analyzer.calculatePitchControl(state, 1);
}

const iterations = 1000;
const start = performance.now();
for (let i = 0; i < iterations; i++) {
  analyzer.calculatePitchControl(state, 1);
}
const elapsedMs = performance.now() - start;
const averageMs = elapsedMs / iterations;
const budgetMs = 1000 / 60;

process.stdout.write(
  [
    `Pitch control: ${iterations} tick, ${elapsedMs.toFixed(0)}ms total`,
    `Average: ${averageMs.toFixed(2)}ms/tick`,
    `60 Hz budget: ${budgetMs.toFixed(2)}ms/tick`,
    `Status: ${averageMs < budgetMs ? 'within budget' : 'over budget'}`,
    '',
  ].join('\n'),
);
