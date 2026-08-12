import type { ReactNode } from "react";

export default function ReaderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-screen w-full overflow-hidden bg-background">
      {children}
    </div>
  );
}