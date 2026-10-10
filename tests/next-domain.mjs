import assert from 'node:assert/strict';
import {geoScope,validCoordinates,metersBetween,formatDistance,filterPlaces,nearbyBounds} from '../src/domain/geo.ts';

assert.equal(geoScope(null),'none');
assert.equal(geoScope({lat:36.86123,lng:30.63764}),'36.86123:30.63764');
assert.notEqual(geoScope({lat:36.86123,lng:30.63764}),geoScope({lat:36.86223,lng:30.63764}), 'distinct streets need distinct cache keys');
for (const bad of [null,undefined,{lat:NaN,lng:30},{lat:91,lng:0},{lat:30,lng:181},{lat:'30',lng:30}]) assert.equal(validCoordinates(bad),false);
assert.equal(validCoordinates({lat:-90,lng:180}),true);
assert.equal(metersBetween({lat:36.86,lng:30.63},{lat:36.86,lng:30.63}),0);
assert.ok(metersBetween({lat:36.86,lng:30.63},{lat:36.861,lng:30.63})>90);
assert.equal(formatDistance(120),'120 m');
assert.equal(formatDistance(1450),'1,4 km');
assert.equal(formatDistance(Infinity),'Mesafe bilinmiyor');
const origin={lat:36.86,lng:30.63};
const places=[
 {id:'far',name:'DURAK Kahvesi',category:'cafe',lat:36.869,lng:30.63,address:'Merkez'},
 {id:'near',name:'Mavi Market',category:'market',lat:36.8602,lng:30.63,address:'Sahil'},
 {id:'mid',name:'Türkçe Şeker Kafe',category:'cafe',lat:36.861,lng:30.63,address:'Park'},
];
assert.deepEqual(filterPlaces(places,'all','',origin).map(p=>p.id),['near','mid','far']);
assert.deepEqual(filterPlaces(places,'cafe','ŞEKER',origin).map(p=>p.id),['mid']);
assert.deepEqual(filterPlaces(places,'market','',origin).map(p=>p.id),['near']);
assert.equal(places[0].distanceM,undefined,'source array is not mutated');
const bounds=nearbyBounds(origin);assert.ok(bounds.north>origin.lat&&bounds.west<origin.lng);
console.log('NEXT domain: 15 assertions passed (coordinates, scoped keys, distance, Turkish search, sort).');
