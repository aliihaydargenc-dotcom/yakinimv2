import {useCallback, useEffect, useRef, useState} from 'react';
import {useAppStore} from '../store';

// Never initiates a browser permission prompt until request() is invoked by a user gesture.
export function useDeviceLocation() {
  const setLocation = useAppStore(s=>s.setLocation);
  const setLocationError = useAppStore(s=>s.setLocationError);
  const [isLocating,setIsLocating] = useState(false);
  const mounted = useRef(true);
  const revision = useRef(0);
  const watch = useRef<number|null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>|null>(null);
  const stopWatch = useCallback(() => {
    if (watch.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
  }, []);
  const cancel = useCallback(() => {
    revision.current += 1;
    stopWatch();
    if (mounted.current) setIsLocating(false);
  }, [stopWatch]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; revision.current += 1; stopWatch(); };
  }, [stopWatch]);
  const request = useCallback(() => {
    if (!window.isSecureContext || !navigator.geolocation) {
      setLocationError('Konum için HTTPS ve tarayıcı konum desteği gerekir. İstersen haritadan seçebilirsin.');
      return;
    }
    cancel();
    const requestId = revision.current;
    let accuracy = Infinity;
    let refineStarted = false;
    setIsLocating(true);
    setLocationError('');
    const alive = () => mounted.current && requestId === revision.current;
    const success = (position: GeolocationPosition) => {
      if (!alive()) return;
      const {latitude:lat, longitude:lng, accuracy:reportedAccuracy} = position.coords;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const nextAccuracy = Number.isFinite(reportedAccuracy) ? reportedAccuracy : Infinity;
      if (nextAccuracy > accuracy) return;
      accuracy = nextAccuracy;
      setLocation({lat,lng}, 'Cihazdan alınan konum', 'device');
      setIsLocating(false);
      if (accuracy <= 35) stopWatch();
      else if (!refineStarted && navigator.geolocation.watchPosition) {
        refineStarted = true;
        watch.current = navigator.geolocation.watchPosition(success, () => {}, {enableHighAccuracy:true, maximumAge:0, timeout:15000});
        timeout.current = setTimeout(stopWatch, 20000);
      }
    };
    const error = (reason: GeolocationPositionError) => {
      if (!alive()) return;
      setIsLocating(false);
      setLocationError(reason.code === 1
        ? 'Konum izni reddedildi. Safari ayarlarından bu siteye izin verebilir veya haritadan nokta seçebilirsin.'
        : 'Konum alınamadı. Ağ ve konum ayarlarını kontrol et veya haritadan nokta seç.');
    };
    navigator.geolocation.getCurrentPosition(success, reason => {
      if (!alive()) return;
      if (reason.code === 1) return error(reason);
      navigator.geolocation.getCurrentPosition(success, error, {enableHighAccuracy:false, timeout:12000, maximumAge:0});
    }, {enableHighAccuracy:true, timeout:14000, maximumAge:0});
  }, [cancel, setLocation, setLocationError, stopWatch]);
  return {request, cancel, isLocating};
}
