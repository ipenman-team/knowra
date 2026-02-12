'use client';

import type { ComponentType } from 'react';
import type { SiteBuilderTemplate } from '@/lib/api/site-builder';
import { KnowledgeSiteTemplate } from './knowledge-site';
import type { SiteTemplateRendererProps } from './template.types';

const TEMPLATE_COMPONENT_MAP: Record<
  SiteBuilderTemplate,
  ComponentType<SiteTemplateRendererProps>
> = {
  'knowledge-site': KnowledgeSiteTemplate,
};

export function SiteTemplateRenderer(props: SiteTemplateRendererProps) {
  const TemplateComponent =
    TEMPLATE_COMPONENT_MAP[props.data.template] ?? KnowledgeSiteTemplate;
  return <TemplateComponent {...props} />;
}
