"use strict";

window.WeddingProgress = class WeddingProgress {
  static cloudPrefix = "wedding_progress_v1_";

  constructor({readLocal,writeLocal,recordUnit,onChange}) {
    this.readLocal = readLocal;
    this.writeLocal = writeLocal;
    this.recordUnit = recordUnit;
    this.onChange = onChange;
    this.best = 0;
    this.opened = new Set();
    this.merge(this.localSnapshot());
    this.synchronize = this.synchronize.bind(this);
    window.addEventListener("storage",event => {
      if (event.key==="wedding-run-best" || event.key==="wedding-run-paintings") {
        this.update(this.localSnapshot());
      }
    });
  }

  localSnapshot() {
    const best = this.readLocal("best",0);
    return {
      best:typeof best==="number" ? Math.round(best*this.recordUnit) : 0,
      paintings:this.readLocal("paintings",[])
    };
  }

  merge(snapshot) {
    let changed = false;
    if (Number.isSafeInteger(snapshot?.best) && snapshot.best>this.best) {
      this.best = snapshot.best;
      changed = true;
    }
    if (Array.isArray(snapshot?.paintings)) {
      for (const id of snapshot.paintings) {
        if (WeddingGallery.paintings.has(id) && !this.opened.has(id)) {
          this.opened.add(id);
          changed = true;
        }
      }
    }
    return changed;
  }

  save() {
    // Keep the legacy record in units of a banknote for existing installations.
    this.writeLocal("best",this.best/this.recordUnit);
    this.writeLocal("paintings",[...this.opened]);
    this.onChange();
  }

  update(snapshot) {
    const changedHere = this.merge(snapshot);
    const changedFromStorage = this.merge(this.localSnapshot());
    if (!changedHere && !changedFromStorage) return false;
    this.save();
    this.synchronize();
    return changedHere;
  }

  connect(telegram) {
    if (this.cloud || !telegram?.CloudStorage || !telegram.isVersionAtLeast?.("6.9")) return;
    // The SDK also loads in a regular browser, where the platform is "unknown".
    if (!telegram.initData && (!telegram.platform || telegram.platform==="unknown")) return;
    this.cloud = telegram.CloudStorage;
    this.device = this.readLocal("progress-device","");
    if (!/^[a-f0-9]{32}$/.test(this.device)) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      this.device = Array.from(bytes,byte=>byte.toString(16).padStart(2,"0")).join("");
      this.writeLocal("progress-device",this.device);
    }
    this.synchronize();
    window.addEventListener("online",this.synchronize);
    window.addEventListener("focus",this.synchronize);
    document.addEventListener("visibilitychange",() => {
      if (!document.hidden) this.synchronize();
    });
    setInterval(() => {
      if (!document.hidden) this.synchronize();
    },20000);
  }

  call(method,...args) {
    return new Promise((resolve,reject) => {
      const timeout = setTimeout(() => reject(new Error("Telegram CloudStorage timeout")),3500);
      try {
        this.cloud[method](...args,(error,result) => {
          clearTimeout(timeout);
          if (error) reject(error);
          else resolve(result);
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  async sync() {
    const prefix = WeddingProgress.cloudPrefix;
    const keys = (await this.call("getKeys")).filter(key=>key.startsWith(prefix));
    const values = keys.length ? await this.call("getItems",keys) : {};
    const remote = {best:0,paintings:new Set()};
    for (const value of Object.values(values)) {
      let snapshot;
      try { snapshot = JSON.parse(value); } catch { continue; }
      if (Number.isSafeInteger(snapshot?.best)) remote.best = Math.max(remote.best,snapshot.best);
      if (!Array.isArray(snapshot?.paintings)) continue;
      for (const id of snapshot.paintings) {
        if (WeddingGallery.paintings.has(id)) remote.paintings.add(id);
      }
    }
    const changedFromCloud = this.merge({best:remote.best,paintings:[...remote.paintings]});
    const changedFromStorage = this.merge(this.localSnapshot());
    if (changedFromCloud || changedFromStorage) this.save();
    if (this.best<=remote.best && this.opened.size===remote.paintings.size) return;

    // Different installations use separate keys, so simultaneous writes are merged on the next read.
    const snapshot = JSON.stringify({best:this.best,paintings:[...this.opened]});
    if (await this.call("setItem",prefix+this.device,snapshot)!==true) throw new Error("CloudStorage rejected progress");
  }

  synchronize() {
    if (!this.cloud) return Promise.resolve();
    if (this.syncing) {
      this.syncAgain = true;
      return this.syncing;
    }
    const run = () => this.sync();
    const task = navigator.locks ? navigator.locks.request(WeddingProgress.cloudPrefix+this.device,run) : run();
    this.syncing = task.catch(() => {
      // Local progress survives connection errors and will be retried on focus or the next sync.
    }).finally(() => {
      this.syncing = null;
      if (!this.syncAgain) return;
      this.syncAgain = false;
      this.synchronize();
    });
    return this.syncing;
  }

  async developerReward() {
    if (this.cloud) {
      let timeout;
      await Promise.race([this.synchronize(),new Promise(resolve => { timeout = setTimeout(resolve,1400); })]);
      clearTimeout(timeout);
    }
    const award = () => {
      this.merge(this.localSnapshot());
      const available = WeddingGallery.developers.filter(id=>!this.opened.has(id));
      if (!available.length) return null;
      const id = WeddingGallery.pick(available);
      this.update({paintings:[id]});
      return id;
    };
    return navigator.locks ? navigator.locks.request("wedding_developer_reward",award) : award();
  }
};
