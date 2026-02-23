import { supabase } from "./supabase";
import { getWriteQueue, setWriteQueue } from "./globalDataLayer";
import { v4 as uuidv4 } from "uuid";




function getStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem("profile")) || null;
  } catch {
    return null;
  }
}

export const SyncEngine = {

  initialized: false,
  syncInProgress: false,

  initialize() {
    if (this.initialized) return;

    this.initialized = true;

    console.log("SyncEngine initialized");

    window.addEventListener("online", () => {
      console.log("Connection restored → syncing");
      this.syncAll();
    });

    setInterval(() => {
      this.syncAll();
    }, 30000);
  },

  async syncAll() {

    if (this.syncInProgress) return;

    if (!navigator.onLine) {
      console.log("Offline — sync skipped");
      return;
    }

    this.syncInProgress = true;

    try {

      const queue = getWriteQueue();

      if (!queue.length) {
        this.syncInProgress = false;
        return;
      }

      console.log("Syncing queue:", queue.length);

      const remaining = [];
      const profile = getStoredProfile();

      for (const op of queue) {

        try {

          if (
            op.type === "insert" &&
            profile?.practice_id &&
            !op.data?.practice_id
          ) {
            op.data.practice_id = profile.practice_id;
          }

          if (op.type === "insert") {

            const { error } =
              await supabase
                .from(op.table)
                .insert(op.data);

            if (error) throw error;
          }

          else if (op.type === "update") {

            let query =
              supabase
                .from(op.table)
                .update(op.data);

            Object.entries(op.match || {})
              .forEach(([k, v]) =>
                query = query.eq(k, v)
              );

            const { error } = await query;

            if (error) throw error;
          }

          else if (op.type === "delete") {

            let query =
              supabase
                .from(op.table)
                .delete();

            Object.entries(op.match || {})
              .forEach(([k, v]) =>
                query = query.eq(k, v)
              );

            const { error } = await query;

            if (error) throw error;
          }

          else if (op.type === "rpc") {

            const { error } =
              await supabase.rpc(
                op.functionName,
                op.params
              );

            if (error) throw error;
          }

        }
        catch (err) {

          console.error("Sync failed:", err);

          remaining.push(op);
        }
      }

      setWriteQueue(remaining);

      console.log("Sync complete. Remaining:", remaining.length);

    }
    finally {
      this.syncInProgress = false;
    }
  },

  queue(table, data, type = "insert", match = {}) {

    const profile = getStoredProfile();


    if (profile?.practice_id && !data.practice_id) {
      data.practice_id = profile.practice_id;
    }

    const op = {
      id: uuidv4(),
      type,
      table,
      data,
      match,
      created_at: new Date().toISOString(),
      status: "pending",
    };

    const queue = getWriteQueue();
    queue.push(op);
    setWriteQueue(queue);

    this.syncAll();
  }

};
