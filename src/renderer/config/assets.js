// src/renderer/config/assets.js
// Static constants for external asset URLs

export const ASSETS_BASE_URL = 'https://endfield-permit-export.weikuwu.me/assets/';

export const getCharacterIconUrl = (charId) => {
  return `${ASSETS_BASE_URL}characters/${charId}.png`;
};

export const getWeaponIconUrl = (wpnId) => {
  return `${ASSETS_BASE_URL}weapons/${wpnId}.png`;
};

export const getBannerUrl = (bannerId) => {
  return `${ASSETS_BASE_URL}banners/${bannerId}.png`;
};