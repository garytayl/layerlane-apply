import { Nav } from "@/components/nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Nav />
      <main className="relative z-[1] mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
