const createError = require('http-errors');
const engineDiscoveryClient = require('./EngineDiscoveryClient');
const engineSessionPrepper = require('./DocPrepper');
const engineLoadBalancer = require('./LoadBalancer');

class QixSessionService {
  /**
   * Picks an engine
   * @param docId
   * @returns {Promise<TResult>}
   */
  static async openSession(docId) {
    // Get list of possible engines
    const engines = await engineDiscoveryClient.queryEngines('');

    // Select one of them and get the address.
    const engine = engineLoadBalancer.roundRobin(engines);

    if (!engine) {
      throw createError(503, 'No suitable QIX Engine available');
    }

    try {
      // Prepare the session
      const sessionId = await engineSessionPrepper.prepareDoc(engine.ipAddress, engine.port, docId);
      return Object.assign({}, { ipAddress: engine.ipAddress, port: engine.port }, { sessionId });
    } catch (err) {
      throw createError(404, 'Document not found');
    }
  }
}

module.exports = QixSessionService;