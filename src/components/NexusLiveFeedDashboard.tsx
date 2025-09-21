import LiveRealtimeCharts from "@/components/LiveRealtimeCharts";
import LiveSupabaseCharts from "@/components/LiveSupabaseCharts";
import OutputCommandTab from "@/components/OutputCommandTab";
import ProcessingCoreTab from "@/components/ProcessingCoreTab";
import SensoryLayerTab from "@/components/SensoryLayerTab";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveNexusDataProvider, useLiveNexusData } from "@/contexts/LiveNexusDataContext";

const DashboardHeader = () => {
  const { timestamp } = useLiveNexusData();
  const formatted = new Date(timestamp).toLocaleString();

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-stone-900">
          Nexus Live Feed Dashboard
        </h1>
        <p className="text-sm text-stone-500">
          Monitoring sensory intake, processing harmonics, and command output in
          real time.
        </p>
      </div>
      <div className="flex flex-col items-start gap-2 text-sm text-stone-500 lg:items-end">
        <Badge variant="success">Operational</Badge>
        <span>
          Updated <span className="font-medium text-stone-700">{formatted}</span>
        </span>
      </div>
    </div>
  );
};

const DashboardContent = () => (
  <div className="space-y-8">
    <DashboardHeader />
    <LiveSupabaseCharts />
    <LiveRealtimeCharts />
    <Tabs defaultValue="sensory" className="space-y-4">
      <TabsList className="w-full justify-start bg-white shadow-sm">
        <TabsTrigger value="sensory">Sensory Layer</TabsTrigger>
        <TabsTrigger value="processing">Processing Core</TabsTrigger>
        <TabsTrigger value="output">Command Output</TabsTrigger>
      </TabsList>
      <TabsContent value="sensory">
        <SensoryLayerTab />
      </TabsContent>
      <TabsContent value="processing">
        <ProcessingCoreTab />
      </TabsContent>
      <TabsContent value="output">
        <OutputCommandTab />
      </TabsContent>
    </Tabs>
  </div>
);

const NexusLiveFeedDashboard = () => (
  <LiveNexusDataProvider>
    <DashboardContent />
  </LiveNexusDataProvider>
);

export default NexusLiveFeedDashboard;
