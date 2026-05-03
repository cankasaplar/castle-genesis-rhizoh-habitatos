export function createRhizohFounderConsoleStore(substrate) {
  return Object.freeze({
    getOverview() {
      return substrate.getSnapshot();
    },
    approve(taskId, reason = "founder_approved") {
      return substrate.approveTask(taskId, true, reason);
    },
    reject(taskId, reason = "founder_rejected") {
      return substrate.approveTask(taskId, false, reason);
    },
    emergencyStop(reason = "founder_emergency_stop") {
      return substrate.emitKillSignal("L3", reason);
    },
    resumeFromEmergency() {
      return substrate.resetKillSignal({
        approvedByHuman: true,
        reason: "founder_manual_reset_after_review"
      });
    }
  });
}

