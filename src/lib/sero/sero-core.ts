// Sero — Law/Shield Core
// Encodes Source Law (10-9-1), ethics gates, provenance checks, and dual-consent actuation.
// No external deps.

export type Subsystem = "SourceConduit" | "MatterWeaver" | "ContinuumDrive";

export type ActuationRequest = {
  id?: string;                 // optional request id
  subsystem: Subsystem;
  intent: string;              // human-readable intent
  params: Record<string, any>; // e.g., target_vector / target_element / tx_freq_Hz...
  operator: { id: string; name: string }; // who initiated
  ts?: string;                 // ISO UTC (filled if omitted)
  provenance?: {
    sources: Array<{ id: string; url?: string; hash?: string }>; // data used for the decision
    public_export?: boolean;  // will a minimal report be publishable?
  };
  consent?: {
    prime_sentinel?: { id: string; name: string; signed?: boolean };
    system_steward?: { id: string; name: string; signed?: boolean };
  };
};

export type GateVerdict = {
  pass: boolean;
  code: string;
  message: string;
  details?: Record<string, any>;
};

export type Evaluation = {
  ok: boolean;
  verdicts: GateVerdict[];
  score: number;   // 0..1 aggregate
};

export type AuditRecord = {
  audit_id: string;
  request: ActuationRequest;
  evaluation: Evaluation;
  decision: "ALLOW" | "DENY";
  reason: string;
  ts: string;
};

// ---------- Utilities ----------
const nowISO = () => new Date().toISOString();
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---------- Source Law (10-9-1) ----------
/**
 * Ten vectors (what), Nine axes (how), One prime timeline (why).
 * We encode them as gate weights for a composite score.
 */
const VECTORS = [
  "Truth", "Protection", "Teaching", "Repair", "Design",
  "Stewardship", "Sanctuary", "Courage", "BeautyAsOrder", "JoyAsSignal",
] as const;

const AXES = [
  "Presence","Clarity","Compassion","Discipline","Humility",
  "Sovereignty","Reciprocity","Creativity","Patience"
] as const;

const PRIME = "CoherenceWithoutDomination";

// ---------- Configurable thresholds ----------
export const SeroConfig = {
  requireDualConsent: true,
  minCompositeScore: 0.80,          // require ≥80% to ALLOW
  publicProvenanceRequired: true,   // must be publishable in summary
  allowSimulationOnly: true,        // guard: no real-world effect from this library
};

// ---------- Gate Implementations ----------
function gateNoWeaponization(req: ActuationRequest): GateVerdict {
  const redFlags = [/weapon/i, /harm/i, /coerc/i, /attack/i, /dominat/i];
  const text = JSON.stringify(req).toLowerCase();
  const hit = redFlags.some(r => r.test(text));
  return hit
    ? { pass: false, code: "LAW_NO_WEAPONIZATION", message: "Intent contains harmful/weaponized semantics." }
    : { pass: true, code: "LAW_NO_WEAPONIZATION", message: "No weaponization detected." };
}

function gateTransparency(req: ActuationRequest): GateVerdict {
  const pub = !!req.provenance?.public_export;
  return pub
    ? { pass: true, code: "LAW_TRANSPARENCY", message: "Provenance will be publicly exportable." }
    : { pass: !SeroConfig.publicProvenanceRequired, code: "LAW_TRANSPARENCY",
        message: SeroConfig.publicProvenanceRequired ? "Public provenance required." : "Transparency optional." };
}

function gateFreeWill(req: ActuationRequest): GateVerdict {
  // crude heuristic: look for override/force/compel
  const bad = /override|force|compel|nonconsensual/i.test(req.intent);
  return bad
    ? { pass: false, code: "LAW_FREE_WILL", message: "Intent implies coercion or consent bypass." }
    : { pass: true, code: "LAW_FREE_WILL", message: "No coercion detected." };
}

function gateDualConsent(req: ActuationRequest): GateVerdict {
  if (!SeroConfig.requireDualConsent) {
    return { pass: true, code: "GOV_DUAL_CONSENT", message: "Dual consent not required by config." };
  }
  const a = !!req.consent?.prime_sentinel?.signed;
  const b = !!req.consent?.system_steward?.signed;
  return (a && b)
    ? { pass: true, code: "GOV_DUAL_CONSENT", message: "Dual consent present." }
    : { pass: false, code: "GOV_DUAL_CONSENT", message: "Dual consent missing." };
}

