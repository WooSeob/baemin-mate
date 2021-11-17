import { Valuable } from "../interface/valuable";

// .value() 를 통해 받은 값을 우선순위로 하는 큐
export default class PriorityQueue<T extends Valuable> {
  private readonly queue: T[];
  constructor() {
    this.queue = [];
  }
  public getAll(): T[] {
    return this.queue;
  }
  public isEmpty(): boolean {
    return this.queue.length == 0;
  }

  public enqueue(item: T) {
    this.queue.push(item);
  }

  public dequeue(): T {
    if (this.queue.length == 0) {
      throw new Error("queue is empty");
    }

    let ret: T;
    let largest: number = 0;
    let largestIdx: number = 0;

    for (let i = 0; i < this.queue.length; i++) {
      let item = this.queue[i];
      if (item.value() > largest) {
        largest = item.value();
        largestIdx = i;
      }
    }

    ret = this.queue[largestIdx];
    this.queue.splice(largestIdx, 1);

    return ret;
  }
}
