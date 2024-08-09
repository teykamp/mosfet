export const toDegrees = (theta: number): number => {
  return theta * 180 / Math.PI
}

export const toRadians = (theta: number): number => {
  return theta * Math.PI / 180
}

export const linspace = (start: number, end: number, num: number): number[] => {
  if (num <= 0) {
    throw new Error("num must be a positive integer");
  }
  if (num === 1) {
    return [start];
  }

  const step = (end - start) / (num - 1);
  const result: number[] = [];

  for (let i = 0; i < num; i++) {
    result.push(start + step * i);
  }

  return result;
}

export const modulo = (a: number, b: number)  => {
  return ((a % b) + b) % b
}

export const between = (a: number, b: number, x: number): number => {
  const maxValue = Math.max(a, b)
  const minValue = Math.min(a, b)
  if (x > maxValue) {
    return maxValue
  }
  if (x < minValue) {
    return minValue
  }
  return x
}
