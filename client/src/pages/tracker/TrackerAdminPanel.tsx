import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Plus,
  Trash2,
  LogOut,
  Shield,
  ArrowLeft,
  Loader2,
  Users,
  Map,
  ListChecks,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// ── Aliases Tab ───────────────────────────────────────────────────────────────

function AliasesTab() {
  const utils = trpc.useUtils();
  const { data: aliases = [], isLoading } = trpc.admin.getMappings.useQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [alias, setAlias] = useState("");
  const [realId, setRealId] = useState("");
  const [label, setLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const addMutation = trpc.admin.addMapping.useMutation({
    onSuccess: () => {
      toast.success("Alias added successfully.");
      utils.admin.getMappings.invalidate();
      setShowAdd(false);
      setAlias(""); setRealId(""); setLabel("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deleteMapping.useMutation({
    onSuccess: () => {
      toast.success("Alias deleted.");
      utils.admin.getMappings.invalidate();
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Map customer-facing IDs to real IPS tracking numbers.
        </p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Alias
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : aliases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Map className="h-8 w-8 opacity-30" />
              <p className="text-sm">No aliases configured yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alias</TableHead>
                  <TableHead>Real Tracking ID</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {aliases.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono font-medium">{a.alias}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{a.realId}</TableCell>
                    <TableCell className="text-muted-foreground">{a.label ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(a.alias)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tracking Alias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Customer-facing Alias</Label>
              <Input placeholder="e.g. PBW-001" value={alias} onChange={(e) => setAlias(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Real IPS Tracking Number</Label>
              <Input placeholder="e.g. IPSXX123456789" value={realId} onChange={(e) => setRealId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Label (optional)</Label>
              <Input placeholder="e.g. John Doe – Order #42" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate({ alias, realId, label: label || undefined })}
              disabled={!alias || !realId || addMutation.isPending}
            >
              {addMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add Alias
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alias</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete alias <strong>{deleteTarget}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate({ alias: deleteTarget })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Manual Steps Tab ──────────────────────────────────────────────────────────

function ManualStepsTab() {
  const utils = trpc.useUtils();
  const { data: aliases = [] } = trpc.admin.getMappings.useQuery();
  const [selectedAlias, setSelectedAlias] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [desc, setDesc] = useState("");
  const [loc, setLoc] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const { data: steps = [], isLoading: stepsLoading } = trpc.admin.getSteps.useQuery(
    { alias: selectedAlias },
    { enabled: selectedAlias.length > 0 }
  );

  const addMutation = trpc.admin.addStep.useMutation({
    onSuccess: () => {
      toast.success("Step added.");
      utils.admin.getSteps.invalidate({ alias: selectedAlias });
      setShowAdd(false);
      setDesc(""); setLoc(""); setEventTime("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deleteStep.useMutation({
    onSuccess: () => {
      toast.success("Step deleted.");
      utils.admin.getSteps.invalidate({ alias: selectedAlias });
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add custom tracking events to any alias. These appear alongside IPS data in the timeline.
      </p>

      {/* Alias selector */}
      <div className="flex items-center gap-3">
        <Label className="shrink-0">Select Alias</Label>
        <select
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={selectedAlias}
          onChange={(e) => setSelectedAlias(e.target.value)}
        >
          <option value="">— choose an alias —</option>
          {aliases.map((a) => (
            <option key={a.alias} value={a.alias}>{a.alias}{a.label ? ` (${a.label})` : ""}</option>
          ))}
        </select>
        {selectedAlias && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Step
          </Button>
        )}
      </div>

      {selectedAlias && (
        <Card>
          <CardContent className="p-0">
            {stepsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <ListChecks className="h-8 w-8 opacity-30" />
                <p className="text-sm">No manual steps for this alias yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Event Time</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {steps.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.description}</TableCell>
                      <TableCell className="text-muted-foreground">{s.location || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(s.eventTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Step to "{selectedAlias}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Input placeholder="e.g. Package received at warehouse" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location (optional)</Label>
              <Input placeholder="e.g. Dubai, UAE" value={loc} onChange={(e) => setLoc(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Event Date & Time (optional)</Label>
              <Input type="datetime-local" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
              <p className="text-xs text-muted-foreground">Leave blank to use current time.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={() =>
                addMutation.mutate({
                  alias: selectedAlias,
                  description: desc,
                  location: loc || undefined,
                  eventTime: eventTime ? new Date(eventTime).getTime() : undefined,
                })
              }
              disabled={!desc || addMutation.isPending}
            >
              {addMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Step</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tracking step? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget !== null && deleteMutation.mutate({ id: deleteTarget })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const utils = trpc.useUtils();
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading } = trpc.admin.listUsers.useQuery();

  // Add User dialog state
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const roleMutation = trpc.admin.setUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated.");
      utils.admin.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const createMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("User created successfully.");
      utils.admin.listUsers.invalidate();
      setShowAdd(false);
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("user");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted.");
      utils.admin.listUsers.invalidate();
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage user roles and access levels.</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => utils.admin.listUsers.invalidate()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Users className="h-8 w-8 opacity-30" />
              <p className="text-sm">No users registered yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {u.id !== currentUser?.id ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={roleMutation.isPending}
                            onClick={() =>
                              roleMutation.mutate({
                                userId: u.id,
                                role: u.role === "admin" ? "user" : "admin",
                              })
                            }
                          >
                            {u.role === "admin" ? "Demote" : "Promote"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget({ id: u.id, name: u.name ?? u.email ?? String(u.id) })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">(you)</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="e.g. Jane Smith" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input type="email" placeholder="e.g. jane@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="Minimum 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "user" | "admin")}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({ name: newName, email: newEmail, password: newPassword, role: newRole })}
              disabled={!newName || !newEmail || newPassword.length < 8 || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate({ userId: deleteTarget.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Admin Panel Page ──────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = "/sign-in"}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Shield className="h-10 w-10 text-destructive mx-auto mb-2" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have admin privileges.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tracker
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-40">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
            <Badge variant="default" className="hidden sm:flex">Admin</Badge>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Management Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage tracking aliases, manual steps, and user access.
          </p>
        </div>

        <Tabs defaultValue="aliases">
          <TabsList className="mb-6">
            <TabsTrigger value="aliases" className="gap-2">
              <Map className="h-4 w-4" /> Aliases
            </TabsTrigger>
            <TabsTrigger value="steps" className="gap-2">
              <ListChecks className="h-4 w-4" /> Manual Steps
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aliases">
            <AliasesTab />
          </TabsContent>
          <TabsContent value="steps">
            <ManualStepsTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PBW Order Tracker — Admin Panel
      </footer>
    </div>
  );
}
