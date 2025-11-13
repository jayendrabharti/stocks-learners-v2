"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";

export default function DashboardNewUsersTable({
  newUsers,
}: {
  newUsers: User[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          New Users
          <Link href="/admin/users">
            <Button variant={"link"}>
              View All <ExternalLinkIcon />
            </Button>
          </Link>
        </CardTitle>
        <Separator />
      </CardHeader>
      <CardContent className="flex flex-col space-y-2">
        {newUsers.length > 0 ? (
          <div>
            {newUsers.map((user) => (
              <div
                key={user.id}
                className="hover:bg-muted flex flex-col items-center gap-3 rounded-md p-3 transition-colors sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <Avatar>
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback>
                      {user.name ? user.name.charAt(0) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.email}</span>
                    <span className="text-muted-foreground text-xs">
                      {user.name || "No Name Provided"}
                    </span>
                  </div>
                </div>
                <span className="text-muted-foreground w-full text-xs sm:w-auto sm:text-right">
                  Joined {formatDistanceToNow(new Date(user.createdAt))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground mx-auto text-sm">
            No new users
          </span>
        )}
      </CardContent>
    </Card>
  );
}
