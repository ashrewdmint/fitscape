/* globals postMessage:false, addEventListener:false */

var Simulation = require('../simulation/simulation.js');

function onUpdate (t, pop) {
  postMessage({ event: 'update', time: t, population: pop });
}

function onDivide (p, o) {
  postMessage({ event: 'divide', parentId: p, offspring: o });
}

function onDie (ids) {
  postMessage({ event: 'die', ids: ids });
}

function onGetPopulation (pop) {
  postMessage({ event: 'getPopulation', population: pop });
}

function newSim(options) {
  var s = new Simulation(options);
  s.on('update', onUpdate);
  s.on('divide', onDivide);
  s.on('die', onDie);
  return s;
}

var sim = newSim();

addEventListener('message', function (e) {
  var data = e.data || {};
  if (data.options) {
    sim = newSim(data.options);
  } else if (data === 'start')  {
    sim.start();
  } else if (data === 'stop') {
    sim.stop();
  } else if (data === 'getPopulation') {
    postMessage({ event: 'getPopulation', population: sim.population });
  }
}, false);