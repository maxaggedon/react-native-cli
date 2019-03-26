/**
 * @flow
 *
 * Loads and validates a project configuration
 */
import {get} from 'lodash';
import comsmiconfig from 'cosmiconfig';
import path from 'path';
import {validate} from 'jest-validate';

import type {ProjectConfig, DependencyConfig} from './types.flow';

import resolveReactNativePath from './resolveReactNativePath';
import getPackageConfiguration from '../getPackageConfiguration';

const exampleProjectConfig: ProjectConfig = {
  reactNativePath: '.',
};

const exampleDependencyConfig = {
  dependency: {
    android: '',
    ios: '',
  },
  platforms: {
    windows: './platform.js',
  },
  commands: ['./local-cli/runWindows/runWindows.js'],
};

const exampleConfig = {
  ...exampleProjectConfig,
  ...exampleDependencyConfig,
};

const searchPlaces = ['react-native.config.js', 'package.json'];

export function readProjectConfigFromDisk(): ProjectConfig {
  const explorer = comsmiconfig('react-native', {searchPlaces});

  const {config} = explorer.searchSync() || {config: {}};

  validate(config, {exampleConfig});

  return {
    ...config,
    reactNativePath: config.reactNativePath
      ? config.reactNativePath
      : resolveReactNativePath(),
  };
}

export function readDependencyConfigFromDisk(
  dependencyName: string,
): DependencyConfig {
  const root = path.resolve(process.cwd(), 'node_modules', dependencyName);

  const explorer = comsmiconfig('react-native', {
    stopDir: root,
    searchPlaces,
  });

  const {config} = explorer.searchSync(root) || {config: undefined};

  if (!config) {
    return null;
  }

  validate(config, {
    exampleConfig,
    title: {
      warning: `Warnings from ${dependencyName}`,
      error: `Errors from ${dependencyName}`,
      deprecation: `Deprecations from ${dependencyName}`,
    },
  });

  return config;
}

export function readLegacyDependencyConfigFromDisk(dependencyName: string) {
  const root = path.resolve(process.cwd(), 'node_modules', dependencyName);
  const config = getPackageConfiguration(root);

  return {
    commands: [].concat(config.plugin),
    platforms: config.platform
      ? require(path.join(root, config.platform))
      : undefined,
    haste: config.haste,
  };
}
