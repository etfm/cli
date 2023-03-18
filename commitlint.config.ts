import type { UserConfig } from '@commitlint/types'
import { RuleConfigSeverity } from '@commitlint/types'

export const Configuration: UserConfig = {
  /*
   * Resolve and load @commitlint/config-conventional from node_modules.
   * Referenced packages must be installed
   */
  extends: [
    '@commitlint/config-lerna-scopes',
    '@commitlint/config-conventional',
  ],
  /*
   * Resolve and load conventional-changelog-atom from node_modules.
   * Referenced packages must be installed
   */
  // parserPreset: 'conventional-changelog-atom',
  /*
   * Resolve and load @commitlint/format from node_modules.
   * Referenced package must be installed
   */
  // formatter: '@commitlint/format',
  /*
   * Any rules defined here will override rules from @commitlint/config-conventional
   */
  rules: {
    'body-leading-blank': [RuleConfigSeverity.Error, 'always'],
    'footer-leading-blank': [RuleConfigSeverity.Warning, 'always'],
    'header-max-length': [RuleConfigSeverity.Error, 'always', 108],
    'subject-empty': [RuleConfigSeverity.Error, 'never'],
    'type-empty': [RuleConfigSeverity.Error, 'never'],
    'subject-case': [RuleConfigSeverity.Disabled],
    'type-enum': [
      RuleConfigSeverity.Error,
      'always',
      [
        'feat',
        'fix',
        'perf',
        'style',
        'docs',
        'test',
        'refactor',
        'build',
        'ci',
        'chore',
        'revert',
        'wip',
        'workflow',
        'types',
        'release',
      ],
    ],
  },
  /*
   * Functions that return true if commitlint should ignore the given message.
   */
  // ignores: [(commit) => commit === ''],
  /*
   * Whether commitlint uses the default ignore rules.
   */
  // defaultIgnores: true,
  /*
   * Custom URL to show upon failure
   */
  // helpUrl:
  //   'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
  /*
   * Custom prompt configs
   */
  // prompt: {
  //   messages: {},
  //   questions: {
  //     type: {
  //       description: 'please input type:',
  //     },
  //   },
  // },
}

module.exports = Configuration
