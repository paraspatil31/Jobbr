import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { MapPin, Users as UsersIcon, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import UserForm from "@/components/users/UserForm";
import UserList from "@/components/users/UserList";
import { usersApi, type User } from "@/api/index";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.list();
      setUsers(data.users);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch users"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await usersApi.delete(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" aria-label="Back to home">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="font-extrabold tracking-tight">JobNearby</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UsersIcon className="w-4 h-4" />
            <span className="hidden sm:inline">User Management</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Full CRUD demo — create, list, and delete users via the REST API.
          </p>
        </div>

        <section className="bg-card border rounded-3xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Create New User</h2>
          <UserForm onSuccess={fetchUsers} />
        </section>

        <Separator className="mb-8" />

        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">
              All Users
              {!loading && !error && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({users.length})
                </span>
              )}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <UserList
            users={users}
            loading={loading}
            error={error}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </section>
      </main>
    </div>
  );
}
