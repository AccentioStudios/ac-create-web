#!/usr/bin/env node

'use strict';

var currentNodeVersion = process.versions.node;
var semver = currentNodeVersion.split('.');
var major = semver[0];

if (major < 10) {
  console.error(
    'Estas ejecutando Node ' +
      currentNodeVersion +
      '.\n' +
      'AC-Create App requiere Node 10 o mayor. \n' +
      'Por favor actualiza tu version de Node.'
  );
  process.exit(1);
}

const { init } = require('./acCreateWeb');

init();