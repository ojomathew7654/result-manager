import Navbar from "./navbar/navbar";

export default async function RootLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#1f1f38] text-white flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
