import { Navigate } from "@solidjs/router";

export function RootRedirect() {
  return <Navigate href="/spells" />;
}
