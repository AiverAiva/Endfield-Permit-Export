<template>
  <div
    class="statistics-page h-full flex flex-col bg-gray-50 text-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100"
  >
    <!-- Type Tabs -->
    <div class="flex-none px-6 pt-4 bg-white border-b border-gray-200">
      <div class="flex gap-6">
        <button
          v-for="poolType in poolTypes"
          :key="poolType.key"
          @click="activeType = poolType.key"
          class="pb-3 px-2 text-sm font-bold transition-all relative"
          :class="
            activeType === poolType.key
              ? 'text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          "
        >
          {{ poolType.name }}
          <div
            v-if="activeType === poolType.key"
            class="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"
          ></div>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto p-6 scroll-smooth">
      <!-- Empty State -->
      <div
        v-if="!rawDataMap || rawDataMap.size === 0"
        class="flex flex-col items-center justify-center text-gray-400 py-32"
      >
        <el-icon class="text-6xl mb-4 text-gray-300"><FolderDelete /></el-icon>
        <p class="text-lg font-medium">{{ i18n?.ui?.hint?.noData || 'No Data' }}</p>
        <p class="text-sm mt-1">{{ i18n?.ui?.hint?.noDataHint }}</p>
      </div>

      <div v-else class="space-y-6 max-w-6xl mx-auto">
        <!-- Summary Cards for Active Type -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Pulls -->
          <div
            class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            <div
              class="absolute top-0 left-0 w-1 h-full"
              :class="activeTypeConfig.color"
            ></div>
            <div
              class="text-gray-500 text-xs mb-1 uppercase tracking-wider font-semibold"
            >
              {{ i18n?.ui?.data?.total }}
            </div>
            <div
              class="text-3xl font-extrabold text-gray-900 font-mono tracking-tight"
            >
              {{ activeStats.total }}<span v-if="activeType === 'beginner'" class="text-xl text-gray-400">/40</span> <span class="text-sm font-medium text-gray-400">{{ i18n?.ui?.data?.times }}</span>
            </div>
          </div>

          <!-- Current Pity -->
          <div
            v-if="activeType !== 'urgent' && activeType !== 'beginner'"
            class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            <div
              class="absolute top-0 left-0 w-1 h-full"
              :class="activeTypeConfig.color"
            ></div>
            <div
              class="text-gray-500 text-xs mb-1 uppercase tracking-wider font-semibold"
            >
              {{ i18n?.ui?.data?.pity }}
            </div>
            <div
              class="text-3xl font-extrabold font-mono tracking-tight"
              :class="getPityColorText(activeStats.currentPity)"
            >
              {{ activeStats.currentPity
              }}<span class="text-sm font-medium text-gray-400 ml-1"
                >/{{ activeTypeConfig.maxPity }}</span
              >
            </div>
          </div>

          <!-- SSR Count -->
          <div
            class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            <div
              class="absolute top-0 left-0 w-1 h-full"
              :class="activeTypeConfig.color"
            ></div>
            <div
              class="text-gray-500 text-xs mb-1 uppercase tracking-wider font-semibold"
            >
              {{ i18n?.ui?.data?.star5 }}
            </div>
            <div
              class="text-3xl font-extrabold text-[#d97706] font-mono tracking-tight"
            >
              {{ activeStats.ssrCount }}
            </div>
            <div class="text-xs text-gray-400 mt-1 font-medium">
              {{ i18n?.ui?.data?.avgSSR }}: {{ activeStats.avgSSR }}
            </div>
          </div>

          <!-- UP Rate (Temporary commented out) -->
          <!-- 
          <div
            class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            ...
          </div>
          -->
        </div>

        <!-- Banner Cards List -->
        <div class="space-y-6">
          <div
            v-for="banner in bannerList"
            :key="banner.id"
            class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <!-- Banner Header -->
            <div
              class="relative bg-gray-50/50 px-6 py-4 flex justify-between items-center border-b border-gray-100 min-h-[80px]"
            >
              <!-- Background Image -->
              <div 
                v-if="getBannerImage(banner.id)"
                class="absolute inset-0 z-0 pointer-events-none"
              >
                <img 
                    :src="getBannerImage(banner.id)" 
                    class="w-full h-full object-cover object-right opacity-40"
                    style="-webkit-mask-image: linear-gradient(to right, transparent, black 40%); mask-image: linear-gradient(to right, transparent, black 40%);"
                />
              </div>

              <div class="relative z-10 flex-1 flex justify-between items-center">
                <div class="flex-1 min-w-0">
                <h3
                  class="text-lg font-bold text-gray-800 flex items-center gap-2"
                >
                  {{ banner.name }}
                  <span
                    v-if="banner.isCurrent"
                    class="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-200 uppercase tracking-wide"
                    >Current</span
                  >
                </h3>
                <!-- <div class="text-xs text-gray-500 mt-1 font-mono font-medium">
                  {{ formatDateRange(banner.startTime, banner.endTime) }}
                </div> -->
              </div>
              <div class="flex items-center gap-3">
                 <!-- Spark Status -->
                 <div class="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100" v-if="banner.sparkStatus">
                    <span class="text-[10px] uppercase font-bold text-purple-400">{{ activeType === 'weapon' ? 'Guarantee' : 'Spark' }} ({{ activeType === 'weapon' ? 80 : 120 }})</span>
                    <span class="text-xs font-bold font-mono text-gray-600">
                        {{ banner.sparkStatus.text }}
                    </span>
                 </div>

                 <div
                    class="bg-white/80 backdrop-blur-sm text-gray-600 text-sm px-4 py-1.5 rounded-full font-bold font-mono border border-gray-200 shadow-sm"
                 >
                    {{ banner.totalPulls }} {{ i18n?.ui?.data?.times }}
                 </div>
              </div>
              </div>
            </div>

            <!-- Banner Body -->
            <div class="p-6 space-y-6">
              <!-- Icon Summary Grid (Temporarily commented out) -->
              <!-- <div class="flex flex-wrap gap-3">
                <div
                  v-for="(item, idx) in banner.upItems"
                  :key="idx"
                  class="relative group cursor-default"
                >
                  <div
                    class="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-sm font-bold shadow-sm select-none overflow-hidden"
                    :class="{
                      'border-amber-400 bg-amber-50 text-amber-600': !item.isMajor,
                      'border-red-400 bg-red-50 text-red-600': item.isMajor,
                    }"
                    :title="item.name"
                  >
                    <img
                      v-if="getItemIcon(item.name)"
                      :src="getItemIcon(item.name)"
                      class="w-full h-full object-cover"
                      :alt="item.name"
                    />
                    <span v-else>{{ item.name[0] }}</span>
                  </div>
                  <div
                    v-if="item.isMajor"
                    class="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                  >
                    <div class="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                  <div
                    v-else
                    class="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                  ></div>
                </div>
              </div> -->

              <!-- Detailed Timeline -->
              <div class="space-y-4">
                <!-- Current Pity (Pulls since last SSR) -->
                <div v-if="banner.currentPity > 0" class="flex items-center gap-5 group/item opacity-80 italic">
                  <div class="relative shrink-0 flex items-center justify-center w-12 h-12">
                    <el-icon class="text-2xl text-gray-300"><Clock /></el-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between text-[10px] mb-1 px-0.5 text-gray-400 font-bold uppercase tracking-wider">
                      <span>{{ i18n?.ui?.data?.sum || 'Pity' }}</span>
                      <span>{{ banner.currentPity }}{{ i18n?.ui?.data?.times }} / {{ activeTypeConfig.maxPity }}</span>
                    </div>
                    <div class="relative h-1.5 bg-gray-100 rounded-full overflow-hidden w-full border border-gray-50 flex items-center">
                        <div 
                          class="h-full bg-gray-300" 
                          :style="{ width: getPityPercentage(banner.currentPity, activeTypeConfig.maxPity) + '%' }"
                        ></div>
                    </div>
                    <div class="mt-1.5 text-[11px] text-gray-500 font-medium">
                        {{ banner.currentPity }}{{ i18n?.ui?.data?.no5star || ' pulls without 6★' }}
                    </div>
                  </div>
                </div>

                <div
                  v-for="(record, rIdx) in banner.ssrRecords"
                  :key="rIdx"
                  class="flex items-center gap-5 group/item"
                >
                  <div class="relative shrink-0">
                    <div
                      class="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-lg font-bold shadow-sm text-gray-700 overflow-hidden"
                      :class="{ '': !record.isUpMajor && !record.isUpMinor }"
                    >
                       <!-- opacity-50 grayscale -->

                      <img
                        v-if="getItemIcon(record)"
                        :src="getItemIcon(record)"
                        class="w-full h-full object-cover"
                        :alt="i18n?.wpn?.[record.item_id] || i18n?.char?.[record.item_id] || record.name"
                      />
                      <span v-else>{{ (i18n?.wpn?.[record.item_id] || i18n?.char?.[record.item_id] || record.name)[0] }}</span>
                    </div>
                    <!-- Status Tags (Temporarily commented out) -->
                    <!-- <div
                      v-if="record.isUpMajor"
                      class="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-md shadow-sm font-bold border-2 border-white z-10"
                    >UP</div>
                    <div
                      v-else-if="record.isUpMinor"
                      class="absolute -top-2.5 -right-2.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-md shadow-sm font-bold border-2 border-white z-10"
                    >UP</div>
                    <div
                      v-else
                      class="absolute -top-2.5 -right-2.5 bg-gray-400 text-white text-[10px] px-1.5 py-0.5 rounded-md shadow-sm font-bold border-2 border-white z-10"
                    >{{ i18n?.ui?.data?.lost }}</div> -->
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between text-xs mb-1.5 px-0.5">
                      <span class="text-gray-700 font-bold">{{ i18n?.wpn?.[record.item_id] || i18n?.char?.[record.item_id] || record.name }}</span>
                      <span class="text-gray-400 font-mono text-[10px] mt-0.5">{{ formatDate(record.time) }}</span>
                    </div>
                    <div
                      class="relative h-8 bg-gray-100 rounded-lg overflow-hidden w-full flex items-center shadow-inner border border-gray-100"
                    >
                      <div
                        class="absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out"
                        :class="getBarColor(record)"
                        :style="{ width: getPityPercentage(record.displayPity, record.maxValue) + '%' }"
                      ></div>
                      <div class="relative z-10 w-full flex justify-between px-3 text-xs font-bold items-center">
                        <span :class="getPityPercentage(record.displayPity, record.maxValue) < 50 ? 'text-gray-800' : 'text-white drop-shadow-sm'">
                          {{ record.displayPity }}<span v-if="!record.isFree"> {{ i18n?.ui?.data?.times }}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="banner.ssrRecords.length === 0"
                class="text-center text-gray-400 text-sm py-4 border-t border-gray-100 border-dashed mt-2 italic"
              >
                {{ i18n?.ui?.data?.ssrNone }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, ref, computed, watch } from "vue";
