var _              = require('underscore'),
    React          = require('react'),
    Simulation     = require('./simulation/simulation'),
    GridVisualizer = require('./visualizers/grid-visualizer');

var simWorker = Simulation.async({
  speed: 0.5,
  mutationRate: 0.3,
  mutationSpread: 5,
  maxPopulation: 500,
  initialPopulation: 1,
  pDivideFit: 0.5,
  pDivideUnfit: 0.001,
  maxTime: 20000
});

// simWorker.on('divide', function (data) {
//   console.log('something divided!', data.parent);
// });
// 
// simWorker.on('update', function (data) {
//   console.log('pop size', data.population.length);
// });
// 
// simWorker.on('die', function (data) {
//   console.log('deaths :-(', data.ids);
// });

var gv = new GridVisualizer(simWorker);
simWorker.start();

var GridComponent = React.createClass({
  getInitialState: function () {
    return { cells: [], sideLength: gv.grid.getSideLength() };
  },

  componentDidMount: function () {
    var self = this;

    setInterval(function () {
      var cells = [];
      gv.grid.each(function (obj) {
        var org = obj.value;
        cells.push({
          x: obj.x,
          y: obj.y,
          hue: org.genome.get('hue').value,
          sat: org.genome.get('sat').value
        });
      });

      self.setState({ cells: cells });
    }, 500);

    console.log('component mounted, time to start the grid visualizer');
  },

  render: function () {
    var w = Math.max(Math.floor(window.innerWidth/(this.state.sideLength)), 1),
        h = Math.max(Math.floor(window.innerHeight/(this.state.sideLength)), 1);

    var cells = _.map(this.state.cells, function (cell, i) {
      var color = [cell.hue, cell.sat+'%', '50%'].join(', ');
      return React.createElement('div', {
        className: 'cell',
        key: i,
        style: {
          width: w+'px',
          height: h+'px',
          position: 'absolute',
          top: cell.y*h+'px',
          left: cell.x*w+'px',
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

console.log('hello, world!');