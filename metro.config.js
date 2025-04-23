const { getDefaultConfig } = require('@expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('ttf');
const extraNode = config.resolver.extraNodeModules || {};
config.resolver.extraNodeModules = {
  'missing-asset-registry-path': require.resolve('react-native/Libraries/Image/AssetRegistry'),
  ...extraNode,
};
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});
module.exports = config; 