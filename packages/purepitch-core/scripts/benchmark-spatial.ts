import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { SpatialAnalyzer } from '../src/SpatialAnalyzer.js';
import { createFixtureState } from '../test/golden/fixture.js';

const ITERATIONS = 1000;
const WARMUP = 100;
const RESOLUTION = 1.0;
const BUDGET_MS = 16.66;

function runBenchmark(): void {
  const analyzer = new SpatialAnalyzer();
  const state = createFixtureState();

  for (let i = 0; i < WARMUP; i++) {
    analyzer.calculatePitchControl(state, RESOLUTION);
  }

  const times: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    analyzer.calculatePitchControl(state, RESOLUTION);
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const mean = times.reduce((sum, value) => sum + value, 0) / ITERATIONS;
  const p50 = times[Math.ceil(ITERATIONS * 0.50) - 1];
  const p95 = times[Math.ceil(ITERATIONS * 0.95) - 1];
  const p99 = times[Math.ceil(ITERATIONS * 0.99) - 1];
  const min = times[0];
  const max = times[ITERATIONS - 1];

  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    resolution: RESOLUTION,
    iterations: ITERATIONS,
    warmup: WARMUP,
    mean: Number(mean.toFixed(3)),
    p50: Number(p50.toFixed(3)),
    p95: Number(p95.toFixed(3)),
    p99: Number(p99.toFixed(3)),
    min: Number(min.toFixed(3)),
    max: Number(max.toFixed(3)),
    budgetMs: BUDGET_MS,
    passes: p95 < BUDGET_MS,
  };

  console.log('===========================================');
  console.log('  PurePitch - Pitch Control Benchmark');
  console.log('===========================================');
  console.log(`  Node: ${report.nodeVersion} (${report.platform}/${report.arch})`);
  console.log(`  Resolution: ${RESOLUTION}m | Iterations: ${ITERATIONS} | Warmup: ${WARMUP}`);
  console.log('-------------------------------------------');
  console.log(`  mean:  ${report.mean.toFixed(3)} ms`);
  console.log(`  p50:   ${report.p50.toFixed(3)} ms`);
  console.log(`  p95:   ${report.p95.toFixed(3)} ms`);
  console.log(`  p99:   ${report.p99.toFixed(3)} ms`);
  console.log(`  min:   ${report.min.toFixed(3)} ms`);
  console.log(`  max:   ${report.max.toFixed(3)} ms`);
  console.log('-------------------------------------------');
  console.log(`  p95 budget: ${BUDGET_MS.toFixed(2)} ms`);
  console.log(`  Status: ${report.passes ? 'within budget' : 'over budget'}`);
  console.log('===========================================');

  writeFileSync('benchmark-results.json', JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log('Report written: benchmark-results.json');

  if (!report.passes) {
    process.exitCode = 1;
  }
}

runBenchmark();
