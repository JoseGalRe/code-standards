import * as config from './packages/eslint-config/src/configs/index.ts';
import { eslintConfig } from './packages/eslint-config/src/index.ts';

export default eslintConfig(
  config.setup(),
  config.antfu(),
  config.javascript(),
  config.typescript(),
  config.promise(),
  config.node(),
  config.sonar(),
  config.regexp(),
  config.security(),
  config.unicorn(),
  config.others(),
  config.jsonc(),
  config.jsdoc(),
  config.yml(),
  config.stylistic(),
  config.perfectionist(),
  config.react(),
  config.testing(),
  config.custom(),
  config.overrides(),
);
