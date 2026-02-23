import { SyncEngine } from "../lib/syncEngine";

class SyncWorker {

  constructor() {

    this.interval = null
    this.syncIntervalMs = 15000

  }

  start() {

    if (this.interval) return

    SyncEngine.initialize()

    this.interval = setInterval(async () => {

      if (navigator.onLine)
        await SyncEngine.syncAll()

    }, this.syncIntervalMs)

    console.log("Sync worker started")
  }

  stop() {

    if (this.interval)
      clearInterval(this.interval)

    this.interval = null
  }

}

export const syncWorker = new SyncWorker();
