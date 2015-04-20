var _          = require('underscore'),
    //prob       = require('../simulation/probability'),
    Simulation = require ('../simulation/simulation');

function GridVisualizer (options) {
  // Rows are Y, columns are X; imagine [0,0] being the top left
  this.grid = [];
  this.dead = {}; // Remember dead cell locations for ancestor search
  this.sim = new Simulation(options);
  this.sim.afterUpdate = _.bind(this.update, this);
}

_.extend(GridVisualizer.prototype, {
  start: function () {
    this.dead = {};
    this.sim.start();
  },

  initGrid: function (population) {
    var columns = Math.round(Math.sqrt(population.length));

    for (var i=0; i<population.length; i++) {
      var col = i % columns;
      if (col === 0) { this.grid.push([]); } // New row
      this.grid[this.grid.length-1][col] = population[i];
    }
  },

  changeGrid: function (population) {
    var ids   = _.pluck(population, 'id'),
        alive = [];

    this.loopGrid(function (organism, x, y) {
      if (!organism) { return; }

      // Cell has died
      if (ids.indexOf(organism.id) < 0) {
        this.replaceCell(x, y, null);
        this.dead[organism.id] = { x: x, y: y }; // Remember where it was
      } else {
        alive.push(organism.id);
      }
    });

    _.map(population, function (organism) {
      // Cell is currently alive! Nothing to do
      if (alive.indexOf(organism.id) >= 0) { return; }
      // New cell... find most recent ancestor
      var ans = organism.findNearestAncestor(_.keys(this.dead));
      if (!ans) {
        console.log(this.dead, organism);
        throw 'Could not find an ancestor for #'+organism.id;
      }
      var pos = this.dead[ans.id];
      if (!pos) { throw 'Could not position for dead #'+organism.id; }
      this.spliceCell(pos.x, pos.y, organism);
    }, this);
  },

  loopGrid: function (callback) {
    var self = this;
    _.each(this.grid, function (row, y) {
      _.each(row, function (organism, x) {
        callback.apply(self, [organism, x, y]);
      });
    });
  },

  replaceCell: function (x, y, value) {
    if (!this.grid[y]) { this.grid[y] = []; }
    this.grid[y][x] = value;
    return value;
  },

  spliceCell: function (x, y, value) {
    if (!this.grid[y]) { this.grid[y] = []; }
    var occupant = this.grid[y][x];

    this.replaceCell(x, y, value);

    if (!occupant) { return; }

    var directions = [[x+1, y+1], [x+1, y], [x, y+1]];
    var choice = directions[Math.round(Math.random()*(directions.length-1))];

    this.spliceCell(choice[0], choice[1], occupant);
  },

  update: _.throttle(function (t, population) {
    if (!this.grid.length) {
      this.initGrid(population);
    } else {
      this.changeGrid(population);
    }
    console.log(t);

    if (typeof this.callback === 'function') {
      this.callback(this.grid, this.sim);
    }
  }, 100)
});

module.exports = GridVisualizer;