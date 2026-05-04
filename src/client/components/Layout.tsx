import type { ParentProps } from "solid-js";
import { A } from "@solidjs/router";

export function Layout(props: ParentProps) {
  return (
    <div class="app-shell">
      <header class="site-header">
        <div>
          <p class="eyebrow">API-first spell index</p>
          <A href="/spells" class="brand">
            Library of Netheril
          </A>
        </div>
        <nav class="top-nav">
          <A href="/spells">Spells</A>
          <A href="/spells/new" class="button-link">
            New Custom Spell
          </A>
        </nav>
      </header>
      <main class="page-container">{props.children}</main>
    </div>
  );
}
