import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private ENDPOINT = "https://express-js-wishlist.onrender.com";

  constructor(private http: HttpClient) { }

  getWishlist(): Observable<any[]> {
    const url = `${this.ENDPOINT}/wishlists`;
    return this.http.get<any[]>(url);
  }

    updateWishlist(_id: string | number, body: any) {
      const url = `${this.ENDPOINT}/wishlists/${_id}`;
      return this.http.put<any>(url, body); 
    }
}
