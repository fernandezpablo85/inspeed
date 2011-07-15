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

function makeItem (item, text) {
  return "<li>"+item.replace(new RegExp("("+text+")",'gi'), "<mark>$1</mark>")+"</li>";
}

function createListItems (collection, text) {
  return _.map(collection, function (item) {
    return makeItem(item, text);
  }).join("");
}

function drawPeoplePane(people) {
  console.log("drawPeoplePane("+people.length+" people)");
  $('#peopleList').empty();
  var template = "<li><div class='profileBox'>"
			   + "  <a class='profileLink' href='<%= person.publicProfileUrl %>'>"
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

function onSearchInput(text) {
  var people = getPeople(connections, text);
  drawPeoplePane(people);

  var industries = getIndustries(connections, text);
  var mkup = createListItems(industries, text);
  $($('#industry ul')[0]).html(mkup);
  var locations = getLocations(connections, text);
  mkup = createListItems(locations, text);
  $($('#location ul')[0]).html(mkup);
}

function getPeople(connections, text) {
  return _.select(connections, function(connection) {
    return contains(connection.firstName, text) || contains(connection.lastName, text);
  });
}

function getIndustries(connections, text) {
  return _.uniq(_.pluck(filterByIndustry(connections,text),'industry'));
}

function getLocations(connections, text) {
  return _.uniq(_.map(filterByLocation(connections,text), function(connection) {
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

