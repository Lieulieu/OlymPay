import ProfileClient from "@/components/profile/ProfileClient";
import { requireUser } from "@/utils/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  await requireUser("/profile");
  return (
    <div className="space-y-8">
      <ProfileClient />
    </div>
  );
}
