# 헤드셋 이미지와 생성 기록

[문서 목록](../README.md) · [현재 디자인 기준](../../DESIGN.md)

## 현재 사용 자산

| 자산                                                                    | 역할                                          |
| ----------------------------------------------------------------------- | --------------------------------------------- |
| [노란 헤드셋](../../frontend/public/assets/listening-object-yellow.png) | 현재 Hero의 투명 배경 이미지                  |
| [원본 헤드셋](../../frontend/public/assets/listening-object.png)        | 초기 시안 보존, 현재 Hero에는 사용하지 않음   |
| [PaintSplash.tsx](../../frontend/src/components/PaintSplash.tsx)        | 이미지 뒤에서 별도로 움직이는 보라색 SVG 물감 |

노란 외장과 차콜 패딩을 사용하며, 원본의 형태·카메라 각도를 유지했다. 노란 이미지의 투명 배경은 기존 작업에서 알파 채널로 확인했다. 이미지와 SVG를 분리해 서로 다른 깊이로 움직인다. 특정 실제 제품의 판매·추천을 위한 이미지가 아닌 브랜드 시안용 생성 이미지다.

## 노란색 수정 프롬프트

기존 로컬 이미지를 편집한 당시 프롬프트 원문이다. 현재 프로젝트 색상은 [DESIGN.md](../../DESIGN.md)를 따른다.

```text
Edit the reference image for the TUNIT music website. Preserve the exact single over-ear headphone silhouette, three-quarter camera angle, headband arch, relative earcup sizes, mesh texture and realistic product rendering. Recolor ALL walnut wooden earcup exteriors and metal support arms and outer headband to vivid clean electric lemon yellow #FFF21A, with realistic glossy painted surfaces and subtle highlights. The cushions and inner headband padding may stay charcoal #171717. Remove ALL brown, gold, bronze and wood-grain coloration. Make the headphone a premium minimalist yellow-and-charcoal design object. Remove the entire background completely: genuinely transparent alpha background, including the open region inside the headband, with no rectangle, no dark backdrop, no ground plane, no shadow plane. Keep the same landscape 1536x1024 framing and full object placement with generous margin. Sharp realistic detail. NO words, no lettering, no logos, no text, no extra objects, no purple paint in this asset: the purple paint will be a separate animation layer in the website.
```

## 초기 원본 프롬프트

초기 [ORYZO 참고 문서](references/oryzo.md)를 바탕으로 생성한 당시 원문이다. 아래의 갈색·크림 지시는 초기 기록이며 현재 프로젝트 색상 기준이 아니다.

```text
Use case: product-mockup. Asset type: high-end music discovery website hero background, 1536x1024 landscape. Create a photorealistic editorial studio product photograph of ONE pair of elegant unbranded over-ear audiophile headphones, polished aged walnut-brown ear cups, fine brown mesh and brushed champagne aluminium arms, a supple dark chocolate leather headband. The headphones are suspended sculpturally in warm darkness, tilted slightly clockwise in three-quarter view, oval headband arcs above the beautifully crafted ear cups. Object occupies central 45% of canvas with generous completely empty negative space on left and right and above. Background solid very dark warm walnut near-black #100904, smoothly fading to that exact color near all edges, no horizon, no surface. Dramatic highly controlled warm softbox from upper right, a fine cream rim light on metal and wood, gorgeous tactile craftsmanship, deep subtly visible shadows. Premium museum artifact photography, quiet analog listening room mood, medium-format sharp product focus. No people, NO WORDS NO TEXT NO LETTERS, no logos, no watermarks, no bright color, no neon, no props. This is a restrained warm-brown and warm-cream scene. Save resulting image for use as a local website asset if file output is supported.
```
