var geojsonLayer;
var features;
var styleCompany = { fillColor: 'yellow', color: 'blue', weight: 1, fillOpacity: 0.8 }
var styleOrigin = { fillColor: 'cyan', color: 'blue', weight: 1, fillOpacity: 0.8 }
var styleBoth = { fillColor: 'magenta', color: 'blue', weight: 1, fillOpacity: 0.8 }
let styleDefault = { fillColor: 'white', color: 'blue', weight: 1, fillOpacity: 0.8 };
//bubblingMouseEventa: true,

var company_keys;
var company_values;
var bean_bar_names;
var REFs;
var bean_types;
var review_dates;
var cocoa_percents;
var locations;
var ratings;
var bean_types;
var bean_origins;

var company_url_keys;
var company_url_companies;
var company_url_urls;

var is_painted = false;

function restyleLayer(propertyName, country, style) {
  geojsonLayer.eachLayer(function (featureInstanceLayer) {
    propertyValue = featureInstanceLayer.feature.properties[propertyName];
    //console.log(`propertyName=${propertyName}, propertyValue=${propertyValue}`);
    if (propertyValue == country) {
      featureInstanceLayer.setStyle(style);
    }
  });
}

function toggleCountry(feature, country, style) {
  //console.log(`feature=${feature.properties.ADMIN}`);
  let geometry_type = feature.geometry.type;
  if (geometry_type == "Polygon" || geometry_type == "MultiPolygon") {
    restyleLayer('ADMIN', country, style);
    //console.log(`${country}`);
  }
}

function drawMap() {
  console.log(`drawMap`)
  if (features) {
    is_painted = true;
    features.forEach((feature) => {
      let destination = locations[sample];
      let source = bean_origins[sample];
      let both = false;
      if (destination == source) {
        both = true;
      }
      let country = feature.properties.ADMIN;
      if (country == destination) {
        if (both) {
          console.log(`both=${country}`)
          toggleCountry(feature, country, styleBoth);
        }
        else {
          console.log(`destination=${country}`)
          toggleCountry(feature, destination, styleCompany);
        }
      }
      if (country == source) {
        if (both == false) {
          console.log(`source=${country}`)
          toggleCountry(feature, source, styleOrigin);
        }
      }
    });
  }
}

function init() {
  console.log(`start init()`);
  // Grab a reference to the dropdown select element
  var selector = d3.select("#selDataset");

  console.log(`read geojson`);
  d3.json("countries.geojson").then(function (data) {
    //console.log(data);
    geojsonLayer = L.geoJson(data, {
      style: styleDefault,
      onEachFeature: function (feature, layer) {
        layer.bindPopup("<h3>Country: " + "foo");
      }
    }).addTo(map);

    features = JSON.parse(JSON.stringify(data.features));

    //console.log(`one: features=${features}`)
  });
  //console.log(`two: features=${features}`)

  d3.json("chocolate_company_urls.json").then((data) => {
    company_url_keys = Object.keys(data.Company);
    company_url_companies = Object.values(data.Company);
    company_url_urls = Object.values(data.URL);
    //console.log(`one: urls=${company_url_urls}`)
  });

  console.log(`read csv`);
  // Use the list of sample names to populate the select options
  d3.json("flavors_of_cacao_with_index.json").then((data) => {
    company_keys = Object.keys(data.Company);
    company_values = Object.values(data.Company);
    bean_bar_names = Object.values(data.Bean_Origin_or_Bar_Name);
    REFs = Object.values(data.REF);
    review_dates = Object.values(data.Review_Date);
    cocoa_percents = Object.values(data.Cocoa_Percent);
    locations = Object.values(data.Company_Location);
    ratings = Object.values(data.Rating);
    bean_types = Object.values(data.Bean_Type);
    bean_origins = Object.values(data.Broad_Bean_Origin);

    // populate the drop-down selector
    company_keys.forEach((key) => {
      company = company_values[key];
      bar_name = bean_bar_names[key];
      bar_ref = REFs[key];
      bean_type = bean_types[key];
      selector
        .append("option")
        .text(`${key}: ${company}: ${bar_name}: ${bar_ref}: ${bean_type}`)
        .property("value", key);
    });

    // Use the first sample from the list to build the initial plots
    var firstSample = 0;
    buildCharts(firstSample);
    buildMetadata(firstSample);
    //console.log(`three: bean_types=${bean_types}`)

  });
  //console.log(`finish init() features=${features}, bean_types=${bean_types}`);
  drawMap();
}

