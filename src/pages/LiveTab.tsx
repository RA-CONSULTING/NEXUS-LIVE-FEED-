import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const onboardingSteps = [
  { id: '01', title: 'Welcome to Nexus', status: 'Complete', detail: 'Signal attunement + mission brief.' },
  { id: '02', title: 'Field Calibration', status: 'Complete', detail: 'Bio-scan + coherence anchor set.' },
  { id: '03', title: 'Sensor Sync', status: 'Complete', detail: 'Link planetary nodes + resonance ID.' },
  { id: '04', title: 'Map Orientation', status: 'Complete', detail: 'Ley-line grid + coherence zones preview.' },
  { id: '05', title: 'Personal Profile', status: 'Complete', detail: 'HRV baseline, resonance signature, guardianship oath.' },
  { id: '06', title: 'Gesture Primer', status: 'Complete', detail: 'Tap, swipe, pinch, rotate, shake walkthrough.' },
  { id: '07', title: 'Live Launch', status: 'In Progress', detail: 'Final harmonic countdown + dashboard unlock.' },
] as const;

const quickStats = [
  { label: 'Global Coherence', value: '82%', trend: '+4.6', tone: 'Emerald Rise' },
  { label: 'Anomaly Watch', value: '2 active', trend: 'Stable', tone: 'Amber Pulse' },
  { label: 'Sensors Online', value: '147', trend: '+12', tone: 'Skywave Mesh' },
  { label: 'Sacred Sites Active', value: '36', trend: '+1', tone: 'Golden Spiral' },
] as const;

const liveFeedEntries = [
  {
    title: 'Cusco Witness Array',
    summary: 'Ley-line interference harmonized. Coherence regained within 90 seconds.',
    timestamp: '09:34 GMT',
    status: 'Resolved',
  },
  {
    title: 'Lagrange L1 Orbital Relay',
    summary: 'Solar wind spike translating into auric shimmer. Spectrogram on standby.',
    timestamp: '09:28 GMT',
    status: 'Watching',
  },
  {
    title: 'Ancestral Grove · Bali',
    summary: 'Group meditation initiated. Collective resonance trending toward unity.',
    timestamp: '09:22 GMT',
    status: 'Live',
  },
] as const;

const quickActions = [
  { label: 'Stabilize Field', description: 'Launch harmonic rebalance macro.' },
  { label: 'Open Sacred Channel', description: 'Initiate real-time guardian bridge.' },
  { label: 'Mirror to Command', description: 'Share current scene to Nexus council.' },
] as const;

const dashboardInteractions = [
  {
    id: 'coherence-meter',
    title: 'Tap Coherence Meter',
    outcome: 'Expands into full-spectrum graph with coherence wave history + predictive arc.',
  },
  {
    id: 'quick-stat-card',
    title: 'Tap Quick Stat Card',
    outcome: 'Opens detail analytics, trend explanations, and recommended ritual responses.',
  },
  {
    id: 'live-feed-card',
    title: 'Tap Live Feed Card',
    outcome: 'Streams sensor transcript, field logs, and direct chat with ground stewards.',
  },
  {
    id: 'fab',
    title: 'Tap Floating Action Button',
    outcome: 'Summons quick actions: Stabilize, Signal Boost, Deploy Meditation Mode.',
  },
  {
    id: 'profile-avatar',
    title: 'Tap Profile Avatar',
    outcome: 'Transitions into personal dashboard for resonance maintenance.',
  },
  {
    id: 'notifications',
    title: 'Tap Notifications',
    outcome: 'Surfaces anomaly queue, coherence milestones, and sacred site invitations.',
  },
] as const;

const notifications = [
  {
    id: 'anomaly',
    badge: 'Anomaly',
    tone: 'Crimson Trace',
    message: 'Temporal drift detected over Reykjavik Temporal Anchor. Review immediately.',
    time: 'Just now',
  },
  {
    id: 'pattern',
    badge: 'Pattern',
    tone: 'Azure Bloom',
    message: 'Emerging resonance braid linking Andes sensors. Insight available.',
    time: '2 min ago',
  },
  {
    id: 'milestone',
    badge: 'Coherence Milestone',
    tone: 'Golden Dawn',
    message: 'Global coherence sustained above 80% for 180 minutes.',
    time: '12 min ago',
  },
  {
    id: 'sacred',
    badge: 'Sacred Site',
    tone: 'Violet Whisper',
    message: 'Stonehenge guardian beacon requesting harmonic accompaniment.',
    time: '24 min ago',
  },
] as const;

