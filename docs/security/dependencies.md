# Dependency audit status

Updated 2026-10-15. Current `npm audit --omit=dev` reported zero known vulnerabilities. Full audit reported five high entries in the development lint dependency chain: eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces.

The root advisory is [braces nested-pattern stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), reported for versions through 3.0.3. Registry lookup still returned 3.0.3 as latest. npm's automatic fix proposes downgrading eslint-config-next to 14.2.35, which is incompatible with this Next.js 16 project; it was not applied. No unreviewed vendor patch or claim of a clean full audit is made.

Audit evidence is retained in ignored test-results. Recheck for an upstream compatible fixed release before launch and run lint/build after updating. This result describes the audited dependency tree; it is not a comprehensive security certification.
