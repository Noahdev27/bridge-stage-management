import { auth, signOut } from "@/shared/auth/auth";
import { AdminShell } from "@/features/demandes-admin/components/AdminShell";

export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const email = session?.user?.email ?? "";

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <AdminShell email={email} logoutAction={logout}>
      {children}
    </AdminShell>
  );
}
