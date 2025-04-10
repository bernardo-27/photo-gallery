import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Directory, Filesystem } from '@capacitor/filesystem';

import { ActionSheetController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})

export class PhotoService {
  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = 'photos';
  private platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }
  
  private async savePicture(photo: Photo) { 
  // Convert photo to base64 format, required by Filesystem API to save
  const base64Data = await this.readAsBase64(photo);
    
      // Write the file to the data directory
  const fileName = Date.now() + '.jpeg';
  const savedFile = await Filesystem.writeFile({
    path: fileName,
    data: base64Data,
    directory: Directory.Data
  });
  
  if (this.platform.is('hybrid')) {
    
    return {
      filepath: savedFile.uri,
      webviewpath: Capacitor.convertFileSrc(savedFile.uri) 
    };
  }

  // Use webPath to display the new image instead of base64 since it's
  // already loaded into memory
  return {
    filepath: fileName,
    webviewPath: photo.webPath
  };
}



  private async readAsBase64(photo: Photo) {

    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.path!
      });

      return file.data;
    } else {
          // Fetch the photo, read as a blob, then convert to base64 format
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
  
    return await this.convertBlobToBase64(blob) as string;
    }
  }
  
  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
});
  




  public async addNewToGallery() {
    
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });
    
      // Save the picture and add it to photo collection
  const savedImageFile = await this.savePicture(capturedPhoto);
  this.photos.unshift(savedImageFile);

    this.photos.unshift({
      filepath: "soon...",
      webviewPath: capturedPhoto.webPath!
    });
    Preferences.set ({
    key: this.PHOTO_STORAGE,
    value: JSON.stringify(this.photos),
  })
  }
  

  public async loadSaved(){
    // retrieve cached photo array data
    const { value } = await Preferences.get({key: this.PHOTO_STORAGE  });
    this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];


    if (!this.platform.is('hybrid')) {
      for (let photo of this.photos) {
        
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        });
        
      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;

      }
    }
    }



    public async deletePicture(photo: UserPhoto, position: number) {
      // Remove this photo from the Photos reference data array
      this.photos.splice(position, 1);
    
      // Update photos array cache by overwriting the existing photo array
      Preferences.set({
        key: this.PHOTO_STORAGE,
        value: JSON.stringify(this.photos)
      });
    
      // delete photo file from filesystem
      const filename = photo.filepath
                          .substr(photo.filepath.lastIndexOf('/') + 1);
    
      await Filesystem.deleteFile({
        path: filename,
        directory: Directory.Data
      });
    }

    
  }
  
export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}

