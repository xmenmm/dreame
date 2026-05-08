import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function ProfileRedirect() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  redirect(`/u/${user.username}`);
}
