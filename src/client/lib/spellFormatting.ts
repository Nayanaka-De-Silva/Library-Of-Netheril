// Produces a human-readable level-and-school label: "3rd-level evocation" or "evocation cantrip".
export function formatSpellLevelAndSchool(level: number, school: string): string {
  const normalizedSchool = school.toLowerCase();

  if (level === 0) {
    return `${normalizedSchool} cantrip`;
  }

  const suffix =
    level % 10 === 1 && level % 100 !== 11
      ? "st"
      : level % 10 === 2 && level % 100 !== 12
        ? "nd"
        : level % 10 === 3 && level % 100 !== 13
          ? "rd"
          : "th";

  return `${level}${suffix}-level ${normalizedSchool}`;
}
