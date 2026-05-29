import {
  enqueueWorldObservationIngressV0,
  startWorldObservationIngressQueueV0,
  stopWorldObservationIngressQueueV0
} from "./worldObservationIngressQueueV0.js";
import { setWorldObservationIngressSinkV0 } from "./worldObservationBusV0.js";

/**
 * Wire observation bus → durable ingress queue (retry + backpressure).
 * @returns {() => void} stop
 */
export function startWorldObservationIngressWireV0() {
  const stopQueue = startWorldObservationIngressQueueV0();
  const stopSink = setWorldObservationIngressSinkV0((row) => {
    enqueueWorldObservationIngressV0(row);
  });
  return () => {
    stopSink();
    stopQueue();
    stopWorldObservationIngressQueueV0();
  };
}
