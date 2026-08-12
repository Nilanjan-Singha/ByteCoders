import { ReaderProvider } from "@/components/reader-provider";
import { ReaderShell } from "@/components/reader-shell";

interface ReaderPageProps {
  params: Promise<{
    bookId: string;
  }>;
}

export default async function ReaderPage({
  params,
}: ReaderPageProps) {
  const { bookId } = await params;

  return (
    <ReaderProvider bookId={bookId}>
      <ReaderShell />
    </ReaderProvider>
  );
}