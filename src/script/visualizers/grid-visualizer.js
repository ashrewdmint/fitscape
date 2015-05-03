var _          = require('underscore'),
    //prob       = require('../simulation/probability'),
    Simulation = require('../simulation/simulation'),
    Organism   = require('../simulation/organism');

function Grid (max) {
  this.max = max;
}

_.extend(Grid.prototype, {
  max: 100,
  grid: [],
  emptyNb: [],

  all: function (callback) {
    var array = [], useCb = typeof callback === 'function';

    for (var x=0; x<this.getSideLength(); x++) {
      for (var y=0; y<this.getSideLength(); y++) {
        var obj = this.get(x, y);
        array.push(useCb ? callback(obj) : obj);
      }
    }

    return array;
  },

  each: function (callback) {
    for (var x=0; x<this.grid.length; x++) {
      if (!this.grid[x]) continue;
      for (var y=0; y<this.grid[x].length; y++) {
        var value = this.grid[x][y];
        if (!value) continue;
        var obj = { x: x, y: y, value: value };
        if (typeof callback === 'function' && callback(obj) === 'BREAK')
          return;
      }
    }
  },

  getSideLength: function () {
    if (!this._sideln) {
      this._sideln = Math.ceil(Math.sqrt(this.max));
    }
    return this._sideln;
  },

  getBoundedRandom: function () {
    return Math.round(Math.random()*this.getSideLength());
  },

  xy: function (x, y) {
    var side = this.getSideLength();
    if (x < 0) x = side+x;
    if (y < 0) y = side+y;
    return {
      x: Math.abs(x % side),
      y: Math.abs(y % side)
    };
  },

  getNeighborsXY: function (x, y) {
    return [
      [x, y-1],   // Top
      [x+1, y-1], // Top right
      [x+1, y],   // Right
      [x+1, y+1], // Bottom right
      [x, y+1],   // Bottom
      [x-1, y+1], // Bottom left
      [x-1, y],   // Left
      [x-1, y-1]  // Top left
    ];
  },

  getNeighbors: function (x, y) {
    return _(this.getNeighborsXY(x, y)).map(function (xy) {
      return this.get(xy[0], xy[1]);
    }, this);
  },

  getEmptyTarget: function (x, y) {
    var choices = {}, best = null;
    if (this.emptyNb.length === 0) return null;
    _(this.emptyNb).each(function (xys) {
      var xy = this.str2vec(xys);
      // Math.round() just as a precaution
      var dist = Math.round(Math.pow(xy.x-x, 2)+Math.pow(xy.y-y, 2));
      if (best === null || dist < best) {
        best = dist;
        if (!choices[dist]) choices[dist] = [];
        choices[dist].push(xy);
      }
    }, this);
    return _.sample(choices[best]);
  },

  vec2str: function (vec) {
    return [vec.x, vec.y].join(',');
  },

  str2vec: function (str) {
    var split = str.split(',');
    return { x: parseInt(split[0], 10), y: parseInt(split[1], 10) };
  },

  get: function (x, y) {
    var xy = this.xy(x, y),
        value = this.grid[xy.x] ? this.grid[xy.x][xy.y] : null;
    return { x: xy.x, y: xy.y, value: value };
  },

  clear: function (x, y) {
    this.set(x, y, null);
  },

  set: function (x, y, value) {
    var xy = this.xy(x, y);
    if (!this.grid[xy.x]) this.grid[xy.x] = [];
    this.grid[xy.x][xy.y] = value;
    this.updateEmptyNbFor(xy, value);
    return { x: x, y: y, value: value };
  },

  insert: function (x, y, value, target) {
    var last = this.get(x, y).value;
    this.set(x, y, value);
    if (!last) return;

    if (!target) target = this.getEmptyTarget(x, y);
    if (!target) throw 'Grid is full; cannot insert()';

    var nx = x+Math.max(Math.min(target.x-x, 1), -1),
        ny = y+Math.max(Math.min(target.y-y, 1), -1);

    this.insert(nx, ny, last, target);
  },

  updateEmptyNbFor: function (xy, value) {
    var xys = this.vec2str(xy);
    // Get neighbors
    var neighbors = this.getNeighbors(xy.x, xy.y);
    var emptyN = [];
    var fullN  = [];

    // Get empty and full neighbors
    _.each(neighbors, function (obj) {
      var nxy = this.vec2str(_.omit(obj, 'value'));
      obj.value ? fullN.push(nxy) : emptyN.push(nxy);
    }, this);

    if (value) {
      // We added a value, make sure all empty neighbors are added to emptyN
      // Also make sure this now non-empty cell is not listed in emptyN
      this.emptyNb = _.without(_.uniq(this.emptyNb.concat(emptyN), true), xys);
    } else {
      // We cleared a grid cell, make sure empty neighbors with 100%
      // empty neighbors are removed from the list
      _(emptyN).each(function (_xys) {
        var _xy = this.str2vec(_xys);
        var fullN2 = _(this.getNeighbors(_xy.x, _xy.y))
          .reject(function (obj) { return !obj.value; });

        if (fullN2.length === 0) this.emptyNb = _.without(this.emptyNb, _xys);
      }, this);

      // Now-cleared cell is an empty neighbor if it has a full neighbor
      if (fullN.length > 0 && this.emptyNb.indexOf(xys) < 0)
        this.emptyNb.push(xys);
    }
  },

  randomSafeSet: function (value) {
    var empty = _.reject(this.all(), function (obj) {
      return obj.value;
    });

    if (!empty.length) return null;

    var choice = _.sample(empty);
    return this.set(choice.x, choice.y, value);
  },

  show: function () {
    _.each(_.groupBy(this.all(), 'y'), function (row) {
      console.log(_(row).map(function (obj) {
        if (this.emptyNb.indexOf(this.vec2str(obj)) >= 0) {
          if (obj.value) return '!';
          return '–';
        }
        return obj.value ? obj.value : ' ';
      }, this).join('  '));
    }, this);
  }
});

function GridVisualizer (sim) {
  var self = this;
  this.grid = new Grid(sim.options.maxPopulation);

  sim.getPopulation(function (data) {
    _.map(data.population, function (org) {
      self.grid.randomSafeSet(org);
    });
  });

  sim.on('die', function (data) {
    self.grid.each(function (obj) {
      if (data.ids.indexOf(obj.value.id) >= 0) {
        self.grid.clear(obj.x, obj.y);
      }
    });
  });

  sim.on('divide', function (data) {
    self.grid.each(function (obj) {
      if (obj.value.id === data.parentId) {
        self.grid.clear(obj.x, obj.y);
        self.grid.insert(obj.x, obj.y, data.offspring[0]);
        self.grid.insert(obj.x, obj.y, data.offspring[1]);
        return 'BREAK';
      }
    });
  });
}

// _.extend(GridVisualizer.prototype, {
//   start: function () {
//     this.simWorker.postMessage('start');
//   },
// 
//   update: _.throttle(function (t, population) {
//     if (!this.grid.length) {
//       this.initGrid(population);
//     } else {
//       this.changeGrid(population);
//     }
//     console.log(t);
// 
//     if (typeof this.callback === 'function') {
//       this.callback(this.grid, this.sim);
//     }
//   }, 400)
// });

module.exports = GridVisualizer;
