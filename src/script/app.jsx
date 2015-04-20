var _              = require('underscore'),
    React          = require('react'),
    GridVisualizer = require('./visualizers/grid');

// var gv = new GridVisualizer();
// gv.callback = function (grid, sim) {
//   return [sim.population.length, grid.length];
// };

var GridComponent = React.createClass({
  getInitialState: function () {
    return { cells: [], cols: 0, rows: 0 };
  },

  componentDidMount: function () {
    var gv = new GridVisualizer({
                  speed: 1,
                  mutationRate: 0.3,
                  mutationSpread: 5,
                  maxPopulation: 100,
                  pDivideFit: 1.0,
                  pDivideUnfit: 0.001
                }),
        self = this, cells, cols, rows, minX, maxX, minY, maxY;

    gv.callback = function () {
      cells = []; cols = []; rows = [];
      maxX = 0; minX = null; maxY = 0; minY = null;
      gv.loopGrid(function (organism, x, y) {
        if (!organism) { return; }
        if (!minX) { minX = x; }
        if (!minY) { minY = y; }
        if (x < minX) { minX = x; }
        if (y < minY) { minY = y; }
        if (x > maxX) { maxX = x; }
        if (y > maxY) { maxY = y; }

        cols.push(x);
        rows.push(y);

        cells.push({
          x: x,
          y: y,
          hue: organism.genome.get('hue').value,
          sat: organism.genome.get('sat').value
        });
      });

      self.setState({
        cells: cells,
        cols: _.uniq(cols).length,
        rows: _.uniq(rows).length,
        minX: minX,
        minY: minY
      });
    };

    gv.start();
  },

  render: function () {
    var w = window.outerWidth/(this.state.cols+1);
    var h = window.outerHeight/(this.state.rows+1);
    var minX = this.state.minX;
    var minY = this.state.minY;

    w = 10;
    h = 10;

    minX = 0;
    minY = 0;

    var cells = _.map(this.state.cells, function (cell, i) {
      var color = [cell.hue, cell.sat+'%', '50%'].join(', ');
      return React.createElement('div', {
        className: 'cell',
        key: i,
        style: {
          width: w+'px',
          height: h+'px',
          position: 'absolute',
          top: (cell.y-minY)*w+'px',
          left: (cell.x-minX)*h+'px',
          backgroundColor: 'hsl('+color+')',
        }
      });
    });

    return (<div className="grid">{cells}</div>);
  }
});


React.render(
  <GridComponent />,
  document.getElementById('root')
);