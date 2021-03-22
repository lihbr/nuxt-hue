export function kebabTopascalCase(str: string = "") {
  return (
    str
      .toLowerCase()
      .split("-")
      .filter(Boolean)
      .map((s, i) => (i === 0 ? s : `${s[0].toUpperCase()}${s.slice(1)}`))
      .join("") ?? ""
  );
}
