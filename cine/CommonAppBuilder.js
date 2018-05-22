const WebSocket = require('ws');
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.67.2.json');
const Halyard = require('halyard.js');
const mixins = require('halyard.js/dist/halyard-enigma-mixin');
const uuid = require('uuid/v4');
const logger = require('./../src/Logger').get();
const createError = require('http-errors');

// number of seconds Qlik Associative Engine should keep the session alive after disconnecting
// the last socket to a session:
const DEFAULT_TTL = 60;

function createConfiguration(host, port, sessionId, jwt) {
  const headers = {
    'X-Qlik-Session': sessionId,
  };
  if (jwt) {
    headers.Authorization = jwt;
  }
  const config = {
    schema,
    mixins,
    url: `ws://${host}:${port}/app/engineData/ttl/${DEFAULT_TTL}`,
    createSocket(url) {
      return new WebSocket(url, {
        headers,
      });
    },
  };
  return config;
}

class AppBuilder {
  static async createCommonDoc(host, port, docId, jwt, sessionId) {
    try {
      const halyard = new Halyard();
      //********************* Create App ***************************//

      //Add Customer Table
      const customersurl = 'https://github.com/AnalyticsEarth/data/raw/master/Customers.qvd';
      const customersTable = new Halyard.Table(customersurl, {
        name: 'Customers',
      });
      halyard.addTable(customersTable);

      //Add Orders Table
      const ordersurl = 'https://github.com/AnalyticsEarth/data/raw/master/Orders.qvd';
      const ordersTable = new Halyard.Table(ordersurl, {
        name: 'Orders',
      });
      halyard.addTable(ordersTable);

      //Add Customer Table
      const productsurl = 'https://github.com/AnalyticsEarth/data/raw/master/Products.qvd';
      const productsTable = new Halyard.Table(productsurl, {
        name: 'Products',
      });
      halyard.addTable(productsTable);

      //********************* Create App ***************************//

      console.log('Creating and opening app using mixin.');
      const config = createConfiguration(host, port, sessionId, jwt);
      const session = enigma.create(config);

      const qix = await session.open();
      //const app = await qix.reloadAppUsingHalyard(docId, halyard, true);
      const app = await qix.createAppUsingHalyard(docId,halyard);

      const script = await app.getScript();
      console.log(script);

      await session.close();
      console.log('Session closed.');
    } catch (err) {
      console.log('Woops! An error occurred.', err);
      process.exit(1);
    }
  }
}

module.exports = AppBuilder;
