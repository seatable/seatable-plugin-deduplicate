import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';

class TaskList {

  static execute() {
    const root = createRoot(document.getElementById('#plugin-wrapper'));
    root.render(<App showDialog />);
  }
}

export default TaskList;

window.app.registerPluginItemCallback('deduplication', TaskList.execute);