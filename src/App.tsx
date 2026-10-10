import {lazy, Suspense, useCallback, useEffect, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ArrowLeft, ArrowRight, Bookmark, ChevronRight, Compass, LocateFixed, MapPin, Radio, RefreshCw, ShieldCheck, SlidersHorizontal} from 'lucide-react';
import type {CategoryId, Coordinates, Place, RadioStation} from './types';
import {useAppStore} from './store';
import {useBackLayer} from './hooks/useBackLayer';
import {useDeviceLocation} from './hooks/useDeviceLocation';
import {useNearby, DEMO_LOCATION, PREVIEW_PLACES} from './features/useNearby';
import {fetchRadio} from './services/api';
import {AppHeader, MessageState, NavigationMenu} from './components/next/Shell';
import {PlaceCategoryFilter, PlaceDetail, PlaceList, QuickCategories, SearchField} from './components/next/Places';
import {categoryIcon, labelForCategory, mediaLinks, services, type Media, type Service, type Tab} from './components/next/catalog';
import {RadioPlayer} from './components/RadioPlayer';
import {formatDistance} from './domain/geo';

const MapView=lazy(()=>import('./components/MapView').then(module=>({default:module.MapView})));
const WeatherSummary=lazy(()=>import('./components/WeatherSummary'));
const PilotView=lazy(()=>import('./components/PilotViews').then(module=>({default:module.PilotView})));
const NewsView=lazy(()=>import('./components/NewsView').then(module=>({default:module.NewsView})));
const RadioView=lazy(()=>import('./components/RadioView').then(module=>({default:module.RadioView})));
const GamesView=lazy(()=>import('./components/GamesView').then(module=>({default:module.GamesView})));

const SEARCH_PARAMS=new URLSearchParams(window.location.search);
const PREVIEW=SEARCH_PARAMS.has('preview');
const PREVIEW_STATE=SEARCH_PARAMS.get('state'); // UI-only states, never described as live data.

function useDesktop() {
  const [desktop,setDesktop]=useState(()=>window.matchMedia('(min-width:1080px)').matches);
  useEffect(()=>{
    const media=window.matchMedia('(min-width:1080px)');
    const update=()=>setDesktop(media.matches);
    media.addEventListener('change',update);
    return ()=>media.removeEventListener('change',update);
  },[]);
  return desktop;
}

