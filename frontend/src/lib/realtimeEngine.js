import { supabase } from "./supabase";

import {
  cacheTableData,
  getCachedTable
} from "./globalDataLayer";



class RealtimeEngineClass {

  constructor() {

    this.channels = new Map();

    this.listeners = new Map();

    this.connected = false;

    this.reconnectInterval = null;

  }

  initialize() {

    if (this.connected)
      return;

    console.log("RealtimeEngine initializing...");

    this.connected = true;

    window.addEventListener(
      "online",
      this.handleReconnect.bind(this)
    );

  }

  subscribe(table) {

    if (this.channels.has(table))
      return;

    console.log(
      "Subscribing realtime:",
      table
    );

    const channel =
      supabase
        .channel(`realtime-${table}`)

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table
          },
          payload =>
            this.handleChange(
              table,
              payload
            )
        )

        .subscribe(status => {

          console.log(
            `Realtime ${table}:`,
            status
          );

        });

    this.channels.set(
      table,
      channel
    );

  }

  unsubscribe(table) {

    const channel =
      this.channels.get(table);

    if (!channel)
      return;

    supabase.removeChannel(channel);

    this.channels.delete(table);

  }

  handleChange(table, payload) {

    console.log(
      "Realtime change:",
      table,
      payload.eventType
    );

    const current =
      getCachedTable(table);

    let updated = [...current];

    switch (payload.eventType) {

      case "INSERT":

        updated.push(
          payload.new
        );

        break;

      case "UPDATE":

        updated =
          updated.map(item =>
            item.id === payload.new.id
              ? payload.new
              : item
          );

        break;

      case "DELETE":

        updated =
          updated.filter(item =>
            item.id !== payload.old.id
          );

        break;

      default:
        break;

    }

    cacheTableData(
      table,
      updated
    );

    this.notifyListeners(
      table,
      updated
    );

  }

  on(table, callback) {

    if (!this.listeners.has(table))
      this.listeners.set(
        table,
        new Set()
      );

    this.listeners
      .get(table)
      .add(callback);

  }

  off(table, callback) {

    if (!this.listeners.has(table))
      return;

    this.listeners
      .get(table)
      .delete(callback);

  }

  notifyListeners(
    table,
    data
  ) {

    const callbacks =
      this.listeners.get(table);

    if (!callbacks)
      return;

    callbacks.forEach(cb =>
      cb(data)
    );

  }

  handleReconnect() {

    console.log(
      "Realtime reconnecting..."
    );

    this.channels.forEach(
      (_, table) => {

        this.unsubscribe(table);

        this.subscribe(table);

      }
    );

  }

  subscribeMany(tables) {

    tables.forEach(
      table =>
        this.subscribe(table)
    );

  }

  shutdown() {

    this.channels.forEach(
      channel =>
        supabase.removeChannel(
          channel
        )
    );

    this.channels.clear();

    this.listeners.clear();

    this.connected = false;

  }

}

export const RealtimeEngine =
  new RealtimeEngineClass();
