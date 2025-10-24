import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@../../../components/ui/toaster';
import { AuthProvider } from '@../../../components/auth/AuthProvider';
import NavBar from '@../../../components/nav/navbar'; 

export const metadata: Metadata = {
  title: 'DocBook — Doctor Appointments',
  description: 'Find a doctor and book appointments quickly',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900 antialiased">
        {/* Client providers can be rendered by a server layout */}
        <ToastProvider>
          <AuthProvider>
            <header className="sticky top-0 z-30 backdrop-blur bg-white/75 border-b">
              <NavBar /> {/* ← uses useAuth inside a client component */}
            </header>
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
