import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';

class TaskList {

  static execute() {
    const container = document.querySelector('#plugin-wrapper');
    const root = createRoot(container);
    root.render(<App showDialog />);
  }
}

export default TaskList;

window.app.registerPluginItemCallback('deduplication', TaskList.execute);