import { FolderDelete, Clock } from "@element-plus/icons-vue";

const i18n = inject("i18n");
const gachaStateGlobal = inject("gachaState");
const rawDataMap = ref(new Map());
const activeType = ref("special");

const poolTypeEnumMap = {
  special: "E_CharacterGachaPoolType_Special",
  joint: "E_CharacterGachaPoolType_Joint",
  standard: "E_CharacterGachaPoolType_Standard",
  beginner: "E_CharacterGachaPoolType_Beginner",
  weapon: "E_WeaponGachaPoolType_Special",
  urgent: "E_UrgentGachaPoolType",
};

const handleGlobalData = (data) => {
    if (data && data.dataMap) {
       const userData = data.dataMap.get(data.current);
       if (userData && userData.result) {
         let rawResult = userData.result;
         if (!(rawResult instanceof Map)) {
             rawResult = new Map(Array.isArray(rawResult) ? rawResult : Object.entries(rawResult));
         }
         rawDataMap.value = rawResult;
       } else {
         rawDataMap.value = new Map();
       }
    }
};

watch(() => gachaStateGlobal.value, (newVal) => {
  if (newVal) handleGlobalData(newVal);
}, { immediate: true, deep: true });

const poolTypes = computed(() => {
  if (!i18n?.value?.gacha?.type) {
    return [
      { key: "special", name: "Chartered" },
      { key: "joint", name: "Special" },
      { key: "weapon", name: "Arsenal" },
      { key: "standard", name: "Basic" },
      { key: "beginner", name: "Beginner" },
      { key: "urgent", name: "Urgent" },
    ];
  }
  const types = i18n.value.gacha.type;
  return [
    { key: "special", name: types.special },
    { key: "joint", name: types.joint },
    { key: "weapon", name: types.weapon },
    { key: "standard", name: types.standard },
    { key: "beginner", name: types.beginner },
    { key: "urgent", name: types.urgent },
  ];
});

