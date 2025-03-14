import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'

export default tsEslint.config(eslint.configs.recommended, tsEslint.configs.recommended, {
  ignores: ['node_modules/', 'dist/', 'build/', 'scripts/', '**/*.min.js'],
}) as any
