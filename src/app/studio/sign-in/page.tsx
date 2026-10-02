import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PasscodeForm } from "@/components/PasscodeForm";
import { isOrganizer } from "@/lib/auth";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Organizer sign in — Pravaha", robots: { index: false, follow: false } };

export default async function SignInPage() {
  if (await isOrganizer()) redirect("/studio");
  return <PasscodeForm demo={env().STUDIO_DEMO === "on"} />;
}
