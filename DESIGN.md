# SheetDelta design contract

Operate mode. A reconciliation workstation for people comparing recurring tables during the working day. Concept seed 188bb332 assigned candidate 5. Code-led implementation is a session implementation choice under the authorization to build; no standing user preference is inferred.

Grounded directions considered: spreadsheet canvas; file-manager comparison; data-review inbox; report reader; reconciliation workstation; import wizard; command palette. The concept seed assigned candidate 5: reconciliation workstation. The working surface uses a quiet navigation rail, paired source slots, compact rules, and a wide row-level review area. Decorative annual/lexicon/instrument metaphors are declined because they reduce product clarity; their useful discipline is carried through precise column alignment, strong active states, and a single visible task sequence.

Palette: paper #ffffff; canvas #f4f7fa; ink #172b45; muted #607086; action #2359d1; line #dce4ee. Status colors are semantic green, amber, red. Manrope for Latin display/numbers, PingFang SC/Microsoft YaHei for Chinese prose, ui-monospace only for code and keys. No external font requests: Manrope is bundled.

Layout: navigation rail | file pair > matching rules > difference table. Responsive mobile replaces the rail with a compact header and stacks file inputs. Table scrolls inside its container, never the entire page. Signature interaction: a changed cell preserves its old value above the new one, so the reader sees both the delta and its context. Active filters are labeled and colored; color alone never carries meaning.

Keyboard-operable file pickers, visible focus, labeled fields, polite status messages, reduced-motion support. Controls are at least 36px desktop / 44px on narrow screens. One short result-entry transition; no decorative continuous animation.

## Verified final interface — 2026-09-09

An independent bounded review inspected the four final production-build captures in `.impeccable/review/`: desktop and mobile, each in empty and sample-results states. The reviewed mobile results surface explicitly tells users to swipe horizontally to see all fields. Its internal table region is focusable and has an accessible name in the implementation. Narrow-screen swap, remove, save, replace, result-filter, and pagination targets have final CSS dimensions of at least 44px, with no overlap visible in the captures. The desktop composition and old-value-above-new-value difference treatment are preserved.

Both findings from the initial visual review are resolved; see `docs/qa/visual-review.md`. This validation covers screenshots and source inspection, not a new real-device or keyboard interaction test.
