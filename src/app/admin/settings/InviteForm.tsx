import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteUser } from "@/lib/actions/invite-user";

export default function InviteForm() {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="font-semibold text-gray-900">Invite a team member</h2>
          <p className="mt-1 text-sm text-gray-500">Create an invite link for a new admin or editor.</p>
        </div>

        <form action={inviteUser} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" placeholder="staff@test.com" required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
              defaultValue="ADMIN"
            >
              <option value="ADMIN">Admin</option>
              <option value="EDITOR">Editor</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>

          <Button type="submit" className="w-full">Create Invite</Button>
        </form>
      </CardContent>
    </Card>
  );
}