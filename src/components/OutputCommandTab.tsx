import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AuditRecord } from '@/lib/sero/sero-core';
import KeyStatus from './KeyStatus';

type VaultStatus = Record<string, { present: boolean; masked: string }>;

const formatRelativeTime = (iso?: string) => {
  if (!iso) return 'timestamp pending';
  const value = new Date(iso).getTime();
  if (!Number.isFinite(value)) return 'timestamp pending';
  const deltaMs = Date.now() - value;
  if (deltaMs < 30_000) return 'just now';
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

type OutputCommandTabProps = {
  latestAudit: AuditRecord[];
  vaultStatus: VaultStatus | null;
  vaultError: string | null;
};

const OutputCommandTab = ({ latestAudit, vaultStatus, vaultError }: OutputCommandTabProps) => (
  <div className="grid gap-6 lg:grid-cols-2">
    <Card className="border-stone-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-stone-900">Command Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {latestAudit.length === 0 ? (
          <p className="text-sm text-stone-500">
            No stewardship commands executed in this session. Use the Actuation console to initiate one.
          </p>
        ) : (
          latestAudit.map((entry) => (
            <div key={entry.audit_id} className="rounded-xl border border-stone-200 bg-white/80 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-stone-800">{entry.request.subsystem}</div>
                <Badge variant={entry.decision === 'ALLOW' ? 'success' : 'warning'}>{entry.decision}</Badge>
              </div>
              <div className="mt-1 text-xs text-stone-500">{entry.request.intent}</div>
              <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                <span>{entry.request.operator?.name ?? 'Unknown operator'}</span>
                <span>{formatRelativeTime(entry.request.ts)}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-stone-200">
                <div
                  className="h-2 rounded-full bg-amber-500"
                  style={{ width: `${Math.round((entry.evaluation?.score ?? 0) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>

    <Card className="border-stone-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-stone-900">Access & Credentials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Environment Flags</div>
          <div className="mt-2 rounded-xl border border-stone-200 bg-white/70 p-3">
            <KeyStatus />
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Key Vault</div>
          <div className="mt-2 space-y-2">
            {vaultError ? (
              <p className="text-xs text-rose-500">{vaultError}</p>
            ) : !vaultStatus ? (
              <p className="text-xs text-stone-500">Requesting key status…</p>
            ) : (
              <ul className="space-y-2 text-sm text-stone-600">
                {Object.entries(vaultStatus).map(([name, status]) => (
                  <li
                    key={name}
                    className="flex items-center justify-between rounded-lg border border-stone-200 bg-white/80 px-3 py-2"
                  >
                    <span className="font-medium text-stone-700">{name}</span>
                    <span className={`text-xs font-mono ${status.present ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {status.masked}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p className="text-xs text-stone-500">
          Access logs rotate every 24 hours. Stewardship counsel can revoke any credential from the Sero console.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default OutputCommandTab;
