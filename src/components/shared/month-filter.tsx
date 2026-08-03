"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function MonthFilter({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <input
      type="month"
      value={month}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
    />
  );
}
