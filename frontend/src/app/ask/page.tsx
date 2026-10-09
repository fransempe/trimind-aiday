import { redirect } from "next/navigation";

// Ask Coaches vive ahora como pestaña de Today.
export default function AskPage() {
  redirect("/?tab=ask");
}
