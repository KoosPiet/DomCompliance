import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { footerNav, siteConfig } from "@/config/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            {siteConfig.tagline}
          </p>
          <p className="text-xs text-muted-foreground">
            Built for South African homeowners. Not a law firm — guidance based
            on the BCEA, UIF Act and Sectoral Determination 7.
          </p>
        </div>

        {footerNav.map((group) => (
          <div key={group.heading}>
            <h3 className="mb-3 text-sm font-semibold">{group.heading}</h3>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>Made in South Africa 🇿🇦</p>
        </div>
      </div>
    </footer>
  );
}
