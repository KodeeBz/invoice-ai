"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type SettingsFormValues = {
  name: string;
  email: string;
  businessName: string;
  address: string;
  phone: string;
  taxNumber: string;
  currency: string;
  businessLogo: string;
  defaultTaxRate: number;
  defaultPaymentTerms: string;
  defaultDueDays: number;
  aiContext: string;
};

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const currencies = ["USD", "EUR", "GBP", "PKR", "INR", "AED", "CAD", "AUD"];

export default function SettingsPage() {
  const { update } = useSession();
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");

  const settingsForm = useForm<SettingsFormValues>({
    defaultValues: {
      name: "",
      email: "",
      businessName: "",
      address: "",
      phone: "",
      taxNumber: "",
      currency: "USD",
      businessLogo: "",
      defaultTaxRate: 0,
      defaultPaymentTerms: "Payment due within 30 days. Thank you for your business.",
      defaultDueDays: 30,
      aiContext: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const res = await fetch("/api/user/settings");
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load settings");
        }

        if (!isMounted) return;

        settingsForm.reset({
          name: json.data.name ?? "",
          email: json.data.email ?? "",
          businessName: json.data.businessName ?? "",
          address: json.data.address ?? "",
          phone: json.data.phone ?? "",
          taxNumber: json.data.taxNumber ?? "",
          currency: json.data.currency ?? "USD",
          businessLogo: json.data.businessLogo ?? "",
          defaultTaxRate: json.data.defaultTaxRate ?? 0,
          defaultPaymentTerms:
            json.data.defaultPaymentTerms ??
            "Payment due within 30 days. Thank you for your business.",
          defaultDueDays: json.data.defaultDueDays ?? 30,
          aiContext: json.data.aiContext ?? "",
        });

        setLogoPreview(json.data.businessLogo ?? "");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load settings");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [settingsForm]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be under 5MB");
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to upload logo");
      }

      settingsForm.setValue("businessLogo", json.data.url, { shouldDirty: true });
      setLogoPreview(json.data.url);
      toast.success("Logo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    settingsForm.setValue("businessLogo", "", { shouldDirty: true });
    setLogoPreview("");
  };

  const onSaveSettings = settingsForm.handleSubmit(async (values) => {
    setSavingSettings(true);
    try {
      const payload = {
        name: values.name,
        businessName: values.businessName,
        address: values.address,
        phone: values.phone,
        taxNumber: values.taxNumber,
        currency: values.currency,
        businessLogo: values.businessLogo,
        defaultTaxRate: Number(values.defaultTaxRate),
        defaultPaymentTerms: values.defaultPaymentTerms,
        defaultDueDays: Number(values.defaultDueDays),
        aiContext: values.aiContext,
      };

      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save settings");
      }

      settingsForm.reset({
        name: json.data.name ?? "",
        email: json.data.email ?? "",
        businessName: json.data.businessName ?? "",
        address: json.data.address ?? "",
        phone: json.data.phone ?? "",
        taxNumber: json.data.taxNumber ?? "",
        currency: json.data.currency ?? "USD",
        businessLogo: json.data.businessLogo ?? "",
        defaultTaxRate: json.data.defaultTaxRate ?? 0,
        defaultPaymentTerms:
          json.data.defaultPaymentTerms ??
          "Payment due within 30 days. Thank you for your business.",
        defaultDueDays: json.data.defaultDueDays ?? 30,
        aiContext: json.data.aiContext ?? "",
      });

      setLogoPreview(json.data.businessLogo ?? "");
      await update?.({
        name: json.data.name,
        businessName: json.data.businessName,
      });

      toast.success("Settings updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  });

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to change password");
      }

      passwordForm.reset();
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your profile, business details, and password
        </p>
      </div>

      <form onSubmit={onSaveSettings} className="space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="settings-name"
              label="Name"
              placeholder="Your full name"
              error={settingsForm.formState.errors.name?.message}
              {...settingsForm.register("name", { required: "Name is required" })}
            />
            <Input
              id="settings-email"
              label="Email"
              disabled
              {...settingsForm.register("email")}
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Business Information
          </h2>

          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Business Logo</p>
            <div className="flex flex-wrap items-center gap-3">
              {logoPreview ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt="Business logo preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 dark:border-slate-600">
                  No logo
                </div>
              )}

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-800">
                <Upload className="h-4 w-4" />
                {uploadingLogo ? "Uploading..." : "Upload"}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>

              {logoPreview && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="settings-business-name"
              label="Business Name"
              placeholder="Acme Studio"
              {...settingsForm.register("businessName")}
            />
            <Input
              id="settings-phone"
              label="Phone"
              placeholder="+1 234 567 890"
              {...settingsForm.register("phone")}
            />
            <Input
              id="settings-address"
              label="Address"
              placeholder="123 Main St, City"
              {...settingsForm.register("address")}
            />
            <Input
              id="settings-tax-number"
              label="Tax Number"
              placeholder="VAT / Tax ID"
              {...settingsForm.register("taxNumber")}
            />
            <div className="space-y-1">
              <label
                htmlFor="settings-currency"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Currency
              </label>
              <select
                id="settings-currency"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
                {...settingsForm.register("currency", { required: "Currency is required" })}
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
              {settingsForm.formState.errors.currency?.message && (
                <p className="text-sm text-danger">{settingsForm.formState.errors.currency.message}</p>
              )}
            </div>
            <Input
              id="settings-default-tax-rate"
              label="Default Tax Rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              error={settingsForm.formState.errors.defaultTaxRate?.message}
              {...settingsForm.register("defaultTaxRate", {
                valueAsNumber: true,
                min: { value: 0, message: "Tax rate cannot be negative" },
                max: { value: 100, message: "Tax rate cannot exceed 100" },
              })}
            />
            <Input
              id="settings-default-due-days"
              label="Default Due Days"
              type="number"
              min="1"
              max="365"
              error={settingsForm.formState.errors.defaultDueDays?.message}
              {...settingsForm.register("defaultDueDays", {
                valueAsNumber: true,
                min: { value: 1, message: "Due days must be at least 1" },
                max: { value: 365, message: "Due days must be 365 or less" },
              })}
            />
          </div>

          <div className="mt-4 space-y-1">
            <label
              htmlFor="settings-default-payment-terms"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Default Payment Terms
            </label>
            <textarea
              id="settings-default-payment-terms"
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
              {...settingsForm.register("defaultPaymentTerms", {
                required: "Default payment terms are required",
              })}
            />
            {settingsForm.formState.errors.defaultPaymentTerms?.message && (
              <p className="text-sm text-danger">
                {settingsForm.formState.errors.defaultPaymentTerms.message}
              </p>
            )}
          </div>

          <div className="mt-4 space-y-1">
            <label
              htmlFor="settings-ai-context"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              AI Context (About your business/experience)
            </label>
            <textarea
              id="settings-ai-context"
              rows={4}
              placeholder="Write 2-3 sentences about your experience and skills."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
              {...settingsForm.register("aiContext")}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={savingSettings}>
              Save Settings
            </Button>
          </div>
        </Card>
      </form>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
        <form onSubmit={onChangePassword} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="settings-current-password"
            label="Current Password"
            type="password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register("currentPassword", {
              required: "Current password is required",
            })}
          />
          <Input
            id="settings-new-password"
            label="New Password"
            type="password"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register("newPassword", {
              required: "New password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
          />
          <Input
            id="settings-confirm-password"
            label="Confirm New Password"
            type="password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register("confirmPassword", {
              required: "Please confirm your new password",
              validate: (value) =>
                value === passwordForm.getValues("newPassword") || "Passwords do not match",
            })}
          />

          <div className="sm:col-span-2">
            <Button type="submit" loading={savingPassword}>
              Change Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
