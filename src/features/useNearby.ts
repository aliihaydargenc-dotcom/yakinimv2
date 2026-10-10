import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import type {Coordinates, Place} from '../types';
import {combinePlaceSources,fetchArea,fetchDiscoveryPlaces,fetchMunicipalPlaces,fetchOvertureSupplement,fetchDuty,type ViewportBounds} from '../services/api';
import discoveryCategories from '../../lib/discovery-categories.json';
import {filterPlaces,geoScope,nearbyBounds} from '../domain/geo';
import {useRetainedPlaces} from '../hooks/useRetainedPlaces';

export const DEMO_LOCATION: Coordinates = {lat:36.8615,lng:30.6377};
export const PREVIEW_PLACES: Place[] = [
  {id:'demo:market',name:'Örnek Mahalle Marketi',category:'market',lat:36.8622,lng:30.637, address:'Örnek adres · Antalya',source:'TEMSİLİ'},
  {id:'demo:cafe',name:'Örnek Sahil Kahvesi',category:'cafe',lat:36.8603,lng:30.6364,address:'Örnek adres · Antalya',source:'TEMSİLİ'},
  {id:'demo:pharmacy',name:'Örnek Eczane',category:'pharmacy',lat:36.8633,lng:30.6398,address:'Örnek adres · Antalya',source:'TEMSİLİ'},
  {id:'demo:duty',name:'Örnek Nöbetçi Eczane',category:'duty',lat:36.8621,lng:30.6382,address:'Örnek adres · Antalya',source:'TEMSİLİ'},
  {id:'demo:bakery',name:'Örnek Fırın',category:'bakery',lat:36.8641,lng:30.6352,address:'Örnek adres · Antalya',source:'TEMSİLİ'},
  {id:'demo:food',name:'Örnek Ev Yemekleri',category:'food',lat:36.8587,lng:30.6415,address:'Örnek adres · Antalya',source:'TEMSİLİ'},
  {id:'demo:atm',name:'Örnek ATM',category:'atm',lat:36.8606,lng:30.6347,address:'Örnek adres · Antalya',source:'TEMSİLİ'},
  {id:'demo:park',name:'Örnek Kent Parkı',category:'park',lat:36.8656,lng:30.6334,address:'Örnek adres · Antalya',source:'TEMSİLİ'},
  {id:'demo:fuel',name:'Örnek Akaryakıt',category:'fuel',lat:36.8658,lng:30.6417,address:'Örnek adres · Antalya',source:'TEMSİLİ'},
];

type Area = {center:Coordinates;bounds:ViewportBounds;owner:string};
const istanbulDate = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

