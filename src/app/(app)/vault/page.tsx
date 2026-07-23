import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, FileText, Search, Trash2, Vault as VaultIcon } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { listEmployees } from "@/server/services/employee";
import { deleteDocumentAction } from "@/server/actions/document-actions";
import { UploadDocument } from "@/components/vault/upload-document";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const metadata = buildMetadata({
  title: "Document Vault",
  path: "/vault",
  noIndex: true,
});

const TYPE_LABEL: Record<string, string> = {
  CONTRACT: "Contract",
  PAYSLIP: "Payslip",
  WARNING: "Warning",
  PERFORMANCE_REVIEW: "Performance review",
  ID_DOCUMENT: "ID document",
  BANK_DETAILS: "Bank details",
  INVOICE: "Invoice",
  OTHER: "Document",
};

const FILTERS = [
  { label: "All", type: "" },
  { label: "Contracts", type: "CONTRACT" },
  { label: "Payslips", type: "PAYSLIP" },
] as const;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { q, type } = await searchParams;
  const query = q?.trim() ?? "";

  const where: Prisma.DocumentWhereInput = {
    userId: session.user.id,
    deletedAt: null,
    ...(type && TYPE_LABEL[type]
      ? { type: type as Prisma.DocumentWhereInput["type"] }
      : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { searchText: { contains: query, mode: "insensitive" } },
            { fileName: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [documents, employees] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { firstName: true, lastName: true } } },
      take: 100,
    }),
    listEmployees(session.user.id),
  ]);
  const employeeOptions = employees.map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <VaultIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Document Vault</h1>
            <p className="text-muted-foreground">
              Every contract, payslip and record — searchable and secure.
            </p>
          </div>
        </div>
        <UploadDocument employees={employeeOptions} />
      </div>

      {/* Search + filters */}
      <form action="/vault" className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search documents…"
            className="pl-9"
          />
          {type && <input type="hidden" name="type" value={type} />}
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (type ?? "") === f.type;
          const href = f.type
            ? `/vault?type=${f.type}${query ? `&q=${encodeURIComponent(query)}` : ""}`
            : `/vault${query ? `?q=${encodeURIComponent(query)}` : ""}`;
          return (
            <Link key={f.label} href={href}>
              <Badge variant={active ? "default" : "secondary"} className="cursor-pointer">
                {f.label}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Results */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <FileText className="size-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">
            {query ? "No documents match your search" : "Your vault is empty"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Sign a contract, generate a payslip, or upload an ID copy or bank letter.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <UploadDocument employees={employeeOptions} />
            <Button asChild variant="outline">
              <Link href="/employees">Go to employees</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium">
                      <FileText className="size-4 text-muted-foreground" />
                      {doc.title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{TYPE_LABEL[doc.type] ?? doc.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {doc.createdAt.toLocaleDateString("en-ZA")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatSize(doc.sizeBytes)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="ghost">
                        <a
                          href={`/api/v1/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="size-4" /> Download
                        </a>
                      </Button>
                      <form action={deleteDocumentAction.bind(null, doc.id)}>
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:text-danger"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
