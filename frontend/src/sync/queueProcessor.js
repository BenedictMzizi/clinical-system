import { syncEngine } from "./syncEngine"

export class QueueProcessor {

  constructor() {

    this.processing = false
  }


  async process() {

    if (this.processing) return

    this.processing = true

    try {

      const queue = await syncEngine.getQueue()

      for (const item of queue)
        await syncEngine.processQueueItem(item)

    }
    finally {

      this.processing = false
    }
  }

}

export const queueProcessor = new QueueProcessor()
