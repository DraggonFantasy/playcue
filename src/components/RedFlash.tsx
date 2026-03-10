interface Props {
  visible: boolean;
}

export function RedFlash({ visible }: Props) {
  if (!visible) return null;
  return <div className="red-flash" />;
}
