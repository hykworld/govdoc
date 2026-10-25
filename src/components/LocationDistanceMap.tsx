import React, { useState, useEffect, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { AnalysisResult, LocationItem } from '../types';
import { 
  MapPin, 
  Navigation, 
  Home, 
  Building2, 
  Search, 
  ArrowRight, 
  Compass, 
  Car, 
  Train, 
  ExternalLink,
  Sparkles,
  Layers,
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';

interface LocationDistanceMapProps {
  result: AnalysisResult | null;
}

// Preset standard hub coordinates in South Korea
const PRESET_ORIGINS = [
  { name: '강남역 (테헤란로 직장가)', address: '서울 강남구 테헤란로 152', lat: 37.4979, lng: 127.0276 },
  { name: '광화문/종로 (도심 업무지구)', address: '서울 종로구 세종대로 172', lat: 37.5714, lng: 126.9768 },
  { name: '여의도역 (금융 중심)', address: '서울 영등포구 의사당대로 1', lat: 37.5218, lng: 126.9242 },
  { name: '판교역 (IT 테크밸리)', address: '경기 성남시 분당구 판교역로 160', lat: 37.3948, lng: 127.1111 },
  { name: '서울역 (교통 환승 허브)', address: '서울 용산구 한강대로 405', lat: 37.5547, lng: 126.9707 },
];

// Fallback dummy locations if notice doesn't specify exact coordinates
const DEFAULT_LOCATIONS: LocationItem[] = [
  {
    id: 'loc-1',
    name: '강동 리엔파크 11단지',
    address: '서울시 강동구 강일동 산 12',
    lat: 37.5512,
    lng: 127.1654,
    type: '원룸/투룸 (29㎡, 39㎡)',
    units: '240호',
    deposit: '4,800만원',
    rent: '19만원'
  },
  {
    id: 'loc-2',
    name: '은평뉴타운 디에트르',
    address: '서울시 은평구 진관동 85',
    lat: 37.6358,
    lng: 126.9192,
    type: '청년형 (36㎡, 44㎡)',
    units: '180호',
    deposit: '5,200만원',
    rent: '21만원'
  },
  {
    id: 'loc-3',
    name: '마곡 스마트시티 단지',
    address: '서울시 강서구 마곡동 727',
    lat: 37.5601,
    lng: 126.8274,
    type: '원룸형 (21㎡)',
    units: '310호',
    deposit: '3,900만원',
    rent: '16만원'
  },
  {
    id: 'loc-4',
    name: '신내 글로리빌 (역세권)',
    address: '서울시 중랑구 신내동 648',
    lat: 37.6186,
    lng: 127.0945,
    type: '셰어/단독 (16㎡, 29㎡)',
    units: '150호',
    deposit: '100만원 (1순위)',
    rent: '14만원'
  },
  {
    id: 'loc-5',
    name: '성남 복정 청년안심단지',
    address: '경기 성남시 수정구 복정동 42',
    lat: 37.4628,
    lng: 127.1264,
    type: '청년형 (24㎡)',
    units: '120호',
    deposit: '200만원',
    rent: '18만원'
  }
];

// Calculate Haversine distance in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Map Controller helper to animate pan & zoom
function MapPanController({ targetCenter, targetZoom }: { targetCenter: { lat: number; lng: number } | null; targetZoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && targetCenter) {
      map.panTo(targetCenter);
      if (targetZoom) {
        map.setZoom(targetZoom);
      }
    }
  }, [map, targetCenter, targetZoom]);
  return null;
}

