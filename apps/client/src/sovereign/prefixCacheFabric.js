/**
 * GlobalPrefixCache — paylaşımlı KV örgüsü (şehir / robotik / acil / öğrenme / kişisel ajan).
 * Amaç: warm start, düşük gecikme, on-prem vLLM maliyet düşürme.
 */

export const PREFIX_NAMESPACE = {
  CITY: "city:",
  ROBOTICS: "robotics:",
  EMERGENCY: "emergency:",
  LEARNING: "learning:",
  PERSONAL: "personal:"
};

export class PrefixCacheFabric {
  constructor() {
    /** @type {Map<string, Map<string, unknown>>} */
    this.namespaces = new Map();
    for (const v of Object.values(PREFIX_NAMESPACE)) {
      this.namespaces.set(v, new Map());
    }
  }

  _ns(key) {
    for (const [prefix, map] of this.namespaces) {
      if (key.startsWith(prefix)) return map;
    }
    const d = this.namespaces.get(PREFIX_NAMESPACE.CITY);
    return d;
  }

  get(key) {
    return this._ns(key).get(key);
  }

  set(key, value) {
    this._ns(key).set(key, value);
  }

  getOrSet(key, factory) {
    const m = this._ns(key);
    if (m.has(key)) return m.get(key);
    const v = factory();
    m.set(key, v);
    return v;
  }
}
