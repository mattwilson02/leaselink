"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTenantSchema } from "@leaselink/shared";
import { useCreateTenant } from "@/hooks/use-tenants";
import { toast } from "sonner";

type InviteTenantFormValues = z.infer<typeof createTenantSchema>;

export function InviteTenantForm() {
  const router = useRouter();
  const createTenant = useCreateTenant();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InviteTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
    },
  });

  function onSubmit(data: InviteTenantFormValues) {
    createTenant.mutate(data, {
      onSuccess: () => {
        toast.success("Tenant invited successfully");
        router.push("/tenants");
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Failed to invite tenant";
        if (message.includes("already exists") || message.includes("409")) {
          setError("email", {
            message: "A tenant with this email already exists",
          });
        } else {
          toast.error(message);
        }
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="John Doe" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+1 (555) 000-0000"
            {...register("phoneNumber")}
          />
          {errors.phoneNumber && (
            <p className="text-sm text-destructive">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/tenants")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createTenant.isPending}>
          {createTenant.isPending ? "Inviting..." : "Invite Tenant"}
        </Button>
      </div>
    </form>
  );
}
