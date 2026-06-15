import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type User } from "@/api/index";
import { MapPin, Briefcase, Trash2, User as UserIcon } from "lucide-react";

interface UserListProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

function UserCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl border bg-card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export default function UserList({
  users,
  loading,
  error,
  onDelete,
  deletingId,
}: UserListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <UserCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p className="font-medium">{error}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Make sure the API server is running and MONGODB_URI is set.
        </p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <UserIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No users yet</p>
        <p className="text-sm mt-1">Create one using the form above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <div
          key={user._id}
          className="group relative p-5 rounded-2xl border bg-card hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-semibold text-sm">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{user.fullName}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(user._id)}
              disabled={deletingId === user._id}
              aria-label={`Delete ${user.fullName}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {user.location}
            </span>
            {user.companyName && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {user.companyName}
              </span>
            )}
          </div>

          <div className="mt-3">
            <Badge
              variant={user.role === "recruiter" ? "default" : "secondary"}
              className="text-xs"
            >
              {user.role === "recruiter" ? "Recruiter" : "Job Seeker"}
            </Badge>
          </div>

          {user.skills && user.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-xs"
                >
                  {skill}
                </span>
              ))}
              {user.skills.length > 3 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{user.skills.length - 3}
                </span>
              )}
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
