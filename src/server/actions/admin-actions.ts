"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRequestContext } from "@/lib/request";
import {
  adminUpdateUserSchema,
  type AdminUpdateUserInput,
} from "@/lib/validations/admin";
import {
  updateUserByAdmin,
  softDeleteUserByAdmin,
  AdminError,
} from "@/server/services/admin";

export type AdminActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function updateUserAction(
  userId: string,
  input: AdminUpdateUserInput,
): Promise<AdminActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = adminUpdateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const ctx = await getRequestContext();
  try {
    await updateUserByAdmin(session.user.id, userId, parsed.data, ctx);
  } catch (e) {
    if (e instanceof AdminError) return { ok: false, message: e.message };
    throw e;
  }

  revalidatePath("/admin/users");
  return { ok: true, message: "User updated." };
}

export async function deleteUserAction(
  userId: string,
): Promise<AdminActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getRequestContext();
  try {
    await softDeleteUserByAdmin(session.user.id, userId, ctx);
  } catch (e) {
    if (e instanceof AdminError) return { ok: false, message: e.message };
    throw e;
  }

  revalidatePath("/admin/users");
  return { ok: true, message: "User deleted." };
}
