import { ReaderProvider } from "@/components/reader-provider";
import { ReaderShell } from "@/components/reader-shell";

export default function Home() {
  return (
    <ReaderProvider bookId="demo-book">
      <ReaderShell />
    </ReaderProvider>
  );
}