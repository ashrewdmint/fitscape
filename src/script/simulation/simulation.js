var _        = require('underscore'),
    Organism = require('./organism'),
    Genome   = require('./genome'),
    prob     = require('./probability');

function Simulation (options) {
  this.options    = _.extend({}, Simulation.defaultOptions, options);
  this.population = [];
  this.generate();
}

Simulation.defaultOptions = {
  mutationRate:       0.01,
  mutationSpread:     30,
  maxPopulation:      500,
  initialPopulation:  1,
  pDivideFit:         1/2,
  pDivideUnfit:       1/100,
  targetGenome:       [Genome.HueGene.withValue(90),
                       Genome.SatGene.withValue(100)],
  speed:              0.1, // 0.001,
  maxTime:            3000
};

_.extend(Simulation.prototype, {
  setOption: function (key, value) {
    this.options[key] = value;
  },

  generate: function () {
    for (var i=0; i<this.options.initialPopulation; i++) {
      this.population.push(Organism.maxfit(0.01, this.options.targetGenome));
    }
  },

  tick: function (organism) {
    var fitness = this.getFitness(organism),
        pDivide = this.getDivideP(fitness),
        pDeath  = this.getDeathP(fitness);

    if (prob.gamble(pDeath)) { return null; } // This kills the organism

    if (prob.gamble(pDivide)) {
      return organism.divide(this.options.mutationRate,
                             this.options.mutationSpread);
    }

    return organism;
  },

  stop: function () {
    if (this._timeout) { clearTimeout(this._timeout); }
  },

  start: function () {
    this.t = 0;
    this.runner();
  },

  runner: function () {
    var self = this;
    if (this.t > this.options.maxTime) { return; }
    this.population = this.step();
    if (typeof this.afterUpdate === 'function') {
      var state = _.clone(this);
      _.delay(function () {
        self.afterUpdate(state.t, state.population);
      });
    }
    this.t += 1;
    this._timeout = setTimeout(function () { self.runner(); },
      1/this.options.speed);
  },

  step: function () {
    return _.chain(this.population)
      .map(function (organism) {
        return this.tick(organism);
      }, this)
      .compact()
      .flatten()
      .value();
  },

  getDivideP: function (fitness) {
    var opts = this.options;
    return opts.pDivideUnfit+(opts.pDivideFit-opts.pDivideUnfit)*fitness;
  },

  getDeathP: function () { // use fitness at some point?
    if (this.population.length === 0) { return 0.0; }
    return (this.population.length/this.options.maxPopulation)*0.1;
  },

  getFitness: function (organism) {
    return organism.fitness(this.options.targetGenome);
  }
});

module.exports = Simulation;

// var sim = new Simulation();
// 
// sim.afterUpdate = _.throttle(function (t) {
//   console.log('t='+t, 'population='+sim.population.length);
// 
//   var fitnesses = _.chain(sim.population)
//     .map(function (organism) {
//       return organism.fitness(this.options.targetGenome);
//     }, this)
//     .value();
// 
//   var avgFitness = _.reduce(fitnesses, function (sum, fitness) {
//       return sum+fitness;
//   }, 0)/sim.population.length;
// 
//   console.log('        avg fitness:', avgFitness, _.max(fitnesses));
// }, 500);
// 
// sim.start();