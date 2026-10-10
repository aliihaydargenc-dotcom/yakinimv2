import {useQuery} from '@tanstack/react-query';
import {ChevronDown, ChevronRight, LocateFixed, MapPin, RotateCcw, Trash2, X, ShieldCheck, Locate, Check} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import type {Coordinates} from '../../types';
import {validCoordinates} from '../../domain/geo';
import {tabs, type Tab} from './catalog';

export function NavigationMenu({tab,onTab,variant}:{tab:Tab;onTab:(tab:Tab)=>void;variant:'mobile'|'desktop'}) {
  return <nav className={`yn-nav yn-nav--${variant}`} aria-label="Ana gezinme">
    {tabs.map(({id,label,Icon})=><button type="button" className="yn-nav-item" aria-current={tab===id?'page':undefined} key={id} onClick={()=>onTab(id)}>
      <Icon size={20} strokeWidth={tab===id?2.5:1.9}/><span>{label}</span>
    </button>)}
  </nav>;
}

function useLocationLabel(location:Coordinates|null,preview:boolean) {
  const lat=location?.lat.toFixed(3), lng=location?.lng.toFixed(3);
  return useQuery({queryKey:['next:location-label',lat,lng],queryFn:async({signal})=>{
    const response=await fetch(`/api/location?lat=${lat}&lng=${lng}`,{signal});
    if(!response.ok) throw Error('location_label_unavailable');
    const data:unknown=await response.json();
    if(!data || typeof data!=='object' || typeof (data as {label?:unknown}).label!=='string') throw Error('invalid_location_label');
    return (data as {label:string}).label;
  },enabled:!!location&&!preview,staleTime:86400000,retry:0});
}

export function AppHeader({location,manual,restored,locationError,locating,preview,onUseDevice,onChooseMap,onManualCoordinates,onClear}:{
 location:Coordinates|null;manual:boolean;restored:boolean;locationError:string;locating:boolean;preview:boolean;
 onUseDevice:()=>void;onChooseMap:()=>void;onManualCoordinates:(coords:Coordinates)=>void;onClear:()=>void;
}) {
 const [open,setOpen]=useState(false);
 const [manualOpen,setManualOpen]=useState(false);
 const [latitude,setLatitude]=useState('');
 const [longitude,setLongitude]=useState('');
 const [coordinateError,setCoordinateError]=useState('');
 const popup=useRef<HTMLDivElement>(null);
 const label=useLocationLabel(location,preview);
 const locationText=!location?'Konum seçilmedi':preview?'Konyaaltı · örnek':label.data || 'Seçili konum';
 useEffect(()=>{
   if(!open)return;
   const close=(event:PointerEvent)=>{if(!popup.current?.contains(event.target as Node))setOpen(false);};
   const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
   document.addEventListener('pointerdown',close);window.addEventListener('keydown',escape);
   return ()=>{document.removeEventListener('pointerdown',close);window.removeEventListener('keydown',escape);};
 },[open]);
 return <header className="yn-header">
   <div className="yn-header-inner">
     <div className="yn-brand" aria-label="Yakınım"><span className="yn-logo"><MapPin size={20} strokeWidth={2.5}/></span><span>yakınım<span className="yn-brand-period">.</span></span></div>
     <div className="yn-location-wrap" ref={popup}>
       <button type="button" className="yn-location-trigger" aria-expanded={open} aria-controls="yn-location-panel" onClick={()=>setOpen(o=>!o)}>
         <span className="yn-location-dot"/><span className="yn-location-copy"><small>Konumun</small><strong>{locationText}</strong></span><ChevronDown size={16}/>
       </button>
       {open&&<div className="yn-location-popup" id="yn-location-panel">
         <div className="yn-popup-title"><strong>Konum seçimi</strong><button onClick={()=>setOpen(false)} aria-label="Konum menüsünü kapat"><X size={18}/></button></div>
         <p>{preview?'Bu ekran temsili konumla açıldı.':location?`${manual?'Haritadan seçildi':'Cihaz konumu'} · ${restored?'Son kullanılan konum (en fazla 6 saat)':'Bu oturum'} `:'Yakındaki sonuçlar için bir konum belirle.'}</p>
         <button className="yn-popup-option" disabled={locating||preview} onClick={()=>{setOpen(false);onUseDevice();}}><LocateFixed size={19}/>{locating?'Konum alınıyor…':'Cihaz konumumu kullan'}<ChevronRight size={17}/></button>
         <button className="yn-popup-option" onClick={()=>{setOpen(false);onChooseMap();}}><MapPin size={19}/>Haritadan nokta seç<ChevronRight size={17}/></button>
         <button className="yn-popup-option" aria-expanded={manualOpen} onClick={()=>setManualOpen(o=>!o)}><Locate size={19}/>Koordinat gir<ChevronDown size={17}/></button>
         {manualOpen&&<form className="yn-coordinate-form" onSubmit={event=>{
           event.preventDefault();
           const coords={lat:Number(latitude.trim().replace(',','.')),lng:Number(longitude.trim().replace(',','.'))};
           if(!latitude.trim()||!longitude.trim()||!validCoordinates(coords)){
             setCoordinateError('Geçerli enlem (-90 / 90) ve boylam (-180 / 180) gir.');return;
           }
           onManualCoordinates(coords);setCoordinateError('');setOpen(false);setManualOpen(false);
         }}>
           <label>Enlem<input aria-label="Enlem" value={latitude} inputMode="decimal" onChange={e=>setLatitude(e.target.value)} placeholder="36,8615" /></label>
           <label>Boylam<input aria-label="Boylam" value={longitude} inputMode="decimal" onChange={e=>setLongitude(e.target.value)} placeholder="30,6377" /></label>
           {coordinateError&&<small role="alert">{coordinateError}</small>}
           <button type="submit"><Check size={16}/>Konumu uygula</button>
         </form>}
         {location&&!preview&&<button className="yn-popup-option yn-danger-option" onClick={()=>{setOpen(false);onClear();}}><Trash2 size={19}/>Kaydedilmiş konumu sil<ChevronRight size={17}/></button>}
         {locationError&&<p role="alert" className="yn-location-error">{locationError}</p>}
         <div className="yn-location-help"><ShieldCheck size={16}/>Konum izni yalnızca isteğinle açılır.</div>
       </div>}
     </div>
   </div>
 </header>;
}

export function MessageState({kind,title,description,action,buttonLabel}:{kind?:'error'|'empty'|'location';title:string;description:string;action?:()=>void;buttonLabel?:string}){
 return <div className={`yn-state yn-state--${kind||'empty'}`} role={kind==='error'?'alert':'status'}>
   <div className="yn-state-glyph">{kind==='error'?<RotateCcw size={22}/>:<MapPin size={22}/>}</div>
   <strong>{title}</strong><p>{description}</p>
   {action&&<button type="button" className="yn-button yn-button--secondary" onClick={action}>{buttonLabel||'Tekrar dene'}</button>}
 </div>;
}
