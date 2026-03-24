import React from 'react';
import { createRoot } from 'react-dom/client';
import DTable from 'dtable-sdk';
import App from './app';
import './setting';

class TaskList {

  static async init() {
    const dtableSDK = new DTable();

    // local develop
    window.app = {};
    window.app.state = {};
    window.dtable  = {};
    await dtableSDK.init(window.dtablePluginConfig);
    await dtableSDK.syncWithServer();

    window.dtableWebAPI = dtableSDK.dtableWebAPI;
    window.app.collaborators = dtableSDK.dtableStore.collaborators;
    window.app.state.collaborators = dtableSDK.dtableStore.collaborators;
    window.dtable.mediaUrl = window.dtablePluginConfig.mediaUrl;
    window.dtableSDK = dtableSDK;
  }

  static async execute() {
    await this.init();
    const root = createRoot(document.getElementById('root'));
    root.render(<App isDevelopment showDialog />);
  }

}

TaskList.execute();
