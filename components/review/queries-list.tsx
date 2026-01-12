import { HelpCircle } from "lucide-react";

interface Query {
  id: string;
  query: string;
  location: string;
  evidence: string;
}

export default function QueriesList({ queries }: { queries: Query[] }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
      <div className="bg-query-light border-b border-query p-4 flex items-center gap-3">
        <HelpCircle className="h-5 w-5 text-query flex-shrink-0" />
        <div>
          <h3 className="font-bold text-query">
            Queries – Partner Decision Required
          </h3>
          <p className="text-sm text-query/80">
            Provide evidence to support these points
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {queries.map((query) => (
          <div
            key={query.id}
            className="border border-query-light rounded-lg p-4 space-y-3"
          >
            <div className="flex gap-3">
              <span className="font-bold text-query min-w-fit">{query.id}</span>
              <div className="space-y-1">
                <p className="font-medium text-neutral-900">{query.query}</p>
                <p className="text-sm text-neutral-600">
                  <strong>Location:</strong> {query.location}
                </p>
                <p className="text-sm text-neutral-600">
                  <strong>Evidence Needed:</strong> {query.evidence}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
