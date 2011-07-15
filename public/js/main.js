IN.Event.on(IN, 'systemReady', function() {
  if (IN.User.isAuthorized()) {
    _onAuth();
  } else {
    $('#input').attr('placeholder', 'You must login in order to use InSpeed');
    $('#li-login').show();
    $('#li-login').click(function () {
      IN.User.authorize(_onAuth);
    });
  }

  $('#input').keyup(function(event) {
    // Ignore shift key (13) and do not fire if text.length is less than 2 characters.
    if (event.keyCode != 13 && this.value.length >= 2) {
      $(document).trigger('input:changed', [this.value]);
    }
  });

  // Sample listener.
  $(document).bind('input:changed', function(event, text) {
    onSearchInput(text);
  });
});

var connections = [];

function _onAuth () {
  getConnections(_onConnectionsReady);
}

function _onConnectionsReady() {
  $('#input').attr('disabled', false).attr('placeholder', 'Search your network...');
  $('#li-login').hide();
}

function getConnections(callback) {
  if (window._devMode) {
    $.getJSON('connections.pablo.json', function(data) {
      window.connections = data.connections;
      callback();
    });
  } else {
    var fs = ['location', 'firstName', 'lastName', 'industry', 'headline', 'pictureUrl', 'publicProfileUrl', 'threeCurrentPositions', 'educations'];
    IN.API.Connections('me').fields(fs).result(function (data){
      window.connections = data.values;
      callback();
    });
  }
}

function onSearchInput(text) {
  var industries = _.uniq(_.pluck(filterByIndustry(connections, text), 'industry'));
  console.log(industries);
  var locations = getLocations(filterByLocation(connections, text));
  console.log(locations);
}

function getLocations(connections) {
  return _.uniq(_.map(connections, function(connection) {
    return connection.location.name;
  }));
}

function filterByIndustry(connections, text) {
  var filtered = _.select(connections, function(connection) {
    return contains(connection.industry, text);
  });
  return filtered;
}

function filterByLocation(connections, text) {
  var filtered = _.select(connections, function(connection) {
    if (connection.location) {
      return contains(connection.location.name, text);
    }
    return false;
  });
  return filtered;
}

function contains(field, text) {
  if (field) {
    field = field.toLowerCase();
    return field.indexOf(text.toLowerCase()) >= 0;
  } 
  return false;
}