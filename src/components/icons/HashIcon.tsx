import { Flex } from "@radix-ui/themes";

interface HashIconProps {
  size?: number | string;
  width?: number | string;
  height?: number | string;
  color?: string;
}

export default function HashIcon({
  size,
  width,
  height,
  color = 'currentColor'
}: HashIconProps) {

  const w = width ?? size ?? 16;
  const h = height ?? size ?? 16;

  const numericHeight = typeof h === 'number'
    ? h
    : parseInt(h, 10) || 16;

  const calculatedFontSize = Math.max(10, Math.floor(numericHeight * 1.0));

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
        color: color,
        fontSize: `${calculatedFontSize}px`,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        userSelect: 'none',
        lineHeight: 1,
      }}
      title="Integer"
    >
      #
    </Flex>
  );
}