/**

 * Reliable Cesium basemap — Ion world imagery when token works, Mapbox/Carto/OSM fallback.

 * @param {import("cesium").Viewer} viewer

 * @param {typeof import("cesium")} Cesium

 * @param {'streets'|'satellite'|'city_3d'|'terrain'|'dark'} profile

 * @param {{ ionUsable?: boolean, satelliteTileTemplate?: string | null, mapboxToken?: string, lowHardware?: boolean }} cfg

 */

export async function applyCesiumBasemapImageryV0(viewer, Cesium, profile, cfg = {}) {

  if (!viewer || viewer.isDestroyed?.()) return false;

  const { ionUsable, satelliteTileTemplate, mapboxToken, lowHardware } = cfg;

  viewer.imageryLayers.removeAll(true);



  if (profile === "dark") {

    const token = String(mapboxToken || "").trim();

    if (token) {

      viewer.imageryLayers.addImageryProvider(

        new Cesium.UrlTemplateImageryProvider({

          url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${token}`,

          credit: "Mapbox"

        })

      );

      return true;

    }

    viewer.imageryLayers.addImageryProvider(

      new Cesium.UrlTemplateImageryProvider({

        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",

        subdomains: "abcd",

        credit: "CARTO"

      })

    );

    return true;

  }



  if (lowHardware && profile === "satellite") {

    viewer.imageryLayers.addImageryProvider(

      new Cesium.UrlTemplateImageryProvider({

        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",

        subdomains: "abcd",

        credit: "CARTO"

      })

    );

    return true;

  }



  if (profile === "satellite" && satelliteTileTemplate) {

    viewer.imageryLayers.addImageryProvider(

      new Cesium.UrlTemplateImageryProvider({ url: satelliteTileTemplate })

    );

    return true;

  }



  if (ionUsable) {

    try {

      const style =

        profile === "satellite" || profile === "city_3d"

          ? Cesium.IonWorldImageryStyle.AERIAL

          : Cesium.IonWorldImageryStyle.ROAD;

      const provider = await Cesium.createWorldImageryAsync({ style });

      viewer.imageryLayers.addImageryProvider(provider);

      return true;

    } catch (err) {

      console.warn("[CASTLE_CESIUM] ion basemap fallback osm", err);

    }

    if (profile === "satellite" || profile === "city_3d") {

      try {

        const provider = await Cesium.IonImageryProvider.fromAssetId(2);

        viewer.imageryLayers.addImageryProvider(provider);

        return true;

      } catch {

        /* fall through */

      }

    }

  }



  if (profile === "city_3d" || profile === "satellite") {

    viewer.imageryLayers.addImageryProvider(

      new Cesium.UrlTemplateImageryProvider({

        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",

        subdomains: "abcd",

        credit: "CARTO"

      })

    );

    return true;

  }



  viewer.imageryLayers.addImageryProvider(

    new Cesium.OpenStreetMapImageryProvider({ url: "https://tile.openstreetmap.org/" })

  );

  return true;

}


