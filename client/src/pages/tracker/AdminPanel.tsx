import { useState } from "react";
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
  Map,
  ListChecks,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface Alias {
  id: string;
  alias: string;
  realId: string;
  label?: string;
  createdAt: string;
}

interface TrackingStep {
  id: string;
  alias: string;
  description: string;
  location: string;
  eventTime: string;
}

function AliasesTab() {
  const [aliases, setAliases] = useState<Alias[]>([
    {
      id: "1",
      alias: "PBW-001",
      realId: "IPSXX123456789",
      label: "John Doe - Order #42",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      alias: "PBW-002",
      realId: "IPSXX987654321",
      label: "Jane Smith - Order #43",
      createdAt: new Date().toISOString(),
    },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [alias, setAlias] = useState("");
  const [realId, setRealId] = useState("");
  const [label, setLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleAddAlias = () => {
    if (!alias || !realId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newAlias: Alias = {
      id: Date.now().toString(),
      alias,
      realId,
      label: label || undefined,
      createdAt: new Date().toISOString(),
    };

    setAliases([...aliases, newAlias]);
    toast.success("Alias added successfully");
    setShowAdd(false);
    setAlias("");
    setRealId("");
    setLabel("");
  };

  const handleDeleteAlias = (aliasId: string) => {
    setAliases(aliases.filter((a) => a.id !== aliasId));
    toast.success("Alias deleted");
    setDeleteTarget(null);
  };

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
          {aliases.length === 0 ? (
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
                        onClick={() => setDeleteTarget(a.id)}
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

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tracking Alias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Customer-facing Alias</Label>
              <Input
                placeholder="e.g. PBW-001"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Real IPS Tracking Number</Label>
              <Input
                placeholder="e.g. IPSXX123456789"
                value={realId}
                onChange={(e) => setRealId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Label (optional)</Label>
              <Input
                placeholder="e.g. John Doe – Order #42"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAlias}>Add Alias</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alias</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this alias? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDeleteAlias(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ManualStepsTab() {
  const [steps, setSteps] = useState<TrackingStep[]>([
    {
      id: "1",
      alias: "PBW-001",
      description: "Package picked up",
      location: "New York, NY",
      eventTime: new Date().toISOString(),
    },
  ]);

  const [selectedAlias, setSelectedAlias] = useState("PBW-001");
  const [showAdd, setShowAdd] = useState(false);
  const [desc, setDesc] = useState("");
  const [loc, setLoc] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filteredSteps = steps.filter((s) => s.alias === selectedAlias);

  const handleAddStep = () => {
    if (!desc || !loc || !eventTime) {
      toast.error("Please fill in all fields");
      return;
    }

    const newStep: TrackingStep = {
      id: Date.now().toString(),
      alias: selectedAlias,
      description: desc,
      location: loc,
      eventTime,
    };

    setSteps([...steps, newStep]);
    toast.success("Step added successfully");
    setShowAdd(false);
    setDesc("");
    setLoc("");
    setEventTime("");
  };

  const handleDeleteStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
    toast.success("Step deleted");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add custom tracking events to any alias. These appear alongside IPS data in the timeline.
      </p>

      <div className="flex items-center gap-3">
        <Label className="shrink-0">Select Alias</Label>
        <select
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={selectedAlias}
          onChange={(e) => setSelectedAlias(e.target.value)}
        >
          <option value="PBW-001">PBW-001 (John Doe - Order #42)</option>
          <option value="PBW-002">PBW-002 (Jane Smith - Order #43)</option>
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
            {filteredSteps.length === 0 ? (
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
                  {filteredSteps.map((step) => (
                    <TableRow key={step.id}>
                      <TableCell className="font-medium">{step.description}</TableCell>
                      <TableCell className="text-muted-foreground">{step.location}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(step.eventTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(step.id)}
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

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tracking Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Package picked up"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                placeholder="e.g. New York, NY"
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Event Time</Label>
              <Input
                type="datetime-local"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStep}>Add Step</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
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
              onClick={() => deleteTarget && handleDeleteStep(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Support" | "Agent";
  status: "Active" | "Inactive";
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "Admin User", email: "admin@pbw.com", role: "Admin", status: "Active" },
    { id: "2", name: "Support Team", email: "support@pbw.com", role: "Support", status: "Active" },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Admin" | "Support" | "Agent">("Agent");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleAddUser = () => {
    if (!name || !email) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role,
      status: "Active",
    };

    setUsers([...users, newUser]);
    toast.success("User added successfully");
    setShowAdd(false);
    setName("");
    setEmail("");
    setRole("Agent");
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId));
    toast.success("User deleted");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage user accounts and permissions.</p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-600">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              <Input
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="e.g. john@pbw.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={role}
                onChange={(e) => setRole(e.target.value as "Admin" | "Support" | "Agent")}
              >
                <option value="Agent">Agent</option>
                <option value="Support">Support</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Alert */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDeleteUser(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">PBW Tracker Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/tracker")}
            >
              Back to Tracker
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/")}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Exit Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage tracking aliases, manual steps, and users</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="aliases" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="aliases">
                <Map className="h-4 w-4 mr-2" />
                Aliases
              </TabsTrigger>
              <TabsTrigger value="steps">
                <ListChecks className="h-4 w-4 mr-2" />
                Manual Steps
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
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
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PBW Order Tracker Admin. All rights reserved.
      </footer>
    </div>
  );
}
