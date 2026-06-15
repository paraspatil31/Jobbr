import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersApi, type CreateUserInput } from "@/api/index";

interface UserFormProps {
  onSuccess: () => void;
}

const EMPTY: CreateUserInput = {
  fullName: "",
  email: "",
  password: "",
  role: "seeker",
  location: "",
  companyName: "",
};

export default function UserForm({ onSuccess }: UserFormProps) {
  const [form, setForm] = useState<CreateUserInput>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CreateUserInput>(key: K, value: CreateUserInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await usersApi.create(form);
      setForm(EMPTY);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="uf-name">Full Name</Label>
          <Input
            id="uf-name"
            placeholder="Jane Doe"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="uf-email">Email</Label>
          <Input
            id="uf-email"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="uf-password">Password</Label>
          <Input
            id="uf-password"
            type="password"
            placeholder="Min 8 characters"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="uf-location">Location</Label>
          <Input
            id="uf-location"
            placeholder="San Francisco, CA"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="uf-role">Role</Label>
          <Select
            value={form.role}
            onValueChange={(v) => set("role", v as "seeker" | "recruiter")}
          >
            <SelectTrigger id="uf-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seeker">Job Seeker</SelectItem>
              <SelectItem value="recruiter">Recruiter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.role === "recruiter" && (
          <div className="space-y-1.5">
            <Label htmlFor="uf-company">Company Name</Label>
            <Input
              id="uf-company"
              placeholder="Acme Corp"
              value={form.companyName ?? ""}
              onChange={(e) => set("companyName", e.target.value)}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating…" : "Create User"}
      </Button>
    </form>
  );
}