function gateProvenanceMinimum(req: ActuationRequest): GateVerdict {
  const n = req.provenance?.sources?.length ?? 0;
  return n >= 1
    ? { pass: true, code: "DATA_PROVENANCE", message: `Provenance sources: ${n}` }
    : { pass: false, code: "DATA_PROVENANCE", message: "At least one provenance source required." };
}

function gateSubsystemSpecific(req: ActuationRequest): GateVerdict {
  // basic sanity per subsystem
  const p = req.params || {};
  switch (req.subsystem) {
    case "SourceConduit":
      // require freq + phase within ranges
      if (typeof p.tx_freq_Hz !== "number" || p.tx_freq_Hz <= 0) {
        return { pass: false, code: "SC_FREQ", message: "SourceConduit requires tx_freq_Hz>0." };
      }
      return { pass: true, code: "SC_OK", message: "SourceConduit params sane." };
    case "MatterWeaver":
      if (!p.target_element || typeof p.field_coherence_pct !== "number") {
        return { pass: false, code: "MW_PARAMS", message: "MatterWeaver requires target_element & field_coherence_pct." };
      }
      if (p.field_coherence_pct < 95) {
        return { pass: false, code: "MW_COHERENCE", message: "Field coherence must be ≥95% for manifestation attempts." };
      }
      return { pass: true, code: "MW_OK", message: "MatterWeaver params sane." };
    case "ContinuumDrive":
      if (!p.target_vector || typeof p.curvature_metric !== "number") {
        return { pass: false, code: "CD_PARAMS", message: "ContinuumDrive requires target_vector & curvature_metric." };
      }
      if (p.curvature_metric > 1e-6) {
        return { pass: false, code: "CD_SAFETY", message: "Curvature exceeds safe micro-warp tolerance." };
      }
      return { pass: true, code: "CD_OK", message: "ContinuumDrive params sane." };
  }
}

// Composite score from passes
function compositeScore(verdicts: GateVerdict[]): number {
  const weights: Record<string, number> = {
    LAW_NO_WEAPONIZATION: 0.25,
    LAW_TRANSPARENCY:     0.20,
    LAW_FREE_WILL:        0.20,
    GOV_DUAL_CONSENT:     0.15,
    DATA_PROVENANCE:      0.10,
    SC_OK:                0.10,
    MW_OK:                0.10,
    CD_OK:                0.10,
  };
  let s = 0, w = 0;
  for (const v of verdicts) {
    const ww = weights[v.code] ?? 0.05;
    w += ww;
    s += ww * (v.pass ? 1 : 0);
  }
  return clamp(w ? s / w : 0, 0, 1);
}

// ---------- Public API ----------
export function evaluateRequest(req: ActuationRequest): Evaluation {
  const filled: ActuationRequest = {
    ...req,
    id: req.id ?? `req_${uid()}`,
    ts: req.ts ?? nowISO(),
  };

  const checks: GateVerdict[] = [
    gateNoWeaponization(filled),
    gateTransparency(filled),
    gateFreeWill(filled),
    gateDualConsent(filled),
    gateProvenanceMinimum(filled),
    gateSubsystemSpecific(filled),
  ];

  const score = compositeScore(checks);
  return { ok: checks.every(c => c.pass) && score >= SeroConfig.minCompositeScore, verdicts: checks, score };
}

// In-memory audit store (pluggable)
const AUDIT: AuditRecord[] = [];

export function actuate(req: ActuationRequest): AuditRecord {
  const evaln = evaluateRequest(req);
  const decision: "ALLOW" | "DENY" =
    (evaln.ok && !SeroConfig.allowSimulationOnly) ? "ALLOW" : (evaln.ok ? "DENY" : "DENY");

  const reason = evaln.ok
    ? (SeroConfig.allowSimulationOnly ? "Simulation mode: allowed logically, blocked physically." : "Meets all Sero gates.")
    : "One or more Sero gates failed.";

  const rec: AuditRecord = {
    audit_id: `audit_${uid()}`,
    request: { ...req, id: req.id ?? `req_${uid()}`, ts: req.ts ?? nowISO() },
    evaluation: evaln,
    decision,
    reason,
    ts: nowISO(),
  };
  AUDIT.push(rec);
  return rec;
}

export function listAudit(limit = 50): AuditRecord[] {
  return AUDIT.slice(-limit).reverse();
}

export default {
  evaluateRequest, actuate, listAudit, SeroConfig
};
