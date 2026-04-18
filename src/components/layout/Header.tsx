
"use client";

import Link from 'next/link';
import { BookOpen, UserCircle, LogIn, LogOut, Search, Settings, LayoutDashboard, School, Briefcase, MessageSquare, Sun, Moon } from 'lucide-react'; // Added Sun, Moon
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { signOutUser } from '@/lib/firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { useTheme } from '@/components/theme-provider'; // Import useTheme
import { useAuth } from '@/components/auth-provider';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleLogout = async () => {
    const { error } = await signOutUser();
    if (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Could not log you out. Please try again.",
      });
    } else {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/courses?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(""); // Clear search term after submit
    }
  };

  let finalNavLinks;

  if (currentUser) {
    let dashboardLinkConfig = { href: '/my-learning', label: 'Student Dashboard', icon: LayoutDashboard };
    if (currentUser.role === 'admin') {
      dashboardLinkConfig = { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard };
    } else if (currentUser.role === 'teacher') {
      dashboardLinkConfig = { href: '/teach/dashboard', label: 'Teacher Dashboard', icon: LayoutDashboard };
    } else if (currentUser.role === 'parent') {
      dashboardLinkConfig = { href: '/parent/dashboard', label: 'Parent Dashboard', icon: LayoutDashboard };
    }

    finalNavLinks = [
      { href: '/courses', label: 'Courses', icon: Briefcase },
      dashboardLinkConfig,
      { href: '/teach', label: 'Teach', icon: School },
      { href: '/blog', label: 'Blog', icon: BookOpen },
    ];
  } else {
    finalNavLinks = [
      { href: '/courses', label: 'Courses', icon: Briefcase },
      { href: '/teach', label: 'Teach', icon: School },
      { href: '/blog', label: 'Blog', icon: BookOpen },
    ];
  }


  if (isLoading && pathname.startsWith('/auth')) {
     // Don't show a loading state on auth pages themselves.
  } else if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
           <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">CourseHub</span>
          </Link>
          <div className="h-8 w-20 rounded-md bg-muted animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold text-primary">CourseHub</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {finalNavLinks.map((link) => (
            <Button key={link.href} asChild variant="ghost"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary h-auto px-3 py-2",
                pathname === link.href ? "text-primary bg-accent/50" : "text-muted-foreground"
              )}
            >
              <Link href={link.href} className="flex items-center">
                <link.icon className="mr-2 h-4 w-4" />
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="pl-8 sm:w-[200px] md:w-[250px] lg:w-[300px] h-9 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || currentUser.email || 'User'} data-ai-hint="user avatar" />
                    <AvatarFallback>{(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.displayName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                     {currentUser.role && <p className="text-xs leading-none text-muted-foreground capitalize pt-1">Role: {currentUser.role}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center w-full">
                   <UserCircle className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/messages" className="flex items-center w-full">
                    <MessageSquare className="mr-2 h-4 w-4" /> Messages
                  </Link>
                </DropdownMenuItem>
                {currentUser.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center w-full">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                 {currentUser.role === 'teacher' && (
                  <DropdownMenuItem asChild>
                    <Link href="/teach/dashboard" className="flex items-center w-full">
                     <LayoutDashboard className="mr-2 h-4 w-4" /> Teacher Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {currentUser.role === 'parent' && (
                  <DropdownMenuItem asChild>
                    <Link href="/parent/dashboard" className="flex items-center w-full">
                     <LayoutDashboard className="mr-2 h-4 w-4" /> Parent Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {currentUser.role === 'student' && (
                  <DropdownMenuItem asChild>
                    <Link href="/my-learning" className="flex items-center w-full">
                     <LayoutDashboard className="mr-2 h-4 w-4" /> Student Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center w-full">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
