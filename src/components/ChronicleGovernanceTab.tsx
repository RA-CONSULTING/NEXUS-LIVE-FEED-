import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type ChronicleSection = {
  id: string;
  title: string;
  badge?: string;
  metrics: Array<{ label: string; value: string }>;
  description: string;
};

export type ChronicleGovernance = {
  sections: ChronicleSection[];
  highlights: string[];
};

type ChronicleGovernanceTabProps = {
  governance: ChronicleGovernance;
};

const ChronicleGovernanceTab = ({ governance }: ChronicleGovernanceTabProps) => (
  <Card className="border-stone-200">
    <CardHeader className="pb-2">
      <CardTitle className="text-xl font-semibold text-stone-900">Chronicle &amp; Data Governance</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {governance.sections.map((section) => (
          <div key={section.id} className="rounded-xl border border-stone-200 bg-white/80 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold text-stone-800">{section.title}</div>
              {section.badge ? <Badge variant="outline">{section.badge}</Badge> : null}
            </div>
            <p className="mt-1 text-xs text-stone-500">{section.description}</p>
            <dl className="mt-4 space-y-3 text-sm">
              {section.metrics.map((metric) => (
                <div key={metric.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs uppercase tracking-wide text-stone-500">{metric.label}</dt>
                  <dd className="text-right text-sm font-medium text-stone-900">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4 text-sm text-amber-900">
        <div className="font-semibold uppercase tracking-wide text-xs">Continuity Highlights</div>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {governance.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </div>
    </CardContent>
  </Card>
);

export default ChronicleGovernanceTab;