legend = L.control({
  position: "topright"
});
legend.onAdd = function () {
  let div = L.DomUtil.create("div", "info legend");
  div.innerHTML +=
    "<br><br><br><br><br><br>"
    + "<i style=\'background: yellow\'>&nbsp;&nbsp;&nbsp;</i>&nbsp;Company</i><br>"
    + "<i style=\'background: cyan\'>&nbsp;&nbsp;&nbsp;</i>&nbsp;Cacao Origin</i><br>"
    + "<i style=\'background: magenta\'>&nbsp;&nbsp;&nbsp;</i>&nbsp;Both</i><br>";
  // + "<i>&nbsp;&nbsp;&nbsp;</i>&nbsp;& Bean Origin same</i><br>";
  return div;
}
legend.addTo(map);

function optionChanged(newSample) {
  //console.log(`optionsChanged newSample=${newSample} features=${features} bean_types=${bean_types}`);
  // Fetch new data each time a new sample is selected
  buildMetadata(newSample);
  buildCharts(newSample);
}

//FIXME
//See: https://gis.stackexchange.com/questions/78069/how-do-i-set-the-fillcolor-of-polygons-in-leaflet-js-dynamically#93987
//polygon.setStyle({fillColor: '#0000FF'});

// Demographics Panel 
function buildMetadata(sample) {
  console.log(`buildMetadata()`);
  //console.log(`buildMetadata() bean_types=${bean_types}`);
  //console.log(`buildMetadata() features=${features}`);

  metadata = {
    "id": sample,
    "company": company_values[sample],
    "Bean_Origin_or_Bar_Name": bean_bar_names[sample],
    "REF": REFs[sample],
    "Review_Date": review_dates[sample],
    "Cocoa_Percent": cocoa_percents[sample],
    "Company_Location": locations[sample],
    "Rating": ratings[sample],
    "Bean_Type": bean_types[sample],
    "Broad_Bean_Origin": bean_origins[sample]
  };
  // Use d3 to select the panel with id of `#sample-metadata`
  var PANEL = d3.select("#sample-metadata");
  // Use `.html("") to clear any existing metadata
  PANEL.html("");
  // Use `Object.entries` to add each key and value pair to the panel
  // Hint: Inside the loop, you will need to use d3 to append new
  // tags for each key-value in the metadata.
  Object.entries(metadata).forEach(([key, value]) => {
    PANEL.append("h6").text(`${key.toUpperCase()}: ${value}`);
  });

  COMPANY_URL = d3.select("#url-path1");
  COMPANY_URL.html("");
  let this_company = company_values[sample];
  if (company_url_keys) {
    company_url_keys.forEach((key) => {
      if (company_url_companies[key] == this_company) {
        COMPANY_URL.html(`<p>website: <a href=${company_url_urls[key]}>${company_url_urls[key]}</a></p>`);
      }
    });
  }

  let destination = locations[sample];
  let source = bean_origins[sample];
  let both = false;
  if (destination == source) {
    both = true;
  }

  if (features) {
    features.forEach((feature) => {
      let country = feature.properties.ADMIN;
      toggleCountry(feature, country, styleDefault);
    });
    features.forEach((feature) => {
      let country = feature.properties.ADMIN;
      if (country == destination) {
        if (both) {
          //console.log(`both=${country}`)
          toggleCountry(feature, country, styleBoth);
        }
        else {
          //console.log(`destination=${country}`)
          toggleCountry(feature, destination, styleCompany);
        }
      }
      if (country == source) {
        if (both == false) {
          //console.log(`source=${country}`)
          toggleCountry(feature, source, styleOrigin);
        }
      }
    });
  }
}

// 1. Create the buildCharts function.
function buildCharts(sample) {
  console.log(`buildCharts()`);
  //console.log(`buildCharts() bean_types=${bean_types}`);
  //console.log(`buildCharts() features=${features}`);
  var rating = ratings[sample];
  var gaugeData = [
    {
      value: rating,
      title: { text: "Rating" },
      type: "indicator",
      mode: "gauge+number",
      gauge: {
        axis: { range: [null, 5], tickwidth: 1, tickmode: "array", tickvals: [0, 2, 4, 6, 8, 10] },
        bar: { color: "black" },
        steps: [
          { range: [0, 1], color: "red" },
          { range: [1, 2], color: "orange" },
          { range: [2, 3], color: "yellow" },
          { range: [3, 4], color: "olive" },
          { range: [4, 5], color: "darkgreen" },
        ]
      }
    }
  ];

  // 5. Create the layout for the gauge chart.
  var gaugeLayout = {
    //title: "Chocolate Bar Rating",
    width: 175,
    height: 175,
    margin: {
      t: 0,
      b: 0,
      l: 0,
      r: 0
    },
    bar: { color: "black" }
  };

  // 6. Use Plotly to plot the gauge data and layout.
  Plotly.newPlot("gauge", gaugeData, gaugeLayout);
}

// Initialize the dashboard
init();
