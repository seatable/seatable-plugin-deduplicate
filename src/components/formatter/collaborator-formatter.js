
import React, { Component } from 'react';
import styles from '../../css/plugin-layout.module.css';

class CollaboratorFormatter extends Component {
  
  getCollaboratorsList = () => {
    let { value, collaborators } = this.props;
    let validCollaborators = [];
    Array.isArray(value) && value.map((v, i) => { //eslint-disable-line
      let collaborator = collaborators && collaborators.find(c => c.email === v);
      if (collaborator) {
        validCollaborators.push(
          <div key={i} className={styles["collaborator"]}>
            <span className={styles["collaborator-avatar-container"]}>
              <img className={styles["collaborator-avatar"]} alt={collaborator.name} src={collaborator.avatar_url} />
            </span>
            <span className={styles["collaborator-name"]}>{collaborator.name}</span>
          </div>
        );
      }
    });
    return validCollaborators;
  }

  render() {
    let collaboratorList = this.getCollaboratorsList();
    return collaboratorList.length > 0 && (
      <div className={styles["collaborators-formatter"]}><div className={styles["formatter-show"]}>{collaboratorList}</div></div>
    );
  }
}

export default CollaboratorFormatter;