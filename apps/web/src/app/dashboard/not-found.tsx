import { ErrorScreen } from "@/components/layout/error-screen";

/** IVA-189: 404 inside the dashboard keeps the shell and links back to the dashboard. */
export default function DashboardNotFound() {
  return <ErrorScreen kind="notFound" homeHref="/dashboard" variant="section" />;
}
