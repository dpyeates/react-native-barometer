module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.sensorworks.RNBarometer.RNBarometerPackage;',
        packageInstance: 'new RNBarometerPackage()',
      },
      ios: {},
    },
  },
};
