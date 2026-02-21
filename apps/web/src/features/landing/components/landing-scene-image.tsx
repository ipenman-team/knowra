'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';

import type { LandingSceneAsset } from '@/features/landing/content';
import { cn } from '@/lib/utils';

interface LandingSceneImageProps {
  scene: LandingSceneAsset;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function LandingSceneImage({
  scene,
  className,
  sizes = '(min-width: 1280px) 560px, (min-width: 768px) 50vw, 100vw',
  priority = false,
}: LandingSceneImageProps) {
  const [failed, setFailed] = useState(false);

  const src = useMemo(() => (failed ? scene.fallbackSrc : scene.src), [failed, scene.fallbackSrc, scene.src]);

  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-slate-200/80 bg-white', className)}>
      <Image
        src={src}
        alt={scene.alt}
        width={1680}
        height={1050}
        className="block h-auto w-full"
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        sizes={sizes}
        onError={() => {
          if (!failed) {
            setFailed(true);
          }
        }}
      />
    </div>
  );
}
