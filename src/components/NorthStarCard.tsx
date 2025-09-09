import React, { useState } from "react";
import { NORTH_STAR_CLAIM, publishNorthStar } from "@/lib/prime/prime-north-star";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function NorthStarCard() {
  const claim = NORTH_STAR_CLAIM;
  const [status, setStatus] = useState<string | null>(null);

  async function onPublish() {
    setStatus("Publishing…");
    const res = await publishNorthStar();
    setStatus(res.ok ? `Published (HTTP ${res.status})` : `Publish failed (${res.status}): ${res.text}`);
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">
          North Star Claim <span className="opacity-60">• {claim.id}</span>
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{claim.author.name}</Badge>
          <Badge variant="outline">Born {claim.author.birth_code}</Badge>
          <Badge variant="success">Checksum {claim.checksum}</Badge>
          <Badge variant="secondary">{new Date(claim.ts).toUTCString()}</Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3">
        <blockquote className="italic opacity-90">
          “{claim.aphorism}”
        </blockquote>
        <div className="grid gap-1">
          <div className="font-medium">Titles</div>
          <div className="flex flex-wrap gap-2">
            {claim.roles.map(r => <Badge key={r} variant="outline">{r}</Badge>)}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={onPublish}>Publish to Chronicle</Button>
          {status && <span className="text-xs opacity-80">{status}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
