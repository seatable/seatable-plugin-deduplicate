
const config = {
  APIToken: 'ce6fae609c5e39c6d4cf8d11369a4e7f85ecef9b',
  server: 'https://dev.seafile.com/dtable-web',
  workspaceID: '6',
  dtableName: '插件测试',
  lang: 'zh-CN'
};

const dtablePluginConfig = Object.assign({}, config, {server: config.server.replace(/\/+$/, '')});

window.dtablePluginConfig = dtablePluginConfig;
