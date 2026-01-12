"use client";

interface StepIndicatorProps {
  number: number;
  completed?: boolean;
}

export default function StepIndicator({
  number,
  completed = false,
}: StepIndicatorProps) {
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm transition-all duration-300 ${
        completed
          ? "bg-success text-white"
          : "bg-gradient-to-br from-primary via-primary to-primary text-white shadow-lg"
      }`}
    >
      {completed ? "✓" : number}
    </div>
  );
}
