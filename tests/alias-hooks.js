import { registerHooks } from 'node:module';

// Resolves the app's `@/` imports to source files for tests importing modules
// that use them. Import this before dynamically importing those modules.
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(
      specifier.startsWith('@/')
        ? new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href
        : specifier,
      context,
    );
  },
});
