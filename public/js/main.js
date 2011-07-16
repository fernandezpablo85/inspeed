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
  return "<li>"+highlight(item, text)+"</li>";
}

function highlight (text, subtext) {
  return text.replace(new RegExp("("+subtext+")",'gi'), "<mark>$1</mark>");
}

function createListItems (collection, text) {
  return _.map(collection, function (item) {
    return makeItem(item, text);
  }).join("");
}

function drawPeoplePane(people, text) {
  console.log("drawPeoplePane("+people.length+" people)");
  $('#peopleList').empty();
  var template = "<li><div class='profileBox'>"
			   + "  <a target='_blank' class='profileLink' href='<%= person.publicProfileUrl %>'>"
			   + "    <span class='profilePicture'><img src='<%= person.pictureUrl %>'/></span>"
               + "    <span class='firstName'><%= person.firstName %></span>"
               + "    <span class='lastName'><%= person.lastName %></span>"
			   + "  </a><br />"
			   + "  <span class='headline'><%= person.headline %></span><br />"
			   + "  <span class='industry'><%= person.industry %></span><br />"
               + "</div></li>";
  $.each(people, function(idx, person) {
    if (!person.pictureUrl) {
      person.pictureUrl = 'http://static02.linkedin.com/scds/common/u/img/icon/icon_no_photo_80x80.png';
    }
    person.firstName = highlight(person.firstName, text);
    person.lastName = highlight(person.lastName, text);
    $('#peopleList').append( _.template(template, { person: person } ) );
  });
}

function onSearchInput(text) {
  var people = getPeople(connections, text);
  drawPeoplePane(people, text);

  var industries = getIndustries(connections, text);
  var mkup = createListItems(industries, text);
  $($('#industry ul')[0]).html(mkup);
  var locations = getLocations(connections, text);
  mkup = createListItems(locations, text);
  $($('#location ul')[0]).html(mkup);
  var companies = getCompanies(connections, text);
  mkup = createListItems(companies, text);
  $($('#company ul')[0]).html(mkup);
  var educations = getEducations(connections, text);
  mkup = createListItems(educations, text);
  $($('#education ul')[0]).html(mkup);
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

function getCompanies(connections, text) {
  return _.uniq(_.flatten(_.map(filterByCompany(connections,text), function(connection) {
    var match = _.select(connection.threeCurrentPositions.values, function(position) {
	  return contains(position.company.name, text);
	});
	return _.map(match, function(position) {
	  return position.company.name;
	});
  })));
}

function getEducations(connections, text) {
  return _.uniq(_.flatten(_.map(filterByEducation(connections,text), function(connection) {
    var match = _.select(connection.educations.values, function(education) {
	  return contains(education.schoolName, text);
	});
	return _.map(match, function(education) {
	  return education.schoolName;
	});
  })));
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

function filterByCompany(connections, text) {
  var filtered = _.select(connections, function(connection) {
    if (connection.threeCurrentPositions) {
	  var companyMatches = _.select(connection.threeCurrentPositions.values, function(position) {
	    return contains(position.company.name, text);
	  });
      return companyMatches.length > 0;
    }
    return false;
  });
  return filtered;
}

function filterByEducation(connections, text) {
  var filtered = _.select(connections, function(connection) {
    if (connection.educations) {
	  var educationsMatched = _.select(connection.educations.values, function(education) {
	    return contains(education.schoolName, text);
	  });
	  return educationsMatched.length > 0;
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