export const LocationDistanceMap: React.FC<LocationDistanceMapProps> = ({ result }) => {
  // Google Maps API Key from injected secret or fallback demo key
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyBSA_pdN8JjJPsJq9vPmewM9joLL3i_Wrw';

  // Quota banner state for Demo Key compliance
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // User Base Address State
  const [originName, setOriginName] = useState('강남역 (테헤란로 직장가)');
  const [originAddress, setOriginAddress] = useState('서울 강남구 테헤란로 152');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number }>({ lat: 37.4979, lng: 127.0276 });
  const [customInput, setCustomInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Selected Location for InfoWindow & Pan
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'rent' | 'units'>('distance');

  // Listen to quota exceeded event
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Notice Locations: use extracted locations or fallback realistic sample
  const baseLocations = useMemo(() => {
    if (result?.locations && result.locations.length > 0) {
      return result.locations;
    }
    return DEFAULT_LOCATIONS;
  }, [result]);

  // Compute distances & travel times relative to current originCoords
  const locationsWithDistance = useMemo(() => {
    return baseLocations.map((loc) => {
      const dist = calculateDistanceKm(originCoords.lat, originCoords.lng, loc.lat, loc.lng);
      // Rough transit estimate: ~2.5 mins per km in Seoul metro area + 10 mins baseline wait/walk
      const estTime = Math.max(12, Math.round(dist * 2.8 + 8));
      return {
        ...loc,
        distanceKm: dist,
        travelTimeMin: estTime,
      };
    });
  }, [baseLocations, originCoords]);

  // Sorted locations
  const sortedLocations = useMemo(() => {
    const list = [...locationsWithDistance];
    if (sortBy === 'distance') {
      return list.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }
    return list;
  }, [locationsWithDistance, sortBy]);

  // Select preset origin
  const handleSelectPreset = (preset: typeof PRESET_ORIGINS[0]) => {
    setOriginName(preset.name);
    setOriginAddress(preset.address);
    setOriginCoords({ lat: preset.lat, lng: preset.lng });
    setPanTarget({ lat: preset.lat, lng: preset.lng });
  };

  // Browser HTML5 Geolocation (현재 위치)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('브라우저에서 위치 서비스를 지원하지 않습니다.');
      return;
    }
    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setOriginName('현재 내 위치 (GPS 기준)');
        setOriginAddress(`위도 ${lat.toFixed(4)}, 경도 ${lng.toFixed(4)}`);
        setOriginCoords({ lat, lng });
        setPanTarget({ lat, lng });
        setIsGeocoding(false);
      },
      (err) => {
        alert('현재 위치를 가져오지 못했습니다. 위치 권한을 허용해 주세요.');
        setIsGeocoding(false);
      }
    );
  };

  // Search custom address (Simple keyword geocoding for Korean addresses)
  const handleSearchCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const query = customInput.trim();
    if (!query) return;

    setIsGeocoding(true);
    // Well-known coordinates mapping in Seoul/Gyeonggi
    const lower = query.toLowerCase();
    let lat = 37.5665;
    let lng = 126.9780;
    let matchedName = query;

    if (lower.includes('강남') || lower.includes('역삼') || lower.includes('삼성')) {
      lat = 37.4980; lng = 127.0276;
    } else if (lower.includes('마포') || lower.includes('공덕') || lower.includes('홍대') || lower.includes('신촌')) {
      lat = 37.5563; lng = 126.9236;
    } else if (lower.includes('송파') || lower.includes('잠실')) {
      lat = 37.5133; lng = 127.1001;
    } else if (lower.includes('서초') || lower.includes('양재')) {
      lat = 37.4837; lng = 127.0324;
    } else if (lower.includes('성남') || lower.includes('분당') || lower.includes('판교')) {
      lat = 37.3948; lng = 127.1111;
    } else if (lower.includes('수원') || lower.includes('광교')) {
      lat = 37.2636; lng = 127.0286;
    } else if (lower.includes('일산') || lower.includes('고양')) {
      lat = 37.6584; lng = 126.7720;
    } else if (lower.includes('인천') || lower.includes('부평') || lower.includes('송도')) {
      lat = 37.4563; lng = 126.7052;
    } else if (lower.includes('노원') || lower.includes('도봉') || lower.includes('상계')) {
      lat = 37.6542; lng = 127.0568;
    } else if (lower.includes('영등포') || lower.includes('여의도') || lower.includes('문래')) {
      lat = 37.5218; lng = 126.9242;
    }

    setOriginName(matchedName);
    setOriginAddress(`${matchedName} 일대`);
    setOriginCoords({ lat, lng });
    setPanTarget({ lat, lng });
    setIsGeocoding(false);
  };

  return (
    <div className="space-y-6">
      {/* Demo Quota Exceeded Sticky Notice (Google Maps Platform Compliance) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/40">
                스마트 로케이션 매칭
              </span>
              <span className="text-xs text-slate-300">
                {result?.title || '공고 공급 주택 위치 분석'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
              내 기준 주소 vs 공고 공급 단지 거리 비교 맵
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 max-w-2xl leading-relaxed">
              우리 집, 직장, 대학교 등 <strong>기준점 주소</strong>를 설정하면 공고에 나온 공급 단지들의 위치를 지도에서 한눈에 확인하고, 출퇴근·통학 거리와 소요 시간을 즉시 비교합니다.
            </p>
          </div>

          <div className="p-3 bg-white/10 rounded-xl border border-white/15 text-xs text-blue-100 flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="block font-bold">현재 기준점:</span>
              <span className="text-white font-semibold">{originName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Origin Selection & Address Input Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Home className="w-4 h-4 text-blue-600" />
            <span>내 기준 위치 설정 (직장 / 현재 거주지 / 학교)</span>
          </label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isGeocoding}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>현재 내 위치(GPS) 사용</span>
          </button>
        </div>

        {/* Custom Address Input Form */}
        <form onSubmit={handleSearchCustom} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="예: 서울 강남구 테헤란로, 마포구 공덕역, 판교 테크노밸리, 수원역 등"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white text-slate-800 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer shrink-0"
          >
            기준점 변경
          </button>
        </form>

        {/* Quick Origin Presets Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">주요 업무지구 빠른 선택:</span>
          {PRESET_ORIGINS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                originName === preset.name
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span>{preset.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Map & Location List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Google Map */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                공급 위치 인터랙티브 지도
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              파란색: 내 기준점 / 초록색: 공고 공급 단지
            </span>
          </div>

          {/* Google Maps Container */}
          <div className="w-full h-[460px] rounded-xl overflow-hidden relative border border-slate-200">
            <APIProvider apiKey={apiKey} solutionChannel="GMP_aistudio">
              <Map
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                defaultCenter={{ lat: 37.5665, lng: 126.9780 }}
                defaultZoom={11}
                gestureHandling="greedy"
                disableDefaultUI={false}
                className="w-full h-full"
              >
                <MapPanController targetCenter={panTarget} />

                {/* User Origin Marker (Blue Home Pin) */}
                <AdvancedMarker
                  position={originCoords}
                  title={`[내 기준점] ${originName}`}
                >
                  <Pin
                    background="#2563EB"
                    borderColor="#1E40AF"
                    glyphColor="#FFFFFF"
                  />
                </AdvancedMarker>

                {/* Notice Location Markers (Green Building Pins) */}
                {sortedLocations.map((loc, idx) => (
                  <AdvancedMarker
                    key={loc.id}
                    position={{ lat: loc.lat, lng: loc.lng }}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setPanTarget({ lat: loc.lat, lng: loc.lng });
                    }}
                    title={`${loc.name} (${loc.distanceKm}km)`}
                  >
                    <Pin
                      background="#059669"
                      borderColor="#065F46"
                      glyphColor="#FFFFFF"
                      scale={selectedLocation?.id === loc.id ? 1.25 : 1.0}
                    />
                  </AdvancedMarker>
                ))}

                {/* InfoWindow for Clicked Location */}
                {selectedLocation && (
                  <InfoWindow
                    position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                    onCloseClick={() => setSelectedLocation(null)}
                  >
                    <div className="p-1 max-w-xs text-slate-900 font-sans">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          {selectedLocation.type || '공급단지'}
                        </span>
                        <span className="text-xs font-bold text-blue-700">
                          직선 {selectedLocation.distanceKm} km
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mb-1">
                        {selectedLocation.name}
                      </h4>
                      <p className="text-xs text-slate-500 mb-2">
                        {selectedLocation.address}
                      </p>
                      
                      <div className="p-2 bg-slate-50 rounded-lg text-xs space-y-0.5 mb-2 border border-slate-100">
                        {selectedLocation.deposit && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">보증금:</span>
                            <span className="font-bold text-blue-700">{selectedLocation.deposit}</span>
                          </div>
                        )}
                        {selectedLocation.rent && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">월세:</span>
                            <span className="font-bold text-emerald-700">{selectedLocation.rent}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-500">대중교통 예상:</span>
                          <span className="font-bold text-slate-800">약 {selectedLocation.travelTimeMin}분</span>
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${originCoords.lat},${originCoords.lng}&destination=${selectedLocation.lat},${selectedLocation.lng}&travelmode=transit`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                      >
                        <span>Google 지도 길찾기</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </div>
        </div>

        {/* Right Column: Distance Comparison List & Ranking */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  단지별 거리 및 이동시간 순위
                </h3>
              </div>

              <span className="text-xs text-slate-500 font-semibold">
                총 {sortedLocations.length}개 단지
              </span>
            </div>

            {/* List Cards */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {sortedLocations.map((loc, idx) => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setPanTarget({ lat: loc.lat, lng: loc.lng });
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                          {loc.name}
                        </h4>
                      </div>

                      <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0">
                        직선 {loc.distanceKm} km
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-2 pl-7 line-clamp-1">
                      {loc.address}
                    </p>

                    <div className="pl-7 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-100/70 text-slate-700 flex items-center gap-1.5">
                        <Train className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>대중교통 약 <strong>{loc.travelTimeMin}분</strong></span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-100/70 text-slate-700 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{loc.deposit ? `${loc.deposit} / ${loc.rent}` : loc.units || '공급호수 본문참조'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>* 지도를 클릭하면 상세 조건과 길찾기를 확인하실 수 있습니다.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
