/// <reference types="@types/google.maps" />

import { AfterViewInit, Component } from '@angular/core';

import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements AfterViewInit {
  map: google.maps.Map | null = null;
  markers: google.maps.Marker[] = [];
  currentPosition: google.maps.LatLngLiteral | null = null;

  async ngAfterViewInit() {
    await this.initMap();
  }

  async initMap() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      this.currentPosition = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      this.map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
        center: this.currentPosition,
        zoom: 15
      });

      // Add current location marker
      this.addMarker(this.currentPosition, "You are here!");


      // Set up click listener for adding custom markers
      this.map.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (event.latLng && this.map) {
          const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          this.addMarker(position, "Custom marker");

          alert(`Custom marker placed at:\nLatitude: ${position.lat}\nLongitude: ${position.lng}`);
        }
      });
    } catch (error) {
      console.error("Error getting location", error);
    }
  }


  addMarker(position: google.maps.LatLngLiteral, title: string) {
    if (this.map) {
      const marker = new google.maps.Marker({
        position,
        map: this.map,
        title
      });

      // Create InfoWindow with custom content
      const infoWindow = new google.maps.InfoWindow({
        content: `<div><strong>${title}</strong><br>Lat: ${position.lat.toFixed(6)}<br>Lng: ${position.lng.toFixed(6)}</div>`
      });

      // Open InfoWindow on marker click
      marker.addListener("click", () => {
        infoWindow.open(this.map!, marker);
      });

      this.markers.push(marker);
    }
  }



  async refreshLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const newPosition = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      // Update the current position
      this.currentPosition = newPosition;

      // Center map on new position
      if (this.map) {
        this.map.setCenter(newPosition);
      }

      // Remove previous "You are here" marker if it exists
      const youAreHereIndex = this.markers.findIndex(marker => marker.getTitle() === "You are here!");
      if (youAreHereIndex > -1) {
        this.markers[youAreHereIndex].setMap(null);
        this.markers.splice(youAreHereIndex, 1);
      }

      // Add new marker
      this.addMarker(newPosition, "You are here!");
    } catch (error) {
      console.error("Error refreshing location", error);
    }
  }

  clearAllMarkers() {
    for (const marker of this.markers) {
      marker.setMap(null);
    }
    this.markers = [];

    // Re-add the current location marker
    if (this.currentPosition && this.map) {
      this.addMarker(this.currentPosition, "You are here!");
    }
  }
}
