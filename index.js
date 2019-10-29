const { Plugin } = require('powercord/entities');
const { uninject } = require('powercord/injector');
const { InjectionIDs } = require('./Constants');

module.exports = class Quotonic extends Plugin {
  async startPlugin () {
    /*
     * Modules
     * Handled by the module resolver outside of `startPlugin`.
     * All modules are created by Nevulo#0007 unless stated otherwise. Contributors will be listed as well
     */

    // Store each of the modules above into this object where we can load them later
    this.MODULES = require('./modules');
    for (const module of Object.keys(this.MODULES)) {
      this.MODULES[module] = this.MODULES[module].bind(this);
    }

    this.load();
  }

  /*
   * Module Resolver + Handler
   * Handles the loading and unloading of all modules.
   */

  /**
   * Load one or multiple modules
   * When no module is specified, all modules are loaded by default.
   * @param {String} specific Pass a specific module name to load only that module
   */
  load (specific) {
    if (specific) {
      this.MODULES[specific]();
    } else {
      for (const load of Object.keys(this.MODULES)) {
        this.MODULES[load]();
      }
    }
  }

  /**
   * Get a module
   * @param {String} specific Pass a specific module name to load only that module
   */
  getModule (module) {
    if (!module) {
      this.error('No module specified for getModule');
    }
    return this.MODULES[module];
  }

  /**
   * Unload one or multiple modules
   * When no module is specified, the entire plugin is unloaded from Powercord.
   * @param {String} specific Pass a specific module name to unload only that module
   */
  unload (specific) {
    if (specific) {
      for (const injection of InjectionIDs[specific]) {
        uninject(injection);
      }
    } else {
      this.log('Plugin stopped');
      for (const unload of Object.keys(this.MODULES)) {
        for (const injection of (InjectionIDs[unload] || [])) {
          uninject(injection);
        }
      }
    }
  }

  pluginWillUnload () {
    this.unload();
  }

  /**
   * Reload (unload and then load) one or multiple modules
   * When no module is specified, the entire plugin will reload
   * @param {String} specific Pass a specific module name to reload only that module
   */
  reload (...specific) {
    if (specific) {
      for (const mod of specific) {
        this.log(`Reloading module '${mod}'`);
        this.unload(mod);
        this.load(mod);
      }
    } else {
      this.log('Reloading all modules');
      this.unload();
      this.startPlugin();
    }
  }

  /**
   * Log a string or data to the developer console
   * Overwrites the normal Powercord .log method.
   * @param {any} data Data to log
   */
  log (data) {
    console.log('%c[ Quotonic ]', 'color: #512da8; font-weight: 900;', data);
  }

  error (data) {
    console.error('%c[ Quotonic ]', 'color: #512da8; font-weight: 900;', data);
  }
};
