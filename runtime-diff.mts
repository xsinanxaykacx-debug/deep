import { runScenario as runOld } from './old/packages/purepitch-core/test/golden/runScenario.ts';
import { runScenario as runNew } from './new/packages/purepitch-core/test/golden/runScenario.ts';
import { writeFileSync } from 'node:fs';

const config = {
  ticks: 50,
  captureStates: true,
  intentSeed: 0x0BADC0DE,
  physicsSeed: 0xC0FFEE42,
};

const oldRun = runOld(config);
const newRun = runNew(config);
if (!oldRun.states || !newRun.states) throw new Error('captureStates did not return snapshots');

function snapshot(state: any) {
  return {
    tickId: state.tickId,
    ball: {
      position: state.ball.position,
      velocity: state.ball.velocity,
      spin: state.ball.spin,
      ownerId: state.ball.ownerId,
      lastTouchId: state.ball.lastTouchId ?? null,
      controlStrength: state.ball.controlStrength,
      ...(Object.hasOwn(state.ball, 'dribbleUntilTick')
        ? { dribbleUntilTick: state.ball.dribbleUntilTick }
        : {}),
    },
    playerOrder: state.playerOrder,
    players: Object.fromEntries(
      [...state.players.entries()].map(([id, p]: [string, any]) => [id, {
        id: p.id,
        teamId: p.teamId,
        position: p.position,
        velocity: p.velocity,
        stamina: p.stamina,
        facing: p.facing,
        attributes: p.attributes,
        roleAnchor: p.roleAnchor,
      }])
    ),
  };
}

function collectDiffs(a: any, b: any, path = ''): any[] {
  if (Object.is(a, b)) return [];
  if (a && b && typeof a === 'object' && typeof b === 'object' &&
      !Array.isArray(a) && !Array.isArray(b)) {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
    return keys.flatMap((key) => collectDiffs(a[key], b[key], path ? path + '.' + key : key));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [{ field: path + '.length', old: a.length, new: b.length }];
    return a.flatMap((value, i) => collectDiffs(value, b[i], path + '[' + i + ']'));
  }
  return [{ field: path, old: a === undefined ? '<absent>' : a, new: b === undefined ? '<absent>' : b }];
}

const targetTicks = [0, 1, 10, 50];
const rows = targetTicks.map((tick) => {
  const oldState = snapshot(oldRun.states![tick]);
  const newState = snapshot(newRun.states![tick]);
  const diffs = collectDiffs(oldState, newState);
  const expectedOnly = diffs.every((d) =>
    d.field === 'ball.dribbleUntilTick' && d.old === '<absent>' && d.new === 0
  );
  return {
    tick,
    diffCount: diffs.length,
    physicsFieldsSame: diffs.every((d) => !/^ball\.(position|velocity|spin)\./.test(d.field) &&
      !/^players\./.test(d.field)),
    ownershipSame: !diffs.some((d) => d.field === 'ball.ownerId' || d.field === 'ball.lastTouchId'),
    dribbleUntilTick: {
      old: Object.hasOwn(oldRun.states![tick].ball, 'dribbleUntilTick')
        ? oldRun.states![tick].ball.dribbleUntilTick : '<absent>',
      new: Object.hasOwn(newRun.states![tick].ball, 'dribbleUntilTick')
        ? newRun.states![tick].ball.dribbleUntilTick : '<absent>',
    },
    otherDiffs: diffs,
    result: expectedOnly ? 'PASS' : 'FAIL',
    oldHash: oldRun.hashes[tick],
    newHash: newRun.hashes[tick],
  };
});

const report = {
  baseline: '030d4db9f34fe6eb241c7a7a0ab7d183df0b1f58',
  candidate: '985eebc9278d1c6cd98c875fdd09f41c238bc667',
  seeds: { intentSeed: config.intentSeed, physicsSeed: config.physicsSeed },
  ticksCaptured: targetTicks,
  rows,
  overall: rows.every((r) => r.result === 'PASS') ? 'PASS' : 'FAIL',
};
writeFileSync('runtime-diff.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.overall !== 'PASS') process.exitCode = 1;
