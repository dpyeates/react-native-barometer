const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const pak = require('../package.json');

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, '..');
const peerDeps = Object.keys(pak.peerDependencies);
const defaultConfig = getDefaultConfig(projectRoot);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const peerBlockList = peerDeps.map(
  name =>
    new RegExp(
      `^${escapeRegExp(path.join(libraryRoot, 'node_modules', name))}\\/.*$`,
    ),
);

/**
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [libraryRoot],
  resolver: {
    // The library installs React as a devDependency. Without this, Metro
    // resolves `react` from the library folder and the example crashes with
    // "Invalid hook call" / "Cannot read property 'useState' of null".
    blockList: [defaultConfig.resolver.blockList, ...peerBlockList].filter(
      Boolean,
    ),
    extraNodeModules: peerDeps.reduce((acc, name) => {
      acc[name] = path.join(projectRoot, 'node_modules', name);
      return acc;
    }, {}),
  },
};

module.exports = mergeConfig(defaultConfig, config);
