// require first
const { Module } = require('@dashup/module');

// import base
const CSVConnect = require('./connects/csv');

/**
 * export module
 */
class CSVModule extends Module {

  /**
   * construct discord module
   */
  constructor() {
    // run super
    super();
  }
  
  /**
   * registers dashup structs
   *
   * @param {*} register 
   */
  register(fn) {
    // register pages
    fn('connect', CSVConnect);
  }
}

// create new
module.exports = new CSVModule();
