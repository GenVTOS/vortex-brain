import { redirect } from "next/navigation";

// Root simply routes into the app shell. Unauthenticated users are bounced to
// /login by middleware.ts.
export default function Home() {
  redirect("/command");
}
