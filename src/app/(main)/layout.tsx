import { Navbar } from "@/components/layout/Navbar";
import { UploadModal } from "@/components/upload/UploadModal";
import { CreateAlbumModal } from "@/components/albums/CreateAlbumModal";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-mesh">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      <UploadModal />
      <CreateAlbumModal />
    </div>
  );
}
