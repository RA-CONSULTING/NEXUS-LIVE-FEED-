import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui";
import AureonCore, {
  compileIntuition, runAureon, asCSV, flattenResults, EquationResult
} from "@/lib/aureon/aureon-core";

function download(name: string, data: string, type = "text/plain") {
  const blob = new Blob([data], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

export const AureonEquationStudio: React.FC = () => {
  const [text, setText] = React.useState<string>(
`Coherence phasor for planetary songbook; unison threads via Kuramoto; glyph spiral check; echo recognition.`
  );
  const [compiled, setCompiled] = React.useState<{ equations: string[]; notes?: string }|null>(null);
  const [results, setResults] = React.useState<EquationResult[]>([]);
  const [status, setStatus] = React.useState<"IDLE"|"COMPILED"|"RUN"|"ERROR">("IDLE");
  const [err, setErr] = React.useState<string>("");

  const onCompile = () => {
    try {
      const intent = compileIntuition(text);
      setCompiled({ equations: intent.equations, notes: intent.notes });
      setStatus("COMPILED");
      setErr("");
    } catch (e:any) {
      setErr(String(e?.message||e)); setStatus("ERROR");
    }
  };

  const onRun = () => {
    try {
      const intent = compileIntuition(text);
      const out = runAureon({ intent, data: {} });
      if (!out.ok) { setErr(out.errors?.join("; ") || "Unknown"); setStatus("ERROR"); }
      else { setResults(out.results); setStatus("RUN"); setErr(""); }
    } catch (e:any) {
      setErr(String(e?.message||e)); setStatus("ERROR");
    }
  };

  const onExportCSV = () => {
    const csv = asCSV(flattenResults(results));
    download("aureon_results.csv", csv, "text/csv");
  };
  const onExportJSON = () => {
    download("aureon_results.json", JSON.stringify(results, null, 2), "application/json");
  };
  const onCopyTeX = () => {
    const tex = results.flatMap(r => r.tex).join("\n\n");
    navigator.clipboard.writeText(tex);
  };

  const badge = (s: typeof status) =>
    s==="RUN" ? "success" : s==="COMPILED" ? "info" : s==="ERROR" ? "destructive" : "secondary";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Intuition → Compile/Run */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Math & Meaning — Aureon Equation Studio</CardTitle>
          <Badge variant={badge(status)}>{status}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs opacity-70">Describe the intent (keywords route to equations): coherence/phasor, kuramoto/unison, spiral/glyph, echo/crosscorr.</div>
          <textarea
            className="w-full h-28 bg-transparent border border-white/15 rounded-lg p-2 text-sm"
            value={text}
            onChange={(e)=>setText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={onCompile}>Compile</Button>
            <Button variant="ghost" onClick={onRun}>Run</Button>
            <Button variant="ghost" onClick={onExportCSV} disabled={!results.length}>Export CSV</Button>
            <Button variant="ghost" onClick={onExportJSON} disabled={!results.length}>Export JSON</Button>
            <Button variant="ghost" onClick={onCopyTeX} disabled={!results.length}>Copy TeX</Button>
          </div>
          {compiled && (
            <div className="text-xs">
              <div className="opacity-70">Selected Equations:</div>
              <div>{compiled.equations.join(", ")}</div>
            </div>
          )}
          {!!err && <div className="text-xs text-rose-400">{err}</div>}
        </CardContent>
      </Card>

      {/* Right: Results */}
      <Card>
        <CardHeader>
          <CardTitle>Results & Interpretations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.length===0 && <div className="text-xs opacity-60">Run to see computed values.</div>}
          {results.map((r, idx) => (
            <div key={idx} className="rounded-lg border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{r.id}</div>
                <Badge variant="secondary">values</Badge>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-0.5">
                  {Object.entries(r.values).map(([k,v])=>(
                    <div key={k}><span className="opacity-60">{k}:</span> {Number.isFinite(v)? (+v).toFixed(6): String(v)} {r.units[k] ?? ""}</div>
                  ))}
                </div>
                <div className="space-y-0.5">
                  <div className="opacity-60">Meaning:</div>
                  <ul className="list-disc list-inside">
                    {r.meaning.map((m,i)=>(<li key={i}>{m}</li>))}
                  </ul>
                </div>
              </div>
              <details className="mt-2">
                <summary className="text-xs opacity-70 cursor-pointer">TeX</summary>
                <pre className="text-[11px] whitespace-pre-wrap leading-tight mt-1">{r.tex.join("\n")}</pre>
              </details>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AureonEquationStudio;
