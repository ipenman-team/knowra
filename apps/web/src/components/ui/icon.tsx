import type { CSSProperties, SVGProps } from 'react';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'color' | 'fill'> & {
  color?: string;
  size?: number | string;
  fill?: boolean | string;
};

export const Icon = ({
  color,
  size,
  style,
  width,
  height,
  fill,
  stroke,
  ...props
}: IconProps) => {
  const resolvedWidth = width ?? size;
  const resolvedHeight = height ?? size;

  const mergedStyle: CSSProperties = {
    ...style,
    ...(resolvedWidth && { width: resolvedWidth }),
    ...(resolvedHeight && { height: resolvedHeight }),
  };

  const fillMode = typeof fill === 'boolean' ? fill : undefined;
  const fillValue = typeof fill === 'string' ? fill : undefined;

  let resolvedFill = fillValue;
  let resolvedStroke = stroke;

  if (color) {
    const hasFillValue = typeof fillValue === 'string' && fillValue !== 'none';
    if (fillMode || hasFillValue) {
      resolvedFill = color;
    } else {
      resolvedStroke = color;
      if (fillValue == null) {
        resolvedFill = 'none';
      }
    }
  }

  return (
    <svg
      {...props}
      width={resolvedWidth}
      height={resolvedHeight}
      fill={resolvedFill}
      stroke={resolvedStroke}
      style={mergedStyle}
    />
  );
};
