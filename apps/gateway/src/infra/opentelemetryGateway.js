/**
 * OpenTelemetry — isteğe bağlı (`CASTLE_OTEL_ENABLED=1`). OTLP/HTTP trace export.
 * Kök örnekleme: `CASTLE_OTEL_TRACE_SAMPLE_RATE` (0–1), varsayılan 1 (davranış değişmez).
 */
import { diag, DiagConsoleLogger, DiagLogLevel, trace, SpanStatusCode } from "@opentelemetry/api";
import { normalizeRhizohDecisionActionMetricLabel } from "./rhizohEnterpriseMetrics.js";

let initialized = false;

function tracesEndpoint() {
  const explicit = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim();
  if (explicit) return explicit;
  const base = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  if (base) return `${base.replace(/\/$/, "")}/v1/traces`;
  return "http://127.0.0.1:4318/v1/traces";
}

export async function initCastleGatewayOpenTelemetry() {
  if (initialized || process.env.CASTLE_OTEL_ENABLED !== "1") return;

  try {
    const [{ NodeTracerProvider }, sdkTraceBase, { OTLPTraceExporter }, resourcesMod] =
      await Promise.all([
        import("@opentelemetry/sdk-trace-node"),
        import("@opentelemetry/sdk-trace-base"),
        import("@opentelemetry/exporter-trace-otlp-http"),
        import("@opentelemetry/resources")
      ]);
    const { BatchSpanProcessor, TraceIdRatioBasedSampler, ParentBasedSampler } = sdkTraceBase;
    const { Resource } = resourcesMod;

    const level =
      process.env.OTEL_LOG_LEVEL === "debug" ? DiagLogLevel.DEBUG : DiagLogLevel.ERROR;
    diag.setLogger(new DiagConsoleLogger(), level);

    const rawRate = Number(process.env.CASTLE_OTEL_TRACE_SAMPLE_RATE);
    const sampleRate = Number.isFinite(rawRate) ? Math.max(0, Math.min(1, rawRate)) : 1;
    const sampler = new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(sampleRate) });

    const exporter = new OTLPTraceExporter({ url: tracesEndpoint() });
    const provider = new NodeTracerProvider({
      sampler,
      resource: Resource.default().merge(
        new Resource({
          "service.name": process.env.OTEL_SERVICE_NAME || "castle-gateway",
          "service.version": process.env.CASTLE_GATEWAY_VERSION || "1.0.0",
          "deployment.environment":
            process.env.CASTLE_DEPLOY_ENV || process.env.NODE_ENV || "development"
        })
      )
    });
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));
    provider.register();
    initialized = true;
    console.info(
      "[GATEWAY] OpenTelemetry tracing enabled →",
      tracesEndpoint(),
      `(CASTLE_OTEL_TRACE_SAMPLE_RATE=${sampleRate})`
    );
  } catch (e) {
    console.warn("[GATEWAY] OpenTelemetry init failed:", String(e?.message || e));
  }
}

export function getCastleGatewayTracer() {
  return trace.getTracer("castle-gateway", process.env.CASTLE_GATEWAY_VERSION || "1.0.0");
}

/**
 * @param {string} traceId
 * @param {() => Promise<T>} run
 * @template T
 */
export async function runRhizohLlmTurnWithOtelSpan(traceId, run) {
  if (process.env.CASTLE_OTEL_ENABLED !== "1" || !initialized) {
    return run();
  }
  const tracer = getCastleGatewayTracer();
  return tracer.startActiveSpan(
    "rhizoh.llm.turn",
    {
      attributes: {
        "castle.rhizoh.trace_id": traceId,
        "castle.component": "rhizoh.llm"
      }
    },
    async (span) => {
      try {
        const out = await run();
        const rp = out?.result?.rhizohProduction;
        const dec = rp?.decision;
        if (dec?.action != null) {
          span.setAttribute(
            "rhizoh.constitutional.decision_action",
            normalizeRhizohDecisionActionMetricLabel(dec.action)
          );
        }
        if (rp?.shouldProceed === true || rp?.shouldProceed === false) {
          span.setAttribute("rhizoh.constitutional.should_proceed", rp.shouldProceed);
        }
        if (typeof out?.turnLatencyMs === "number") {
          span.setAttribute("castle.rhizoh.turn_latency_ms", out.turnLatencyMs);
        }
        const pipe = rp?.pipelineVersion;
        if (pipe != null) span.setAttribute("castle.rhizoh.pipeline_version", String(pipe));
        return out;
      } catch (err) {
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err?.message || err) });
        throw err;
      } finally {
        span.end();
      }
    }
  );
}
