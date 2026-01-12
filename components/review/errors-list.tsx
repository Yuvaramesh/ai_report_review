import { AlertCircle } from "lucide-react";

export default function ErrorsList({ errors }: { errors: any[] }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
      <div className="bg-error-light border-b border-error p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
        <div>
          <h3 className="font-bold text-error">Errors – Must Be Corrected</h3>
          <p className="text-sm text-error/80">
            Review will fail if any remain
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-6 py-3 text-left font-semibold text-neutral-900">
                Ref
              </th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-900">
                Issue
              </th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-900">
                Location
              </th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-900">
                TB Ref
              </th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-900">
                Required Action
              </th>
            </tr>
          </thead>
          <tbody>
            {errors.map((error, idx) => (
              <tr
                key={error.id}
                className="border-b border-neutral-200 hover:bg-neutral-50"
              >
                <td className="px-6 py-4 font-bold text-error">{error.id}</td>
                <td className="px-6 py-4 text-neutral-900">{error.issue}</td>
                <td className="px-6 py-4 text-neutral-600">{error.location}</td>
                <td className="px-6 py-4 text-neutral-600">{error.tbRef}</td>
                <td className="px-6 py-4 font-medium text-error">
                  {error.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
