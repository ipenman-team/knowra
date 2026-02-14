export type ToolbarPluginProps = {
  disabled?: boolean;
};

export const PLUGIN_SCOPE_BLOCK = "block";
export const PLUGIN_SCOPE_INLINE = "inline";

export type PluginScope = typeof PLUGIN_SCOPE_BLOCK | typeof PLUGIN_SCOPE_INLINE;

export type PluginMarkerFields = {
  pluginScope?: PluginScope;
  pluginKind?: string;
};
