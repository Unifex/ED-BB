var kofi_button = "<div class='text-center'><a href='https://ko-fi.com/W7W51MP72' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a></div>";

$(json_data.systems).each(function (index, system) {
  // create an unordered list of biologicals for each system as a string
  var biologicals = "";
  // Default to complete.
  var biological_count = 0;
  var biological_scanned = 0;
  $(system.biologicals).each(function (bio_index, biological) {
    checked = "";
    biological_count++;
    if (getBiologicalState(system.name, system.body, biological)) {
      biological_scanned++;
      checked = "checked";
    }
    biologicals += "<li>";
    // Add a checkbox showing the status of the biological
    biologicals += "<input type='checkbox' ";
    biologicals += "data-system-index='" + index + "' ";
    biologicals += "data-system='" + system.name + "' ";
    biologicals += "data-body='" + system.body + "' ";
    biologicals += "data-biological='" + biological + "' ";
    biologicals += "id='" + biological + "' ";
    biologicals += "onclick='toggleBiological(this)' ";
    biologicals += checked + "/>";
    // Add a label for each biological
    biologicals += "<label for='" + biological + "'>" + biological + "</label>";
    biologicals += "</li>";
  });
  // Append the list of biologicals to the system infos
  if (system.name != "Sol") {
    json_data.systems[index].infos = "<h3>Body: " + system.body + "</h3>";
    json_data.systems[index].infos += "<ul class='biologicals'>" + biologicals + "</ul>";
    json_data.systems[index].infos += kofi_button;
  }
})
.promise()
.then(function () {
  $(json_data.systems).each(function (index, system) {
    json_data.systems[index].cat = checkSystemCategory(system.name);
  })
  .promise()
  .then(function () {

    credits = [
      {
        name: "Down To Earth Astronomy",
        url: "https://cmdrs-toolbox.com/billionaires-boulevard",
      },
      {
        name: "ED3D Galaxy Map",
        url: "https://github.com/gbiobob/ED3D-Galaxy-Map",
      },
      {
        name: "EDSM",
        url: "https://www.edsm.net/",
      },
    ];

    about = "This was created for my personal use, but I thought I'd share " +
      "it with the community. " +
      "This tool will track <em>and remember</em> your progress in " +
      "<a href='https://cmdrs-toolbox.com/billionaires-boulevard'>Billionaire's " +
      "Boulevard</a>. The 'memory' of your progress is in your browsers local storage. " +
      "I hope you enjoy it.";
    // Finally init the map.
    Ed3d.init({
      container: "edmap",
      json: json_data,
      withHudPanel: true,
      credits: credits,
      about: about,
      kofi: kofi_button,
      effectScaleSystem: [128, 1500],
      systemColor: "#00FF00",
      showNameNear: false,
      showNameFar: true,
    });
  })
  .promise()
  .then(function () {
    $('#hud').append("Testing");
  });
});

/**
 * We need to check the state of each biological in all entries for a system.
 *
 * @param {string} system_name 
 * @returns array
 */
function checkSystemCategory(system_name) {
  // The category of the system.
  var cat = [];
  // Get all systems in json_data that have this system name.
  var systems = json_data.systems.filter(function (system) {
    return system.name == system_name;
  });
  // Check the state of each biological in each system.
  var biological_count = 0;
  var biological_scanned = 0;
  $(systems).each(function (index, system) {
    $(system.biologicals).each(function (bio_index, biological) {
      biological_count++;
      if (getBiologicalState(system.name, system.body, biological)) {
        biological_scanned++;
      }
    });
  });
  // Set the category of the system.
  if (system_name == "Sol") {
    cat = [4];
  } else if (biological_scanned == biological_count) {
    cat = [3];
  } else if (biological_scanned > 0) {
    cat = [2];
  } else {
    cat = [1];
  }
  return cat;
}

function getParticleId(system) {
  var x = parseInt(system.coords.x);
  var y = parseInt(system.coords.y);
  var z = -parseInt(system.coords.z); //-- Revert Z coord
  return x + '_' + y + '_' + z;
}

// Toggle the state of the Biological in local storage.
function toggleBiological(bio) {
  var system = $(bio).data("system");
  var body = $(bio).data("body");
  var biological = $(bio).data("biological");
  var key = system + " " + body + " " + biological;
  var value = localStorage.getItem(key);
  if (value == null) {
    localStorage.setItem(key, "1");
  } else {
    localStorage.removeItem(key);
  }
  setSystemStatus(system, body);
  updateSystemOnMap(system, body);
}

function updateSystemOnMap(system, body) {
  var newColor = new THREE.Color(0x8888ff);
  var thisSystem = getSystem(system, body);

  var idSys = getParticleId(thisSystem);
  var indexParticle = System.particleInfos[idSys];

  switch (thisSystem.cat[0]) {
    case 1:
      newColor = new THREE.Color(0xff0000);
      break;
    case 2:
      newColor = new THREE.Color(0xffa500);
      break;
    case 3:
      newColor = new THREE.Color(0x00ff00);
      break;
  }
  System.particleColor[indexParticle] = newColor;
  System.particleGeo.colorsNeedUpdate = true;

}

// Fetch a single system from json_data.
function getSystem(name, body) {
  ret = null
  $(json_data.systems).each(function (index, system) {
    if (system.name == name && system.body == body) {
      ret = system;
    }
  });
  return ret;
}

// Set the status of a system based on the status of its Biologicals.
function setSystemStatus(name, body) {
  $(json_data.systems).each(function (index, system) {
    if (system.name == name && system.body == body) {
      json_data.systems[index].cat = checkSystemCategory(system.name);
    }
  });
}

// Get the state of a Biological in local storage.
function getBiologicalState(system, body, biological) {
  var key = system + " " + body + " " + biological;
  var value = localStorage.getItem(key);
  if (value == null) {
    return 0;
  } else {
    return 1;
  }
}

// Get the coordinates of a system from local storage.
function getSystemCords(system) {
  var key = "coords " + system;
  var value = localStorage.getItem(key);
  if (value == null) {
    return { x: 0, y: 0, z: 0 };
  } else {
    return JSON.parse(value);
  }
}

// Set the coordinates of a system in local storage.
function setSystemCoords(system, coords) {
  localStorage.setItem("coords " + system, JSON.stringify(coords));
}
