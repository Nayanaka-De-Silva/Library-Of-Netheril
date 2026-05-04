export function SpellBadge(props: { source: "official" | "custom" }) {
  return <span class={`badge badge-${props.source}`}>{props.source === "official" ? "Official" : "Custom"}</span>;
}