export function useNearby({location,category,search,enabled,preview,showMap}:{
  location:Coordinates|null; category:string; search:string; enabled:boolean; preview:boolean; showMap:boolean;
}) {
  const scope = geoScope(location);
  const [area,setArea] = useState<Area|null>(() => location ? {center:location,bounds:nearbyBounds(location),owner:scope} : null);
  const debounce = useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    setArea(location ? {center:location,bounds:nearbyBounds(location),owner:scope} : null);
    return () => {if (debounce.current) clearTimeout(debounce.current);};
  }, [scope]);
  const onViewportChange = useCallback((center:Coordinates, bounds:ViewportBounds) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setArea({center,bounds,owner:scope}), 420);
  }, [scope]);
  const ready = !!location && !!area && area.owner === scope;
  const specialDiscovery = discoveryCategories.some(c=>c.id === category);
  const municipalArea = ready && area.center.lat>=40.5&&area.center.lat<=41.8&&area.center.lng>=27.5&&area.center.lng<=30.5;
  const municipalKind = category === 'parking' ? 'parking' : category === 'toilets' ? 'toilets' : 'all';
  const municipalEnabled = enabled && !preview && municipalArea && ['all','parking','toilets'].includes(category);
  const normalEnabled = enabled && !preview && ready && category !== 'duty';
  const boundsKey = area ? [area.bounds.south,area.bounds.north,area.bounds.west,area.bounds.east].map((v:number)=>v.toFixed(4)) : [];
  const areaQuery = useQuery({queryKey:['next:area',scope,...boundsKey],queryFn:({signal})=>fetchArea(area!.bounds,area!.center,signal),enabled:normalEnabled,staleTime:600000,retry:0});
  const supplement = useQuery({queryKey:['next:overture',scope,area?.center.lat.toFixed(3),area?.center.lng.toFixed(3)],queryFn:({signal})=>fetchOvertureSupplement(area!.center,signal),enabled:normalEnabled,staleTime:1800000,retry:0});
  const fuel = useQuery({queryKey:['next:fuel',scope],queryFn:({signal})=>fetchArea({south:location!.lat-.04,north:location!.lat+.04,west:location!.lng-.05,east:location!.lng+.05},location!,signal),enabled:normalEnabled&&category==='fuel'&&!showMap,staleTime:600000,retry:0});
  const discovery = useQuery({queryKey:['next:discovery',scope],queryFn:({signal})=>fetchDiscoveryPlaces(location!,signal),enabled:normalEnabled&&specialDiscovery&&!showMap,staleTime:600000,retry:0});
  const discoveredOverture = useQuery({queryKey:['next:discovery-overture',category,scope],queryFn:({signal})=>fetchOvertureSupplement(location!,signal,category),enabled:normalEnabled&&specialDiscovery&&!showMap,staleTime:21600000,retry:0});
  const municipal = useQuery({queryKey:['next:municipal',scope,municipalKind,area?.center.lat.toFixed(3),area?.center.lng.toFixed(3)],queryFn:({signal})=>fetchMunicipalPlaces(area!.center,municipalKind,signal),enabled:municipalEnabled,staleTime:120000,refetchInterval:120000,retry:0});
  const dutyDate = istanbulDate();
  const duty = useQuery({queryKey:['next:duty',dutyDate,scope,area?.center.lat.toFixed(4),area?.center.lng.toFixed(4)],queryFn:()=>fetchDuty(area!.center),enabled:enabled&&!preview&&ready&&category==='duty',staleTime:300000,refetchInterval:300000,retry:0});
  const retainedArea = useRetainedPlaces(ready?areaQuery.data:undefined,`next:area:${scope}`);
  const retainedSupplement = useRetainedPlaces(ready?supplement.data:undefined,`next:supplement:${scope}`);
  const retainedDuty = useRetainedPlaces(ready?duty.data:undefined,`next:duty:${dutyDate}:${scope}`);
  const roster = showMap ? retainedDuty : ready?duty.data??[]:[];
  const allPlaces = useMemo(() => {
    if (!ready) return [];
    if (preview) return PREVIEW_PLACES;
    if (category === 'duty') return roster;
    return combinePlaceSources([
      ...retainedArea, ...retainedSupplement,
      ...(specialDiscovery?[...(discovery.data??[]),...(discoveredOverture.data??[])]:[]),
      ...(municipalEnabled?municipal.data?.places??[]:[]),
      ...(category==='fuel'?fuel.data??[]:[]),
    ]);
  },[ready,preview,category,roster,retainedArea,retainedSupplement,specialDiscovery,discovery.data,discoveredOverture.data,municipalEnabled,municipal.data,fuel.data]);
  const matching = useMemo(() => filterPlaces(allPlaces,category,search,location), [allPlaces,category,search,scope]);
  const visible = useMemo(() => {
    if (showMap || category==='duty' || category==='fuel' || specialDiscovery || category==='parking'&&municipalArea || !area) return matching;
    return matching.filter(p=>p.lat>=area.bounds.south&&p.lat<=area.bounds.north&&p.lng>=area.bounds.west&&p.lng<=area.bounds.east);
  },[matching,showMap,category,specialDiscovery,municipalArea,area]);
  const busy = !preview && (category==='duty' ? duty.isFetching : areaQuery.isFetching||supplement.isFetching||municipalEnabled&&municipal.isFetching||specialDiscovery&&(discovery.isFetching||discoveredOverture.isFetching)||category==='fuel'&&fuel.isFetching);
  const error = !preview && (category==='duty' ? duty.isError : areaQuery.isError&&supplement.isError&&(!specialDiscovery||(discovery.isError&&discoveredOverture.isError))&&(!municipalEnabled||municipal.isError));
  const degraded = !preview && (category==='duty' ? false : areaQuery.isError||supplement.isError||municipalEnabled&&(municipal.isError||!!municipal.data?.partial)||specialDiscovery&&(discovery.isError||discoveredOverture.isError));
  const fallbackDuty = category==='duty' && roster.some(p=>p.source==='legacy-fallback');
  const refresh = () => {
    if (category==='duty') void duty.refetch();
    else {
      void areaQuery.refetch(); void supplement.refetch();
      if(municipalEnabled) void municipal.refetch();
      if(specialDiscovery) {void discovery.refetch();void discoveredOverture.refetch();}
      if(category==='fuel') void fuel.refetch();
    }
  };
  return {places:visible,mapPlaces:matching,ready,busy,error,degraded,fallbackDuty,refresh,onViewportChange,scope};
}
