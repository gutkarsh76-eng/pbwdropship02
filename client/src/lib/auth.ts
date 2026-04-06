// Secure Authentication Utility
// Default admin credentials (hashed in production)
const DEFAULT_ADMIN = {
  email: "probadmintonworld@proton.me",
  password: "prbw@Admin@@1",
  role: "admin" as const,
};

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "agent";
  createdAt: number;
}

interface StoredUser extends User {
  passwordHash?: string;
}

// Simple password hashing (in production, use bcrypt on backend)
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Initialize default admin - ALWAYS ensure admin exists
function ensureDefaultAdmin(users: StoredUser[]): StoredUser[] {
  const adminExists = users.some(
    (u) => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()
  );
  if (!adminExists) {
    const defaultAdmin: StoredUser = {
      id: "admin_default",
      email: DEFAULT_ADMIN.email,
      name: "PBW Admin",
      role: "admin",
      createdAt: Date.now(),
      passwordHash: hashPassword(DEFAULT_ADMIN.password),
    };
    users.unshift(defaultAdmin);
    localStorage.setItem("pbw_users", JSON.stringify(users));
  }
  return users;
}

// Get all users from localStorage
export function getAllUsers(): StoredUser[] {
  const usersJson = localStorage.getItem("pbw_users");
  let users: StoredUser[] = [];
  if (usersJson) {
    try {
      users = JSON.parse(usersJson);
    } catch {
      users = [];
    }
  }
  // Always ensure default admin exists
  users = ensureDefaultAdmin(users);
  return users;
}

// Find user by email
export function findUserByEmail(email: string): StoredUser | undefined {
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// Find user by ID
export function findUserById(id: string): StoredUser | undefined {
  const users = getAllUsers();
  return users.find((u) => u.id === id);
}

// Create new user
export function createUser(
  email: string,
  name: string,
  password: string,
  role: "admin" | "agent" = "agent"
): StoredUser {
  const users = getAllUsers();

  // Check if user already exists
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("User already exists");
  }

  const newUser: StoredUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    name,
    role,
    createdAt: Date.now(),
    passwordHash: hashPassword(password),
  };

  users.push(newUser);
  localStorage.setItem("pbw_users", JSON.stringify(users));
  return newUser;
}

// Update user password (only admin can change agent passwords)
export function updateUserPassword(
  userId: string,
  newPassword: string,
  adminId: string
): boolean {
  const users = getAllUsers();
  const admin = findUserById(adminId);

  if (!admin || admin.role !== "admin") {
    throw new Error("Only admins can change passwords");
  }

  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    throw new Error("User not found");
  }

  users[userIndex].passwordHash = hashPassword(newPassword);
  localStorage.setItem("pbw_users", JSON.stringify(users));
  return true;
}

// Authenticate user
export function authenticateUser(
  email: string,
  password: string
): StoredUser | null {
  const user = findUserByEmail(email);
  if (!user || !user.passwordHash) {
    return null;
  }

  if (verifyPassword(password, user.passwordHash)) {
    return user;
  }

  return null;
}

// Get current logged-in user
// Uses "user" key to match useAuth.ts hook
export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

// Set current logged-in user
// Uses "user" key to match useAuth.ts hook
export function setCurrentUser(user: User): void {
  localStorage.setItem("user", JSON.stringify(user));
}

// Logout user
export function logoutUser(): void {
  localStorage.removeItem("user");
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// Check if current user is admin
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === "admin";
}

// Get all agents (admin only)
export function getAllAgents(): User[] {
  const users = getAllUsers();
  return users
    .filter((u) => u.role === "agent")
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
    }));
}

// Initialize auth system on import - ensures default admin always exists
getAllUsers();
