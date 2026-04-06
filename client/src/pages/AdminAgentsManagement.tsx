import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Users, Lock, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { getAllAgents, updateUserPassword, getCurrentUser, getAllUsers, findUserById } from "@/lib/auth";

export default function AdminAgentsManagement() {
  const [agents, setAgents] = useState(getAllAgents());
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUser = getCurrentUser();

  const handleResetPassword = async () => {
    if (!selectedAgent || !currentUser) return;

    if (!newPassword || !confirmPassword) {
      toast.error("Please enter both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error("Password must contain uppercase, lowercase, number, and special character (@$!%*?&)");
      return;
    }

    setLoading(true);

    try {
      // Update password
      updateUserPassword(selectedAgent.id, newPassword, currentUser.id);
      
      toast.success(`Password reset for ${selectedAgent.name}`);
      setIsResetDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setSelectedAgent(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
      return;
    }

    try {
      const users = getAllUsers();
      const filteredUsers = users.filter(u => u.id !== agentId);
      localStorage.setItem("pbw_users", JSON.stringify(filteredUsers));
      
      setAgents(getAllAgents());
      toast.success("Agent deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete agent");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Agent Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage agents, reset passwords, and control access
          </p>
        </div>
      </div>

      {/* Agents Table */}
      {agents.length === 0 ? (
        <div className="p-12 text-center rounded-lg border bg-card">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No agents registered yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Agents will appear here once they register.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registered Agents ({agents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Joined</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{agent.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{agent.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="capitalize">
                          {agent.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setIsResetDialogOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Lock className="h-4 w-4" />
                            Reset Password
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteAgent(agent.id)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Agent Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedAgent?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Agent Email</Label>
              <Input value={selectedAgent?.email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must contain uppercase, lowercase, number, and special character (@$!%*?&)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsResetDialogOpen(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={loading}
              className="gap-2"
            >
              <Lock className="h-4 w-4" />
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
