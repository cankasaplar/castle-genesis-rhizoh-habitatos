export class DirectQueueAdapter {
  async enqueue(event) {
    void event;
    return Promise.resolve();
  }

  async depth() {
    return 0;
  }
}
