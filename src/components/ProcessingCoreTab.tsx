import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLiveNexusData } from "@/contexts/LiveNexusDataContext";

const ProcessingCoreTab = () => {
  const { processing } = useLiveNexusData();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="border-stone-200">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-stone-800">
              QSSR Module
            </CardTitle>
            <Badge variant="success">{processing.qssrModule.cosmicWeather}</Badge>
          </div>
          <p className="text-sm text-stone-500">
            Solar coherence and cosmic weather analysis pipelines
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-stone-600">
          <div className="flex items-center justify-between">
            <span>Solar coherence index</span>
            <span className="font-semibold text-stone-900">
              {processing.qssrModule.solarCoherenceIndex.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Planetary resonance</span>
            <span className="font-semibold text-stone-900">
              {processing.qssrModule.planetaryResonance}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Analysis queue</span>
            <span className="font-semibold text-stone-900">
              {processing.qssrModule.analysisQueue}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-stone-800">
              Storm Targeting
            </CardTitle>
            <Badge variant="info">{processing.stormTargeting.status}</Badge>
          </div>
          <p className="text-sm text-stone-500">
            Harmonic neutralization and atmospheric disturbance tracking
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-stone-600">
          <div className="flex items-center justify-between">
            <span>Active patterns</span>
            <span className="font-semibold text-stone-900">
              {processing.stormTargeting.activePatterns}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Neutralization rate</span>
            <span className="font-semibold text-stone-900">
              {processing.stormTargeting.neutralizationRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Harmonic integration</span>
            <span className="font-semibold text-stone-900">
              {processing.stormTargeting.harmonicIntegration.toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-stone-800">
              Auris Safeguard
            </CardTitle>
            <Badge variant="secondary">
              {processing.aurisCognitiveSafeguard.status}
            </Badge>
          </div>
          <p className="text-sm text-stone-500">
            Cognitive hazard dampening and authorized temporal filters
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-stone-600">
          <div className="flex items-center justify-between">
            <span>Hazard detections</span>
            <span className="font-semibold text-stone-900">
              {processing.aurisCognitiveSafeguard.hazardDetections}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Dampening factor</span>
            <span className="font-semibold text-stone-900">
              {processing.aurisCognitiveSafeguard.dampeningFactor.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Authorized temporal ID</span>
            <span className="font-semibold text-stone-900">
              {processing.aurisCognitiveSafeguard.authorizedTemporalId}
            </span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-500">
              Algorithms in play
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {processing.algorithms.map((algorithm) => (
                <li key={algorithm} className="text-stone-700">
                  • {algorithm}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingCoreTab;
