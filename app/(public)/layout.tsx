import { GlobalLanguageProvider } from "@/lib/global-language-context";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalLanguageProvider>
      {children}
    </GlobalLanguageProvider>
  );
}