export const FLAGS = {
  USE_QUEUE: String(process.env.USE_QUEUE || "").toLowerCase() === "true",
  USE_DUAL_RUN: String(process.env.USE_DUAL_RUN || "").toLowerCase() === "true"
};
