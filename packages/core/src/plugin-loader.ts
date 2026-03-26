import type { Rule, GuardrailPlugin } from './types.js';

export function loadPlugins(pluginNames: string[]): Rule[] {
  const rules: Rule[] = [];

  for (const name of pluginNames) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(name);
      const plugin: GuardrailPlugin = mod.default ?? mod;

      if (plugin.rules && Array.isArray(plugin.rules)) {
        rules.push(...plugin.rules);
      }
    } catch (err) {
      console.warn(
        `Warning: Failed to load plugin "${name}": ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  return rules;
}
