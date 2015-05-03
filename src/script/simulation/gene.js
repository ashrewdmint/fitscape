var prob = require('./probability'),
    _    = require('underscore');

function Gene (name, min, max, value) {
  // Normalize min/max
  min = min || 0;
  max = max || 2;

  var _min = Math.round(Math.min(min, max)),
      _max = Math.round(Math.max(min, max));

  min = _min; max = _max;
  this.min = min;
  this.max = max;

  // Normalize value
  var average = Math.floor((max-min)/2);
  this.value = _.isNumber(value) ? this.getValue(value) : average;

  // Normalize name
  this.name = name || 'NO NAME';
}

Gene.random = function (name, min, max) {
  var value = min+Math.round(Math.random()*(max-min));
  return new Gene(name, min, max, value);
};

_.extend(Gene.prototype, {
  copy: function (mutationRate, spread) {
    var value   = this.value,
        mutated = value;

    spread = Math.max(1, spread);

    if (prob.gamble(mutationRate) && this.max-this.min > 0) {
      while (mutated === value) {
        var added = this.getValue(value+Math.random()*spread);
        var subtr = this.getValue(value-Math.random()*spread);

        if (added === value && subtr === value) {
          break;
        } else if (added !== value && subtr !== value) {
          mutated = prob.gamble(0.5) ? added : subtr;
        } else {
          mutated = added === value ? subtr : added;
        }
      }
      value = mutated;
    }

    return new Gene(this.name, this.min, this.max, value);
  },

  randomize: function () {
    return Gene.random(this.name, this.min, this.max);
  },

  getValue: function (v) {
    if (this.wrap) return this.min+(v+this.min) % (this.max-this.min);
    return Math.round(Math.min(Math.max(this.min, v), this.max));
  },

  withValue: function (value) {
    return _.extend({}, this, {value: value});
  },

  wrap: function (value) {
    this.wrap = value;
    return this;
  }
});

module.exports = Gene;
