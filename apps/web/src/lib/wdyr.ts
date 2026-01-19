import React from 'react';

if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    const isFunction = (x: unknown): x is (...args: unknown[]) => unknown => typeof x === 'function';

    void (async () => {
      const mod = (await import('@welldone-software/why-did-you-render')) as Record<string, unknown>;
      const wdyr = mod.default ?? mod.whyDidYouRender;
      if (!isFunction(wdyr)) return;

      const zustand = (await import('zustand')) as Record<string, unknown>;

      wdyr(React, {
        trackAllPureComponents: false,
        trackHooks: true,
        trackExtraHooks: [[zustand, 'useStore']],
        logOnDifferentValues: true,
        collapseGroups: true,
        include: [/PageTree/, /TreeItem/, /PageEditor/],
      });
    })();
  }
}
