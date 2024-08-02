export const linspace = (start: number, end: number, num: number) => {
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
