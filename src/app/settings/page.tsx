
// src/app/settings/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged, getUserProfile, updateUserDisplayName } from "@/lib/firebase/auth";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { UserRole } from "@/lib/firebase/auth";
import { Loader2, User, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface AppUser extends FirebaseAuthUser {
  role?: UserRole;
  displayName?: string | null;
}

const settingsSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(50, "Name can be at most 50 characters"),
  // Add other fields like email (with careful consideration for re-authentication), password change later
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: "",
    },
  });

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setCurrentUser({ 
            uid: firebaseUser.uid, 
            email: firebaseUser.email, 
            ...profile 
          });
          form.reset({ displayName: profile.displayName || "" });
        } else {
          // Fallback for safety, though profile should exist
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "",
            role: 'student'
          });
          form.reset({ displayName: firebaseUser.displayName || "" });
        }
      } else {
        router.push("/auth/login");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router, form]);

  const onSubmit: SubmitHandler<SettingsFormValues> = async (data) => {
    if (!currentUser || !currentUser.uid) {
      toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
      return;
    }
    setIsSubmitting(true);
    const { error } = await updateUserDisplayName(currentUser.uid, data.displayName);
    setIsSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your display name. Please try again.",
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your display name has been successfully updated.",
      });
      // Optionally, update currentUser state here if needed, or rely on header's re-fetch
      setCurrentUser(prev => prev ? {...prev, displayName: data.displayName} : null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
         <Skeleton className="h-8 w-1/4 mb-6" /> {/* Back button skeleton */}
        <Card className="w-full max-w-xl mx-auto shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2 rounded-md" />
            <Skeleton className="h-5 w-3/4 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Or a redirect, already handled by useEffect
  }

  return (
    <div className="py-8">
       <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/profile">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Link>
      </Button>
      <Card className="w-full max-w-xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Account Settings</CardTitle>
          <CardDescription>Manage your account details and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="displayName">Display Name</FormLabel>
                    <FormControl>
                      <Input
                        id="displayName"
                        placeholder="Your full name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormItem>
                  <FormLabel htmlFor="email">Email Address</FormLabel>
                  <Input
                    id="email"
                    type="email"
                    value={currentUser.email || ""}
                    disabled
                    className="bg-muted/50"
                  />
                   <FormDescription>
                    Email address cannot be changed here.
                  </FormDescription>
              </FormItem>

              <FormItem>
                <FormLabel htmlFor="role">Your Role</FormLabel>
                <Input
                    id="role"
                    value={currentUser.role?.charAt(0).toUpperCase() + currentUser.role?.slice(1) || "Student"}
                    disabled
                    className="bg-muted/50"
                  />
              </FormItem>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="border-t pt-6">
            <p className="text-xs text-muted-foreground">
                For password changes or other account modifications, please contact support (feature coming soon).
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
