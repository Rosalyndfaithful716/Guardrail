import { cosmiconfigSync } from 'cosmiconfig';
import { DEFAULT_CONFIG } from './types.js';
import type { GuardrailConfig } from './types.js';

const MODULE_NAME = 'guardrail';

export function loadConfig(searchFrom?: string): GuardrailConfig {
  const explorer = cosmiconfigSync(MODULE_NAME, {
    searchPlaces: [
      `.${MODULE_NAME}rc`,
      `.${MODULE_NAME}rc.json`,
      `.${MODULE_NAME}rc.yaml`,
      `.${MODULE_NAME}rc.yml`,
      `.${MODULE_NAME}rc.js`,
      `.${MODULE_NAME}rc.cjs`,
      `${MODULE_NAME}.config.js`,
      `${MODULE_NAME}.config.cjs`,
      `${MODULE_NAME}.config.ts`,
      'package.json',
    ],
  });

  const result = explorer.search(searchFrom);

  if (!result || result.isEmpty) {
    return { ...DEFAULT_CONFIG };
  }

  const fileConfig = result.config as Partial<GuardrailConfig>;

  return {
    include: fileConfig.include ?? DEFAULT_CONFIG.include,
    exclude: fileConfig.exclude
      ? [...DEFAULT_CONFIG.exclude, ...fileConfig.exclude]
      : DEFAULT_CONFIG.exclude,
    rules: { ...fileConfig.rules },
    severityThreshold: fileConfig.severityThreshold ?? DEFAULT_CONFIG.severityThreshold,
    plugins: fileConfig.plugins,
  };
}

export function mergeConfigs(
  base: GuardrailConfig,
  overrides: Partial<GuardrailConfig>,
): GuardrailConfig {
  return {
    include: overrides.include ?? base.include,
    exclude: overrides.exclude ?? base.exclude,
    rules: { ...base.rules, ...overrides.rules },
    severityThreshold: overrides.severityThreshold ?? base.severityThreshold,
    plugins: overrides.plugins ?? base.plugins,
  };
}
