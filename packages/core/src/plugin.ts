export class Plugin {
  constructor(opts: { path: string; cwd: string }) {
    console.log('plugin:', opts)
  }

  static getPlugins(param: { cwd: string; plugins?: string[] }) {
    // 获取插件路径
    const plugins = param.plugins ?? []

    return plugins.map((path) => {
      return new Plugin({
        path,
        cwd: param.cwd,
      })
    })
  }
}
