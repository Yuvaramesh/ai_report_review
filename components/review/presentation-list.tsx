import { InfoIcon } from "lucide-react";

export default function PresentationList({ items }: { items: any[] }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
      <div className="bg-success-light border-b border-success p-4 flex items-center gap-3">
        <InfoIcon className="h-5 w-5 text-success flex-shrink-0" />
        <div>
          <h3 className="font-bold text-success">
            Presentation & Tidy-Up Items
          </h3>
          <p className="text-sm text-success/80">
            Optional improvements for professionalism
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-success-light rounded-lg p-4 space-y-3"
          >
            <div className="flex gap-3">
              <span className="font-bold text-success min-w-fit">
                {item.id}
              </span>
              <div className="space-y-1">
                <p className="font-medium text-neutral-900">{item.item}</p>
                <p className="text-sm text-neutral-600">
                  <strong>Location:</strong> {item.location}
                </p>
                <p className="text-sm text-neutral-600">
                  <strong>Suggested Change:</strong> {item.suggestion}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
