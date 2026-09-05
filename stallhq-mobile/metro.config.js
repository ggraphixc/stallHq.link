const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.serializer = config.serializer || {};

module.exports = config;
