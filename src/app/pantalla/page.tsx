import { headers } from "next/headers";
import { PublicScreen } from "@/components/public-screen.client";
export default async function PantallaPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  return <PublicScreen voteUrl={`${baseUrl.replace(/\/$/, "")}/votar`} />;
}
