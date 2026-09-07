/* eslint-disable no-undef */ // FIXME: D�vida t�cnica (Quarentena)
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'perf', 'test', 'docs', 'chore', 'security', 'ci'],
    ],
  },
};
