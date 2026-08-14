import Image from "next/image";
import Link from "next/link";

interface NavbarProps {
  userName?: string;
  userRole?: string;
}

export function Navbar({ userName, userRole }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-divider bg-surface-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt="Clinique Yaalgre"
            width={100}
            height={34}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {userName && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-text-muted">
              {userName}
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary-forest/10 text-sm font-medium text-primary-forest">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}