const activeTypeConfig = computed(() => {
  const configs = {
    special: { color: "bg-gradient-to-b from-red-500 to-orange-500", maxPity: 80 },
    joint: { color: "bg-gradient-to-b from-red-500 to-orange-500", maxPity: 80 },
    weapon: { color: "bg-gradient-to-b from-purple-500 to-indigo-500", maxPity: 40 },
    standard: { color: "bg-gradient-to-b from-blue-500 to-cyan-500", maxPity: 80 },
    beginner: { color: "bg-gradient-to-b from-emerald-500 to-teal-500", maxPity: 40 },
    urgent: { color: "bg-gradient-to-b from-gray-500 to-slate-500", maxPity: 1 },
  };
  return configs[activeType.value] || configs.special;
});

const activeRecords = computed(() => {
  const list = rawDataMap.value.get(activeType.value) || [];
  return [...list].sort((a, b) => Number(b.id) - Number(a.id));
});

const activeStats = computed(() => {
  const stats = { total: 0, ssrCount: 0, ssrLost: 0, upRate: 0, avgSSR: 0, currentPity: 0 };
  const records = [...activeRecords.value].sort((a, b) => Number(a.id) - Number(b.id));
  
  // Group by pool to calculate independent pity
  const poolPityMap = new Map();
  let totalSsrPulls = 0;
  let totalSsrCount = 0;

  records.forEach((r) => {
    const pid = r.gacha_id || r.poolId || 'unknown';
    if (!poolPityMap.has(pid)) poolPityMap.set(pid, 0);
    
    if (r.isFree) return;
    
    const currentPity = poolPityMap.get(pid) + 1;
    poolPityMap.set(pid, currentPity);

    if (r.rank_type === "6") {
      totalSsrCount++;
      totalSsrPulls += currentPity;
      poolPityMap.set(pid, 0);
    }
  });

  stats.total = records.length;
  stats.ssrCount = totalSsrCount;
  stats.avgSSR = totalSsrCount > 0 ? (totalSsrPulls / totalSsrCount).toFixed(1) : 0;
  
  // For the global "Current Pity" card, we show the pity of the LATEST active pool
  // (the one with the record having the highest ID)
  if (records.length > 0) {
    const latestRecord = records[records.length - 1];
    const latestPid = latestRecord.gacha_id || latestRecord.poolId || 'unknown';
    stats.currentPity = poolPityMap.get(latestPid) || 0;
  }
  
  return stats;
});

