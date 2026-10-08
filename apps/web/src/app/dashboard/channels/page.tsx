import { redirect } from "next/navigation";

/** Legacy route — inbox moved to /dashboard/inbox in Phase C. */
export default function ChannelsRedirectPage() {
  redirect("/dashboard/inbox");
}
