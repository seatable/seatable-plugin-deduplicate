import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';

class TaskList {

  static execute() {
    ReactDOM.render(<App showDialog />, document.querySelector('#plugin-wrapper'));
  }
}

export default TaskList;

window.app.registerPluginItemCallback('deduplication', TaskList.execute);