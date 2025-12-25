export class Emitter {
  constructor() {
    this._events = new Map(); // event -> Set(handlers)
  }

  on(event, handler) {
    if (!this._events.has(event)) this._events.set(event, new Set());
    this._events.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const set = this._events.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this._events.delete(event);
  }

  emit(event, payload) {
    const set = this._events.get(event);
    if (!set) return;
    for (const handler of set) handler(payload);
  }

  clear() {
    this._events.clear();
  }
}
