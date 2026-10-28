# Baseline editor control inventory

Extracted from the reference snapshot, including the protected user changes. Dynamic expressions are recorded as bindings, not executed. Repeated controls are listed once per source location; a collection control applies to every item. See feature-contract.md for interaction and persistence requirements.

## src/app/editor/about-content.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 106 | MediaImporter | (context label) |  |
| 124 | button | Show more | {() => setExpanded(true)} |
| 129 | Field | "Title" | {items[current].title} |
| 130 | Field | "Description" | {items[current].description} |
| 131 | Field | "Caption" | {items[current].caption \|\| ''} |
| 132 | MediaFramingControls | (context label) |  |
| 136 | input | {\`Replace ${tiles[current]?.name \|\| 'photo'}\`} |  |
| 139 | Field | "Alternative text" | {media?.alt \|\| ''} |
| 143 | Field | "Captions link (.vtt)" | {media.captions} |
| 144 | Field | "Caption language" | {media.captionLanguage} |
| 149 | Field | "Category" | {items[current].group \|\| ''} |
| 150 | Field | "All photos label" | {content.allPhotosLabel \|\| 'All photos'} |
| 155 | MediaVideoControls | (context label) |  |
| 168 | button | Undo | {() => undoRemoval(items, writeItems)} |
| 169 | button | "Dismiss" | {() => setRemoved(null)} |
| 172 | MediaPicker | "Choose from library" |  |
| 181 | MediaPicker | "Choose poster" |  |

## src/app/editor/account.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 165 | button | "button" | {() => requestPane(item.id)} |
| 172 | button | Close | {requestClose} |
| 176 | Field | "Your name" | {profileDraft.ownerName} |
| 180 | Field | "Business name" | {businessDraft.brand} |
| 181 | Field | "Website email" | {businessDraft.email} |
| 182 | Field | "Phone" | {businessDraft.phone} |
| 183 | Field | "Address" | {businessDraft.address} |
| 184 | Field | "Opening hours" | {businessDraft.hours} |
| 197 | button | Cancel | {cancel} |
| 198 | button | Save changes | {save} |

## src/app/editor/brand-settings.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 20 | button | "button" | {kit.fontPair === id} |
| 40 | button | Light | {site.theme === "paper"} |
| 41 | button | Dark | {site.theme !== "paper"} |
| 48 | input | "color" | {/^#[0-9a-f]{6}$/i.test(site.accent \|\| "") ? site.accent! : "#5878f5"} |
| 57 | button | "button" | {eyebrow === style} |
| 68 | button | "button" | {kit.radius === id} |
| 77 | button | "button" | {kit.lineWidth === id} |
| 86 | button | "button" | {headerLook(site.headerStyle) === id} |
| 94 | button | Columns | {site.footerStyle !== "minimal"} |
| 95 | button | Minimal | {site.footerStyle === "minimal"} |

## src/app/editor/components/fields.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 9 | textarea | (context label) | {value} |
| 9 | input | {type} | {value} |
| 12 | button | "button" | {value===o.value} |
| 16 | input | {label} | {value} |
| 20 | input | "number" | {value??''} |
| 26 | input | "color" | {value} |

## src/app/editor/content-browser.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 29 | button | Remove media | {onClear} |
| 33 | Field | {intro?'Small introduction':'Small label'} | {content.smallLabel} |
| 34 | Field | "Headline" | {content.title} |
| 35 | Field | "Subtext" | {content.description} |
| 37 | input | "Additional text" | {!!content.showBody} |
| 38 | Field | "Body text" | {content.body\|\|''} |
| 46 | IconPicker | "Button icon" | {button.icon} |
| 47 | input | (context label) | {button.label} |
| 95 | button | "button" | {()=>setPreview(v=>!v)} |
| 98 | button | Apply suggested colors | {()=>onApply({textColor:suggested.color,fillColor:suggested.backgroundColor\|\|undefined})} |
| 99 | button | Keep current colors | {()=>setPreview(false)} |
| 105 | button | "button" | {value===option.value} |
| 119 | Toggle | "Show secondary button" | {c.showSecondary!==false} |
| 123 | button | "button" | {selectedIndex === i} |
| 137 | button | Use website button colors | {()=>write(actualIndex,{textColor:undefined,fillColor:undefined})} |
| 140 | Destination | "When clicked" | {currentButton.href} |
| 159 | IconPicker | {\`Highlight icon ${index + 1}\`} | {icon} |
| 160 | input | {\`Highlight ${index + 1}\`} | {fact} |
| 161 | button | {\`Remove ${fact.trim() \|\| \`highlight ${index + 1}\`}\`} | {onRemove} |
| 168 | button | Add highlight | {onAdd} |
| 176 | input | {\`Value ${index + 1}\`} | {value} |
| 177 | input | {\`Description ${index + 1}\`} | {label} |
| 192 | input | "Score" | {score} |
| 193 | input | "Review count" | {count} |
| 281 | Field | "Link text" | {c.actionLabel\|\|''} |
| 281 | Field | "Side note" | {c.note} |
| 283 | Field | "Business name" | {site.brand} |
| 299 | Field | "Story button" | {c.note} |
| 299 | Field | "Story length" | {c.badge\|\|''} |
| 305 | input | "checkbox" | {!!c.rating&&c.showRating!==false} |
| 311 | Destination | "Review destination" | {rating.href} |
| 316 | input | {\`Promise ${i+1}\`} | {c.facts[i]\|\|''} |
| 319 | Field | {\`Photo number ${i+1}\`} | {stats[i]?.value\|\|''} |
| 319 | Field | {\`Photo label ${i+1}\`} | {stats[i]?.title\|\|''} |
| 320 | Field | {\`Avatar ${index+1}\`} | {avatar?.title\|\|''} |
| 320 | button | Remove photo | {()=>{const next=[0,1,2].map(i=>({...(avatars[i]\|\|{title:'',description:'',icon:'none' as const}),group:'avatar' as const,...(i===index?{media:undefined}:{})}));change({items:[.. |
| 321 | Field | "More people" | {buckets.more[0]?.value\|\|''} |
| 322 | Field | "Title" | {item.title} |
| 322 | Field | "Description" | {item.description} |
| 322 | IconPicker | {\`Icon, reason ${index+1}\`} | {item.icon} |
| 322 | button | Remove reason | {()=>{change({items:[...reasons.filter((_,i)=>i!==index),...stats,...avatars,...more]});onOpen(null);}} |
| 323 | Field | {i?'Text link':'Button text'} | {c.buttons[i]?.label\|\|''} |
| 323 | Destination | {i?'Text link destination':'Button link'} | {c.buttons[i]?.href\|\|''} |
| 324 | Field | "Our promise" | {c.promise\|\|''} |
| 325 | Field | "Before label" | {c.beforeLabel\|\|'Before'} |
| 325 | Field | "After label" | {c.afterLabel\|\|'After'} |
| 326 | Field | {\`Fact ${i+1}\`} | {c.facts[i]\|\|''} |
| 328 | Field | "Note under the form" | {c.note} |
| 328 | Field | "Form button text" | {c.formButton} |
| 328 | Field | "Consent sentence" | {c.consent} |
| 329 | Field | "Field label" | {field.label} |
| 329 | select | {\`Answer type, field ${index+1}\`} | {field.type} |
| 329 | Toggle | {\`Required, field ${index+1}\`} | {field.required} |
| 329 | button | Remove field | {()=>{change({fields:c.fields.filter((_,i)=>i!==index)});onOpen(null);}} |
| 330 | Field | "Price" | {c.price\|\|''} |
| 330 | Field | "Old price" | {c.oldPrice\|\|''} |
| 330 | Field | "End date" | {c.endDate\|\|''} |
| 330 | Field | "Badge" | {c.badge\|\|''} |
| 330 | Field | "Offer details" | {c.note} |
| 331 | Field | "Address" | {c.address\|\|''} |
| 331 | Field | "Phone" | {c.phone\|\|''} |
| 331 | Field | "Email" | {c.email\|\|''} |
| 331 | Field | "Opening hours" | {c.hours\|\|''} |
| 340 | Field | {type==='logos'\|\|type==='reviews'?'Name':type==='faq'?'Question':type==='trust'?'Label':'Title'} | {item.title} |
| 341 | Field | {type==='faq'?'Answer':type==='reviews'?'Quote':'Description'} | {item.description} |
| 342 | Field | "Price" | {item.price\|\|''} |
| 342 | select | {\`Opens which page? Service ${index+1}\`} | {item.pageId\|\|''} |
| 343 | Field | "Caption" | {item.caption\|\|''} |
| 343 | Field | "Group name" | {item.group\|\|''} |
| 344 | Field | "Short tag" | {item.tag\|\|''} |
| 345 | Field | "Value" | {item.value\|\|''} |
| 345 | Field | "Note" | {item.note\|\|''} |
| 346 | Field | "Service" | {item.tag\|\|''} |
| 346 | Field | "When" | {item.when\|\|''} |
| 346 | Field | "Source" | {item.source\|\|''} |
| 346 | Field | "Details" | {item.note\|\|''} |
| 346 | select | {\`Stars, review ${index+1}\`} | {item.stars\|\|''} |
| 347 | IconPicker | {type==='pains'?'Badge icon':\`Icon, item ${index+1}\`} | {item.icon} |
| 348 | button | Remove item media | {()=>itemChange(index,{media:undefined})} |
| 349 | button | Remove | {()=>removeItem(index)} |
| 354 | button | Header | {()=>onOpen(null)} |
| 355 | button | Introduction options | {()=>onOpen(null)} |
| 356 | button | "button" | {()=>onOpen('media')} |
| 356 | button | "button" | {event=>{onOpen(expanded?null:item.id);event.currentTarget.scrollIntoView({block:'nearest'});}} |
| 356 | button | Add | {add} |

## src/app/editor/fields.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 32 | input | "checkbox" | {checked} |
| 86 | button | "button" | {kind===item.id} |
| 87 | select | "Destination" | {linkChoice} |
| 88 | select | "Page on my website" | {selectedPage?.id\|\|''} |
| 90 | select | "Section on this page" | {selectedAnchor} |
| 91 | input | {inputLabel} | {incompatible ? value : destinationBody(value)} |
| 135 | button | {addIcon ? "Add icon" : \`${label}, ${current.label}\`} | {()=>setOpen(shown=>!shown)} |
| 148 | button | {choice.label} | {choice.id===value} |
| 193 | button | Edit this page | {() => onOpenPage?.(page.id)} |
| 199 | Field | "Call, email, or website" | {item.href \|\| ''} |
| 232 | Field | "Title" | {item.title} |
| 233 | Field | "Description" | {item.description} |
| 234 | Field | "Price" | {item.price \|\| ''} |
| 294 | Choice | "Media type" | {mediaKind} |
| 303 | IconPicker | "Icon" | {item.icon} |
| 306 | MediaImporter | (context label) |  |
| 327 | input | {\`Replace ${importerItems[0]?.name \|\| 'media'}\`} |  |
| 340 | MediaFramingControls | (context label) |  |
| 343 | Field | "Alternative text" | {media.alt \|\| ''} |
| 347 | Field | "Captions link (.vtt)" | {media.captions} |
| 348 | Field | "Caption language" | {media.captionLanguage} |
| 354 | MediaVideoControls | (context label) |  |
| 387 | button | "button" | {onClone} |
| 390 | button | "button" | {onToggleHidden} |
| 395 | button | "button" | {onRemove} |
| 506 | button | "button" | {active} |
| 512 | button | {\`Actions for ${label}\`} | {() => setMenu(menu === index ? null : index)} |
| 530 | button | Show more | {() => setExpanded(true)} |
| 531 | button | Add service | {addService} |
| 537 | button | Details | {() => setPanel('details')} |
| 538 | button | Media | {() => setPanel('media')} |
| 574 | button | Undo | {onUndoRemoval} |
| 575 | button | "Dismiss" | {onDismissRemoval} |
| 578 | MediaPicker | "Choose from library" |  |
| 585 | MediaPicker | "Choose poster" |  |

## src/app/editor/footer-appearance.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 23 | button | "button" | {value === next} |
| 30 | UnitField | {label} | {value} |
| 36 | button | "button" | {config.layout === layout.id} |
| 48 | UnitField | {\`Column ${i + 1} width\`} | {Math.round(width)} |
| 55 | Choice | "Text to style" | {target} |
| 58 | Choice | "Font" | {text.family \|\| 'text'} |
| 70 | select | (context label) | {text.weight \|\| (target === 'heading' ? 600 : 400)} |
| 92 | button | "button" | {(text.transform \|\| 'none') === item.value} |
| 100 | ColorField | "Text color" | {text.color \|\| (site.theme === 'midnight' ? '#f0f3fa' : '#252938')} |
| 101 | button | Use theme color | {() => textWrite({color: undefined})} |
| 102 | Choice | "Appearance" | {config.hover} |
| 106 | Choice | "Hover corners" | {config.hoverShape} |

## src/app/editor/footer-details.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 9 | Choice | "Business" | {config.online ? 'online' : 'physical'} |
| 16 | input | "checkbox" | {!day.closed} |
| 20 | input | {\`${day.day} ${key === 'open' ? 'opens' : 'closes'}\`} | {day[key]} |
| 42 | button | "button" | {() => {setSocialDraft(item); setNotice('');}} |
| 44 | button | {\`Remove ${item.label}\`} | {() => remove('socials', item.id)} |
| 49 | button | Add social link | {() => {setSocialDraft({label: '', href: ''}); setNotice('');}} |
| 60 | Field | "Platform or name" | {draft.label} |
| 61 | Field | "Account URL" | {draft.href} |
| 62 | button | Save link | {save} |
| 62 | button | Cancel | {cancel} |
| 70 | Field | "Display name" | {item.label} |
| 74 | button | Change destination | {() => editDestination(item, i)} |
| 77 | button | Remove link | {() => change( { links: currentColumn.links.filter((_, j) => i !== j), })} |

## src/app/editor/footer-editor.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 144 | button | "button" | {() => setScreen(next)} |
| 169 | button | Footer | {back} |
| 173 | Choice | "Choose from" | {source} |
| 180 | button | "button" | {() => setDraft({ ...choice, id: editingLinkId \|\| crypto.randomUUID(), customLabel: true, })} |
| 185 | button | Enter web address | {() => setDraft({id: editingLinkId \|\| crypto.randomUUID(), label: '', href: ''})} |
| 192 | Field | "Display name" | {draft.label} |
| 194 | Field | "Web address" | {draft.href} |
| 197 | button | Save link | {() => { if (source === 'url' && !safeSocialUrl(draft.href)) { setNotice('Enter a complete http:// or https:// web address.'); return; } saveLink(); }} |
| 202 | button | Cancel | {() => setDraft(null)} |
| 210 | button | Add column | {() => write({}, [...columns, {title: 'New column', text: '', links: []}])} |
| 213 | Field | "Your text" | {block.content.note} |
| 218 | button | "button" | {() => { setPicker('bottom'); setDraft(item); setEditingLinkId(item.id); setSource(item.pageId ? 'pages' : item.href.startsWith('#') ? 'sections' : 'url'); }} |
| 222 | button | {\`Remove ${item.label}\`} | {() => remove('bottomLinks', item.id)} |
| 226 | button | Add bottom link | {() => addLink('bottom')} |
| 231 | Choice | "Footer logo" | {config.logoMode} |
| 239 | MediaUpload | (context label) |  |
| 248 | Field | "Logo description" | {config.logo.alt} |
| 251 | Field | "Motto" | {config.motto} |
| 253 | Choice | "Order" | {config.order} |
| 256 | UnitField | "Space between items (px)" | {config.itemGap} |
| 257 | input | "checkbox" | {config.showMotto} |
| 260 | input | "checkbox" | {config.showSocials} |
| 268 | Field | "Column title" | {currentColumn.title} |
| 270 | Choice | "Column content" | {currentColumn.kind \|\| 'text'} |
| 276 | Field | "Column text" | {activeColumn === 0 ? config.motto : currentColumn.text} |
| 287 | button | Add link | {() => addLink(activeColumn)} |
| 292 | button | Undo removal | {() => { const items = [...config[removed.key]]; if (!items.some(item => item.id === removed.item.id)) { items.splice(Math.min(removed.index, items.length), 0, removed.item); write |
| 300 | MediaPicker | "Choose Footer logo" |  |

## src/app/editor/hero-media.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 159 | button | "button" | {mode===value} |
| 160 | input | "Muted" | {media.muted} |
| 161 | MediaImporter | (context label) |  |
| 162 | input | "Replace selected file" |  |
| 182 | Field | "Label on image (optional)" | {content.indexLabel \|\| ""} |
| 183 | Field | "Description" | {media.alt} |
| 187 | input | "Play slideshow" | {!!content.slideAutoplay} |
| 188 | input | "Loop slideshow" | {content.slideLoop!==false} |
| 189 | input | "Time per image" | {content.slideSeconds ?? 5} |
| 191 | Field | "Caption" | {content.note \|\| ''} |
| 193 | MediaFramingControls | (context label) |  |
| 196 | button | "button" | {shade === mode} |
| 198 | input | "Overlay color" | {color} |
| 199 | RangeControl | "Darkness" | {content.darkness ?? 36} |
| 200 | RangeControl | "Coverage" | {Math.round(content.fadeWidth ?? 45)} |
| 202 | button | Improve text readability | {() => onChange({fade: false, darkness: 64})} |
| 205 | MediaVideoControls | (context label) |  |
| 215 | input | "Play slideshow" | {!!content.slideAutoplay} |
| 216 | input | "Image duration" | {content.slideSeconds ?? 5} |
| 217 | button | After timer | {(content.slideAdvance ?? "time") === "time"} |
| 217 | button | At clip end | {content.slideAdvance === "end"} |
| 218 | input | "Transition fade" | {content.slideFade ?? 0} |
| 222 | Field | "Alternative text" | {media.alt} |
| 222 | Field | "Media title" | {media.title} |
| 222 | Field | "Media description" | {media.description} |
| 222 | Field | "Captions link (.vtt)" | {media.captions} |
| 222 | Field | "Caption language" | {media.captionLanguage} |
| 224 | button | Undo | {undo} |
| 224 | button | "Dismiss" | {() => setRemoved(null)} |
| 225 | MediaPicker | "Choose section media" |  |
| 226 | MediaPicker | "Choose poster" |  |

## src/app/editor/inspector.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 9 | button | {\`${n} ${legend==='Steps'?'step':'column'}${n===1?'':'s'}\`} | {count===n} |
| 10 | input | {\`Column ${i+1} width percent\`} | {Math.round(n*10)/10} |
| 12 | UnitField | "Space between columns (px)" | {s.gap!} |
| 13 | UnitField | "Top and bottom space (px)" | {s.padding??72} |
| 33 | input | "Text color picker" | {color\|\|'#202532'} |
| 35 | button | "Reset color" | {()=>change(undefined)} |
| 41 | input | "Text color picker" | {color\|\|'#f3f6fc'} |
| 41 | input | "Text color hex" | {draft} |
| 48 | button | "button" | {target===item} |
| 50 | select | "Text to style" | {target} |
| 53 | select | (context label) | {t.family\|\|''} |
| 55 | UnitField | "Size" | {t.size} |
| 56 | select | (context label) | {t.weight\|\|''} |
| 59 | button | {String(label)} | {(!t.align && !align) \|\| t.align === align} |
| 61 | select | (context label) | {t.align\|\|''} |
| 64 | UnitField | "Line height" | {t.lineHeight} |
| 65 | UnitField | "Letter spacing" | {t.tracking} |
| 67 | ColorField | (context label) |  |
| 69 | button | Reset style | {()=>change({...value,[target]:undefined})} |
| 75 | input | {label} | {value??''} |

## src/app/editor/inspectors/about.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 31 | LayoutPicker | "Section layout" | {block.layout} |
| 39 | Choice | "Featured photos" | {String(featured)} |
| 62 | Choice | "Rows" | {String(gridRows)} |
| 73 | Choice | "Gallery width" | {width} |
| 84 | Choice | "Movement" | {motion} |
| 97 | input | "Speed" | {speed} |
| 102 | input | "checkbox" | {pauseHover} |
| 121 | input | "Image scale" | {value} |

## src/app/editor/inspectors/default.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 79 | Choice | "Menu look" | {site.headerStyle} |
| 80 | Choice | "Stays on screen" | {site.headerSticky ? 'yes' : 'no'} |
| 81 | Choice | "Photo behind the menu" | {site.headerOverlay ? 'yes' : 'no'} |
| 82 | Choice | "Menu background" | {site.headerBackground !== false ? 'yes' : 'no'} |
| 83 | Choice | "Extra buttons" | {String(headerButtonCount)} |
| 84 | Choice | "Where those buttons sit" | {site.headerButtonPlace \|\| 'inside'} |
| 86 | button | "button" | {activeHeaderIdx === i} |
| 91 | Destination | "When clicked" | {currentHeaderButton.href} |
| 99 | button | Reset section layout | {() => changeSettings({columns: singleLayout ? 1 : ['proof', 'contact', 'quote', 'closing'].includes(block.type) ? 2 : defaultColumns(block.type)})} |
| 104 | Choice | "Layout" | {reviewLayout(block.layout)} |
| 105 | Choice | "Review text" | {block.content.reviewText === 'full' ? 'full' : 'excerpt'} |
| 106 | Choice | "Avatars" | {block.content.avatar \|\| 'circle'} |
| 107 | Choice | "Names" | {block.content.namePrivacy ? 'initials' : 'full'} |
| 108 | Choice | "Card surface" | {block.content.cardFace === 'plain' ? 'plain' : 'filled'} |
| 109 | Choice | "Card padding" | {block.content.cardPad === 'compact' ? 'compact' : 'comfortable'} |
| 110 | input | "checkbox" | {block.content.showRating !== false} |
| 111 | input | "checkbox" | {block.content.showDate !== false} |
| 112 | input | "checkbox" | {block.content.showService !== false} |
| 113 | input | "checkbox" | {block.content.showSource !== false} |
| 116 | select | "Section layout" | {block.layout} |
| 118 | Choice | "Background" | {block.content.showMedia === false ? 'none' : (block.content.showMedia \|\| media.src) ? 'photo' : 'none'} |
| 119 | Choice | "Photo side" | {block.content.photoSide === 'left' ? 'left' : 'right'} |
| 122 | Choice | "Fit" | {media.fit === 'contain' ? 'contain' : 'cover'} |
| 123 | RangeControl | "Image position, horizontal" | {media.x ?? 50} |
| 124 | RangeControl | "Image position, vertical" | {media.y ?? 50} |
| 125 | input | "Section color" | {/^#[0-9a-f]{6}$/i.test(block.content.background \|\| '') ? block.content.background! : '#141922'} |
| 126 | Choice | "Fade" | {block.content.fade === false ? 'off' : 'on'} |
| 127 | Choice | "Direction" | {block.content.fadeDirection === 'rtl' ? 'rtl' : 'ltr'} |
| 128 | RangeControl | "Fade width" | {Math.round(block.content.fadeWidth ?? 35)} |
| 129 | RangeControl | "Fade strength" | {Math.round(block.content.fadeStrength ?? 100)} |
| 130 | RangeControl | "Gradient" | {block.content.darkness ?? 64} |

## src/app/editor/inspectors/hero.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 23 | HeroLayouts | (context label) |  |
| 24 | Choice | "Height" | {block.content.height \|\| 'standard'} |
| 33 | Choice | "Text alignment" | {block.content.align \|\| 'left'} |
| 43 | Choice | "Business details" | {block.content.showBusiness ? 'bottom' : 'off'} |
| 53 | RangeControl | "Image darkness" | {block.content.darkness ?? 36} |

## src/app/editor/inspectors/logos.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 15 | LayoutPicker | "Section layout" | {block.layout} |
| 23 | Choice | "Heading" | {block.content.showHeading === false ? 'hide' : 'show'} |
| 35 | Choice | "Movement" | {block.content.logoMotion === 'still' ? 'still' : 'loop'} |
| 47 | input | "checkbox" | {block.content.logoPauseHover !== false} |

## src/app/editor/inspectors/proof.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 21 | LayoutPicker | "Section layout" | {block.layout} |
| 37 | button | Stacked | {s.columns === 1} |
| 45 | button | Side by side | {s.columns === 2} |
| 66 | button | "button" | {isMoreText} |
| 75 | button | "button" | {isEqual} |
| 84 | button | "button" | {isMoreMedia} |
| 109 | input | "Column 1 width percent" | {Math.round(s.widths![0] * 10) / 10} |
| 131 | input | "Column 2 width percent" | {Math.round(s.widths![1] * 10) / 10} |
| 161 | Choice | "Buttons" | {String(block.content.buttonCount ?? 2)} |
| 171 | Choice | "Intro alignment" | {block.content.headAlign \|\| 'center'} |
| 181 | Choice | "Media side" | {block.content.photoSide \|\| 'left'} |
| 192 | button | Reset layout | {onResetLayout} |

## src/app/editor/inspectors/services.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 18 | LayoutPicker | "Section layout" | {block.layout} |
| 26 | Choice | "Desktop columns" | {String(columns) as '2' \| '3' \| '4'} |

## src/app/editor/layout-picker.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 32 | input | "radio" | {option.value} |

## src/app/editor/logos-content.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 91 | MediaImporter | (context label) |  |
| 112 | Field | "Logo name" | {item.title} |
| 116 | input | {\`Replace ${tiles[current]?.name \|\| 'logo'}\`} |  |
| 120 | Destination | "Destination" | {item.href \|\| ''} |
| 121 | Field | "Accessible name" | {item.media?.alt \|\| ''} |
| 129 | button | Undo | {() => undoRemoval(items, change)} |
| 130 | button | "Dismiss" | {() => setRemoved(null)} |
| 133 | MediaPicker | "Choose from library" |  |

## src/app/editor/main-image-journey.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 121 | button | Keep editing | {() => setLeaveTarget(null)} |
| 122 | button | Discard changes and continue | {() => {const target = leaveTarget; setLeaveTarget(null); setDraft(null); allowLeave.current = true; target.click();}} |
| 124 | button | "button" | {back} |
| 129 | button | "button" | {target===role} |
| 139 | button | {\`Edit image ${i + 1}\`} | {i === selected} |
| 144 | button | "button" | {() => open('choose')} |
| 148 | button | "button" | {() => open('adjust')} |
| 150 | button | "button" | {() => open('describe')} |
| 152 | button | "button" | {() => open('advanced')} |
| 157 | button | Change | {()=>{setDraft(media?{...media}:null);setError('');}} |
| 157 | MediaUpload | (context label) |  |
| 159 | button | "button" | {apply} |
| 164 | MediaFramingControls | (context label) |  |
| 165 | button | Save image changes | {apply} |
| 169 | Field | "Image description" | {draft.alt} |
| 170 | button | Save description | {apply} |
| 174 | MediaPicker | "Choose your main image" |  |

## src/app/editor/media-controls.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 10 | select | "Shape" | {media.ratio} |
| 11 | select | "Display" | {media.fit} |
| 13 | RangeControl | "Zoom" | {media.zoom} |
| 14 | RangeControl | "Horizontal position" | {media.x} |
| 15 | RangeControl | "Vertical position" | {media.y} |
| 16 | button | Reset framing | {() => onChange({zoom: 1, x: 50, y: 50})} |
| 25 | input | "checkbox" | {media.muted} |
| 26 | input | "checkbox" | {media.playback === 'loop'} |
| 27 | input | "checkbox" | {media.autoplay} |
| 29 | button | Choose poster | {onChoosePoster} |
| 30 | select | "Mobile fallback" | {media.mobile} |

## src/app/editor/media-importer.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 24 | MediaUpload | {(accept.includes("video")\|\|accept.includes(".mp4"))?"Add images or videos":"Add images"} |  |
| 54 | button | {\`Select ${index + 1}. ${item.name}\`} | {index === selected} |
| 57 | button | {\`Remove ${item.name} from this ${owner.toLowerCase()}\`} | {event => { event.stopPropagation(); onRemove(index); }} |
| 70 | button | "Move earlier" | {() => onReorder(selected, selected - 1)} |
| 71 | button | "Move later" | {() => onReorder(selected, selected + 1)} |

## src/app/editor/media-upload.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 21 | input | {uploadLabel===label?label:\`${uploadLabel}: ${label}\`} |  |
| 26 | button | "button" | {()=>setLinking(v=>!v)} |
| 27 | button | "Your uploads · Choose from library" | {onLibrary} |
| 32 | button | "Close file link" | {()=>setLinking(false)} |
| 33 | input | "Image or video link" | {link} |
| 35 | button | Preview this file |  |

## src/app/editor/menu-editor.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 17 | select | {\`Menu assigned to ${place === 'header' ? 'Header' : 'Footer'}\`} | {placement[place] \|\| ''} |
| 74 | button | "button" | {onClick} |
| 75 | button | {\`Actions for ${label}\`} | {e=>openActions(e.currentTarget,id,kind)} |
| 81 | button | Rename | {()=>{nameFocus.current=true;setActiveId(menu.id);close(false);}} |
| 82 | button | Duplicate | {()=>{save([...menus,duplicateMenu(menu,()=>crypto.randomUUID())]);setNotice('Menu duplicated.');close();}} |
| 83 | button | Delete menu | {()=>{const next=menus.filter(value=>value.id!==menu.id);save(next,{header:placement.header===menu.id?next[0]?.id:placement.header,footer:placement.footer===menu.id?next[0]?.id:pla |
| 85 | button | Edit link | {()=>{setEditing({menuId:active.id,item});close(false);}} |
| 86 | button | "button" | {()=>{changeMenu(active.id,menu=>({...menu,items:menu.items.filter(value=>value.id!==item.id&&value.parentId!==item.id)}));setNotice('Link and its sublinks deleted. Undo is availab |
| 95 | input | (context label) | {value.text} |
| 96 | select | (context label) | {value.linkTo} |
| 97 | select | (context label) | {value.pageId\|\|pages.find(page=>\`/${page.slug}\`===value.destination)?.id\|\|''} |
| 97 | select | (context label) | {value.destination} |
| 97 | input | "url" | {value.destination} |
| 98 | select | (context label) | {value.parentId\|\|''} |
| 99 | select | (context label) | "" |
| 100 | button | Add link | {()=>{if(!value.parentId&&placement.header===owner.id&&owner.items.filter(item=>!item.parentId).length>=5){setNotice('This header supports 5 main links. Choose a parent under Show  |
| 104 | input | (context label) | {name} |
| 104 | button | Add menu | {()=>{const menu:NamedMenu={id:crypto.randomUUID(),name:name.trim(),items:[]};save([...menus,menu]);setActiveId(menu.id);setCreating(false);}} |
| 106 | input | "Menu name" | {active.name} |
| 110 | button | {\`Edit ${item.text\|\|'Untitled link'}\`} | {()=>{if(!suppressClick.current)setEditing({menuId:active.id,item});}} |
| 120 | button | Add link | {()=>setEditing({menuId:active.id,isNew:true,item:{id:crypto.randomUUID(),text:'',linkTo:'page',destination:\`/${pages[0]?.slug\|\|'home'}\`,pageId:pages[0]?.id,parentId:null,icon: |
| 126 | button | "button" | {()=>{setActiveId(menu.id);setNotice('');}} |
| 128 | button | Add menu | {()=>{setName('');setCreating(true);}} |

## src/app/editor/navigation.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 19 | button | "button" | {site.layout===l.id} |
| 37 | button | {\`Actions for ${name}, section ${index+1}\`} | {()=>setOpen(v=>!v)} |
| 43 | button | "button" | {()=>apply('visibility')} |
| 44 | button | "button" | {()=>{setOpen(false);onAdd(block.id);}} |
| 45 | button | "button" | {()=>apply('duplicate')} |
| 46 | button | "button" | {()=>apply('delete')} |
| 70 | button | Page | {()=>setTab('page')} |
| 71 | button | Navigation | {()=>setTab('navigation')} |
| 72 | button | SEO | {()=>setTab('seo')} |
| 75 | input | (context label) | {current.name} |
| 78 | input | "Page address slug" | {slugValue} |
| 84 | button | Edit service | {onEditService} |
| 87 | button | "button" | {()=>setCrumbsOpen(v=>!v)} |
| 90 | button | "button" | {showCrumbs} |
| 99 | select | "Current page placement" | {location.where} |
| 100 | select | "Current parent menu button" | {location.parent} |
| 104 | input | (context label) | {site.seoTitle} |
| 105 | textarea | (context label) | {site.seoDescription} |
| 113 | select | "What kind of page?" | {kind} |
| 114 | input | (context label) | {name} |
| 115 | select | (context label) | {where} |
| 116 | select | (context label) | {Math.min(parent,site.nav.length-1)} |
| 118 | input | (context label) | {title??(name?\`${name} \| ${site.brand}\`:'')} |
| 119 | textarea | (context label) | {description} |
| 120 | button | Create page |  |
| 126 | select | "Section to add" | {addType} |
| 126 | button | Add to page | {()=>onAdd(addType)} |

## src/app/editor/preview-frame.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 144 | button | "button" | {region === item} |

## src/app/editor/refined-style-shell.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 25 | button | "button" | {event => { setOpen(open === id ? '' : id); event.currentTarget.scrollIntoView({block: 'nearest'}); }} |

## src/app/editor/section-editor.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 78 | button | Reset spacing | {() => changeSettings({...block.settings, gap: undefined, padding: undefined})} |
| 81 | UnitField | "Logo height" | {block.content.logoScale ?? 70} |
| 84 | input | "checkbox" | {!!block.content.monochrome} |
| 88 | RangeControl | "Gradient" | {block.content.darkness ?? 64} |
| 89 | Choice | "Arrow" | {block.content.arrowCircle === false ? 'plain' : 'circle'} |

## src/app/editor/shell.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 29 | button | {\`Actions for ${pageName}\`} | {e=>{e.stopPropagation();setOpen(v=>!v)}} |
| 35 | button | Page settings | {()=>{setOpen(false);onSettings(pageId);}} |
| 36 | button | Reset page | {()=>{setOpen(false);onReset();}} |
| 55 | button | {page.name} | {page.id===pageId} |
| 64 | button | Show more | {onExpand} |
| 71 | button | "Page settings" | {()=>setOpen(v=>!v)} |
| 77 | button | Page settings | {()=>{setOpen(false);onOpen();}} |
| 78 | button | Reset page | {()=>{setOpen(false);onReset();}} |
| 104 | button | "button" | {mobilePreview} |
| 110 | button | Pages | {()=>setLocation('pages')} |
| 111 | button | Sections | {()=>setLocation('sections')} |
| 113 | button | {\`Current page: ${pageName}. Switch page\`} | {()=>setLocation(location==='pages'?'sections':'pages')} |
| 121 | button | "Create page" | {()=>setLocation('create-page')} |
| 124 | button | All sections | {()=>setLocation('sections')} |
| 132 | button | {\`${sections.find(section=>section.id===sectionId)?.hidden?'Show':'Hide'} ${sectionName}\`} | {()=>onToggleHidden(sectionId)} |
| 137 | button | Content | {()=>setView('Content')} |
| 138 | button | Style | {()=>setView('Appearance')} |
| 142 | button | All sections | {()=>setLocation('sections')} |
| 150 | button | All sections | {()=>setLocation('sections')} |
| 160 | input | "Find a page" | {pageQuery} |
| 166 | button | Create page | {()=>setLocation('create-page')} |
| 167 | button | Page settings | {onPageSettings} |
| 172 | input | "Find a section" | {query} |
| 178 | button | {\`${section.name}${section.hidden?', hidden':''}${section.shared?', shared':''}\`} | {section.id===sectionId} |
| 185 | button | {\`${section.hidden?'Show':'Hide'} ${section.name}\`} | {()=>onToggleHidden(section.id)} |
| 190 | button | Add section | {onAddSection} |
| 199 | button | "button" | {onLibrary} |
| 200 | button | "button" | {onBusiness} |

## src/app/media/library-board.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 67 | input | "search" | {query} |
| 74 | button | "button" | {filter === id} |
| 77 | MediaUpload | (context label) |  |
| 103 | button | Open use | {() => onJump(first)} |
| 105 | button | Delete | {() => void remove(asset)} |

## src/app/media/library.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 38 | button | "Previous slide" |  |
| 38 | button | "Next slide" |  |
| 38 | button | Pause slideshow | "false" |
| 59 | button | Load | {e=>{e.stopPropagation();setAllowed(true);}} |
| 63 | button | {ended&&plan.playback==='restart'?'Play video again':playing&&plan.clickToPlay?'Pause video':'Play video'} | {playing} |
| 83 | button | Close | {onClose} |
| 85 | input | "search" | {query} |
| 86 | MediaUpload | {imagesOnly?'Add images':'Add images or videos'} |  |
| 88 | button | "button" | {()=>onSelect(\`media:${asset.id}\`,asset.kind==='video'?'video':'image')} |
| 89 | button | Manage library | {()=>{onClose();openManage();}} |
| 96 | input | (context label) | {m[key]} |
| 104 | MediaUpload | (context label) |  |
| 105 | MediaPicker | "Choose section media" |  |
| 108 | input | "search" | {search} |
| 109 | button | "button" | {()=>a.kind==='captions'?update({captions:\`media:${a.id}\`}):update({src:\`media:${a.id}\`,kind:a.kind,title:m.title\|\|a.name,uploadDate:a.created})} |
| 109 | button | Use as video cover | {()=>update({poster:\`media:${a.id}\`})} |
| 109 | button | Delete | {async()=>{if(!window.confirm('Delete this unused file from this browser? This cannot be undone.'))return;setBusy(true);try{await assetStore('delete',a.id);await reload();setNotice |
| 110 | button | Manage library | {openManage} |
| 114 | select | (context label) | {m.kind} |
| 120 | input | "range" | {m[key]} |
| 121 | button | Reset framing | {()=>update({zoom:1,x:50,y:50})} |
| 122 | select | (context label) | {m.ratio} |
| 123 | select | (context label) | {m.fit} |
| 126 | input | "checkbox" | {m.muted} |
| 126 | input | "checkbox" | {m.autoplay} |
| 126 | select | "Playback mode" | {m.playback} |
| 126 | input | "checkbox" | {m.controls} |
| 126 | input | "checkbox" | {m.clickToPlay} |
| 127 | input | "checkbox" | {m[key]} |
| 129 | select | (context label) | {m.mobile} |
| 131 | input | "file" |  |

## src/app/page.tsx

| Baseline line | Control | Label | Binding/action |
| ---: | --- | --- | --- |
| 215 | button | Fit | {()=>chooseZoom("fit")} |
| 216 | button | % | {()=>chooseZoom(value)} |
| 227 | button | "Desktop preview" | {()=>setDevice("desktop")} |
| 228 | button | "Tablet preview" | {()=>setDevice("tablet")} |
| 229 | button | "Mobile preview" | {()=>setDevice("mobile")} |
| 231 | input | "Preview width" | {previewWidth} |
| 233 | button | "button" | {()=>setMenu(current=>current==="zoom"?"":"zoom")} |
| 238 | button | "Undo" | {()=>{setHeroFocus(null);setDirty(true);dispatch({type:"undo"});}} |
| 239 | button | "Redo" | {()=>{setHeroFocus(null);setDirty(true);dispatch({type:"redo"});}} |
| 240 | button | {darkTheme?"Switch to light website theme":"Switch to dark website theme"} | {darkTheme} |
| 241 | button | "button" | {openPreview} |
| 243 | button | "button" | {()=>setMenu(current=>current==="export"?"":"export")} |
| 244 | button | HTML website (.zip) | {()=>void exportPackage("html")} |
| 244 | button | WordPress website theme (.zip) | {()=>void exportPackage("wordpress")} |
| 244 | button | All pages (.json) | {()=>{setMenu("");exportConfig();}} |
| 247 | button | "Settings" | {()=>openSettings('business')} |
| 250 | button | "More" | {()=>setMenu(current=>current==="more"?"":"more")} |
| 252 | button | "button" | {()=>{update({theme:darkTheme?"paper":"midnight"});setMenu("");}} |
| 253 | button | Live preview | {()=>{setMenu("");openPreview();}} |
| 254 | button | HTML website (.zip) | {()=>{setMenu("");void exportPackage("html");}} |
| 255 | button | WordPress website theme (.zip) | {()=>{setMenu("");void exportPackage("wordpress");}} |
| 256 | button | All pages (.json) | {()=>{setMenu("");exportConfig();}} |
| 257 | button | Settings | {()=>{setMenu("");openSettings('business');}} |
| 279 | button | "Dismiss notification" | {()=>setNotice("")} |

Total: 522 control declarations. This inventory does not establish interaction correctness; rendering, callback, migration, export and browser tests supply the available evidence.