const bannerList = computed(() => {
  const records = activeRecords.value;
  if (!records.length) return [];
  
  const poolGroups = new Map();
  
  // Group by gacha_id (from records directly)
  records.forEach(r => {
    const pid = r.gacha_id || r.poolId || 'unknown';
    if (!poolGroups.has(pid)) {
      poolGroups.set(pid, []);
    }
    poolGroups.get(pid).push(r);
  });
  
  const banners = [];
  poolGroups.forEach((groupRecords, pid) => {
    const ascGroup = [...groupRecords].sort((a, b) => Number(a.id) - Number(b.id));
    const descGroup = [...groupRecords].sort((a, b) => Number(b.id) - Number(a.id));
    
    // In our adapted records, poolName and poolId are included
    const firstRecord = groupRecords[0];
    const poolName = firstRecord.poolName || pid;
    
    // Spark status: simple pull count for special and weapon pools
    let sparkStatus = null;
    if (activeType.value === 'special' || activeType.value === 'joint' || activeType.value === 'weapon') {
      const paidPulls = ascGroup.filter(r => !r.isFree).length;
      const target = activeType.value === 'weapon' ? 80 : 120;
      sparkStatus = {
        text: `${paidPulls} / ${target}`
      };
    }
    
    // Calculate pity WITHIN this specific pool
    let pityInPool = 0;
    const ssrDetails = [];
    
    ascGroup.forEach(r => {
      if (!r.isFree) pityInPool++;
      if (r.rank_type === "6") {
        ssrDetails.push({
          ...r,
          pity: r.isFree ? 0 : pityInPool,
          displayPity: r.isFree ? "FREE" : pityInPool,
          maxValue: activeTypeConfig.value.maxPity
        });
        pityInPool = 0;
      }
    });

    // Current Pity of this banner (pulls after last SSR)
    const currentPity = pityInPool;
    
    banners.push({
      id: pid,
      name: poolName,
      totalPulls: groupRecords.length,
      sparkStatus,
      currentPity,
      ssrRecords: ssrDetails.reverse(), // Show newest SSR first
      startTime: ascGroup[0].time,
      endTime: descGroup[0].time
    });
  });
  
  // Sort banners by latest record's ID (descending) to show newest pool first
  return banners.sort((a, b) => {
    const aLatestId = Math.max(...poolGroups.get(a.id).map(r => Number(r.id)));
    const bLatestId = Math.max(...poolGroups.get(b.id).map(r => Number(r.id)));
    return bLatestId - aLatestId;
  });
});



