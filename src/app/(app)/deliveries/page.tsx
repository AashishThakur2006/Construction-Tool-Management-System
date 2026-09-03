import { Suspense } from "react";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import DeliveriesClient, { Delivery } from "./deliveries-client";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const session = await getSession();
  const like = `%${q}%`;

  const deliveries = (await sql`
    SELECT d.*, p.name AS project_name
    FROM deliveries d
    LEFT JOIN projects p ON p.id = d.project_id
    WHERE d.reference ILIKE ${like} OR d.carrier ILIKE ${like}
       OR d.item_summary ILIKE ${like} OR d.status ILIKE ${like} OR p.name ILIKE ${like}
    ORDER BY COALESCE(d.scheduled_date, d.created_at::date) DESC, d.created_at DESC`) as unknown as Delivery[];

  const projects = (await sql`
    SELECT id, name FROM projects ORDER BY name`) as unknown as {
    id: number;
    name: string;
  }[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Deliveries</h1>
          <p className="text-sm text-slate-500">
            Track inbound and outbound material movements and their status.
          </p>
        </div>
        <Suspense>
          <SearchBar placeholder="Search deliveries..." />
        </Suspense>
      </div>
      <DeliveriesClient
        deliveries={deliveries}
        projects={projects}
        role={session?.role ?? "SITE_ENGINEER"}
      />
    </div>
  );
}
