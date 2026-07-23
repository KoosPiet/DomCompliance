import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/** LabourMate mark: a compliance shield with a check. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-7", className)}
      aria-hidden="true"
    >
      <path
        d="M16 2.5 4.5 7v8.2c0 6.6 4.6 11.9 11.5 14.3 6.9-2.4 11.5-7.7 11.5-14.3V7L16 2.5Z"
        className="fill-primary"
      />
      <path
        d="m10.6 16.2 3.6 3.6 7.2-7.4"
        stroke="var(--primary-foreground)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
  showWord = true,
}: {
  className?: string;
  href?: string;
  showWord?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
      aria-label={siteConfig.name}
    >
      <LogoMark />
      {showWord && <span className="text-lg">{siteConfig.name}</span>}
    </Link>
  );
}
