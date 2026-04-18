
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import FirebaseErrorListener from '@/components/FirebaseErrorListener';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CourseHub - Your Learning Journey Starts Here',
  description: 'Discover a wide range of courses on CourseHub. Learn, teach, and grow with our e-learning platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} flex flex-col min-h-screen`}>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 animate-fade-in">
              {children}
            </main>
            <Footer />
            <Toaster />
            <FirebaseErrorListener />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
