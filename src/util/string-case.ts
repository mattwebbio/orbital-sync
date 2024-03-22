export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function camelToTitleCase(str: string): string {
  return (
    str.charAt(0).toUpperCase() +
    str.slice(1).replace(/[A-Z]/g, (letter) => ` ${letter.toUpperCase()}`)
  );
}
