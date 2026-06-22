import { UnitsGrid } from "@/components/units/units-grid";

export default function UnitsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Units</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage rooms, suites, villas, and studios. Set availability and pricing.
        </p>
      </div>
      <UnitsGrid />
    </div>
  );
}
