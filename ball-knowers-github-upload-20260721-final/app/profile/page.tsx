import type { Metadata } from "next";
import { ProfileView } from "@/components/game/ProfileView";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your sports quiz profile, local history and leaderboard details."
};

export default function ProfilePage() {
  return (
    <main className="game-shell">
      <ProfileView />
    </main>
  );
}
