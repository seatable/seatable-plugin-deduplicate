
const config = {
  APIToken: "dcda36fd98160d78d88095dd6493525d1fa62d6f",
  server: "https://dev.seafile.com/dtable-web",
  workspaceID: "6",
  dtableName: "ert",
  lang: "en"
};

const dtablePluginConfig = Object.assign({}, config, {server: config.server.replace(/\/+$/, "")}) ;
window.dtablePluginConfig = dtablePluginConfig;