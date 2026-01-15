"use client";

import ApiClient from "@/utils/ApiClient";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Wallet,
  Plus,
  Minus,
  IndianRupee,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SortField = "email" | "name" | "createdAt" | "updatedAt" | "isAdmin";
type SortOrder = "asc" | "desc";

interface UserAccount {
  id: string;
  cash: number;
  usedMargin: number;
  availableBalance: number;
}

interface UserDetails {
  user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    isAdmin: boolean;
    createdAt: string;
  };
  account: UserAccount | null;
  stats: {
    openPositions: number;
    totalTransactions: number;
  };
}

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

  // Fund adjustment dialog state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [adjustType, setAdjustType] = useState<"ADD" | "DEDUCT">("ADD");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

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

  // Fund adjustment functions
  const openFundDialog = async (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
    setIsLoadingDetails(true);
    setAdjustAmount("");
    setAdjustReason("");
    setAdjustType("ADD");
    setUserDetails(null);

    try {
      const response = await ApiClient.get(`/admin/users/${user.id}/account`);
      if (response.status === 200) {
        setUserDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user account details");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAdjustFunds = async () => {
    if (!selectedUser || !adjustAmount || !adjustReason) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    setIsAdjusting(true);
    try {
      const response = await ApiClient.post(
        `/admin/users/${selectedUser.id}/funds/adjust`,
        {
          amount,
          type: adjustType,
          reason: adjustReason,
        },
      );

      if (response.status === 200) {
        toast.success(
          `Successfully ${adjustType === "ADD" ? "added" : "deducted"} ₹${amount.toLocaleString("en-IN")} ${adjustType === "ADD" ? "to" : "from"} ${selectedUser.name || selectedUser.email}'s account`,
        );
        // Refresh the user details to show updated balance
        setAdjustAmount("");
        setAdjustReason("");
        // Re-fetch user details to update displayed balance
        const refreshResponse = await ApiClient.get(
          `/admin/users/${selectedUser.id}/account`,
        );
        if (refreshResponse.status === 200) {
          setUserDetails(refreshResponse.data);
        }
        fetchUsers();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to adjust funds");
    } finally {
      setIsAdjusting(false);
    }
  };

  const closeFundDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setUserDetails(null);
    setAdjustAmount("");
    setAdjustReason("");
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
          <div className="flex gap-2">
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
            <Button
              onClick={fetchUsers}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-muted mb-4 rounded-full p-4">
              <User className="text-muted-foreground h-12 w-12" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              {debouncedSearch ? "No users found" : "No users yet"}
            </h3>
            <p className="text-muted-foreground max-w-sm text-center">
              {debouncedSearch
                ? "Try adjusting your search or filter criteria"
                : "Users will appear here once they sign up"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Mobile View - Card Layout */}
          <div className="md:hidden">
            {users.map((user) => (
              <div key={user.id} className="border-b p-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <Avatar className="shrink-0">
                    <AvatarImage
                      src={user.avatar || undefined}
                      alt={user.name || user.email}
                    />
                    <AvatarFallback>
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-medium">
                        {user.name || "No Name"}
                      </div>
                      <Badge
                        variant={user.isAdmin ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {user.isAdmin ? "Admin" : "User"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-0.5 truncate text-sm">
                      {user.email}
                    </div>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {formatDate(user.createdAt)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openFundDialog(user)}
                      className="mt-3 gap-2"
                    >
                      <Wallet className="h-4 w-4" />
                      Manage Funds
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table Layout */}
          <div className="hidden overflow-x-auto md:block">
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
                  <TableHead className="p-4 text-left text-sm font-semibold">
                    Actions
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

                    {/* Actions */}
                    <TableCell className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openFundDialog(user)}
                        className="gap-2"
                      >
                        <Wallet className="h-4 w-4" />
                        Manage Funds
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="border-border flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted-foreground text-center text-sm sm:text-left">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} users
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <span className="text-muted-foreground px-2 text-sm">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Fund Adjustment Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeFundDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Manage User Funds
            </DialogTitle>
            <DialogDescription>
              Add or deduct funds from user&apos;s main account
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
                <Avatar>
                  <AvatarImage
                    src={selectedUser.avatar || undefined}
                    alt={selectedUser.name || selectedUser.email}
                  />
                  <AvatarFallback>
                    {getInitials(selectedUser.name, selectedUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {selectedUser.name || "No Name"}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {selectedUser.email}
                  </div>
                </div>
              </div>

              {/* Current Balance */}
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : userDetails ? (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="text-muted-foreground mb-1 text-sm">
                    Current Main Account Balance
                  </div>
                  <div className="flex items-center gap-1 text-2xl font-bold">
                    <IndianRupee className="h-5 w-5" />
                    {(userDetails.account?.cash ?? 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-center text-sm">
                  Could not load account details
                </div>
              )}

              {/* Adjustment Form */}
              <div className="space-y-4">
                {/* Type Selection */}
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={adjustType === "ADD" ? "default" : "outline"}
                      onClick={() => setAdjustType("ADD")}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Funds
                    </Button>
                    <Button
                      type="button"
                      variant={
                        adjustType === "DEDUCT" ? "destructive" : "outline"
                      }
                      onClick={() => setAdjustType("DEDUCT")}
                      className="gap-2"
                    >
                      <Minus className="h-4 w-4" />
                      Deduct
                    </Button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="pl-10"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Required)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for this adjustment..."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeFundDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAdjustFunds}
              disabled={isAdjusting || !adjustAmount || !adjustReason}
              variant={adjustType === "DEDUCT" ? "destructive" : "default"}
            >
              {isAdjusting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {adjustType === "ADD" ? (
                    <Plus className="mr-2 h-4 w-4" />
                  ) : (
                    <Minus className="mr-2 h-4 w-4" />
                  )}
                  {adjustType === "ADD" ? "Add Funds" : "Deduct Funds"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
