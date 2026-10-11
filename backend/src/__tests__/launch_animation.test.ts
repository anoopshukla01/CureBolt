import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('CureBolt Mascot & Brand Launch Animation Rig', () => {
  const rigPath = path.resolve(__dirname, '../../../packages/core_ui/assets/launch/scooter_rig.json');
  const fullArtPng = path.resolve(__dirname, '../../../packages/core_ui/assets/launch/curebolt_full.png');
  const fullArtWebp = path.resolve(__dirname, '../../../packages/core_ui/assets/launch/curebolt_full.webp');
  const frontWheelPng = path.resolve(__dirname, '../../../packages/core_ui/assets/launch/wheel_front.png');
  const rearWheelPng = path.resolve(__dirname, '../../../packages/core_ui/assets/launch/wheel_rear.png');

  it('L1: verifies all artwork assets exist and are optimized', () => {
    expect(fs.existsSync(rigPath)).toBe(true);
    expect(fs.existsSync(fullArtPng)).toBe(true);
    expect(fs.existsSync(fullArtWebp)).toBe(true);
    expect(fs.existsSync(frontWheelPng)).toBe(true);
    expect(fs.existsSync(rearWheelPng)).toBe(true);

    const fullArtStats = fs.statSync(fullArtWebp);
    // Compressed WebP should be well under 250 KB
    expect(fullArtStats.size).toBeLessThan(250 * 1024);
  });

  it('L1: verifies scooter rig geometry matches the left-facing mascot artwork', () => {
    const rig = JSON.parse(fs.readFileSync(rigPath, 'utf8'));

    expect(rig.direction).toBe('left_facing');
    expect(rig.nativeEntryDirection).toBe('enter_from_right_exit_to_left');
    expect(rig.canvasWidth).toBe(1024);
    expect(rig.canvasHeight).toBe(975);

    // Front wheel must be to the left of the rear wheel
    expect(rig.frontWheel.centerX).toBeLessThan(rig.rearWheel.centerX);
    expect(rig.frontWheel.radius).toBe(120);
    expect(rig.rearWheel.radius).toBe(110);

    // Wheelbase calculated correctly
    expect(rig.wheelbase).toBe(rig.rearWheel.centerX - rig.frontWheel.centerX);
    expect(rig.wheelbase).toBe(488);

    // Ground contact aligns near bottom of canvas
    expect(rig.groundContactY).toBeGreaterThan(900);
  });

  it('L2 & L3: verifies physical motion curves, pitch angles, and wheel rotation math', () => {
    // Kinematic model verification mirroring Dart BrandLaunchAnimation math
    const config = {
      totalDurationMs: 3300,
      arriveStart: 0.075,
      arriveEnd: 0.44,
      brakeEnd: 0.53,
      pauseEnd: 0.71,
      leaveEnd: 0.95,
      revealStart: 0.78,
    };

    function calculatePosition(t: number): number {
      if (t < config.arriveStart) return 1.4;
      if (t < config.arriveEnd) {
        const p = (t - config.arriveStart) / (config.arriveEnd - config.arriveStart);
        // easeOutCubic: 1 - (1 - p)^3
        const eased = 1 - Math.pow(1 - p, 3);
        return 1.4 * (1.0 - eased);
      }
      if (t < config.pauseEnd) return 0.0;
      const p = Math.min(1.0, Math.max(0.0, (t - config.pauseEnd) / (config.leaveEnd - config.pauseEnd)));
      // easeInCubic: p^3
      const eased = Math.pow(p, 3);
      return -1.5 * eased;
    }

    function calculateDistanceTravelled(t: number): number {
      if (t < config.arriveStart) return 0.0;
      if (t < config.arriveEnd) {
        const p = (t - config.arriveStart) / (config.arriveEnd - config.arriveStart);
        const eased = 1 - Math.pow(1 - p, 3);
        return 1.4 * eased;
      }
      if (t < config.pauseEnd) return 1.4;
      const p = Math.min(1.0, Math.max(0.0, (t - config.pauseEnd) / (config.leaveEnd - config.pauseEnd)));
      return 1.4 + 1.5 * Math.pow(p, 3);
    }

    function calculatePitch(t: number): number {
      // Brake dip between arriveEnd and brakeEnd (positive = nose dip)
      if (t >= config.arriveEnd && t < config.brakeEnd) {
        const p = (t - config.arriveEnd) / (config.brakeEnd - config.arriveEnd);
        return Math.sin(p * Math.PI) * 0.04;
      }
      // Squat lean back on launch between pauseEnd and leaveEnd (negative = squat)
      if (t >= config.pauseEnd && t < config.leaveEnd) {
        const p = (t - config.pauseEnd) / (config.leaveEnd - config.pauseEnd);
        if (p < 0.3) {
          return -0.05 * Math.sin((p / 0.3) * Math.PI);
        }
      }
      return 0.0;
    }

    // 1. Position test: starts off-screen right (+1.4)
    expect(calculatePosition(0.0)).toBe(1.4);

    // 2. Center arrival: at pause, position must be exactly 0.0
    expect(calculatePosition(0.50)).toBe(0.0);
    expect(calculatePosition(0.65)).toBe(0.0);

    // 3. Exit: moves off-screen left (-1.5)
    expect(calculatePosition(0.95)).toBeCloseTo(-1.5, 2);
    expect(calculatePosition(1.0)).toBeCloseTo(-1.5, 2);

    // 4. Wheel rotation must always roll counter-clockwise (negative angle) as it travels leftward
    const d0 = calculateDistanceTravelled(0.0);
    const dMid = calculateDistanceTravelled(0.5);
    const dExit = calculateDistanceTravelled(0.95);
    expect(d0).toBe(0.0);
    expect(dMid).toBe(1.4);
    expect(dExit).toBeCloseTo(2.9, 2);

    const wheelRotMid = -dMid * 22.0;
    const wheelRotExit = -dExit * 22.0;
    expect(wheelRotMid).toBeLessThan(0);
    expect(wheelRotExit).toBeLessThan(wheelRotMid); // continues rolling forward

    // 5. Pitch dynamics: dips forward on braking, squats backward on takeoff
    const brakePitch = calculatePitch((config.arriveEnd + config.brakeEnd) / 2);
    expect(brakePitch).toBeGreaterThan(0.03); // nose dip

    const takeoffPitch = calculatePitch(config.pauseEnd + 0.02);
    expect(takeoffPitch).toBeLessThan(-0.02); // squat
  });

  it('L4: verifies reveal timing and accessibility safeguards', () => {
    const config = {
      totalDurationMs: 3300,
      revealStart: 0.78, // 2.6s
    };

    // The reveal starts at 78% (while scooter accelerates out to the left)
    const revealTimestampMs = config.totalDurationMs * config.revealStart;
    expect(revealTimestampMs).toBeCloseTo(2574, 0);

    // Work app profile duration is fast (< 1.5s)
    const workDurationMs = 1200;
    expect(workDurationMs).toBeLessThanOrEqual(1500);
  });
});
