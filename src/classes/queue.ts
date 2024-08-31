// from https://www.basedash.com/blog/how-to-implement-a-queue-in-typescript
export class Queue<T> {
    public items: T[] = [];

    enqueue(item: T): void {
        this.items.push(item);
    }

    dequeue(): T | undefined {
        return this.items.shift();
    }

    peek(): T | undefined {
        return this.items[0];
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    size(): number {
        return this.items.length;
    }

    toArray(): T[] {
      return this.items
    }

    fill(item: T, size: number) {
      this.items = Array(size).fill(item)
    }
  }
