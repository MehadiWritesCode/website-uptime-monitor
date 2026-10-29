"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertPublicUrl } from "@/lib/monitor/ssrf-guard";
import { idSchema, siteSchema, type FormState } from "@/lib/validators";

export async function createSite(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = siteSchema.safeParse({
    name: formData.get("name") ?? "",
    baseUrl: formData.get("baseUrl") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let baseUrl: string;
  try {
    // reject localhost / private addresses up front (same guard the checker uses)
    const url = await assertPublicUrl(parsed.data.baseUrl);
    baseUrl = url.origin + url.pathname.replace(/\/+$/, "");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid URL" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sites")
    .insert({ name: parsed.data.name, base_url: baseUrl })
    .select("id")
    .single();

  if (error || !data)
    return { error: "Could not create the site. Please try again." };

  revalidatePath("/sites");
  redirect(`/sites?open=${data.id}`);
}

export async function deleteSite(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("sites").delete().eq("id", id.data);
  if (error) return;

  revalidatePath("/sites");
  redirect("/sites");
}
