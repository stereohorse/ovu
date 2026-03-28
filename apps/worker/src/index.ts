const startedAt = new Date().toISOString();

console.log(`[ovu-worker] Stub worker ready at ${startedAt}`);
console.log(
  "[ovu-worker] Scheduling and agent orchestration will land in later MVP slices.",
);

process.on("SIGINT", () => {
  console.log("[ovu-worker] Stopping worker stub.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[ovu-worker] Stopping worker stub.");
  process.exit(0);
});
