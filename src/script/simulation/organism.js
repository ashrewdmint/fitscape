var _      = require('underscore'),
    Genome = require('./genome');

function Organism (genome, parent) {
  this.id = Math.random().toString().replace(/0\./, '');
  this.genome = genome || Genome.random();
  if (parent) { this.parent = parent; }
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

  parentIds: function () {
    return this.parentMap(function (p) { return p.id; });
  },

  findNearestAncestor: function (ids) {
    if (!_.isArray(ids)) { ids = [ids]; }
    return _.compact(this.parentMap(function (parent) {
      return ids.indexOf(parent.id) < 0 ? null : parent;
    }))[0];
  }
});

module.exports = Organism;