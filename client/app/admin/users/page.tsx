"use client";

import ApiClient from "@/utils/ApiClient";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Calendar,
  User,
  Shield,
  ShieldOff,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchParams } from "next/navigation";

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SortField = "email" | "name" | "createdAt" | "updatedAt" | "isAdmin";
type SortOrder = "asc" | "desc";

export default function AdminUsersPage() {
  const role_filter = useSearchParams().get("role_filter");
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  // Filters and sorting
  const [search, setSearch] = useState("");
  const [adminFilter, setAdminFilter] = useState<string>(
    role_filter === "admin" ? "true" : "all",
  );
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const debouncedSearch = useDebounce(search, 500);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      if (adminFilter !== "all") {
        params.append("isAdmin", adminFilter);
      }

      const response = await ApiClient.get(`/admin/users?${params.toString()}`);

      if (response.status === 200) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortBy,
    sortOrder,
    debouncedSearch,
    adminFilter,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage all registered users on the platform
        </p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={adminFilter}
            onValueChange={(value) => {
              setAdminFilter(value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="true">Admins Only</SelectItem>
              <SelectItem value="false">Regular Users</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchUsers} variant="outline">
            Refresh
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Total Users</div>
          <div className="mt-2 text-2xl font-bold">{pagination.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Current Page</div>
          <div className="mt-2 text-2xl font-bold">
            {pagination.page} of {pagination.totalPages || 1}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Showing</div>
          <div className="mt-2 text-2xl font-bold">{users.length} users</div>
        </Card>
      </div>

      {/* Users Table */}
      {loading ? (
        <Card className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </Card>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center">
          <Search className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p className="text-muted-foreground">No users found</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="p-4 text-left text-sm font-semibold">
                    User
                  </TableHead>
                  <TableHead className="p-4 text-left text-sm font-semibold">
                    Contact
                  </TableHead>
                  <TableHead className="p-4 text-left text-sm font-semibold">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("createdAt")}
                      className="-ml-3 h-8"
                    >
                      Joined
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="p-4 text-left text-sm font-semibold">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("isAdmin")}
                      className="-ml-3 h-8"
                    >
                      Role
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-border hover:bg-muted/30 border-t transition-colors"
                  >
                    {/* User Info */}
                    <TableCell className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={user.avatar || undefined}
                            alt={user.name || user.email}
                          />
                          <AvatarFallback>
                            {getInitials(user.name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.name || "No Name"}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Search size={12} />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell className="p-4">
                      {user.phone ? (
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          {user.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No phone
                        </span>
                      )}
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="p-4">
                      <div className="text-muted-foreground text-sm">
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell className="p-4">
                      <Badge variant={user.isAdmin ? "default" : "secondary"}>
                        {user.isAdmin ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="border-border flex items-center justify-between border-t p-4">
              <div className="text-muted-foreground text-sm">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
