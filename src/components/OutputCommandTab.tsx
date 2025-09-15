import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLiveNexusData } from "@/contexts/LiveNexusDataContext";

const transmissionStateMap = {
  queued: "warning",
  transmitting: "info",
  complete: "success",
} as const;

const OutputCommandTab = () => {
  const { output } = useLiveNexusData();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="border-stone-200">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-stone-800">
              Voice Pipelines
            </CardTitle>
            <Badge variant="success">Operational</Badge>
          </div>
          <p className="text-sm text-stone-500">
            Real-time synthesis channels broadcasting system directives
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-stone-600">
          <div className="flex items-center justify-between">
            <span>Active voices</span>
            <span className="font-semibold text-stone-900">
              {output.voicePipelines.activeVoices}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Median latency</span>
            <span className="font-semibold text-stone-900">
              {output.voicePipelines.latencyMs} ms
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Successful transmissions</span>
            <span className="font-semibold text-stone-900">
              {output.voicePipelines.successfulTransmits}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-stone-800">
              Command Queue
            </CardTitle>
            <Badge variant="info">{output.commandQueue.lastCommand}</Badge>
          </div>
          <p className="text-sm text-stone-500">
            Tactical directives awaiting execution by Prime Sentinel
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-stone-600">
          <div className="flex items-center justify-between">
            <span>Queued commands</span>
            <span className="font-semibold text-stone-900">
              {output.commandQueue.queued}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Executing</span>
            <span className="font-semibold text-stone-900">
              {output.commandQueue.executing}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Compliance status</span>
            <Badge variant="secondary">{output.compliance.status}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Audits passed</span>
            <span className="font-semibold text-stone-900">
              {output.compliance.auditsPassed}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Escalation level</span>
            <span className="font-semibold text-stone-900">
              {output.compliance.escalationLevel}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg font-semibold text-stone-800">
            Transmission Channels
          </CardTitle>
          <p className="text-sm text-stone-500">
            Live uplink routes broadcasting Nexus directives across the grid
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {output.transmissions.map((transmission) => (
            <div
              key={transmission.id}
              className="rounded-lg border border-stone-200 p-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-800">
                    {transmission.channel}
                  </p>
                  <p className="text-xs text-stone-500">
                    {transmission.destination}
                  </p>
                </div>
                <Badge variant={transmissionStateMap[transmission.status]}>
                  {transmission.status.charAt(0).toUpperCase() +
                    transmission.status.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default OutputCommandTab;