const dataVisualizations = [
  { title: 'Line Graphs', detail: 'Temporal coherence lines with predictive overlays and resonance shading.' },
  { title: 'Heat Maps', detail: 'Planetary heat blooms highlight energetic surges and depletion zones.' },
  { title: 'Gauges', detail: 'Coherence, field strength, and anomaly probability radial gauges.' },
  { title: 'Spectrograms', detail: 'Frequency waterfalls for audio + electromagnetic sensors.' },
  { title: '3D Globe', detail: 'Real-time global sphere with ley-line ribbons and sensor pulses.' },
] as const;

const gestureControls = [
  { gesture: 'Tap', description: 'Select metrics, open detail cards, confirm rituals.' },
  { gesture: 'Swipe', description: 'Navigate screens, dismiss overlays, scroll live feed.' },
  { gesture: 'Pinch', description: 'Zoom on maps, expand coherence bands, scale sacred geometry.' },
  { gesture: 'Rotate', description: 'Shift 3D globe perspective and align ley-line overlays.' },
  { gesture: 'Shake', description: 'Trigger rapid anomaly acknowledgment + send reassurance ping.' },
] as const;

const processTree = [
  {
    label: 'App Launch',
    children: [
      {
        label: 'First-Time User',
        children: [
          { label: 'Onboarding (7 screens)', children: [{ label: 'Live Dashboard' }] },
        ],
      },
      { label: 'Returning User', children: [{ label: 'Live Dashboard (default)' }] },
    ],
  },
] as const;

