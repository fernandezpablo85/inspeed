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
  var people = _.select(connections, function(connection) {
    return ((connection.firstName + " " + connection.lastName).toLowerCase().indexOf(text.toLowerCase()) >= 0);
  });
  drawPeoplePane(people);
}

function drawPeoplePane(people) {
  console.log("drawPeoplePane("+people.length+" people)");
  $('#peopleList').empty();
  var template = "<li><div class='profileBox'>"
			   + "  <a class='profileLink' href='<%= person.siteStandardProfileRequest.url %>'>"
			   + "    <span class='profilePicture'><img src='<%= person.pictureUrl %>'/></span>"
               + "    <span class='firstName'><%= person.firstName %></span>"
               + "    <span class='lastName'><%= person.lastName %></span>"
			   + "  </a><br />"
			   + "  <span class='headline'><%= person.headline %></span><br />"
			   + "  <span class='industry'><%= person.industry %></span><br />"
               + "</div></li>";
  $.each(people, function(idx, person) {
    console.debug("drawPeoplePane: "+idx+" - '"+person.firstName+" "+person.lastName+"', ", person);
    $('#peopleList').append( _.template(template, { person: person } ) );
  });
}
