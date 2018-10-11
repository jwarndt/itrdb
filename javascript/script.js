$(document).ready(function(){

var map;
var imagery =  L.tileLayer.wms('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var topo = L.tileLayer.wms('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
});

var openstreetmap = L.tileLayer.wms('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

var mapbox = L.tileLayer.wms('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
});

/*###################################
#     ESRI layers
#####################################*/
var esriToken;
var esriTokenSettings = {
    "async": true,
    "crossDomain": true,
    "url": "https://www.arcgis.com/sharing/rest/oauth2/token",
    "method": "POST",
    "headers": {
      "content-type": "application/x-www-form-urlencoded",
      "accept": "application/json"
    },
    "data": {
      "expiration": 120,
      "client_id": "s1RAkoIlJZQH1kM4",
      "client_secret": "eb07a9b423c842d885215f17f34a2718",
      "grant_type": "client_credentials"
    }
}

var esriHillshade = L.esri.tiledMapLayer({
    url:"https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer"
});
var esriTerrain;
var esriElevHillshade
var esriAspect;
var esriSlope;
var itrdb

//esriToken = "FJ-ZG-kG5pVLDUbCMDOyJ-ZJrAbyz-ZDmgiLk7CFaIfhtughOqYRvOiGxKRdwqdELYOhXwn5-TGjNuLZlLSet1nxUCj3w6FvCfml0vxVyLV8wxEwnE4rs2AVxvs1NjIvP3l_iDbo16Rbcq5EureqoA..";;
$.ajax(esriTokenSettings).done(function (response) {
  console.log('esri token: ', response);
  //console.log(response.slice(16,response.indexOf(',"expires')));
  //esriToken = "zhBLmIVVDFKsV5B-9gXw7pyAqKSN-kYqH6NQSh4xKJ9gC1vpxCjW5uZQP_FLYMQshLZGFhNQAb59Bmy7gwlMFFsYE11S2xehqnYD58dPakxGwxPFbnYzUm6JCnv9VLjh";
  esriToken = response.slice(16,response.indexOf(',"expires'));
});

var esriTerrainURL = "https://elevation.arcgis.com/arcgis/rest/services/WorldElevation/Terrain/ImageServer"

$(document).ajaxComplete(function(e, xhr, settings) {
  if(settings.url === "https://www.arcgis.com/sharing/rest/oauth2/token") {
    console.log("requesting esri layers with access token");
    // the base elevation model for querying elevation information
    // it isn't for display
    esriTerrain = L.esri.imageMapLayer({
      url:esriTerrainURL,
      token:esriToken
    });

    var elevhillshadeRenderingRule = {
      "rasterFunction":"Elevation_Tinted_Hillshade"
    }
    esriElevHillshade = L.esri.imageMapLayer({
      url: esriTerrainURL,
      token: esriToken,
      renderingRule: elevhillshadeRenderingRule,
      pane: "tilePane"
    });

    var aspectRenderingRule = {
      "rasterFunction":"Aspect_Map"
    }
    esriAspect = L.esri.imageMapLayer({
      url: esriTerrainURL,
      token: esriToken,
      renderingRule: aspectRenderingRule,
      pane: "tilePane"
    });

    var slopeRenderingRule = {
      "rasterFunction":"Slope_Degrees_Map"
    }
    esriSlope = L.esri.imageMapLayer({
      url: esriTerrainURL,
      token: esriToken,
      renderingRule: slopeRenderingRule,
      pane: "tilePane"
    });
  itrdb = L.tileLayer.wms("http://localhost:8080/geoserver/ows?", {
      layers: "itrdb:itrdb",
      format: 'image/png',
      transparent: true,
      attribution: "Map application by <a href='http://www.jwarndt.com' target='_blank'>Jacob Arndt</a>"
    });

    map = L.map('mapid', {
        center: [20, -15],
        zoom: 2,
        layers: [mapbox, itrdb]
    });

    var basemaps = {
        "Imagery": imagery,
        "Topo": topo,
        "OpenStreetMap": openstreetmap,
        "MapBox": mapbox,
        "Hillshade": esriHillshade,
        "Elevation Hillshade": esriElevHillshade,
        "Slope": esriSlope,
        "Aspect": esriAspect,
    };

    var overlays = {
        "ITRDB": itrdb
    }

    L.control.layers(basemaps, overlays, {position: 'topleft'}).addTo(map);

    basemaps.MapBox.addTo(map);
    map.addEventListener('click', Identify);
  }
});

function updateBuffer() {
  /*
  function for adjusting the buffer relative to 
  the zoom level for bringing up the popup for
  features
  */
  var zoomLevel = map.getZoom();
  var buffer = 0;
  if (zoomLevel <= 5) {
    buffer = 0.06;
  }
  else if (zoomLevel <= 7) {
    buffer = 0.045;
  }
  else if (zoomLevel < 10) {
    buffer = 0.02;
  }
  else if (zoomLevel == 10) {
    buffer = 0.01;
  }
  else if (zoomLevel == 11) {
    buffer = 0.005;
  }
  else if (zoomLevel == 12) {
    buffer = 0.001;
  }
  else {
    buffer = 0.00055;
  }
  return buffer
}



  var popup = L.popup(className='popupWindow');
  var featureDat;
  var cqlFilter = null;

    // define event handler function for click events and register it
    function Identify(e) {
        /*
        map.options.crs is in EPSG:3857.
        an e.layerPoint returns the coordinates in pixels
        a map.getBounds() returns coordinates in EPSG 4326

        */
        
        var click_buffer = updateBuffer();
        click_point = map.layerPointToLatLng(e.layerPoint);
        lat = click_point.lat;
        lon = click_point.lng;

        var sw = map.options.crs.project(map.getBounds().getSouthWest()); //units: map coords
        var ne = map.options.crs.project(map.getBounds().getNorthEast()); //units: map coords
        var x_loc = Math.trunc(map.layerPointToContainerPoint(e.layerPoint).x); //units: pixels
        var y_loc = Math.trunc(map.layerPointToContainerPoint(e.layerPoint).y); //units: pixels
        
        var llx = lon - click_buffer;
        var lly = lat - click_buffer;
        var urx = lon + click_buffer;
        var ury = lat + click_buffer;
        var parameters = {
          SERVICE: 'WFS',
          VERSION: '1.1.0',
          REQUEST: 'GetFeature',
          TYPENAME: "itrdb_all:itrdb_all",
          outputFormat: 'text/javascript',
          srsName:"EPSG:4326",
          HEIGHT: map.getSize().y,
          WIDTH: map.getSize().x,
          bbox: lly + "," + llx + "," + ury + "," + urx //minx, miny, maxx, maxy
        }

        var url = 'http://localhost:8080/geoserver/ows' + L.Util.getParamString(parameters);

        $.ajax({
          jsonp: false,
          contentType: "application/json",
          jsonpCallback: "parseResponse",
          type: "GET",
          url: url,
          dataType: "jsonp",
          success: function(data) {
            if (data.totalFeatures == 0) {
              null;
            }
            else {
              featureDat = data.features[0];
              handleJSON(data);
            }
          }
        });
    }

    function handleJSON(data) {
      console.log(data);

      //highlight the feature

      var highlightStyle = {
          radius: 6,
          fillColor: "#fa1b14",
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
      };
      var latlng = L.latLng(data.features[0].geometry.coordinates[1], data.features[0].geometry.coordinates[0]);
      var highlightFeature = L.geoJSON(data.features[0], {
          pointToLayer: function (feature, latlng) {
              return L.circleMarker(latlng, highlightStyle);
          }
      });

      /*var terrainElev;
      esriAspect.identify()
        .at(latlng)
        .run(function(error, results, rawresponse) {
          terrainElev = String(results.pixel.properties.value)
          console.log(String(data.features[0].properties.studyID) +", "+ String(results.pixel.properties.value));
          $("#elev").text(terrainElev);
      });*/
      
      highlightFeature.addTo(map);

      // set the popup
      popup.setLatLng({"lat":data.features[0].geometry.coordinates[1],
                      "lng":data.features[0].geometry.coordinates[0]});
      var popupHeader = buildPopupHeader(data.features[0]);
      var content = buildOverviewContent(data.features[0]);
      htmlString = popupHeader + content;
      popup.setContent(htmlString);
      popup.openOn(map);
      //$("#elev").text(terrainElev);

      map.on('popupclose', function(e) {
        console.log('popup closed. removing wfs highlight layer');
        map.removeLayer(highlightFeature);
      });

      $('#dataOverview').on('click', function() {
        buildOverviewPopup(data.features[0]);
      });

      $('#dataAdvanced').click(function() {
        buildDataPopup(data.features[0]);
      });

      $(".plotButton").on("click", function() {
        var fileID = $(this).next().text();
        console.log("plot button clicked: " + fileID);
      });

    }

    function buildOverviewPopup(feature) {
      var popupHeader = buildPopupHeader(feature);
      var content = buildOverviewContent(feature);
      htmlString = popupHeader + content;
      popup.setContent(htmlString);

      $('#dataOverview').on('click', function() {
        buildOverviewPopup(feature);
      });

      $('#dataAdvanced').click(function() {
        buildDataPopup(feature);
      });
    }

    function buildDataPopup(feature) {
      var popupHeader = buildPopupHeader(feature);
      var content = buildDataContent(feature);
      htmlString = popupHeader + content;
      popup.setContent(htmlString);

      $('#dataOverview').on('click', function() {
        buildOverviewPopup(feature);
      });

      $('#dataAdvanced').click(function() {
        buildDataPopup(feature);
      });

      $(".plotButton").on("click", function() {
        var fileID = $(this).next().text();
        console.log("plot button clicked: " + fileID);
        if (fileID.slice(-3) == "crn") { // chronology
          jsonData = $.ajax({
            type: "GET",
            url: "http://localhost:8080/geoserver/www/itrdb_crn_data.json",
            contentType: "application/json",
            async: false,
            datatype: "json",
            success: function(data) {
              buildPlot(data[fileID], "crn");
            }
          });
        }
        else if (fileID.slice(-3) == "rwl") { //ring width
          jsonData = $.ajax({
            type: "GET",
            url: "http://localhost:8080/geoserver/www/itrdb_rwl_data.json",
            dataType: "json",
            async: false,
            contentType: "application/json",
            success: function(data) {
              buildPlot(data[fileID], "rwl");
            }
          });
        }
        else { // correlation stats
          jsonData = $.ajax({
            type: "GET",
            url: "http:/localhost:8080/geoserver/www/itrdb_corr_data.json",
            dataType: "json",
            async: false,
            contentType: "application/json",
            success: function(data) {
              buildPlot(data[fileID], "corr");
            }
          });
        }
      });
    }

    function buildPopupHeader(feature) {
      var html = "<div class=popupHeader>\
                  <h6>" + feature.properties.sitename + "</h6> (" + feature.properties.lat + ", " + feature.properties.lon + ")<br>\
                  <hr class='my-6' style='margin-bottom:0px'>\
                  <button title='chronology overview' type='button' class='btn btn-light popupButton' id='dataOverview'>\
                  <img src='./glyph-iconset-master/svg/si-glyph-bullet-list-2.svg'></button>\
                  <button title='more information' type='button' class='btn btn-light popupButton' id='dataAdvanced'>\
                  <img src='./glyph-iconset-master/svg/si-glyph-chart-decrease.svg'></button>\
                  </div>"
      return html
    }

    function buildOverviewContent(feature) {
      var content = "<div class=popupContent>\
                    <div>\
                      <h6>Study Information</h6>\
                      <b>Site name:</b> " + feature.properties.sitename + "<br>\
                      <b>Investigators:</b> " + feature.properties.invstgtrs + "<br>\
                      <b>Study code:</b> " + feature.properties.studyCode + "<br>\
                      <b>Study ID:</b> " + feature.properties.studyID + "<br><br>\
                    </div>\
                    <div>\
                      <h6>Species Information</h6>\
                      <b>Common name:</b> " + feature.properties.sppCom + "<br>\
                      <b>Scientific name:</b> " + feature.properties.sppSci + "<br>\
                      <b>Species code:</b> " + feature.properties.sppCode + "<br><br>\
                    </div>\
                    <div>\
                      <h6>Data Information</h6>\
                      <b>Innermost ring:</b> " + feature.properties.earliest + "<br>\
                      <b>Outtermost ring:</b> " + feature.properties.mostRecent + "<br>\
                      <b>Series intercorrelation:</b> " + feature.properties.earliest + "<br>\
                      <b>Percent problem segments:</b> " + feature.properties.earliest + "<br>\
                      <b>Number of dated series:</b> " + feature.properties.earliest + "<br>\
                      <b>Average autocorrelation:</b> " + feature.properties.earliest + "<br>\
                      <b>Average standard deviation:</b> " + feature.properties.earliest + "<br>\
                      <b>Average mean sensitivity:</b> " + feature.properties.earliest + "<br><br>\
                    </div>\
                    <div>\
                      <a href='"+ feature.properties.noaaPage +"' target='_blank'>NOAA study page</a><br>\
                      <a href='"+ feature.properties.filename + "' target='_blank'>NOAA JSON metadata</a><br><br>\
                    </div>\
                    </div>";
      return content;
    }

    // a complete mess. hide your children, hide your wife
    function buildDataContent(feature) {
      var feature_props = feature.properties;
      var fileIdx = 0;
      var dataUrl = feature_props["u_0"+String(fileIdx)];
      var content = "<div class=popupContent>";
      while (fileIdx < 10) {
        if (dataUrl != "" && dataUrl != null && dataUrl != undefined) {
          var fileBasename = String(dataUrl).substring(dataUrl.lastIndexOf("/") + 1);
          if (feature_props["u_0"+String(fileIdx) + "_desc"] == "Correlation Stats") {
            content += "<div>\
                          <h6>" + feature_props["u_0"+String(fileIdx) + "_desc"] + "</h6>\
                          <button type='button' class='btn btn-light' style='float:right;position:relative;bottom:15px;border-color: rgba(0, 0, 0, 0.2);border-width: 2px;background-clip:padding-box;color:rgba(100,100,100,1);font-size:12px'>Plot</button>\
                          <a href=" + dataUrl + " target='_blank'>"+fileBasename+"</a><br>\
                        </div>"
          }

          else {
            var varIdx = 0;
            var varDesc = feature_props["v_0"+String(fileIdx)+"_0"+String(varIdx)+"_de"];
            while (varIdx < 3) {
              if (varDesc == null || varDesc == "" || varDesc == undefined) {
                content += "<div>\
                              <h6>" + feature_props["u_0"+String(fileIdx) + "_desc"] + "</h6>\
                              <button type='button' class='btn btn-light plotButton'>Plot</button>\
                              <a href=" + dataUrl + " target='_blank'>"+fileBasename+"</a><br>\
                              <b>Units:</b> " + feature_props["v_0"+String(fileIdx)+"_0"+String(varIdx)+"_un"] +"<br>\
                            </div>"
                varIdx+=3
              }
              else {
                if (varDesc == "number of samples" || varDesc == "age") {
                  
                }
                else {
                  content += "<div>\
                                <h6>"+varDesc+"</h6>\
                                <button type='button' class='btn btn-light plotButton'>Plot</button>\
                                <a href=" + dataUrl + " target='_blank'>"+fileBasename+"</a><br>";
                  
                  // handle method if needed
                  if (feature_props["v_0"+String(fileIdx)+"_0"+String(varIdx)+"_me"] == undefined || feature_props["v_0"+String(fileIdx)+"_0"+String(varIdx)+"_me"] == null || feature_props["v_0"+String(fileIdx)+"_0"+String(varIdx)+"_me"] == "") {

                  }
                  else {
                    content+= "<b>Method:</b> " + feature_props["v_0"+String(fileIdx)+"_0"+String(varIdx)+"_me"] +"<br>";
                  }

                  // handle units if needed
                  if (feature_props["v_0"+String(fileIdx)+"_0"+String(varIdx)+"_un"] == undefined || feature_props["v_0"+String(fileIdx)+"_0"+String(varIdx)+"_un"] == null || feature_props["v_0"+String(fileIdx)+"_0"+String(varIdx)+"_un"] == "") {
                     
                  }
                  else {
                    content+= "<b>Units:</b> " + feature_props["v_0"+String(fileIdx)+"_0"+String(varIdx)+"_un"] +"<br>";
                  }
                  content+="</div>"
                  varIdx+=3
                }
              }
              varIdx+=1;
              varDesc = feature_props["v_0"+String(fileIdx)+"_0"+String(varIdx)+"_de"];
            }
          }
          content += "</div><hr class='my-6' style='margin-bottom:0px'><br>"
        }
        fileIdx += 1;
        dataUrl = feature_props["u_0"+String(fileIdx)];
      }
      
      return content
    } // end build data content

    function buildPlot(json_data, plotType) {
      console.log("building plot " + plotType);
      var chronName = json_data[0][0];
      var y = json_data[0].slice(1);
      var parseTime = d3.timeParse("%Y");
      var x = [];
      var data = [];
      dateVal = json_data[2][0];
      for (var n = 0; n < y.length; n++) {
        data.push({value:+y[n], year:parseTime(dateVal)});
        x.push(parseTime(dateVal));
        dateVal = dateVal+1;
      }

      var margin = {top: 20, right: 20, bottom: 30, left: 50};
      var width = 500 - margin.left - margin.right;
      var height = 250 - margin.top - margin.bottom;
      
      var y_axis = d3.scaleLinear()
          .range([height, 0])
          .domain([Math.min(...y), Math.max(...y)]);
      var x_axis = d3.scaleTime()
          .range([0, width])
          .domain(d3.extent(data, function(d) {return d.year}));
      var valueLine = d3.line()
          .x(function(d) {return x_axis(d.year);})
          .y(function(d) { return y_axis(d.value);});
      if ($("#d").length) {
        console.log('adding a tab in the plot window');
        $(".nav-link").removeClass('active');
        $(".chart").removeClass('show');
        $(".chart").removeClass('active');
        $(".nav-link").attr('aria-selected', "false");
        $("#plotTabBar").append("<a class='nav-link active' data-toggle='tab' role='tab' aria-selected='true' aria-controls='" + json_data[0][0] + "' id='" + json_data[0][0] + "Tab' href='#" + json_data[0][0] + "'>" + json_data[0][0] + "</a>");
      }
      else {
        $(".cont").append("<div id='d' class='chartDiv tab-content'><div id='headBar'><button type='button' class='close' aria-label='Close' id='plotClose'><span aria-hidden='true'>&times;</span></button></div></div>");
        $("#headBar").append("<nav id='plotTabBar' class='nav'><a class='nav-link active' data-toggle='tab' role='tab' aria-selected='true' aria-controls='" + json_data[0][0] + "' id='" + json_data[0][0] + "Tab' href='#" + json_data[0][0] + "'>" + json_data[0][0] + "</a></nav>")
        $(".chartDiv").draggable().resizable({aspectRatio: true});
      }
      var svg = d3.select("#d").append("svg")
          .attr("class", "chart tab-pane show active")
          .attr("id", json_data[0][0])
          .attr("aria-labeledby", json_data[0][0]+"Tab")
          .attr("preserveAspectRatio", "xMinYMin meet")
          .attr("viewBox", "0 0 550 300")
          .classed("svg-content", true)
          .append("g")
          .attr("transform","translate(" + margin.left + "," + margin.top + ")");
          /*.attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)*/
      svg.append("path")
           .attr("class", "line")
           .attr("d", valueLine(data));
      svg.append("g")
           .attr("transform", "translate(0,"+ height + ")")
           .call(d3.axisBottom(x_axis)
                   .tickFormat(d3.timeFormat("%Y")));
      svg.append("g")
           .call(d3.axisLeft(y_axis));
      svg.append("text")
           .attr("x", ((width + margin.left + margin.right)/2))
           .attr("y", 0 - (margin.top / 4))
           .attr("text-anchor", "middle")
           .style("font-size", "16px")
           .text(json_data[0][0]);

      $("#plotClose").on("click", function() {
        console.log("plot window closed");
        $(".chartDiv").remove();
      });
    }
    
    /*#############################################################################################
    #                              main query button (click)                                      #
    #############################################################################################*/
    $("#queryButton").on("click", function() {
      console.log("query button clicked");
      $(".window").remove();
      htmlWindow = "<form class='window'>\
                      <button type='button' class='close' aria-label='Close' id='windowClose'>\
                        <span aria-hidden='true'>&times;</span>\
                      </button>\
                      <div class='form-group windowFormGroup'>\
                        <label for='attributeSelect1' style='position:relative;left:15%'>Attribute</label>\
                        <label for='attributeSelect1' style='position:relative;left:60%'>Value</label>\
                        <div class='form-inline queryLine'>\
                          <select class='form-control form-control-sm queryWindowItem' id='attributeSelect1'>\
                            <option value='sppCom'>common name</option>\
                            <option value='sppSci'>scientific name</option>\
                            <option value='sppCode'>species code</option>\
                            <option value='earliest'>innermost ring</option>\
                            <option value='mostRecent'>outtermost ring</option>\
                            <option value='cont'>continent</option>\
                            <option value='country'>country</option>\
                            <option value='state'>state/province (USA/Canada)</option>\
                            <option value='invstgtrs'>investigator</option>\
                          </select>\
                          <select class='form-control form-control-sm queryWindowItem' id='op1'>\
                            <option title='equal'>=</option>\
                            <option title='less than'><</option>\
                            <option title='greater than'>></option>\
                            <option title='less than or equal'><=</option>\
                            <option title='greater than or equal'>>=</option>\
                            <option title='not equal'><></option>\
                            <option title='case insensitive LIKE (fitting a certain description, can use wildcards)'>ILIKE</option>\
                          </select>\
                          <input class='form-control form-control-sm queryWindowItem' type='text' placeholder=''>\
                        </div>\
                      </div>\
                      <button type='button' class='btn btn-primary mb-2 windowButton' id='executeQuery'>OK</button>\
                      <button type='button' class='btn btn-primary mb-2 windowButton' id='addAnotherQuery' style='margin-left:0px'>+</button>\
                      <button type='button' class='btn btn-primary mb-2 windowButton' id='resetData' style='margin-left:0px'>Reset Data</button>\
                    </form>";
      $(".cont").append(htmlWindow);

      $("#windowClose").on("click", function() {
        console.log("query window closed");
        $(".window").remove();
      });

      $("#resetData").on("click", function() {
        console.log("removing all queries and resetting data");
        var origParams = {
          layers: "itrdb:itrdb",
          format: 'image/png',
          transparent: true,
          attribution: "Map application by <a href='http://www.jwarndt.com' target='_blank'>Jacob Arndt</a>"
        };
        delete(itrdb.wmsParams.CQL_FILTER); //https://github.com/Leaflet/Leaflet/issues/3441
        itrdb.setParams(origParams);
        cqlFilter = null;
      });

      $(".removeLine").on("click", function() {
        console.log("removing query line");
        $(this.attr('id')).parent().remove();
      });


      /*#################################################
        #           execute query button click          #
        #################################################
      */
      $("#executeQuery").on("click", function() {
        console.log("executing query");
        // loop over DOM elements that are queryLines
        var logicalOps = [];
        $(".queryLogicalOp").each(function(index) {
          logicalOps.push($("option:selected", this).text());
        });
        var attributeAndVals = [];
        $(".queryWindowItem").each(function(index) {
          if ($(this).is('select')) {
            attributeAndVals.push($("option:selected", this).val());
          }
          else { // else it's a text box
            attributeAndVals.push($(this).val());
          }
        });
        console.log('query logical ops: ' + logicalOps);
        console.log('query attributes and values: ' + attributeAndVals);
        cqlQuery = buildCQLQuery(logicalOps, attributeAndVals);
        queryAndGetWMS(cqlQuery);
      });

      function buildCQLQuery(logicalOps, queryAttributesAndVals) {
        var cqlStatement = "";
        var logOpIdx = -1;
        for (var i = 0; i < queryAttributesAndVals.length; i = i + 3) {
          if (logOpIdx>=0) {
            cqlStatement += " " + logicalOps[logOpIdx] + " ";
          }
          if (queryAttributesAndVals[i] == 'earliest' || queryAttributesAndVals[i] == 'mostRecent') {
            queryLineString = String(queryAttributesAndVals[i]) + " " + String(queryAttributesAndVals[i+1]) + " " + String(queryAttributesAndVals[i+2]);
          }
          else {
            queryLineString = String(queryAttributesAndVals[i]) + " " + String(queryAttributesAndVals[i+1]) + " '" + String(queryAttributesAndVals[i+2] +"'");
          }
          logOpIdx+=1;
          cqlStatement+=queryLineString;
        }
        console.log("query statement: " + cqlStatement);
        cqlFilter = cqlStatement;
        return cqlStatement;
      }

      function queryAndGetWMS(cql_filter_string) {
        var newParams = {
          layers: "itrdb:itrdb",
          format: 'image/png',
          transparent: true,
          attribution: "Map application by <a href='http://www.jwarndt.com' target='_blank'>Jacob Arndt</a>",
          CQL_FILTER: cql_filter_string
        }
        itrdb.setParams(newParams);
      }

      /*
      #############################################################################################
      #                            add another query button (click)                               #
      #############################################################################################
      */
      $("#addAnotherQuery").on("click", function() {
        console.log("adding another query line");
        html = "<div><select class='form-control form-control-sm queryLogicalOp'>\
                    <option>AND</option>\
                    <option>OR</option>\
                </select>\
                <div class='form-inline queryLine'>\
                  <select class='form-control form-control-sm queryWindowItem' id='attributeSelect1'>\
                    <option value='sppCom'>common name</option>\
                    <option value='sppSci'>scientific name</option>\
                    <option value='sppCode'>species code</option>\
                    <option value='earliest'>innermost ring</option>\
                    <option value='mostRecent'>outtermost ring</option>\
                    <option value='cont'>continent</option>\
                    <option value='country'>country</option>\
                    <option value='state'>state/province (USA/Canada)</option>\
                    <option value='invstgtrs'>investigator</option>\
                  </select>\
                  <select class='form-control form-control-sm queryWindowItem' id='op1'>\
                    <option title='equal'>=</option>\
                    <option title='less than'><</option>\
                    <option title='greater than'>></option>\
                    <option title='less than or equal'><=</option>\
                    <option title='greater than or equal'>>=</option>\
                    <option title='not equal'><></option>\
                    <option title='like (fitting a certain description, can use wildcards)'>LIKE</option>\
                  </select>\
                  <input class='form-control form-control-sm queryWindowItem' type='text' placeholder=''>\
                  <button type='button' class='close removeLine' aria-label='Close'>\
                    <span aria-hidden='true'>&times;</span>\
                  </button>\
                </div></div>";
        $(html).appendTo(".windowFormGroup");

        $(".removeLine").on("click", function() {
          console.log("removing query line");
          $(this).parent().parent().remove();
        });
      });
    });
    
    /*#############################################################################################
    #                                   Download button (click)                                   #
    #############################################################################################*/
    $("#downloadButton").on("click", function() {
      console.log("download file button clicked");
      $(".window").remove();
      htmlWindow = "<form class='window'>\
                      <button type='button' class='close' aria-label='Close' id='windowClose'>\
                        <span aria-hidden='true'>&times;</span>\
                      </button>\
                      <div class='form-group windowFormGroup'>\
                        <label for='attributeSelect1'>Format</label>\
                        <select class='form-control form-control-sm' id='attributeSelect1'>\
                          <option value='shape-zip'>shapefile</option>\
                          <option value='csv'>csv</option>\
                        </select>\
                      </div>\
                      <button type='button' class='btn btn-primary mb-2 windowButton'>Download</button>\
                    </form>";
      $(".cont").append(htmlWindow);

      $("#windowClose").on("click", function() {
        console.log("query window closed");
        $(".window").remove();
      });

      $(".windowButton").on("click", function() {
        $("#my_iframe").remove();
        var outFormat = $('#attributeSelect1').find('option:selected').val();
        console.log("downloading " + outFormat);
        if (cqlFilter != null) {
          params = {
            SERVICE: 'WFS',
            VERSION: '1.1.0',
            REQUEST: 'GetFeature',
            TYPENAME: "itrdb_all:itrdb_all",
            outputFormat: outFormat,
            CQL_FILTER: cqlFilter
          }
        }
        else {
          params = {
            SERVICE: 'WFS',
            VERSION: '1.0.0',
            REQUEST: 'GetFeature',
            TYPENAME: "itrdb_all:itrdb_all",
            outputFormat: outFormat
          }
        }
        var url = 'http://localhost:8080/geoserver/wfs' + L.Util.getParamString(params);
        $(".cont").append("<iframe id='my_iframe' style='display:none;''></iframe>");
        document.getElementById('my_iframe').src = url;
      });

    });

    /*#############################################################################################
    #                                   Upload button (click)                                   #
    #############################################################################################*/
    $("#uploadButton").on("click", function() {
      console.log("upload file button clicked");
      $(".window").remove();
      htmlWindow = "<form class='window'>\
                      <button type='button' class='close' aria-label='Close' id='windowClose'>\
                        <span aria-hidden='true'>&times;</span>\
                      </button>\
                      <div class='form-group windowFormGroup'>\
                        <label for='fileInput'>Upload file</label>\
                        <input type='file' class='form-control-file form-control-sm' id='fileInput' style='padding:0px'>\
                      </div>\
                      <button type='button' class='btn btn-primary mb-2 windowButton'>OK</button>\
                    </form>";

      $(".cont").append(htmlWindow);

      $("#windowClose").on("click", function() {
        console.log("query window closed");
        $(".window").remove();
      });
    });
    
    /*#############################################################################################
    #                                   toolbox button (click)                                    #
    #############################################################################################*/
    $("#toolboxButton").on("click", function() {
      console.log("toolbox button clicked");
      $(".window").remove();
      htmlWindow = "<div class='window'>\
                      <button type='button' class='close' aria-label='Close' id='windowClose'>\
                        <span aria-hidden='true'>&times;</span>\
                      </button>\
                      <div id='toolsWindow'>Site Characterization Tools\
                        <hr class='my-6' style='margin-top:5px;margin-bottom:0px'>\
                        <button title='elevation information' type='button' class='btn btn-light popupButton' id='elevationInfo'>\
                        <img src='./glyph-iconset-master/svg/si-glyph-mountain.svg'></button>\
                        <button title='soils information' type='button' class='btn btn-light popupButton' id='soilsInfo'>\
                        <img src='./glyph-iconset-master/svg/si-glyph-wall.svg'></button>\
                        <button title='miscellaneous ecological information' type='button' class='btn btn-light popupButton' id='ecoInfo'>\
                        <img src='./glyph-iconset-master/svg/si-glyph-leaf.svg'></button>\
                      </div>\
                    </div>";
      $(".cont").append(htmlWindow);

      $("#windowClose").on("click", function() {
        console.log("query window closed");
        $(".window").remove();
      });
      
      /*##############################
      # Elevation Info               #
      ##############################*/
      $("#elevationInfo").on("click", function() {
        console.log("elevation tool button selected");
        // make wfs request for all features currently displayed on
        // the map. call processElevation() and pass the geojson features
        // in as a paramter
        if (cqlFilter != null) {
          var parameters = {
            SERVICE: 'WFS',
            VERSION: '1.1.0',
            REQUEST: 'GetFeature',
            TYPENAME: "itrdb_all:itrdb_all",
            outputFormat: 'text/javascript',
            srsName:"EPSG:4326",
            CQL_FILTER: cqlFilter
          }
        }
        else {
          var parameters = {
            SERVICE: 'WFS',
            VERSION: '1.1.0',
            REQUEST: 'GetFeature',
            TYPENAME: "itrdb_all:itrdb_all",
            outputFormat: 'text/javascript',
            srsName:"EPSG:4326",
          }
        }

        var url = 'http://localhost:8080/geoserver/ows' + L.Util.getParamString(parameters);
        $.ajax({
          jsonp: false,
          contentType: "application/json",
          jsonpCallback: "parseResponse",
          type: "GET",
          url: url,
          dataType: "jsonp",
          success: function(data) {
            if (data.totalFeatures == 0) {
              null;
            }
            else {
              console.log("processing elevation for: " + data.features.length + " features");
              processElevation(data, 0)
            }
          }
        });
      });
    });
    
    function processElevation(data, i) {
      setTimeout(function() {
        if (i < data.features.length) {
          var feat = data.features[i];
          var latlng = L.latLng(feat.geometry.coordinates[1], feat.geometry.coordinates[0]);
          var terrainResult;
          var slopeResult;
          var aspectResult;
          /*L.esri.identifyImage({
            url:esriTerrainURL,
            token:esriToken
          })
          .at(latlng)
          .run(function(error, results, rawresponse) {
              terrainResult = results.pixel.properties.value;
              console.log(String(feat.properties.studyID) +", "+ String(results.pixel.properties.value))
            });*/
          esriSlopeAnalysis.identify()
            .at(latlng)
            .run(function(error, results, rawresponse) {
              terrainResult = results.pixel.properties.value;
              console.log(String(feat.properties.studyID) +", "+ String(results.pixel.properties.value));
          });
          i++;
          processElevation(data, i);
        }
      }, 2500);
    }

});