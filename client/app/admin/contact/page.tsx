"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ApiClient from "@/utils/ApiClient";
import { toast } from "sonner";
import {
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Calendar,
  X,
  Check,
  Clock,
  Archive,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

interface ContactForm {
  id: string;
  email: string;
  name: string;
  mobile: string;
  message: string;
  userId: string | null;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminContactFormsPage() {
  const status = useSearchParams().get("status");
  const [forms, setForms] = useState<ContactForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(
    status ? "PENDING" : "",
  );
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedForm, setSelectedForm] = useState<ContactForm | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchForms();
  }, [pagination.page, statusFilter]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await ApiClient.get("/contact", { params });

      if (response.data.success) {
        setForms(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      console.error("Error fetching contact forms:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch contact forms",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (formId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      const response = await ApiClient.put(`/contact/${formId}`, {
        status: newStatus,
        adminNotes: adminNotes || undefined,
      });

      if (response.data.success) {
        toast.success("Status updated successfully");
        fetchForms();
        setSelectedForm(null);
        setAdminNotes("");
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteForm = async (formId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this contact form? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await ApiClient.delete(`/contact/${formId}`);

      if (response.data.success) {
        toast.success("Contact form deleted successfully");
        fetchForms();
        setSelectedForm(null);
      }
    } catch (error: any) {
      console.error("Error deleting form:", error);
      toast.error(error.response?.data?.message || "Failed to delete form");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-500";
      case "IN_PROGRESS":
        return "bg-blue-500/10 text-blue-500";
      case "RESOLVED":
        return "bg-green-500/10 text-green-500";
      case "CLOSED":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock size={12} />;
      case "IN_PROGRESS":
        return <MessageSquare size={12} />;
      case "RESOLVED":
        return <Check size={12} />;
      case "CLOSED":
        return <Archive size={12} />;
      default:
        return <MessageSquare size={12} />;
    }
  };

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Contact Forms</h1>
        <p className="text-muted-foreground mt-2">
          Manage and respond to user inquiries
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="status-filter">Filter by Status</Label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="bg-background border-input ring-offset-background focus-visible:ring-ring mt-2 flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-6">
            <Button onClick={fetchForms} variant="outline">
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Total Forms</div>
          <div className="mt-2 text-2xl font-bold">{pagination.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Pending</div>
          <div className="mt-2 text-2xl font-bold text-yellow-500">
            {forms.filter((f) => f.status === "PENDING").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">In Progress</div>
          <div className="mt-2 text-2xl font-bold text-blue-500">
            {forms.filter((f) => f.status === "IN_PROGRESS").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Resolved</div>
          <div className="mt-2 text-2xl font-bold text-green-500">
            {forms.filter((f) => f.status === "RESOLVED").length}
          </div>
        </Card>
      </div>

      {/* Contact Forms List */}
      {loading ? (
        <Card className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </Card>
      ) : forms.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p className="text-muted-foreground">No contact forms found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => (
            <Card key={form.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{form.name}</h3>
                      <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Mail size={14} />
                          {form.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {form.mobile}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(form.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(form.status)}`}
                    >
                      {getStatusIcon(form.status)}
                      {form.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="bg-muted/30 mb-4 rounded-lg p-4">
                    <p className="text-sm leading-relaxed">{form.message}</p>
                  </div>

                  {/* Admin Notes */}
                  {form.adminNotes && (
                    <div className="bg-primary/5 border-primary/20 mb-4 rounded-lg border p-4">
                      <div className="mb-2 text-xs font-semibold uppercase">
                        Admin Notes:
                      </div>
                      <p className="text-sm leading-relaxed">
                        {form.adminNotes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedForm(form);
                        setAdminNotes(form.adminNotes || "");
                      }}
                    >
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteForm(form.id)}
                      disabled={actionLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={
                      pagination.page === pagination.totalPages || loading
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Manage Form Modal */}
      {selectedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <div className="border-border flex items-center justify-between border-b p-6">
              <h2 className="text-xl font-bold">Manage Contact Form</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedForm(null);
                        setAdminNotes("");
                      }}
                      aria-label="Close dialog"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="space-y-6 p-6">
              {/* Contact Info */}
              <div>
                <h3 className="mb-3 font-semibold">Contact Information</h3>
                <div className="bg-muted/30 space-y-2 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-medium">
                      Name:
                    </span>
                    <span className="text-sm">{selectedForm.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-medium">
                      Email:
                    </span>
                    <span className="text-sm">{selectedForm.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-medium">
                      Mobile:
                    </span>
                    <span className="text-sm">{selectedForm.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-medium">
                      Submitted:
                    </span>
                    <span className="text-sm">
                      {formatDate(selectedForm.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <h3 className="mb-3 font-semibold">Message</h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">
                    {selectedForm.message}
                  </p>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <Label htmlFor="status-update">Update Status</Label>
                <select
                  id="status-update"
                  defaultValue={selectedForm.status}
                  onChange={(e) =>
                    handleStatusChange(selectedForm.id, e.target.value)
                  }
                  disabled={actionLoading}
                  className="bg-background border-input ring-offset-background focus-visible:ring-ring mt-2 flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add notes about this inquiry..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() =>
                    handleStatusChange(selectedForm.id, selectedForm.status)
                  }
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedForm(null);
                    setAdminNotes("");
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
