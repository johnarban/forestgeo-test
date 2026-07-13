/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-undef */
const { VuetifyPlugin } = require('webpack-plugin-vuetify');
const { defineConfig } = require("@vue/cli-service");
const webpack = require("webpack");
const path = require("path");

module.exports = defineConfig({
  publicPath: "./",

  // The app was brutally stripped down to the ForestGEO (SCBI) viewer. A number
  // of old TEMPO source files are intentionally left on disk but are no longer
  // imported. fork-ts-checker type-checks the *whole* project (tsconfig include),
  // so those dead files would fail the build. Disable it and rely on Babel
  // transpile-only for the files that are actually bundled.
  chainWebpack: (config) => {
    config.plugins.delete("fork-ts-checker");
  },

  configureWebpack: {
    plugins: [
      new VuetifyPlugin(),
      new webpack.DefinePlugin({
        // https://github.com/vuejs/vue-cli/pull/7443
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      })
    ],
    resolve: {
      alias: {
        vue: path.resolve("./node_modules/vue")
      }
    }
  },

  // Needed for BrowserStack/Safari testing as of 2023 March. This makes the
  // dev server insecure, but that's OK since we only use it in controlled
  // circumstances. https://stackoverflow.com/questions/43619644
  devServer: {
    allowedHosts: 'all',
    client: {
      overlay: false
    }
  }
});
