var _      = require('underscore'),
    Genome = require('./genome'),
    Gene   = require('./gene');

function Organism (genome, parent) {
  this.id = Math.random().toString().replace(/0\./, '');
  this.genome = genome || Genome.random();
  this.parentIds = [];
  if (parent) {
    this.parent = parent;
    var self = this;
    this.parentMap(function (parent) {
      self.parentIds.push(parent.id);
    });
  }
}

Organism.maxfit = function (fitness, targetGenome) {
  var genome, best = 1.0, tries = 0, fit, g;

  while (!genome || best > fitness) {
    if (tries > 500) { break; }

    g   = Genome.random();
    fit = g.fitness(targetGenome);

    if (fit < best) { best = fit; genome = g; }
    tries ++;
  }

  return new Organism(genome);
};

Organism.fromObject = function (obj) {
  // Hacky stuff!

  // Return new Organism from raw object, with added methods
  var org = _.extend(new Organism(), obj);

  // Same for the Genome
  org.genome = _.extend(new Genome(), org.genome);

  // Same for each Gene
  org.genome.genes = _.map(org.genome.genes, function (g) {
    return _.extend(new Gene(), g);
  });

  return org;
};

_.extend(Organism.prototype, {
  divide: function (mutationRate, spread) {
    return _.map([1, 2], function () {
      return new Organism(this.genome.copy(mutationRate, spread), this);
    }, this);
  },

  fitness: function (target) {
    return this.genome.fitness(target);
  },

  parentMap: function (callback) {
    var organism = this, output = [];
    while (organism.parent) {
      output.push(callback(organism.parent));
      organism = organism.parent;
    }
    return output;
  },

  findNearestAncestor: function (ids) {
    if (!_.isArray(ids)) { ids = [ids]; }
    return _.compact(this.parentMap(function (parent) {
      return ids.indexOf(parent.id) < 0 ? null : parent;
    }))[0];
  }
});

module.exports = Organism;