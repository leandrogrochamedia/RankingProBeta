// ============================================================
// PROOFLY — Imagens seed para demo
// URLs confiáveis: randomuser.me, pravatar.cc, picsum.photos
// (espelha migrations/018_demo_fotos_avaliacoes_completo.sql)
// ============================================================

(function(global) {
  'use strict';

  const PROFESSIONAL_PORTRAITS = [
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/men/44.jpg',
    'https://randomuser.me/api/portraits/men/52.jpg',
    'https://randomuser.me/api/portraits/men/65.jpg',
    'https://randomuser.me/api/portraits/men/71.jpg',
    'https://randomuser.me/api/portraits/men/83.jpg',
    'https://randomuser.me/api/portraits/women/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/women/52.jpg',
    'https://randomuser.me/api/portraits/women/65.jpg',
    'https://randomuser.me/api/portraits/women/71.jpg',
    'https://randomuser.me/api/portraits/women/83.jpg'
  ];

  function seedHash(str) {
    let h = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function pick(pool, seed, salt) {
    if (!pool.length) return '';
    return pool[seedHash(String(seed) + (salt || '')) % pool.length];
  }

  function professionalGallery(id, maxPhotos) {
    const limit = maxPhotos == null ? 4 : maxPhotos;
    const sid = String(id || '');
    const compact = sid.replace(/-/g, '');
    const photos = [
      pick(PROFESSIONAL_PORTRAITS, sid),
      `https://i.pravatar.cc/400?u=${encodeURIComponent(sid)}`,
      `https://i.pravatar.cc/400?u=${encodeURIComponent(sid)}-g2`,
      `https://picsum.photos/seed/proofly-prof-${compact}/640/800`
    ];
    const out = [];
    photos.forEach(u => { if (u && !out.includes(u)) out.push(u); });
    return out.slice(0, limit);
  }

  function establishmentGallery(id, maxPhotos) {
    const limit = maxPhotos == null ? 4 : maxPhotos;
    const compact = String(id || '').replace(/-/g, '');
    return [
      `https://picsum.photos/seed/proofly-est-${compact}-1/800/600`,
      `https://picsum.photos/seed/proofly-est-${compact}-2/800/600`,
      `https://picsum.photos/seed/proofly-est-${compact}-3/800/600`,
      `https://picsum.photos/seed/proofly-est-${compact}-4/800/600`
    ].slice(0, limit);
  }

  function forProfessional(id) {
    const gallery = professionalGallery(id, 4);
    return { avatar_url: gallery[0], gallery_urls: gallery };
  }

  function forEstablishment(id) {
    const gallery = establishmentGallery(id, 4);
    return { avatar_url: gallery[0], gallery_urls: gallery };
  }

  function inferEntityKind(item) {
    if (!item) return null;
    if (item.specialty != null && item.current_establishment_id !== undefined) return 'professional';
    if (item.specialty != null && !item.type) return 'professional';
    if (item.type && (item.infra_tags || item.vibe_tags || item.target_audience)) return 'establishment';
    if (item.type && !item.specialty) return 'establishment';
    return null;
  }

  function resolvePhotos(item) {
    if (!item?.id) return null;
    const kind = inferEntityKind(item);
    if (kind === 'professional') return forProfessional(item.id);
    if (kind === 'establishment') return forEstablishment(item.id);
    return null;
  }

  global.SeedImages = {
    PROFESSIONAL_PORTRAITS,
    professionalAvatar: id => professionalGallery(id, 4)[0],
    establishmentAvatar: id => establishmentGallery(id, 4)[0],
    professionalGallery,
    establishmentGallery,
    forProfessional,
    forEstablishment,
    inferEntityKind,
    resolvePhotos
  };
})(typeof window !== 'undefined' ? window : globalThis);