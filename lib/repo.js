const CLI = require('clui');
const fs = require('fs');
const git = require('simple-git/promise');
const Spinner = CLI.Spinner;
const touch = require('touch');
const _ = require('lodash');

const inquirer = require('./inquirer');
const gh = require('./github');
const { url } = require('inspector');

module.exports = {
  createRemoteRepo: async () => {
    const github = gh.getInstance();
    const answers = await inquirer.askReposDetails();

    const data = {
      name: answers.name,
      description: answers.description,
      private: (answers.visibility === 'private')
    };

    const status = new Spinner('Creating remote repository...');
    status.start();

    try {
      const reposnse = await github.repos.createForAuthenticatedUser(data);
      return reposnse.data.ssh_url;
    } finally {
      status.stop();
    }
  },
  createGitignore: async () => {
    const fileList = _.without(fs.readdirSync('.'), '.git', '.gitignore')

    if (fileList.length) {
      const answers = await inquirer.askIgnoreFiles(fileList);

      if (answers.ignore.length) {
        fs.writeFileSync('.gitignore', answers.ignore.join('\n'));
      } else {
        touch('.gitignore');
      }
    } else {
      touch('.gitignore');
    }
  },
  setupRepo: async () => {
    const status = new Spinner('Initializing local repository and pushing to remote...');
    status.start();

    try {
      git.init()
        .then(git.add('.gitignore'))
        .then(git.add('./*'))
        .then(git.commit('Initial commit'))
        .then(git.addRemote('origin', url))
        .then(git.push('origin', 'main'))
    } finally {
      status.stop();
    }
  }
};
