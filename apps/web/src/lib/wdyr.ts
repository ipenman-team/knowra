import React from 'react';

if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React, {
      trackAllPureComponents: false,
      trackHooks: true,
      trackExtraHooks: [[require('zustand'), 'useStore']],
      logOnDifferentValues: true,
      collapseGroups: true,
      include: [
        // Add component names to track here
        /PageTree/,
        /TreeItem/,
        /PageEditor/,
      ],
    });
  }
}
