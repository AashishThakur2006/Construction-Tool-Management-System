/*
  PLINTH — interface language.

  GLOSSARY (used with zero drift, everywhere):
    Asset        — any ownable piece of plant or equipment.
    Job          — one contracted scope of work at one location.
    Allocation   — the record of an asset committed to a job.
                   Verbs: allocate, return, transfer.
    Yard         — where unallocated assets live. Status: "In yard".
    Workshop     — maintenance holding. Status: "In workshop".
    Employee     — a person on the payroll, assigned to jobs.
    Maintenance request — Reported → Approved → In workshop → Resolved,
                   or Rejected. The Owner approves spend.
    Payment      — one ledger entry. Paid, Pending, Overdue, Disputed or Voided.

  Seed data now lives server-side in scripts/seed.mjs; this file only carries
  the copy shown for each interface state.
*/

const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

export const COPY = {
  loading: "Loading from the register.",
  empty: {
    assets: { title: "No assets registered", body: "The register is empty. Add the first asset and it will appear here and in the allocation field.", action: "Register an asset" },
    jobs: { title: "No jobs yet", body: "Create a job to start allocating assets and crew to it.", action: "Create a job" },
    employees: { title: "No employees on file", body: "Add crew and staff here to assign them to jobs.", action: "Add an employee" },
    maintenance: { title: "The maintenance queue is clear", body: "Faults reported from any job will land here for approval and workshop scheduling.", action: null },
    payments: { title: "The ledger is empty", body: "Payments recorded against jobs will appear here with their status.", action: null },
  },
  error: { title: "This view could not be loaded", body: "The register did not respond. Your data is unchanged. Retry now, or come back after checking your connection.", action: "Retry" },
  offline: { title: "You are offline", body: "Plinth will keep showing the last loaded data and retry when the connection returns. Changes are disabled until then.", action: "Retry connection" },
  denied: { title: "This area is restricted", body: "Your role does not include this record. Payments and approvals outside your jobs are visible to the Owner only. If you need access, ask the Owner to reassign the job to you.", action: "Back to dashboard" },
  noResults: (q) => ({ title: `Nothing matches “${q}”`, body: "Check the spelling, or search by asset ID (AST-0112), job code (JOB-24-011), invoice (INV-26428), or a person's name.", action: "Clear search" }),
  confirm: {
    deleteAsset: (a, openAlloc, openMr) => ({
      title: `Retire ${a.id} — ${a.model}?`,
      body: `${openAlloc ? `Its open allocation to ${a.jobId} will be closed. ` : ""}${openMr ? `${openMr} open maintenance request${openMr > 1 ? "s" : ""} will be cancelled. ` : ""}The asset's history is kept for audit. This cannot be undone from this screen.`,
      confirmLabel: "Retire asset",
    }),
    rejectMr: (m, a, reporter) => ({
      title: `Reject ${m.id}?`,
      body: `${reporter} will see the rejection, and ${a.id} stays in service with the fault unrepaired. Estimated repair deferred: ${inr(m.estCost)}.`,
      confirmLabel: "Reject request",
    }),
    voidPayment: (p) => ({
      title: `Void ${p.id} — ${inr(p.amount)} to ${p.payee}?`,
      body: `The ledger keeps a voided row for audit. The amount is removed from ${p.jobId} committed spend. The payee is not notified by Plinth.`,
      confirmLabel: "Void payment",
    }),
    returnAsset: (a) => ({
      title: `Return ${a.id} to the yard?`,
      body: `The allocation to ${a.jobId} closes today and the asset becomes available to every job.`,
      confirmLabel: "Return to yard",
    }),
  },
};
