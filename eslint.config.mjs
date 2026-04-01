import eslint from '@eslint/js';
import {configs as tseslintConfigs} from 'typescript-eslint';

const {configs: eslintConfigs} = eslint;

export default [
  {
    files: [
      'src/**/*.ts'
    ]
  },
  eslintConfigs.recommended,
  ...tseslintConfigs.strict,
  {
    files: [
      'src/**/*.ts'
    ],
    rules: {
      'no-useless-assignment': 'off'
    }
  }
];
