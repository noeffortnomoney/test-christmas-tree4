import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { isDashboardAuthed } from "@/lib/auth";
import { telegramEnabled } from "@/lib/telegram";

export default async function DashboardPage() {
  if (!(await isDashboardAuthed())) redirect("/dashboard/login");
  return (
    <DashboardClient
      storageMode={process.env.DATABASE_URL ? "database" : "file"}
      telegramOn={telegramEnabled()}
    />
  );
}
