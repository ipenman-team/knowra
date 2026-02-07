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
  const mergedStyle: CSSProperties | undefined = style;
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
      width={width ?? size}
      height={height ?? size}
      fill={resolvedFill}
      stroke={resolvedStroke}
      style={mergedStyle}
      {...props}
    />
  );
};
