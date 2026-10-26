import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var alertEventEmitter: EventEmitter | undefined;
}

export const alertEmitter = global.alertEventEmitter || new EventEmitter();
alertEmitter.setMaxListeners(200);

if (process.env.NODE_ENV !== "production") {
  global.alertEventEmitter = alertEmitter;
}
