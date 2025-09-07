import React from "react";
import { Badge, Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import Sero, { evaluateRequest, actuate, listAudit, ActuationRequest, Subsystem } from "@/lib/sero/sero-core";

type Row = { code: string; pass: boolean; message: string };

export const SeroComplianceConsole: React.FC = () => {
  const [subsystem, setSubsystem] = React.useState<Subsystem>("SourceConduit");
  const [intent, setIntent] = React.useState("Stabilize regional storm cell via coherent transmission.");
  const [params, setParams] = React.useState<Record<string, any>>({
    tx_freq_Hz: 432.0, tx_phase_rad: 0.0, target_system: "StormCell:IE-North"
  });
  const [provenance, setProvenance] = React.useState({
    sources: [{ id: "NOAA_SWPC:KP", url: "https://www.swpc.noaa.gov" }],
    public_export: true
  });
  const [consent, setConsent] = React.useState({
    prime_sentinel: { id: "PS-02111991", name: "Gary Leckey", signed: false },
    system_steward: { id: "SYS-0001", name: "Aureon", signed: false }
  });

  const [verdicts, setVerdicts] = React.useState<Row[]>([]);
  const [score, setScore] = React.useState(0);
  const [decision, setDecision] = React.useState<string | null>(null);
  const [audits, setAudits] = React.useState(listAudit(10));

  const operator = { id: "PS-02111991", name: "Gary Leckey" };

  const simulate = () => {
    const req: ActuationRequest = { subsystem, intent, params, operator, provenance, consent };
    const e = evaluateRequest(req);
    setVerdicts(e.verdicts.map(v => ({ code: v.code, pass: v.pass, message: v.message })));
    setScore(e.score);
    setDecision(e.ok ? "PASS (would ALLOW if not in simulation mode and with dual consent)" : "FAIL");
  };

  const signPrime = () => setConsent(s => ({ ...s, prime_sentinel: { ...s.prime_sentinel, signed: true } }));
  const signSteward = () => setConsent(s => ({ ...s, system_steward: { ...s.system_steward, signed: true } }));

  const execute = () => {
    const req: ActuationRequest = { subsystem, intent, params, operator, provenance, consent };
    const rec = actuate(req);
    setAudits(listAudit(10));
    setDecision(`${rec.decision}: ${rec.reason}`);
  };

  const variant = (p: boolean) => p ? "success" : "destructive";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Request builder */}
      <Card>
        <CardHeader>
          <CardTitle>Sero Compliance Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <label className="col-span-1 opacity-70">Subsystem</label>
            <select
              value={subsystem}
              onChange={e => setSubsystem(e.target.value as Subsystem)}
              className="col-span-1 bg-transparent border border-white/15 rounded-lg px-2 py-1"
            >
              <option value="SourceConduit">Source Conduit</option>
              <option value="MatterWeaver">Matter Weaver</option>
              <option value="ContinuumDrive">Continuum Drive</option>
            </select>

            <label className="col-span-1 opacity-70">Intent</label>
            <input
              value={intent}
              onChange={e => setIntent(e.target.value)}
              className="col-span-1 bg-transparent border border-white/15 rounded-lg px-2 py-1"
            />
          </div>

          {/* Params editor (quick JSON textarea) */}
          <div>
            <div className="opacity-70 mb-1">Parameters (JSON)</div>
            <textarea
              className="w-full h-28 bg-transparent border border-white/15 rounded-lg p-2 font-mono text-xs"
              value={JSON.stringify(params, null, 2)}
              onChange={e => {
                try { setParams(JSON.parse(e.target.value)); } catch {}
              }}
            />
          </div>

          {/* Provenance */}
          <div>
            <div className="opacity-70 mb-1">Provenance</div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={provenance.public_export ? "success" : "warning"}>
                {provenance.public_export ? "Public" : "Private"}
              </Badge>
              <span>{provenance.sources.length} source(s)</span>
            </div>
          </div>

          {/* Consent */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={signPrime}>
              Prime Sentinel Sign {consent.prime_sentinel?.signed ? "✓" : ""}
            </Button>
            <Button variant="ghost" onClick={signSteward}>
              System Steward Sign {consent.system_steward?.signed ? "✓" : ""}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={simulate}>Simulate</Button>
            <Button variant="danger" onClick={execute}>Execute (audit only)</Button>
            <Badge variant="info">Sero Mode: {Sero.SeroConfig.allowSimulationOnly ? "SIMULATION" : "LIVE"}</Badge>
          </div>

          {/* Score */}
          <div className="text-xs">
            Composite Score: <span className="font-semibold">{Math.round(score * 100)}%</span>
            {" "} | Decision: <span className="font-semibold">{decision ?? "—"}</span>
          </div>

          {/* Verdicts */}
          <div className="space-y-1">
            {verdicts.map(v => (
              <div key={v.code} className="flex items-center gap-2 text-xs">
                <Badge variant={variant(v.pass)}>{v.pass ? "PASS" : "FAIL"}</Badge>
                <span className="opacity-70">{v.code}</span>
                <span>— {v.message}</span>
              </div>
            ))}
            {!verdicts.length && <div className="text-xs opacity-60">Run “Simulate” to see gate checks.</div>}
          </div>
        </CardContent>
      </Card>

      {/* Right: Recent audits */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Trail</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          {audits.length === 0 && <div className="opacity-60">No audits yet.</div>}
          {audits.map(a => (
            <div key={a.audit_id} className="rounded-lg border border-white/10 p-2">
              <div className="flex items-center justify-between">
                <div className="font-mono">{a.audit_id}</div>
                <Badge variant={a.decision === "ALLOW" ? "success" : "warning"}>{a.decision}</Badge>
              </div>
              <div className="opacity-70">{a.ts}</div>
              <div className="mt-1">
                <div><span className="opacity-60">Subsystem:</span> {a.request.subsystem}</div>
                <div><span className="opacity-60">Intent:</span> {a.request.intent}</div>
                <div><span className="opacity-60">Reason:</span> {a.reason}</div>
                <div><span className="opacity-60">Score:</span> {Math.round(a.evaluation.score * 100)}%</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeroComplianceConsole;
