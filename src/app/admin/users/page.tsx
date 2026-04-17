
// src/app/admin/users/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { onAuthStateChanged, getUserProfile, getAllUsers, updateUserRole, type UserProfile, type UserRole } from "@/lib/firebase/auth";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { ArrowLeft, Edit, User as UserIcon, ShieldAlert, LogIn, Users, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Timestamp } from "firebase/firestore";

interface AppUser extends FirebaseAuthUser {
  role?: UserRole;
  displayName?: string | null;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [isAuthorized, setIsAuthorized] = React.useState(false);

  const [usersList, setUsersList] = React.useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);
  const [errorUsers, setErrorUsers] = React.useState<string | null>(null);

  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<UserRole | undefined>(undefined);
  const [isUpdatingRole, setIsUpdatingRole] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...profile });
          if (profile.role === 'admin') {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            toast({ variant: "destructive", title: "Access Denied", description: "You are not authorized to view this page." });
            router.push("/admin");
          }
        } else {
          setIsAuthorized(false);
          toast({ variant: "destructive", title: "Profile Not Found", description: "Could not retrieve your user profile." });
          router.push("/");
        }
      } else {
        setCurrentUser(null);
        setIsAuthorized(false);
        router.push("/auth/login?redirect=/admin/users");
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router, toast]);

  const fetchUsers = React.useCallback(async () => {
    setIsLoadingUsers(true);
    setErrorUsers(null);
    try {
      const fetchedUsers = await getAllUsers();
      setUsersList(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users list: ", error);
      setErrorUsers("Failed to load users. Please try again later.");
      toast({ variant: "destructive", title: "Loading Error", description: "Could not fetch users list." });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (isAuthorized && !isLoadingAuth) {
      fetchUsers();
    }
  }, [isAuthorized, isLoadingAuth, fetchUsers]);
  
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const openEditRoleDialog = (user: UserProfile) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setIsEditRoleDialogOpen(true);
  };

  const handleRoleUpdate = () => {
    if (!editingUser || !selectedRole) return;

    if (editingUser.uid === currentUser?.uid && editingUser.role === 'admin' && selectedRole !== 'admin') {
        toast({
            variant: "destructive",
            title: "Action Restricted",
            description: "For safety, you cannot remove your own admin role through this interface.",
        });
        return;
    }

    setIsUpdatingRole(true);
    
    // Using the new non-async function
    updateUserRole(editingUser.uid, selectedRole);

    // Because the function doesn't await, we can give optimistic feedback.
    // The error will be caught by the global listener if it fails.
    toast({ title: "Role Update Initiated", description: `Request to change ${editingUser.displayName}'s role to ${selectedRole} sent.` });
    
    // Optimistically update the UI
    setUsersList(prevUsers => 
        prevUsers.map(u => u.uid === editingUser.uid ? {...u, role: selectedRole} : u)
    );
    
    setIsEditRoleDialogOpen(false);
    setIsUpdatingRole(false);
    // No need to call fetchUsers() immediately, let the optimistic update stand.
    // The global error handler will inform if something went wrong.
  };


  if (isLoadingAuth || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized && !isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center py-12">
        <Card className="w-full max-w-md p-8 shadow-xl bg-destructive/10 border-destructive">
          <CardHeader>
            <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-2xl font-bold text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" size="lg" className="w-full" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href="/admin">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center">
            <Users className="mr-3 h-8 w-8" /> User Management
          </h1>
          <p className="text-muted-foreground">View and manage all platform users.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all registered users on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
            </div>
          ) : errorUsers ? (
            <div className="text-center py-6 text-destructive">
              <AlertCircle className="mx-auto h-10 w-10 mb-3" />
              <p>{errorUsers}</p>
            </div>
          ) : usersList.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersList.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} data-ai-hint="user avatar"/>
                        <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.displayName || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'teacher' ? 'secondary' : 'outline'} className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEditRoleDialog(user)}>
                        <Edit className="mr-1 h-3.5 w-3.5" /> Edit Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingUser && (
        <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Change the role for {editingUser.displayName || editingUser.email}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right col-span-1">
                  User
                </Label>
                <span className="col-span-3 font-medium">{editingUser.displayName} ({editingUser.email})</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right col-span-1">
                  Role
                </Label>
                <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               {editingUser.uid === currentUser?.uid && editingUser.role === 'admin' && selectedRole !== 'admin' && (
                <div className="col-span-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                        You are about to change your own role from Admin. This may restrict your access. This action is currently blocked for safety.
                        </AlertDescription>
                    </Alert>
                </div>
                )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="button" onClick={handleRoleUpdate} disabled={isUpdatingRole || (editingUser.uid === currentUser?.uid && editingUser.role === 'admin' && selectedRole !== 'admin')}>
                {isUpdatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
