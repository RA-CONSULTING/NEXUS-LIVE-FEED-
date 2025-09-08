import React from "react";
import { useSero } from "../contexts/SeroProvider";

// Tiny UI primitives (re-used for brevity)
const Card: React.FC<{title?:string, children:React.ReactNode}> = ({title, children}) => (
  <div style={{border:"1px solid #333", borderRadius:12, padding:16, background:"rgba(10,12,20,.6)", backdropFilter:"blur(6px)"}}>
    {title && <div style={{fontWeight:700, marginBottom:8}}>{title}</div>}
    {children}
  </div>
);
const Row: React.FC<{children:React.ReactNode}> = ({children}) => <div style={{display:"flex", gap:12, alignItems:"center"}}>{children}</div>;
const Badge: React.FC<{ok?:boolean, text:string}> = ({ok, text}) => (
  <span style={{
    padding:"2px 8px", borderRadius:999,
    background: ok===undefined ? "#223" : ok ? "rgba(0,200,120,.15)" : "rgba(255,90,90,.15)",
    border: `1px solid ${ok===undefined ? "#334" : ok ? "#0c8" : "#f55"}`,
    fontSize:12
  }}>{text}</span>
);

export default function SeroComplianceConsole() {
  const { config, updateConfig, audit } = useSero();

  return (
    <div style={{display:"grid", gap:16}}>
      <Card title="SERO Law & Shield Configuration">
        <Row>
          <Badge text={`Min Score: ${config.minCompositeScore*100}%`} />
          <Badge text={`Sim-Only: ${config.allowSimulationOnly}`} />
          <Badge text={`Dual Consent: ${config.requireDualConsent}`} />
          <Badge text={`Public Provenance: ${config.publicProvenanceRequired}`} />
        </Row>
        <div style={{display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:12, marginTop:12}}>
          <Card>
            <strong>Sim-Only Mode</strong>
            <div style={{marginTop:8}}>
              <button onClick={()=>updateConfig({allowSimulationOnly:true})}>SIMULATE</button>{" "}
              <button onClick={()=>updateConfig({allowSimulationOnly:false})}>LIVE</button>
            </div>
          </Card>
          <Card>
            <strong>Dual Consent</strong>
            <div style={{marginTop:8}}>
              <button onClick={()=>updateConfig({requireDualConsent:true})}>Require</button>{" "}
              <button onClick={()=>updateConfig({requireDualConsent:false})}>Bypass</button>
            </div>
          </Card>
          <Card>
            <strong>Public Provenance</strong>
            <div style={{marginTop:8}}>
              <button onClick={()=>updateConfig({publicProvenanceRequired:true})}>Require</acronym>
              <button onClick={()=>updateConfig({publicProvenanceRequired:false})}>Optional</button>
            </div>
          </Card>
          <Card>
            <strong>Min. Score</strong>
            <div style={{marginTop:8}}>
              <button onClick={()=>updateConfig({minCompositeScore:0.8})}>80%</button>{" "}
              <button onClick={()=>updateConfig({minCompositeScore:0.9})}>90%</button>
            </div>
          </Card>
        </div>
      </Card>

      <Card title="Audit Trail">
        <div style={{marginTop:12, maxHeight:480, overflow:"auto", display:"grid", gap:8}}>
          {audit.map(e => (
            <div key={e.audit_id} style={{border:"1px solid #2a2f45", borderRadius:10, padding:10}}>
              <Row>
                <strong>{e.request.intent}</strong>
                <Badge text={e.decision} ok={e.decision === "ALLOW"}/>
                <Badge text={`${(e.evaluation.score * 100).toFixed(0)}%`} />
              </Row>
              <div style={{fontSize:12, opacity:.8, marginTop:6}}>{e.ts}</div>
              <div style={{marginTop:6, fontSize:12, opacity:0.9, display:"flex", flexWrap:"wrap", gap:4}}>
                {e.evaluation.verdicts.map((g, idx) => (
                  <Badge key={idx} ok={g.pass} text={`${g.code}${g.pass?"":" ✖"}`} />
                ))}
              </div>
              <details style={{marginTop:8, fontSize:11, opacity:.7, cursor:"pointer"}}>
                <summary>Details</summary>
                <pre style={{whiteSpace:"pre-wrap", wordBreak:"break-all", background:"#111", padding:8, borderRadius:6, marginTop:4}}>
                  {JSON.stringify(e, null, 2)}
                </pre>
              </details>
            </div>
          ))}
          {audit.length===0 && <div style={{opacity:.7}}>No entries yet. Propose an action to populate.</div>}
        </div>
      </Card>
    </div>
  );
}