const LiveTab = () => {
  const coherence = 82;
  const gaugeStyle = useMemo(
    () => ({
      background: `conic-gradient(#22d3ee ${coherence * 3.6}deg, rgba(14,23,55,0.45) ${coherence * 3.6}deg)`
    }),
    [coherence],
  );

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="border-white/10 bg-white/5 bg-[rgba(12,18,45,0.7)] shadow-[0_0_35px_rgba(45,190,255,0.18)] backdrop-blur">
          <CardHeader className="space-y-2">
            <Badge className="w-max bg-sky-500/20 text-sky-200">Onboarding Flow</Badge>
            <CardTitle className="text-lg uppercase tracking-[0.3em]">First-Time Resonance Journey</CardTitle>
            <p className="text-sm text-[#c8d4ff]/80">
              Seven guided screens align new guardians with the Harmonic Nexus. Each stage locks before the next to guarantee
              full system attunement.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {onboardingSteps.map((step) => (
              <div
                key={step.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-900/20 p-4"
              >
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.45em]">
                  <span className="text-white/70">{step.id}</span>
                  <span className={step.status === 'In Progress' ? 'text-amber-300' : 'text-emerald-300'}>{step.status}</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-xs text-[#c8d4ff]/80">{step.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[rgba(12,18,45,0.7)] shadow-[0_0_30px_rgba(251,191,36,0.25)] backdrop-blur">
          <CardHeader>
            <Badge className="w-max bg-emerald-500/20 text-emerald-100">Coherence Meter</Badge>
            <CardTitle className="text-lg uppercase tracking-[0.3em]">Live Coherence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mx-auto flex w-full max-w-[220px] flex-col items-center gap-4">
              <div className="relative flex h-48 w-48 items-center justify-center rounded-full" style={gaugeStyle}>
                <div className="absolute inset-3 rounded-full bg-slate-950/80 backdrop-blur" />
                <div className="relative flex flex-col items-center justify-center">
                  <span className="text-4xl font-semibold text-white">{coherence}%</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-sky-200">Global</span>
                </div>
              </div>
              <p className="text-center text-xs text-[#c8d4ff]/75">
                Tap to open the coherence timeline with predictive arc, resonance harmonics, and guardian recommendations.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Stabilized within optimal harmonic range
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border-white/10 bg-[rgba(8,18,38,0.75)] backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-[0.4em] text-[#c8d4ff]/80">{stat.label}</CardTitle>
              <Badge className="bg-white/10 text-[0.6rem] uppercase tracking-[0.3em] text-white/80">{stat.tone}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Trend {stat.trend}</p>
            </CardContent>
          </Card>
        ))}

        <Card className="border-white/10 bg-[rgba(8,18,38,0.75)] backdrop-blur">
          <CardHeader>
            <Badge className="w-max bg-fuchsia-500/20 text-fuchsia-100">Live Feed</Badge>
            <CardTitle className="text-xs uppercase tracking-[0.4em] text-[#c8d4ff]/80">
              Real-Time Planetary Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {liveFeedEntries.map((entry) => (
              <div key={entry.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#c8d4ff]/70">
                  <span>{entry.timestamp}</span>
                  <span
                    className={
                      entry.status === 'Live'
                        ? 'text-emerald-300'
                        : entry.status === 'Resolved'
                          ? 'text-sky-300'
                          : 'text-amber-300'
                    }
                  >
                    {entry.status}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-white">{entry.title}</h3>
                <p className="mt-2 text-xs text-[#c8d4ff]/80">{entry.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card className="border-white/10 bg-[rgba(7,16,34,0.76)] backdrop-blur">
          <CardHeader>
            <Badge className="w-max bg-indigo-500/20 text-indigo-100">Process Tree</Badge>
            <CardTitle className="text-lg uppercase tracking-[0.3em]">Operational Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-[#d0dcff]/85">
              <ul className="space-y-4">
                {processTree.map((node) => (
                  <li key={node.label}>
                    <div className="font-semibold text-white">{node.label}</div>
                    <ul className="mt-2 space-y-3 border-l border-white/10 pl-4">
                      {node.children?.map((child) => (
                        <li key={child.label}>
                          <div className="font-medium text-sky-200">{child.label}</div>
                          {child.children && (
                            <ul className="mt-2 space-y-2 border-l border-white/10 pl-4">
                              {child.children.map((grand) => (
                                <li key={grand.label} className="text-xs text-[#c8d4ff]/80">
                                  {grand.label}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[rgba(7,16,34,0.76)] backdrop-blur">
          <CardHeader>
            <Badge className="w-max bg-amber-500/20 text-amber-100">Quick Actions</Badge>
            <CardTitle className="text-sm uppercase tracking-[0.3em]">Floating Action Menu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action) => (
              <div key={action.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.4em] text-[#c8d4ff]/70">{action.label}</div>
                <p className="mt-2 text-xs text-[#d0dcff]/80">{action.description}</p>
              </div>
            ))}
            <Button className="w-full rounded-full bg-sky-500/80 text-xs uppercase tracking-[0.4em] text-white hover:bg-sky-400/90">
              Tap FAB
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-[rgba(6,14,32,0.76)] backdrop-blur">
          <CardHeader>
            <Badge className="w-max bg-emerald-500/20 text-emerald-100">Live Dashboard Actions</Badge>
            <CardTitle className="text-lg uppercase tracking-[0.3em]">Every Tap</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {dashboardInteractions.map((interaction) => (
              <div key={interaction.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-xs uppercase tracking-[0.4em] text-sky-200">{interaction.title}</h3>
                <p className="mt-2 text-xs text-[#c8d4ff]/80">{interaction.outcome}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[rgba(6,14,32,0.76)] backdrop-blur">
          <CardHeader>
            <Badge className="w-max bg-rose-500/20 text-rose-100">Notifications</Badge>
            <CardTitle className="text-sm uppercase tracking-[0.3em]">Live Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((note) => (
              <div key={note.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.35em]">
                  <span className="text-white/80">{note.badge}</span>
                  <span className="text-[#c8d4ff]/60">{note.time}</span>
                </div>
                <div className="mt-2 text-[0.6rem] uppercase tracking-[0.4em] text-sky-200">{note.tone}</div>
                <p className="mt-2 text-xs text-[#d0dcff]/85">{note.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-[rgba(6,14,32,0.76)] backdrop-blur">
          <CardHeader>
            <Badge className="w-max bg-sky-500/20 text-sky-100">Data Visualizations</Badge>
            <CardTitle className="text-lg uppercase tracking-[0.3em]">Visual Arsenal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {dataVisualizations.map((viz) => (
              <div key={viz.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold text-white">{viz.title}</h3>
                <p className="mt-2 text-xs text-[#c8d4ff]/80">{viz.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[rgba(6,14,32,0.76)] backdrop-blur">
          <CardHeader>
            <Badge className="w-max bg-purple-500/20 text-purple-100">Gesture Controls</Badge>
            <CardTitle className="text-sm uppercase tracking-[0.3em]">Embodied Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gestureControls.map((gesture) => (
              <div key={gesture.gesture} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.4em] text-white/75">{gesture.gesture}</div>
                <p className="mt-2 text-xs text-[#c8d4ff]/80">{gesture.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default LiveTab;
