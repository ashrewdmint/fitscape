var _         = require('underscore'),
    asEvented = require('asEvented'),
    Organism  = require('./organism'),
    Genome    = require('./genome'),
    prob      = require('./probability');

function Simulation (options) {
  this.options    = _.extend({}, Simulation.defaultOptions, options || {});
  this.population = [];
  this.generate();
}

Simulation.async = function (options) {
  var worker = new Worker('workers/simulation-worker.js');
  asEvented.call(worker); // Add .trigger() and .on()

  worker.addEventListener('message', _.bind(function (e) {
    var data = e.data;

    if (!data || !_.isObject(data)) {
      throw "Unexpected Simulation Worker message";
    }

    if (data.population) {
      data.population = _.map(data.population, function (obj) {
        // Marshal organisms
        return Organism.fromObject(obj);
      });
    }

    if (data.offspring) {
      data.offspring = _.map(data.offspring, function (obj) {
        // Marshal organisms... TODO DRY this up
        return Organism.fromObject(obj);
      });
    }

    worker.trigger('*', data);
    if (data.event) { worker.trigger(data.event, data); }
  }, this));

  if (options) { worker.postMessage({ options: options }); }

  worker.start = function () { worker.postMessage('start'); };
  worker.stop  = function () { worker.postMessage('stop');  };
  worker.options = options || Simulation.defaultOptions;
  worker.getPopulation = function (callback) {
    worker.one('getPopulation', callback);
    worker.postMessage('getPopulation');
  };

  return worker;
};

Simulation.defaultOptions = {
  mutationRate:       0.01,
  mutationSpread:     30,
  maxPopulation:      500,
  initialPopulation:  1,
  pDivideFit:         1/2,
  pDivideUnfit:       1/100,
  pDeath:             0.10,
  targetGenome:       [Genome.HueGene.withValue(90),
                       Genome.SatGene.withValue(100)],
  speed:              0.1, // 0.001,
  maxTime:            3000
};

asEvented.call(Simulation.prototype); // Enable events (.on(), .bind(), etc.)

_.extend(Simulation.prototype, {
  setOption: function (key, value) {
    this.options[key] = value;
  },

  generate: function () {
    for (var i=0; i<this.options.initialPopulation; i++) {
      this.population.push(Organism.maxfit(0.01, this.options.targetGenome));
    }
  },

  tick: function (organism, popSize) {
    var fitness = this.getFitness(organism),
        pDivide = this.getDivideP(fitness),
        mRate   = this.options.mutationRate,
        mSpread = this.options.mutationSpread,
        div;

    if (popSize+2 > this.options.maxPopulation) return organism;

    if (prob.gamble(pDivide)) {
      div = organism.divide(mRate, mSpread);
      this.trigger('divide', organism.id, div);
      return div;
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

    this.trigger('update', this.t, _.clone(this.population));

    this.t += 1;
    this._timeout = setTimeout(function () { self.runner(); },
      1/this.options.speed);
  },

  step: function () {
    var pop = this.killSome(this.population);
    var divided = 0;

    return _.chain(pop).map(function (organism) {
      var result = this.tick(organism, pop.length+divided);
      if (_.isArray(result)) divided++;
      return result;
    }, this).flatten().value();
  },

  getDivideP: function (fitness) {
    var opts = this.options;
    return opts.pDivideUnfit+(opts.pDivideFit-opts.pDivideUnfit)*fitness;
  },

  getDeathP: function (fitness) { // use fitness at some point?
    if (this.population.length === 0) { return 0.0; }
    return (this.population.length/this.options.maxPopulation)*(1-fitness);
  },

  killSome: function (pop) {
    var normPopLn = Math.min(pop.length, this.options.maxPopulation),
        rate      = this.options.pDeath*pop.length/this.options.maxPopulation,
        kill      = Math.min(Math.round(normPopLn*rate), normPopLn-1);

    pop = _.shuffle(pop);

    // Kill a random [pDeath]% of the population and enforce max size
    var died = pop.slice(0, kill);
    if (died.length > 0) this.trigger('die', _.pluck(died, 'id'));
    return _.difference(pop, died);
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