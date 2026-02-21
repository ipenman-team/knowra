'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { LandingSceneAsset } from '@/features/landing/content';
import { LandingSceneImage } from '@/features/landing/components/landing-scene-image';

interface LandingSceneCarouselProps {
  scenes: ReadonlyArray<LandingSceneAsset>;
}

export function LandingSceneCarousel({ scenes }: LandingSceneCarouselProps) {
  return (
    <Carousel opts={{ loop: true, align: 'start' }} className="w-full">
      <CarouselContent className="-ml-0">
        {scenes.map((scene) => (
          <CarouselItem key={scene.id} className="pl-0">
            <LandingSceneImage
              scene={scene}
              priority={scene.id === scenes[0]?.id}
              className="w-full"
              sizes="(min-width: 1280px) 740px, (min-width: 1024px) 50vw, 100vw"
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="left-3 top-[48%] h-9 w-9 rounded-md border-0 bg-white/90 text-slate-700 shadow-sm hover:bg-white" />
      <CarouselNext className="right-3 top-[48%] h-9 w-9 rounded-md border-0 bg-white/90 text-slate-700 shadow-sm hover:bg-white" />
    </Carousel>
  );
}