export default function App() {
  const {category,setCategory,search,setSearch,location:storedLocation,setLocation,clearLocation,locationMode,restoredLocation,locationError,setLocationError,savedIds,savedPlaces,toggleSaved,rememberSavedPlaces}=useAppStore();
  const [previewLocation,setPreviewLocation]=useState<Coordinates|null>(PREVIEW_STATE==='location'?null:DEMO_LOCATION);
  const [previewSaved,setPreviewSaved]=useState<string[]>([]);
  const location=PREVIEW?previewLocation:storedLocation;
  const actualSavedIds=PREVIEW?previewSaved:savedIds;
  const [tab,setTab]=useState<Tab>('explore');
  const [service,setService]=useState<Service|null>(null);
  const [media,setMedia]=useState<Media|null>(null);
  const [serviceSearch,setServiceSearch]=useState<Record<Service,string>>({prices:'',transit:'',traffic:'',events:'',outages:'',fishing:''});
  const [transitMode,setTransitMode]=useState<'stops'|'traffic'>('stops');
  const [selected,setSelected]=useState<Place|null>(null);
  const [picker,setPicker]=useState<'location'|'coast'|null>(null);
  const [beforePicker,setBeforePicker]=useState<Tab>('explore');
  const [pickedCoast,setPickedCoast]=useState<Coordinates|null>(null);
  const [currentRadio,setCurrentRadio]=useState<RadioStation|null>(null);
  const [playingGame,setPlayingGame]=useState(false);
  const desktop=useDesktop();
  const geo=useDeviceLocation();
  const {request:requestLocation,cancel:cancelLocation,isLocating}=geo;
  const radioStations=useQuery({queryKey:['radio'],queryFn:fetchRadio,enabled:!!currentRadio,staleTime:300000});
  const showMap=tab==='map'||tab==='explore'&&desktop;
  const nearby=useNearby({location,category,search,enabled:tab==='explore'||tab==='map'||tab==='saved',preview:PREVIEW,showMap});
  const demoPlaces=PREVIEW_STATE==='empty'||PREVIEW_STATE==='error'||PREVIEW_STATE==='loading'?[]:nearby.places;
  const places=PREVIEW?demoPlaces:nearby.places;
  const mapPlaces=PREVIEW&&(PREVIEW_STATE==='empty'||PREVIEW_STATE==='error'||PREVIEW_STATE==='loading')?[]:nearby.mapPlaces;
  const busy=PREVIEW?PREVIEW_STATE==='loading':nearby.busy;
  const errored=PREVIEW?PREVIEW_STATE==='error':nearby.error;
  const savedItems=PREVIEW?PREVIEW_PLACES.filter(p=>previewSaved.includes(p.id)):
    [...savedPlaces,...nearby.mapPlaces.filter(p=>savedIds.includes(p.id)&&!savedPlaces.some(saved=>saved.id===p.id))];

  useEffect(()=>{
    if(!PREVIEW&&nearby.mapPlaces.length)rememberSavedPlaces(nearby.mapPlaces);
  },[nearby.mapPlaces,rememberSavedPlaces]);
  useBackLayer(!!selected,()=>setSelected(null));
  // The existing native back-layer hook governs the detail sheet; the map and
  // service menu stay one level deep so they can be left with the fixed nav.
  const navigate=useCallback((next:Tab)=>{
    cancelLocation();
    setPicker(null);
    setSelected(null);
    setTab(next);
    if(next!=='services')setService(null);
    if(next!=='more')setMedia(null);
  },[cancelLocation]);
  const selectCategory=useCallback((id:CategoryId)=>{
    setCategory(id);setSearch('');setSelected(null);setPicker(null);
    setTab('explore');
  },[setCategory,setSearch]);
  const selectService=useCallback((next:Service)=>{
    setTab('services');setService(next);setMedia(null);
    setTransitMode(next==='traffic'?'traffic':'stops');
  },[]);
  const chooseMapLocation=useCallback((mode:'location'|'coast')=>{
    cancelLocation();setLocationError('');
    setBeforePicker(tab);setPicker(mode);setTab('map');setSelected(null);
  },[cancelLocation,setLocationError,tab]);
  const pick=useCallback((coords:Coordinates)=>{
    if(picker==='coast')setPickedCoast(coords);
    else if(PREVIEW)setPreviewLocation(coords);
    else setLocation(coords,'Haritadan seçilen konum','manual');
    setPicker(null);setTab(picker==='coast'?'services':beforePicker);
  },[picker,beforePicker,setLocation]);
  const clearSelectedLocation=()=>{
    cancelLocation();
    if(PREVIEW)setPreviewLocation(null);
    else clearLocation();
  };
  const togglePlaceSave=(place:Place)=>{
    if(PREVIEW)setPreviewSaved(items=>items.includes(place.id)?items.filter(id=>id!==place.id):[...items,place.id]);
    else toggleSaved(place.id,place);
  };
  const renderPlaceList=()=>{
    if(!location) return <MessageState kind="location" title="Önce bir konum seç" description="Yakındaki yerleri göstermek için cihaz konumunu kullan veya haritadan bir nokta belirle." action={()=>chooseMapLocation('location')} buttonLabel="Haritadan seç"/>;
    if(busy&&!places.length) return <div role="status" className="yn-loading"><span className="yn-loading-dot"/>Yakındaki yerler alınıyor…<div className="yn-skeleton"/><div className="yn-skeleton"/><div className="yn-skeleton"/></div>;
    if(errored&&!places.length) return <MessageState kind="error" title="Veri kaynağına ulaşılamadı" description="Bir bağlantı veya servis sorunu olabilir. Boş sonuçmuş gibi göstermiyoruz." action={nearby.refresh}/>;
    if(!places.length) return <MessageState title="Bu seçimde yer bulunamadı" description="Aramanı değiştirebilir, başka bir kategori deneyebilir veya haritada farklı bir alana bakabilirsin." action={()=>{setCategory('all');setSearch('');}} buttonLabel="Filtreyi sıfırla"/>;
    return <PlaceList places={places} onSelect={setSelected} savedIds={actualSavedIds} onToggleSave={togglePlaceSave} preview={PREVIEW}/>;
  };
  const map=()=> <Suspense fallback={<div className="yn-map-wait">Harita hazırlanıyor…</div>}>
    <MapView key={nearby.scope} memoryKey={`next:${nearby.scope}`} location={location} places={mapPlaces} picking={!!picker} onPick={pick} onViewportChange={nearby.onViewportChange} loading={busy&&!mapPlaces.length}/>
  </Suspense>;

  return <div className={`yn-app ${currentRadio?'has-player':''} ${playingGame?'is-playing':''}`}>
    {!playingGame&&<aside className="yn-sidebar"><div className="yn-sidebar-brand"><span className="yn-sidebar-logo"><MapPin size={23}/></span><span>yakınım<span>.</span></span></div>
      <p className="yn-sidebar-kicker">YAŞADIĞIN YERİ KEŞFET</p><NavigationMenu tab={tab} onTab={navigate} variant="desktop"/>
      <div className="yn-sidebar-footer"><span className="yn-online-dot"/><span>Veriler sağlayıcı kaynaklarına bağlıdır.<br/>Konum izni senin kontrolünde.</span></div>
    </aside>}
    <div className="yn-body">
      {!playingGame&&<AppHeader location={location} manual={locationMode==='manual'} restored={restoredLocation} locationError={locationError} locating={isLocating} preview={PREVIEW} onUseDevice={requestLocation} onChooseMap={()=>chooseMapLocation('location')} onManualCoordinates={coords=>{cancelLocation();if(PREVIEW)setPreviewLocation(coords);else setLocation(coords,'Koordinatla seçildi','manual');}} onClear={clearSelectedLocation}/>}
      {PREVIEW&&!playingGame&&<div className="yn-preview-banner"><span>ÖNİZLEME</span> Yakındaki yerler temsili veridir; gerçek işletme bilgisi değildir.</div>}
      {!playingGame&&locationError&&<div className="yn-inline-warning" role="alert">{locationError} {location&&'Mevcut konum korunuyor.'}<button onClick={()=>chooseMapLocation('location')}>Haritadan seç</button></div>}
      <main className={`yn-main yn-main--${tab}`} id="main-content">
        {tab==='explore'&&<div className="yn-explore-grid">
          <section className="yn-explore-column">
            <div className="yn-intro"><div className="yn-eyebrow"><span className="yn-small-dot"/> ÇEVRENDE NELER VAR?</div><h1>Yakınında ne var?</h1><p>İhtiyacın olan yeri hızlıca bul.</p></div>
            <SearchField value={search} onChange={setSearch}/>
            <QuickCategories onChoose={selectCategory}/>
            {category==='all'&&location&&<div className="yn-weather"><Suspense fallback={<span className="yn-weather-wait">Hava bilgisi alınıyor…</span>}><WeatherSummary location={location}/></Suspense></div>}
            <div className="yn-section-heading"><div><span className="yn-eyebrow">KEŞFET</span><h2>{category==='all'?'Yakınındaki yerler':labelForCategory(category)}</h2></div><button className="yn-map-link" onClick={()=>navigate('map')}><MapPin size={17}/>Haritaya bak<ArrowRight size={15}/></button></div>
            <PlaceCategoryFilter category={category} onChoose={selectCategory}/>
            <div className="yn-result-meta"><span>{location?(errored&&!places.length?'Kaynak hatası':busy&&!places.length?'Aranıyor…':`${places.length} sonuç`):'Konum gerekli'}</span><span>Yakından uzağa</span></div>
            {nearby.fallbackDuty&&<div className="yn-source-warning" role="status">Nöbetçi eczane bilgileri alternatif ve resmî olmayan Eczane Adresi kaynağından. Gitmeden önce telefonla doğrulayın.</div>}
            {renderPlaceList()}
            {nearby.degraded&&!errored&&<p className="yn-fineprint">Bazı veri kaynaklarına ulaşılamadı; sonuçlar eksik olabilir.</p>}
            {busy&&places.length>0&&<p className="yn-fineprint" role="status">Sonuçlar güncelleniyor…</p>}
          </section>
          {desktop&&<aside className="yn-desktop-map"><div className="yn-desktop-map-label"><div><strong>Çevrendeki harita</strong><small>{location?'Haritada sürükleyerek ara':'Konum seçilmedi'}</small></div><button onClick={()=>navigate('map')}>Büyüt<ArrowRight size={16}/></button></div><div className="yn-map-canvas">{map()}</div></aside>}
        </div>}
        {tab==='map'&&<section className="yn-map-view">
          <div className="yn-map-top"><div className="yn-map-top-heading"><span className="yn-eyebrow">HARİTA</span><h1>{picker==='location'?'Haritadan konum seç':picker==='coast'?'Balıkçılık noktası seç':'Yakınındaki yerler'}</h1></div><button onClick={()=>navigate(picker?'explore':'explore')} className="yn-outline-control"><ArrowLeft size={18}/>Liste</button></div>
          {!picker&&<div className="yn-map-filters"><PlaceCategoryFilter category={category} onChoose={id=>{setCategory(id);setSearch('');}}/></div>}
          {picker&&<p className="yn-map-instructions">Haritada istediğin noktaya dokun. <button onClick={()=>{setPicker(null);setTab(beforePicker);}}>Vazgeç</button></p>}
          <div className="yn-map-large">{map()}</div>
          {!picker&&<div className="yn-map-bottom"><span><MapPin size={16}/>{busy?'Harita güncelleniyor…':`${mapPlaces.length} yer`}</span><button onClick={()=>navigate('explore')}>Listeye dön<ChevronRight size={17}/></button></div>}
        </section>}
        {tab==='services'&&<section className="yn-screen yn-services-screen">
          {!service?<><div className="yn-page-heading"><div className="yn-eyebrow">GÜNLÜK YARDIMCIN</div><h1>Şehir hizmetleri</h1><p>Konuma ve sağlayıcıların kapsama alanına bağlı güncel bilgiler.</p></div>
            <div className="yn-services-grid">{services.map(({id,label,description,Icon})=><button className="yn-service-tile" key={id} onClick={()=>selectService(id)}><span className="yn-service-icon"><Icon size={23}/></span><span><strong>{label}</strong><small>{description}</small></span><ChevronRight size={19}/></button>)}</div>
            <div className="yn-quiet-note"><ShieldCheck size={19}/><span>Kaynak doğrulanmadığında sonuçlar kesin bilgi olarak sunulmaz. Hizmetlerin kapsamı bölgesel olabilir.</span></div>
          </>:<><button className="yn-back-link" onClick={()=>setService(null)}><ArrowLeft size={18}/>Tüm hizmetler</button>
            <div className="yn-page-heading yn-service-heading"><div className="yn-eyebrow">ŞEHİR HİZMETLERİ</div><h1>{services.find(s=>s.id===service)?.label}</h1><p>{services.find(s=>s.id===service)?.description}</p></div>
            {service!=='fishing'&&<SearchField value={serviceSearch[service]} onChange={text=>setServiceSearch(old=>({...old,[service]:text}))} placeholder={service==='prices'?'Ürün veya marka ara':service==='transit'?'Durak veya hat ara':service==='traffic'?'Cadde veya yer ara':service==='events'?'Etkinlik veya mekan ara':'İlçe veya mahalle ara'}/>}
            <div className="yn-module-area"><Suspense fallback={<MessageState title="Hizmet hazırlanıyor" description="Modül yükleniyor…"/>}>
              <PilotView mode={service==='traffic'?'transit':service} location={location} search={serviceSearch[service]} transitMode={service==='traffic'?'traffic':transitMode} onTransitModeChange={mode=>{setTransitMode(mode);setService(mode==='traffic'?'traffic':'transit');}} onChooseCoast={()=>chooseMapLocation('coast')} pickedCoast={pickedCoast}/>
            </Suspense></div>
          </>}
        </section>}
        {tab==='saved'&&<section className="yn-screen yn-saved-screen"><div className="yn-page-heading"><div className="yn-eyebrow">SANA ÖZEL</div><h1>Kaydedilen yerler</h1><p>Tekrar ulaşmak istediğin yerler burada.</p></div>
          <div className="yn-result-meta"><span>{savedItems.length} kayıt</span><span>Bu cihazda saklanır</span></div>
          {savedItems.length?<PlaceList places={savedItems} onSelect={setSelected} savedIds={actualSavedIds} onToggleSave={togglePlaceSave} preview={PREVIEW}/>:<MessageState title="Henüz kaydedilen yer yok" description="Keşfet bölümünde bir yerin yanındaki kaydet simgesine dokun. Kaydedilen bilgiler bu tarayıcıda tutulur." action={()=>navigate('explore')} buttonLabel="Yerleri keşfet"/>}
          {!PREVIEW&&savedIds.length>savedItems.length&&<p className="yn-fineprint">Eski sürümden kalan {savedIds.length-savedItems.length} kayıt için yer bilgisi henüz bulunamadı. İlgili bölgede arama yapınca eşleşen kayıtlar tamamlanır.</p>}
        </section>}
        {tab==='more'&&<section className="yn-screen yn-more-screen">
          {!media?<><div className="yn-page-heading"><div className="yn-eyebrow">DAHA FAZLASI</div><h1>Dinle, oku, oyna</h1><p>Diğer Yakınım içerikleri.</p></div>
            <div className="yn-more-links">{mediaLinks.map(({id,label,description,Icon})=><button key={id} onClick={()=>setMedia(id)}><span className="yn-service-icon"><Icon size={22}/></span><span><strong>{label}</strong><small>{description}</small></span><ChevronRight size={20}/></button>)}</div>
            <div className="yn-about-note"><strong>Yakınım</strong><p>Konum, kategori ve kaydedilen yerlerin yönetimi bu cihazda. Canlı modüllerin doğruluğu her kaynakta ayrı değerlendirilmelidir.</p></div>
          </>:<><button className="yn-back-link" onClick={()=>setMedia(null)}><ArrowLeft size={18}/>Diğer içerikler</button>
            <div className="yn-media-container"><Suspense fallback={<MessageState title="İçerik hazırlanıyor" description="Birazdan görüntülenecek."/>}>
              {media==='news'?<NewsView/>:media==='radio'?<RadioView current={currentRadio} onSelect={setCurrentRadio}/>:<GamesView onActiveChange={setPlayingGame}/>}
            </Suspense></div>
          </>}
        </section>}
      </main>
      {!playingGame&&<NavigationMenu tab={tab} onTab={navigate} variant="mobile"/>}
      <RadioPlayer station={currentRadio} stations={radioStations.data||[]} onSelect={setCurrentRadio} onClose={()=>setCurrentRadio(null)}/>
      {selected&&<PlaceDetail place={selected} preview={PREVIEW} saved={actualSavedIds.includes(selected.id)} onSave={()=>togglePlaceSave(selected)} onClose={()=>setSelected(null)}/>}
    </div>
  </div>;
}
