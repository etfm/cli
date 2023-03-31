export interface Env {
  FRAMEWORK_NAME: string
  DEBUG: string
  NODE_ENV: NodeEnv
}

export enum NodeEnv {
  development = 'development',
  production = 'production',
  test = 'test',
}
