/** Display backend category keys without changing their filter values. */
export function topicLabel(value: string) {
  const label = value.replaceAll("_", " ").trim();
  return label ? label[0].toUpperCase() + label.slice(1) : value;
}
