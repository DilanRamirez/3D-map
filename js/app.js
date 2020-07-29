import {stateCoords} from './states.js';

require(["esri/Map", "esri/views/SceneView", "esri/Graphic"], function (
  Map,
  SceneView,
  Graphic
) {
  var map = new Map({
    basemap: "streets-night-vector",
    ground: "world-elevation",
  });
  var view = new SceneView({
    container: "viewDiv", // Reference to the scene div created in step 5
    map: map, // Reference to the map object created before the scene
    scale: 50000000, // Sets the initial scale to 1:50,000,000
    center: [-101.17, 21.78], // Sets the center point of view with lon/lat
  });

  view
    .goTo({
      center: [-49.219586, 29.567983],
      zoom: 4,
    })
    .catch(function (error) {
      if (error.name != "AbortError") {
        console.error(error);
      }
    });

  const mapCountry = async () => {
    let response = await fetch(
      "https://corona.lmao.ninja/v2/countries?yesterday&sort"
    );
    if (response.ok) {
      const countriesData = await response.json();

      const coutriesInfo = {
        recovered: countriesData.map((item) => item.recovered),
        confirmed: countriesData.map((item) => item.active),
        deaths: countriesData.map((item) => item.deaths),
        countryRegion: countriesData.map((item) => item.country),
        coords: countriesData.map((item) => item.countryInfo),
      };

      const coordinates = {
        long: coutriesInfo.coords.map((coord) => coord.lat),
        lat: coutriesInfo.coords.map((coord) => coord.long),
      };

      for (var i = 0; i < coordinates.lat.length; i++) {

        let newHeight;
    
        const coneHeight = coutriesInfo.confirmed[i];
        (coutriesInfo.confirmed[i] / 100) < 100
          ? newHeight = coneHeight
          : newHeight =  (coutriesInfo.confirmed[i] / 100);

        var point = {
          type: "point", // autocasts as new Point()
          longitude: coordinates.lat[i],
          latitude: coordinates.long[i],
        };

      
        var markerSymbol = {
          type: "point-3d", // autocasts as new PointSymbol3D()
          symbolLayers: [
            {
              type: "object", // autocasts as new ObjectSymbol3DLayer()
              width: 100000,
              height: newHeight * 300,
              resource: {
                primitive: "cone",
              },
              material: {
                color: "#ff9799",
              },
            },
          ],
          verticalOffset: {
            screenLength: 40,
            maxWorldLength: 100,
            minWorldLength: 20,
          },
        };

        var pointGraphic = new Graphic({
          geometry: point,
          symbol: markerSymbol,
          popupTemplate: {
            title: "COVID-19 Map View",
            content: [
              {
                type: "text",
                text: `There are ${coutriesInfo.confirmed[i]} cases in ${coutriesInfo.countryRegion[i]} with 
                ${coutriesInfo.recovered[i]} recovered cases and ${coutriesInfo.deaths[i]} cases.`,
              },
            ],
          },
        });

        view.graphics.add(pointGraphic);
      }
    }
  };

  mapCountry();

  const states = () => {
    for (let i=0;i< stateCoords.length;i++){
      
      var polygonFigure = {
        type: "polygon", // autocasts as new Polygon()
        rings: [stateCoords[i][1]],
      };

      console.log("states:",polygonFigure.rings)
      var fillSymbol = {
        type: "simple-fill", // autocasts as new SimpleFillSymbol()
        color: "#ff9799",
        outline: {
          // autocasts as new SimpleLineSymbol()
          color: "#ff1235",
          width: 1,
        },
      };

      var polygonGraphic = new Graphic({
        geometry: polygonFigure,
        symbol: fillSymbol
      });

      view.graphics.add(polygonGraphic);
    }
  }

  states()

  const url =
  "https://datos.cdmx.gob.mx/api/records/1.0/search/?dataset=covid-19-sinave-ciudad-de-mexico-a-nivel-colonia&q=&facet=alcaldia&facet=colonia&facet=total";

  const getData = async () => {
    const data = await fetch(url);
    const alcaldias = await fetch(
      "https://datos.cdmx.gob.mx/api/records/1.0/search/?dataset=alcaldias&q=&rows=16&facet=nomgeo&facet=cve_mun&facet=municipio"
    );
    if (data.ok && alcaldias.ok) {
      const mexicoData = await data.json();
      const mexicoAlcaldias = await alcaldias.json();
      // console.log(mexicoData);
      const parsedData = mexicoData.records.map((item) => item.fields);
      const alcaldiasData = mexicoAlcaldias.records.map((item) => item.fields);

      console.log(alcaldiasData);

      const dataTable = parsedData.map((dailyData) => ({
        colonia: dailyData.colonia,
        alcaldia: dailyData.alcaldia,
        total: dailyData.total,
      }));

      // console.log(dataTable);

      const detailData = {
        colonia: parsedData.map((item) => item.colonia),
        alcaldia: parsedData.map((item) => item.alcaldia),
        coords: parsedData.map((item) => item.geo_point_2d),
        polygon: parsedData.map((item) => item.geo_shape),
        total: parsedData.map((item) => item.total),
      };

      const detailDataAlcadias = {
        nombre: alcaldiasData.map((item) => item.nomgeo),
        polygon: alcaldiasData.map((item) => item.geo_shape),
      };

      const coordinates = {
        long: detailData.coords.map((coord) => coord[0]),
        lat: detailData.coords.map((coord) => coord[1]),
      };

      const polygonData = {
        coords: detailData.polygon.map((coord) => coord.coordinates[0]),
      };

      const polygonAlcaldias = {
        coords: detailDataAlcadias.polygon.map((coord) => coord.coordinates[0]),
      };

      console.log(detailDataAlcadias);
      console.log(polygonAlcaldias);
      console.log(polygonAlcaldias.coords.length)

      for (var i=0;i<polygonAlcaldias.coords.length;i++){
        createPolygon([polygonAlcaldias.coords[i]])
      }
      
      for (var i = 0; i < coordinates.long.length; i++) {
        var polygonFigure = {
          type: "polygon", // autocasts as new Polygon()
          rings: [polygonData.coords[i]],
        };

        console.log("mexico:", polygonFigure.rings)
        var fillSymbol = {
          type: "simple-fill", // autocasts as new SimpleFillSymbol()
          color: "#ff9799",
          outline: {
            // autocasts as new SimpleLineSymbol()
            color: "#ff1235",
            width: 1,
          },
        };

        var polygonGraphic = new Graphic({
          geometry: polygonFigure,
          symbol: fillSymbol,
          popupTemplate: {
            title: "COVID-19 Ciudad de Mexico a nivel Colonia",
            content: [
              {
                type: "text",
                text: `Hay ${detailData.total[i]} casos en ${detailData.colonia[i]} informacion actualizada semanalmente`,
              },
            ],
          },
        });

       

        view.graphics.add(polygonGraphic);
      }
 
    }
  };

  getData();

  const createPolygon = (rings) => {
    var polygonFigure = {
      type: "polygon", // autocasts as new Polygon()
      rings: rings,
    };

    var fillSymbol = {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      // color: "#eee",
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: "#ff1235",
        width: 1,
      },
    };

    var polygonGraphic = new Graphic({
      geometry: polygonFigure,
      symbol: fillSymbol,
    });

    view.graphics.add(polygonGraphic);
  };


});
