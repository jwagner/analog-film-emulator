import Promise from 'bluebird';
import _ from 'underscore';

export default class WorkerPool {
    constructor(src='worker.js', poolSize=undefined){
        // limiting the maximal number of workers to 4, navigator.hardwareConcurrency
        // tends to overreport because of hyper threading.
        // according to http://store.steampowered.com/hwsurvey/cpus/
        // systems with more than 4 cpus are rare (~2%) and even on those
        // the synchronization is rarely worth it. 
        poolSize = poolSize || Math.min(4, navigator.hardwareConcurrency) || 4;
        this.pool = [];
        for(var i = 0; i < poolSize; i++) {
            this.pool.push(new Worker(src));
        }
    }
    dispatch(messages){
        return _.zip(this.pool, messages).map(([worker, message]) => {
            worker.postMessage(message[0], message[1]);
            return new Promise((resolve, reject) => {
                worker.onmessage = (e) => resolve(e.data);
                worker.onerror = (e) => reject(e);
            });
        });
    }
}
