/*******Globals*/

// holds the logged user connections for fast in-memory access.
window.connections = [];

// holds the selected filters (undefined by default).
window.filters = { 'industry'  : undefined,
                   'education' : undefined,
                   'company'   : undefined,
                   'location'  : undefined }
/***************/

IN.Event.on(IN, 'systemReady', function() {
  startTextAnimation();
  
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

    if (event.keyCode == 13) {
      if ($('#peopleList li').length == 1) {
        $("#the-form").attr('action', $('#peopleList .profileLink')[0].href);
        $("#the-form").attr('target', '_blank');
        $('#the-form').submit();
        $("#the-form").removeAttr('target');
        $("#the-form").removeAttr('action');
      }
    }

    if (event.keyCode != 13 && this.value.length >= 2) {
      $(document).trigger('input:changed', [this.value]);
    }
  });

  $('body').delegate('.filter li', 'click', function(event) {
    selectFilter(event.target);
    drawPeoplePane(getPeople(connections, ''));
  });

  $(document).bind('input:changed', function(event, text) {
    onSearchInput(text);
  });
});

function selectFilter(element) {
  var e = $(element);
  // get the filter type.
  var section = e.closest('section');

  if (!section.hasClass('selected')) {
    window.filters[section.attr('id')] = e.text();
    section.addClass('selected');
    e.addClass('selected');
  } else {
    window.filters[section.attr('id')] = undefined;
    section.removeClass('selected');
    e.removeClass('selected');
  }

  // clear input
  $('#input').val('');
}

function _onAuth () {
  getConnections(_onConnectionsReady);
}

function _onConnectionsReady() {
  $('#input').attr('disabled', false).attr('placeholder', 'Search your network...');
  $('#li-login').hide();
  stopTextAnimation();
}

function startTextAnimation() {
  var dots = ['','.','..','...'];
  var text = $('#input').attr('placeholder');
  var i = 0;
  function moveDots() {
    $('#input').attr('placeholder', text + dots[i++]);
    if (i == dots.length) {
      i = 0;
    }
  };
  window.dotTimer = window.setInterval(moveDots, 500);
}

function stopTextAnimation() {
  window.clearInterval(window.dotTimer);
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
  if (item.indexOf("~") == 0) {
    return "<li class='selected'>"+highlight(item.slice(1), text)+"</li>"; 
  } else {
    return "<li>"+highlight(item, text)+"</li>";  
  }
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

    // Clone to avoid modifying the orginal object, so that changes only go to the template.
    var personCopy = _.clone(person);

    if (!personCopy.pictureUrl) {
      personCopy.pictureUrl = 'http://static02.linkedin.com/scds/common/u/img/icon/icon_no_photo_80x80.png';
    }
    if (text && text.length > 1) {
      personCopy.firstName = highlight(personCopy.firstName, text);
      personCopy.lastName = highlight(personCopy.lastName, text);
    }
    $('#peopleList').append( _.template(template, { person: personCopy } ) );
  });
}

function onSearchInput(text) {
  var people = getPeople(connections, text);
  drawPeoplePane(people, text);

  var industries = getIndustries(connections, text);
  renderList(industries, text, 'industry');
 
  var locations = getLocations(connections, text);
  renderList(locations, text, 'location');
  
  var companies = getCompanies(connections, text);
  renderList(companies, text, 'company');
  
  var educations = getEducations(connections, text);
  renderList(educations, text, 'education');
}

function renderList(collection, searchText, filterName) {
  title = collection.length > 0 ? 'by ' + filterName + ':' : '';
  $('#' + filterName + ' div').html(title);
  
  var mkup = createListItems(collection, searchText);
  $('#' + filterName + ' ul').html(mkup);
}

function getPeople(connections, text) {
  return _.select(connections, function(connection) {
    
    var companyMatches = matchCompany(connection.threeCurrentPositions, window.filters.company);
    var educationMatches = matchEducation(connection.educations, window.filters.education);
    var locationMatches = matchLocation(connection.location, window.filters.location);
    var industryMatches = contains(connection.industry, window.filters.industry);
    
    var nameMatches = contains(connection.firstName, text) || contains(connection.lastName, text)
    
    return nameMatches && industryMatches && locationMatches && companyMatches && educationMatches;
  });
}

function matchCompany(company, filterValue) {
  if (!filterValue) return true;
  if (company) {
    var matches = _.select(company.values, function(position) {
      return contains(position.company.name, filterValue);
    });
    return matches.length > 0;
  }
  return false;
}

function matchEducation(education, filterValue) {
  if (!filterValue) return true;

  if (education) {
    var matches = _.select(education.values, function(school) {
      return contains(school.schoolName, filterValue);
    });
    return matches.length > 0;
  }
  return false;
}

function matchLocation(location, filterValue) {
  if (!filterValue) return true;
  return (location) ? contains(location.name, filterValue) : false;
}

function getIndustries(connections, text) {
  if (window.filters.industry) return ["~"+window.filters.industry];
  return _.uniq(_.pluck(filterByIndustry(connections,text),'industry'));
}

function getLocations(connections, text) {
  if (window.filters.location) return ["~"+window.filters.location];
  return _.uniq(_.map(filterByLocation(connections,text), function(connection) {
    return connection.location.name;
  }));
}

function getCompanies(connections, text) {
  if (window.filters.company) return ["~"+window.filters.company];
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
  if (window.filters.education) return ["~"+window.filters.education];  
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
  if (!text) return true;

  if (field) {
    field = field.toLowerCase();
    return field.indexOf(text.toLowerCase()) >= 0;
  }
  return false;
}