const formatDateRange = (s, e) => `${formatFullDate(s)} ~ ${formatFullDate(e)}`;
const formatFullDate = (str) => {
  const d = new Date(str);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
};
const formatDate = (str) => {
  const d = new Date(str);
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
};
const getPityPercentage = (val, max) => isNaN(val) ? 100 : Math.min((val / max) * 100, 100);
const getBarColor = (record) => {
  if (record.isFree) return "bg-gray-400";
  const val = record.pity;
  if (val <= 20) return "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]";
  if (val <= 40) return "bg-blue-400";
  if (val <= 60) return "bg-amber-400";
  return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
};
const getPityColorText = (pity) => {
  if (pity <= 20) return "text-emerald-600";
  if (pity <= 40) return "text-blue-600";
  if (pity <= 60) return "text-amber-600";
  return "text-red-600";
};

import { getCharacterIconUrl, getWeaponIconUrl, getBannerUrl } from '../config/assets.js';

const getItemIcon = (record) => {
  if (!record.item_id) return null;
  // Check if it's a character or weapon
  if (record.item_type === 'Character') {
    return getCharacterIconUrl(record.item_id);
  }
  if (record.item_type === 'Weapon' || record.item_id.startsWith('wpn_')) {
    return getWeaponIconUrl(record.item_id);
  }
  return null;
};

const getBannerImage = (poolId) => {
  return getBannerUrl(poolId);
};

const getCharacterFullImage = (charId) => {
  return getCharacterIconUrl(charId);
};
</script>

<style scoped>
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background-color: #d1d5db; }
</style>
