import {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, Bookmark, ChevronDown, ChevronRight, Compass, Heart, MapPin, Navigation, Phone, Search, X} from 'lucide-react';
import type {CategoryId, Place} from '../../types';
import {PlaceFacts} from '../PlaceFacts';
import {formatDistance,validCoordinates} from '../../domain/geo';
import {categories,categoryIcon,labelForCategory,quickCategories} from './catalog';

export function QuickCategories({onChoose}:{onChoose:(category:CategoryId)=>void}){
 return <div className="yn-quick">
   {quickCategories.map(id=>{
     const category=categories.find(c=>c.id===id)!;const Icon=category.Icon;
     return <button key={id} className="yn-quick-item" onClick={()=>onChoose(id)}><span className="yn-quick-icon"><Icon size={23} strokeWidth={1.8}/></span><span>{category.label}</span></button>;
   })}
 </div>;
}
export function PlaceCategoryFilter({category,onChoose}:{category:CategoryId;onChoose:(category:CategoryId)=>void}){
 const [expanded,setExpanded]=useState(false);
 const visible=expanded?categories:categories.slice(0,12);
 return <div className="yn-category-controls">
   <div className={`yn-categories ${expanded?'is-expanded':''}`} role="group" aria-label="Yakındaki yer kategorileri">
     {visible.map(({id,label})=><button type="button" key={id} aria-pressed={category===id} onClick={()=>onChoose(id)}>{label}</button>)}
   </div>
   <button className="yn-expand-filter" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}><ChevronDown size={16} className={expanded?'is-up':''}/><span>{expanded?'Azalt':'Tümü'}</span></button>
 </div>;
}
export function SearchField({value,onChange,placeholder='Yer, kategori veya adres ara'}:{value:string;onChange:(value:string)=>void;placeholder?:string}){
 return <label className="yn-search"><Search size={20} aria-hidden="true"/><input type="search" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}/>
   {value&&<button type="button" aria-label="Aramayı temizle" onClick={()=>onChange('')}><X size={18}/></button>}
 </label>;
}
export function PlaceItem({place,onSelect,saved,onToggleSave,preview}:{place:Place;onSelect:(place:Place)=>void;saved:boolean;onToggleSave:(place:Place)=>void;preview:boolean}){
 const Icon=categoryIcon(place.category);
 return <article className="yn-place-row">
   <button className="yn-place-content" onClick={()=>onSelect(place)} aria-label={`${place.name} ayrıntılarını aç`}>
     <span className="yn-place-icon"><Icon size={21}/></span>
     <span className="yn-place-text"><strong>{place.name}</strong><span>{labelForCategory(place.category)} <i aria-hidden="true">·</i> {formatDistance(place.distanceM)}</span><small>{place.address==='Adres bilgisi yok'?'Adres bilgisi belirtilmemiş':place.address}</small><PlaceFacts place={place} compact/></span>
     <ChevronRight size={17} className="yn-place-chevron"/>
   </button>
   <button type="button" className={`yn-save-action ${saved?'is-saved':''}`} aria-label={saved?`${place.name} kaydını kaldır`:`${place.name} kaydet`} aria-pressed={saved} onClick={()=>onToggleSave(place)}><Bookmark size={18} fill={saved?'currentColor':'none'}/></button>
 </article>;
}
export function PlaceList({places,onSelect,savedIds,onToggleSave,preview}:{places:Place[];onSelect:(place:Place)=>void;savedIds:string[];onToggleSave:(place:Place)=>void;preview:boolean}){
 return <div className="yn-places-list">{places.slice(0,100).map(place=><PlaceItem key={place.id} place={place} saved={savedIds.includes(place.id)} onSelect={onSelect} onToggleSave={onToggleSave} preview={preview}/>)}</div>;
}
export function PlaceDetail({place,preview,onClose,onSave,saved}:{place:Place;preview:boolean;onClose:()=>void;onSave:()=>void;saved:boolean}) {
 const dialog=useRef<HTMLElement|null>(null);
 useEffect(()=>{
   const previous=document.activeElement as HTMLElement|null;
   const node=dialog.current;
   const prior=document.body.style.overflow;
   document.body.style.overflow='hidden';
   node?.querySelector<HTMLElement>('button')?.focus();
   return ()=>{document.body.style.overflow=prior;previous?.focus();};
 },[place.id]);
 const route=validCoordinates(place)?`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`:'';
 return <div className="yn-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
   <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="yn-detail-title" className="yn-detail" onKeyDown={event=>{
     if(event.key==='Escape') {event.preventDefault();onClose();}
     if(event.key==='Tab'){
       const items=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')];
       const first=items[0],last=items.at(-1);
       if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
       else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
     }
   }}>
     <div className="yn-detail-grabber" aria-hidden="true"/>
     <div className="yn-detail-top"><span className="yn-eyebrow">{labelForCategory(place.category)}</span><button type="button" className="yn-icon-button" onClick={onClose} aria-label="Detayı kapat"><X size={21}/></button></div>
     <h2 id="yn-detail-title">{place.name}</h2>
     <p className="yn-detail-address"><MapPin size={17}/>{place.address||'Adres bilgisi yok'}</p>
     <p className="yn-detail-distance"><Compass size={16}/>{formatDistance(place.distanceM)} · yaklaşık kuş uçuşu</p>
     <PlaceFacts place={place}/>
     {place.source&&<div className="yn-source-strip"><small>Kaynak: {place.source==='legacy-fallback'?'Eczane Adresi (alternatif, resmî değil)':place.source}{place.queryDate?` · ${place.queryDate}`:''}</small>{place.category==='duty'&&<small>Gitmeden önce telefonla doğrula.</small>}</div>}
     {preview&&<p className="yn-preview-warning">Bu yer yalnızca tasarım önizlemesi için hazırlanmıştır.</p>}
     <div className="yn-detail-actions">
       {place.phone&&!preview&&<a className="yn-button yn-button--secondary" href={`tel:${place.phone}`}><Phone size={17}/>Ara</a>}
       {!preview&&route&&<a className="yn-button yn-button--primary" href={route} target="_blank" rel="noopener noreferrer"><Navigation size={17}/>Yol tarifi<ArrowUpRight size={16}/></a>}
       <button className={`yn-button yn-button--secondary ${saved?'is-saved':''}`} onClick={onSave}><Heart size={18} fill={saved?'currentColor':'none'}/>{saved?'Kaydedildi':'Kaydet'}</button>
     </div>
   </section>
 </div>;
}
