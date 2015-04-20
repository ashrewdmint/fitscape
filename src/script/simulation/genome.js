var Gene = require('./gene'),
    _    = require('underscore');

function Genome (genes) {
  this.genes = genes || Genome.defaultGenes;
}

Genome.HueGene   = new Gene('hue', 0, 359); // TODO .wrap(true) ?
Genome.SatGene   = new Gene('sat', 0, 100);
Genome.SizeGene  = new Gene('size', 1, 10);

Genome.defaultGenes = [Genome.HueGene, Genome.SatGene, Genome.SizeGene];

Genome.random = function (genes) {
  return new Genome(_.map(genes || Genome.defaultGenes, function (gene) {
    return gene.randomize();
  }));
};

_.extend(Genome.prototype, {
  copy: function (mutationRate, mutationSpread) {
    return new Genome(_.map(this.genes, function (gene) {
      return gene.copy(mutationRate, mutationSpread);
    }));
  },

  get: function (name) {
    return _.indexBy(this.genes, 'name')[name];
  },

  randomize: function () {
    return Genome.random(this.genes);
  },

  // example target: [Genome.HueGene.withValue(90),
  //                  Genome.SatGene.withValue(100)]
  fitness: function (target) {
    var byName  = _.groupBy(this.genes, 'name'),
        compare, diffs, distance, maxDistances = [], maxDistance;

    // Array of the differences in values between every gene
    diffs = _.without(_.map(target, function (gene) {
      compare = byName[gene.name][0];
      if (!compare) { return; }

      // TODO integrate with "wrapping" genes
      maxDistances.push(Math.max(gene.value, gene.max-gene.value));
      return Math.abs(compare.value-gene.value);
    }), null);

    if (!diffs.length) { return 1.0; }

    // Nth root of the sum of every squared difference
    // e.g. for two genes, this will compute the Pythagorean Theorem
    distance = Math.pow(_.reduce(diffs, function (sum, a) {
      return a*a+sum;
    }, 0), 1/diffs.length);

    maxDistance = Math.pow(_.reduce(maxDistances, function (sum, a) {
      return a*a+sum;
    }, 0), 1/maxDistances.length);

    return 1-distance/maxDistance;
  }
});

module.exports = Genome;