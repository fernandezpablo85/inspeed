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
  $.getJSON('connections.pablo.json', function(data) {
    connections = data.connections;
    callback();
  });  
}

function onSearchInput(text) {
  var filtered = _.select(connections, function(connection) {
    var include = false;
    if (connection.industry) {
      include = connection.industry.substring(0, text.length) === text;
    }
    return include;
  });
  console.log(filtered);
}