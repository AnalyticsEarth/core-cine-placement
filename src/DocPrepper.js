const WebSocket = require('ws');
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.67.2.json');
const uuid = require('uuid/v4');
const logger = require('./Logger').get();
const createError = require('http-errors');
const appBuilder = require('./../cine/CommonAppBuilder.js');

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
    url: `ws://${host}:${port}/app/engineData/ttl/${DEFAULT_TTL}`,
    createSocket(url) {
      return new WebSocket(url, {
        headers,
      });
    },
  };
  return config;
}

class DocPrepper {
  static async prepareDoc(host, port, docId, jwt, flush) {
    const sessionId = uuid();
    const config = createConfiguration(host, port, sessionId, jwt);
    try {
      const session = enigma.create(config);

      if (process.env.LOG_LEVEL === 'debug') {
        session.on('traffic:*', (direction, msg) => logger.debug(`${direction}: ${JSON.stringify(msg)}`));
      }

      const qix = await session.open();

      if (docId) {
        //Check if document exists on this node
        var docList = await qix.getDocList();

        if(flush){
          await qix.deleteApp(docId);
        }

        console.log(docList);
        if(docList.length == 0 || flush){
          logger.info(`Create App: ${docId}`);
          await appBuilder.createCommonDoc(host,port,docId,jwt, sessionId);
          docList = await qix.getDocList();
        }

        logger.info(`Doc List: ${docList}`);
        await qix.openDoc(docId, 'testuser');
        logger.info(`Opened Doc: ${docId}`);
      } else {
        await qix.createSessionApp();
      }

      //await qix.session.close();

      return sessionId;
    } catch (err) {
      logger.error(`Failed to open doc with error: ${err}`);
      throw createError(`Failed to open doc with error: ${err}`);
    }
  }
}

module.exports = DocPrepper;
