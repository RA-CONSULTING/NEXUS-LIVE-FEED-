import React, { useState } from "react";
import { PRIME_SENTINEL_SEAL, publishSeal } from "@/lib/prime/prime-sentinel-seal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PrimeSentinelProclamation() {
  const seal = PRIME_SENTINEL_SEAL;
  const [status, setStatus] = useState<null | string>(null);

  async function onPublish() {
    setStatus("Publishing…");
    const res = await publishSeal();
    setStatus(res.ok ? `Published (HTTP ${res.status})` : `Publish failed (${res.status}): ${res.text}`);
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="text-lg">
          Prime Sentinel Seal <span className="opacity-60">• {seal.id}</span>
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{seal.author.name}</Badge>
          <Badge variant="outline">Born {seal.author.birth_code}</Badge>
          <Badge variant="success">Checksum {seal.checksum}</Badge>
          <Badge variant="secondary">{new Date(seal.ts).toUTCString()}</Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 text-sm leading-relaxed">
        <div className="opacity-80">{seal.text}</div>

        <div className="mt-2 grid gap-1">
          <div className="font-medium">Maxim</div>
          <div className="italic opacity-90">“{seal.maxim}”</div>
        </div>

        <div className="mt-3 grid gap-1">
          <div className="font-medium">Titles</div>
          <div className="flex flex-wrap gap-2">
            {seal.titles.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={onPublish}>Publish to Chronicle</Button>
          {status && <span className="text-xs opacity-80">{status}</span>}
        </div>
      </CardContent>
    </Card>
  );
}