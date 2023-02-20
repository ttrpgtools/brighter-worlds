import { UINT32_SIZE } from "./constants";
import type { Distribution, Engine } from "./types";

/**
 * Returns a Distribution to return a value within [min, max]
 * @param min The minimum integer value, inclusive. No less than -0x20000000000000.
 * @param max The maximum integer value, inclusive. No greater than 0x20000000000000.
 */
export function integer(min: number, max: number): Distribution {
  min = Math.floor(min);
  max = Math.floor(max);

  const range = max - min;
  return add(downscaleToRange(range), min);
}

/**
 * Returns a Distribution to return a value within [1, sideCount]
 * @param sideCount The number of sides of the die
 */
export function die(sideCount: number): Distribution<number> {
  return integer(1, sideCount);
}

export function add(distribution: Distribution, addend: number): Distribution {
  if (addend === 0) {
    return distribution;
  } else {
    return engine => distribution(engine) + addend;
  }
}

function downscaleToRange(range: number): Distribution {
  if (isPowerOfTwoMinusOne(range)) {
    return bitmask(range);
  } else {
    return downscaleToLoopCheckedRange(range);
  }
}

function isPowerOfTwoMinusOne(value: number): boolean {
  return ((value + 1) & value) === 0;
}

function bitmask(masking: number): Distribution {
  return (engine: Engine) => engine.next() & masking;
}

function downscaleToLoopCheckedRange(range: number): Distribution {
  const extendedRange = range + 1;
  const maximum = extendedRange * Math.floor(UINT32_SIZE / extendedRange);
  return engine => {
    let value = 0;
    do {
      value = engine.next() >>> 0;
    } while (value >= maximum);
    return value % extendedRange;
  };
}