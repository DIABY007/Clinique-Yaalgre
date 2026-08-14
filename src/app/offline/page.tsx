import Image from "next/image";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-app px-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <Image
          src="/logo.png"
          alt="Clinique Yaalgre"
          width={120}
          height={40}
          className="h-12 w-auto opacity-60"
          priority
        />
        <h1 className="text-xl font-semibold text-text-main">
          Vous êtes hors-ligne
        </h1>
        <p className="text-text-muted">
          L&apos;application fonctionne toujours en local, mais certaines données
          peuvent ne pas être à jour. Les modifications seront synchronisées
          automatiquement au retour de la connexion.
        </p>
        <div className="size-16 rounded-full bg-muted flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
          >
            <path d="M8.5 5.5A11 11 0 0 1 21 16" />
            <path d="M3 8a15 15 0 0 1 11 5" />
            <path d="M5.5 12.5A7 7 0 0 1 17 16" />
            <path d="M8 16a3 3 0 0 1 5 2" />
            <line x1="12" x2="12.01" y1="19" y2="19" />
          </svg>
        </div>
        <Link
          href="/"
          className="rounded-xl bg-primary-forest px-6 py-3 text-sm font-medium text-white inline-block"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}