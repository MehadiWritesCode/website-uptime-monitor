"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { endpointSchema, idSchema, type FormState } from "@/lib/validators";

export async function createEndpoint(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const siteId = idSchema.safeParse(formData.get("siteId"));
  if (!siteId.success) return { error: "Invalid site" };

  const parsed = endpointSchema.safeParse({
    path: formData.get("path") ?? "",
    method: formData.get("method") ?? "GET",
    intervalMinutes: formData.get("intervalMinutes"),
    timeoutSeconds: formData.get("timeoutSeconds"),
    expectedStatus: formData.get("expectedStatus"),
    failureThreshold: formData.get("failureThreshold"),
    keyword: formData.get("keyword") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("endpoints").insert({
    site_id: siteId.data,
    path: d.path,
    method: d.method,
    interval_minutes: d.intervalMinutes,
    timeout_seconds: d.timeoutSeconds,
    expected_status: d.expectedStatus,
    failure_threshold: d.failureThreshold,
    keyword: d.keyword,
  });

  if (error) {
    // 23505 = unique (site_id, method, path)
    return {
      error:
        error.code === "23505"
          ? `${d.method} ${d.path} is already monitored for this site`
          : "Could not add the endpoint. Please try again.",
    };
  }

  revalidatePath("/sites");
  revalidatePath(`/sites/${siteId.data}`);
  return { ok: true };
}

export async function toggleEndpoint(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("id"));
  const siteId = idSchema.safeParse(formData.get("siteId"));
  if (!id.success || !siteId.success) return;

  const active = formData.get("active") === "true";

  const supabase = await createClient();
  await supabase
    .from("endpoints")
    .update({ is_active: active })
    .eq("id", id.data);

  revalidatePath("/sites");
  revalidatePath(`/sites/${siteId.data}`);
}

export async function deleteEndpoint(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("id"));
  const siteId = idSchema.safeParse(formData.get("siteId"));
  if (!id.success || !siteId.success) return;

  const supabase = await createClient();
  await supabase.from("endpoints").delete().eq("id", id.data);

  revalidatePath("/sites");
  revalidatePath(`/sites/${siteId.data}`);
}

const settingsSchema = endpointSchema.pick({
  intervalMinutes: true,
  timeoutSeconds: true,
  expectedStatus: true,
  failureThreshold: true,
  keyword: true,
});

export async function updateEndpoint(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = idSchema.safeParse(formData.get("id"));
  const siteId = idSchema.safeParse(formData.get("siteId"));
  if (!id.success || !siteId.success) return { error: "Invalid endpoint" };

  const parsed = settingsSchema.safeParse({
    intervalMinutes: formData.get("intervalMinutes"),
    timeoutSeconds: formData.get("timeoutSeconds"),
    expectedStatus: formData.get("expectedStatus"),
    failureThreshold: formData.get("failureThreshold"),
    keyword: formData.get("keyword") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("endpoints")
    .update({
      interval_minutes: d.intervalMinutes,
      timeout_seconds: d.timeoutSeconds,
      expected_status: d.expectedStatus,
      failure_threshold: d.failureThreshold,
      keyword: d.keyword,
    })
    .eq("id", id.data)
    .select("id");

  if (error || !data || data.length === 0) {
    return { error: "Could not save changes. Please try again." };
  }

  revalidatePath("/sites");
  revalidatePath(`/sites/${siteId.data}`);
  revalidatePath(`/sites/${siteId.data}/endpoints/${id.data}`);
  return { ok: true };
}
