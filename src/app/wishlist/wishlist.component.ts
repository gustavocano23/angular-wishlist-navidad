import { CommonModule } from '@angular/common';
import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { WishlistService } from '../services/wishlist.service';
import { FormsModule } from '@angular/forms';
type Gift = { Name: string };
type WishlistCard = { _id: number; userName: string; regalos: Gift[] };
type UIState = { adding: boolean; newGiftName: string; editingIndex: number | null; editName: string;  dirty: boolean; snapshot?: string;    };

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent {
  constructor(private wishlistService: WishlistService) {}

      wishlists = signal<WishlistCard[]>([]);
        snapshot?: string;  
      // Estado UI por card, indexado por id de lista
      uis: { [id: number]: UIState } = {};
      
  isPlaying = false;   // estado visual del FAB
  firstPlayTried = false;
 
  private ensureUI(id: number) {
      if (!this.uis[id]) this.uis[id] = { adding: false, newGiftName: '', editingIndex: null, editName: '', dirty: false, snapshot: '' };
      console.log(this.uis);
      
      return this.uis[id];
    }

    private markDirtyIfChanged(listId: number) {
  const ui = this.ensureUI(listId);
  const list = this.wishlists().find(l => l._id === listId);
  if (!list) return;
  const now = JSON.stringify(list.regalos);
  ui.dirty = (now !== ui.snapshot);
}

initSnapshots() {
  for (const l of this.wishlists()) {
    const ui = this.ensureUI(l._id);
    ui.snapshot = JSON.stringify(l.regalos);
    ui.dirty = false;
    ui.editingIndex = null;
    ui.editName = '';
    ui.adding = false;
    ui.newGiftName = '';
  }
}


public audio = new Audio();
  ngOnInit(): void {
    this.loadWishlists();
    this.audio = new Audio();
    this.audio.src = "../../assets/jingle-bells.wav";
    this.audio.preload = 'auto';
    this.audio.loop = true;
  }

  
  playMusic(): void {
    this.isPlaying = ! this.isPlaying
    if (this.isPlaying) {
        this.audio.load();
        this.audio.play();
    } else {
      this.audio.pause()
    }
  }

  loadWishlists():void {
    this.wishlistService.getWishlist().subscribe({
          next: (data) => this.wishlists.set(data),
          error: (err) => console.error('Error al obtener la wishlist:', err)
        });
  }

     toggleAdd(listId: number) {
      const ui = this.ensureUI(listId);
      ui.adding = !ui.adding;
      ui.newGiftName = '';
      // cerrar edición si estaba abierta
      ui.editingIndex = null;
      ui.editName = '';
    }

     updateNewGiftName(listId: number, value: string) {
      this.ensureUI(listId).newGiftName = value;
    }

     saveNew(listId: number) {
    const ui = this.ensureUI(listId);
    const name = ui.newGiftName.trim();
    if (!name) return;

    // TODO: persiste en tu backend y sincroniza; abajo, ejemplo solo-UI
    const lists = [...this.wishlists()];
    const list = lists.find(l => l._id === listId);
    if (list) {
      list.regalos = [...list.regalos, { Name: name }];
      this.wishlists.set(lists);
      this.markDirtyIfChanged(listId); 
    }

    // reset UI SOLO para esa card
    ui.adding = false;
    ui.newGiftName = '';
  }

    cancelAdd(listId: number) {
    const ui = this.ensureUI(listId);
    ui.adding = false;
    ui.newGiftName = '';
  }

  /** Comenzar edición inline de un regalo */
  // ---------- Edición ----------
  startEdit(listId: number, index: number, currentName: string) {
    const ui = this.ensureUI(listId);
    ui.editingIndex = index;
    ui.editName = currentName;
    // cerrar "nuevo" si estaba abierto en esa misma card
    ui.adding = false;
    ui.newGiftName = '';
  }

    /** Guardar edición (conecta aquí tu persistencia) */
  updateEditName(listId: number, value: string) {
    this.ensureUI(listId).editName = value;
  }

 /** Editar regalo */
saveEdit(listId: number, giftKey: number|string, fallbackIndex: number) {
  const ui = this.ensureUI(listId);
  const name = ui.editName.trim();
  if (!name) return;

  const lists = [...this.wishlists()];
  const list = lists.find(l => l._id === listId);
  if (list) {
    let idx = fallbackIndex;
    const hasIds = list.regalos.some((g: any) => 'id' in g);
    if (hasIds) idx = list.regalos.findIndex((g: any, i) => (g.id ?? i) === giftKey);

    if (idx >= 0) {
      if (list.regalos[idx].Name !== name) {     // 👈 solo marca si cambia
        const next = [...list.regalos];
        next[idx] = { ...next[idx], Name: name };
        list.regalos = next;
        this.wishlists.set(lists);
        this.markDirtyIfChanged(listId);         // 👈
      }
    }
  }

  ui.editingIndex = null;
  ui.editName = '';
}

  cancelEdit(listId: number) {
    const ui = this.ensureUI(listId);
    ui.editingIndex = null;
    ui.editName = '';
  }

  

   // ---------- Borrar ----------
deleteGift(listId: number, index: number) {
  const lists = [...this.wishlists()];
  const list = lists.find(l => l._id === listId);
  if (list) {
    list.regalos = list.regalos.filter((_, i) => i !== index);
    this.wishlists.set(lists);
    this.markDirtyIfChanged(listId);   // 👈
  }
  const ui = this.ensureUI(listId);
  ui.editingIndex = null;
  ui.editName = '';
}

updateWishlistByUser(listId: number,  index: number) {
   const lists = [...this.wishlists()];
  const list = lists.find(l => l._id === listId);
  if (list) {
     this.wishlistService.updateWishlist(list._id, list).subscribe({
          next: (data) => {
             this.loadWishlists();
             this.initSnapshots();
             alert("Se ha actualizado su lista de regalos.")
          },
          error: (err) => console.error('Error al obtener la wishlist:', err)
        });
  }
}
}
