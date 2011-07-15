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

  $('#input').keyup(function(event){
    $(document).trigger('input:changed', [this.value]);
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
    IN.API.Connections('me').result(function (data){
      window.connections = data.values;
      callback();
    });
  }
}

function onSearchInput(text) {
  var industries = _.uniq(_.pluck(filterByIndustry(connections, text), 'industry'));
  console.log(industries);
}

function filterByIndustry(connections, text) {
  var filtered = _.select(connections, function(connection) {
    return startsWith(connection.industry, text);
  });
  return filtered;
}

function startsWith(field, text) {
  if (field) {
    return field.substring(0, text.length) === text;
  } 
  return false;
}