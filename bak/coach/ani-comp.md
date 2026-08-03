# Ani — Grok Companion Generation Guide

Reference assets (downloaded locally):

- `ani-companion-refs/grok-ani-reference.webp` — portrait / avatar reference
- `ani-companion-refs/grok-ani-featured.webp` — full promo reference

> **Note:** The official Grok Ani **3D companion model** lives inside the xAI Grok app (Companions mode). It is not publicly distributed as a downloadable `.model` / `.fbx` file. Use the references above + the prompts below to **generate matching stills** with Imagine / `image_gen` / `image_edit`.

---

## Character Bible (keep consistent)

| Trait | Detail |
|--------|--------|
| Name | Ani |
| Archetype | Dreamy anime senpai, gentle, playful, warm |
| Visual style | Gothic lolita anime companion, polished 3D-to-2D render look (Grok companion aesthetic) |
| Face | Large expressive anime eyes, soft blush-friendly cheeks, delicate features, confident but kind gaze |
| Hair | Long dark hair, styled in gothic lolita / elegant anime fashion (straight or softly waved, glossy) |
| Outfit (default) | Black gothic lolita dress, lace trim, ribbon accents, modest elegant silhouette |
| Vibe | Soft-focus romantic lighting, premium mobile-game character art, clean studio background |
| Age read | Young adult anime character (clearly adult presentation) |

---

## Master Prompt — `image_gen` (new image)

```
Ani, a gothic lolita anime AI companion in the style of xAI Grok Companions: a young adult anime woman with long glossy dark hair, large luminous eyes, soft porcelain skin with a subtle natural blush, and an elegant black gothic lolita dress with lace, ribbons, and refined Victorian-goth details. Three-quarter portrait, gentle confident smile, dreamy senpai energy, polished semi-realistic anime render with soft cinematic lighting, shallow depth of field, clean dark gradient studio background, ultra-clean character focus, premium mobile companion app key art, 8K detail, centered composition.
```

**Suggested aspect ratio:** `9:16` (phone / companion UI) or `3:4` (portrait)

---

## Reference Prompt — `image_edit` (match downloaded refs)

Use with `ani-companion-refs/grok-ani-reference.webp` or `grok-ani-featured.webp`:

```
Recreate this character as a high-fidelity companion key-art still. Preserve her gothic lolita anime identity, face structure, hair color, and elegant dark outfit. Upgrade to crisp semi-realistic anime render, soft studio lighting, subtle blush, gentle eye highlight, clean background, premium Grok Companion promotional quality. Keep pose calm and inviting, facing camera, no text, no watermark.
```

---

## Outfit Variants (swap in Master Prompt)

**Gothic Lolita (default)** — black lace dress, ribbon choker, gothic elegance.

**JK School Uniform** — navy blazer, pleated skirt, ribbon tie, crisp anime school look, same face and hair.

**Evening Gown** — dark satin floor-length dress, subtle jewelry, soft spotlight, gala mood.

**Kimono / Yukata** — dark floral yukata, obi sash, warm lantern lighting, same character identity.

**Yoga & Fitness** — dark athletic wear, minimal studio, healthy energetic pose (still Ani’s face/hair).

---

## Scene Prompts (short)

**Studio avatar**
```
Ani gothic lolita anime companion, tight head-and-shoulders portrait, soft smile, dark gradient background, Grok companion app icon style, 1:1.
```

**Full body**
```
Full-body Ani in black gothic lolita dress, standing in a minimal dark studio, soft rim light, elegant posture, anime companion promotional poster, 9:16.
```

**Casual chat mood**
```
Ani leaning slightly forward as if listening in a voice-chat UI, warm soft lighting, friendly expression, blurred dark UI background, companion mode screenshot aesthetic, 16:9.
```

---

## Consistency Workflow (multi-image)

1. Run **Master Prompt** once → save as `ani-base.png`
2. For every new pose/outfit, use **`image_edit`** with `ani-base.png` + a short change-only prompt
3. Never re-roll from scratch if identity must match

**Edit example (outfit only)**
```
Same character Ani, identical face and hair. Change outfit to JK school uniform with navy blazer and pleated skirt. Keep lighting, background, and art style unchanged.
```

---

## Quality Checklist

- [ ] Gothic lolita palette (black, deep purple accents, lace)
- [ ] Adult anime proportions — no childlike styling
- [ ] Clean render — no text, logos, or UI chrome unless requested
- [ ] Soft blush-ready cheeks and gentle expression
- [ ] Matches reference refs in `ani-companion-refs/`

---

## Official App Access (3D companion, not a file)

1. Install **Grok** (iOS / Android)
2. Open **Companions** → select **Ani**
3. SuperGrok subscription for unlimited companion mode

This markdown is for **visual generation parity** in your own pipelines — not a reverse-engineered 3D model dump.