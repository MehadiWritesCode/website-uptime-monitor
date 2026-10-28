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

  revalidatePath(`/sites/${siteId.data}`);
}

export async function deleteEndpoint(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("id"));
  const siteId = idSchema.safeParse(formData.get("siteId"));
  if (!id.success || !siteId.success) return;

  const supabase = await createClient();
  await supabase.from("endpoints").delete().eq("id", id.data);

  revalidatePath(`/sites/${siteId.data}`);
}
