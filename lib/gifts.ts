export type Gift = {
  id: number;
  name: string;
  shortName: string;
  video: string;
};

export const GIFTS: readonly Gift[] = [
  { id: 1, name: "01 gối Kymdan PressureFree Max (trị giá 3.816.000 VND)", shortName: "PressureFree Max", video: "/assets/Video/FreeMax.mp4" },
  { id: 2, name: "01 gối Kymdan PressureFree Air (trị giá 2.678.000 VND)", shortName: "PressureFree Air", video: "/assets/Video/FreeAir.mp4" },
  { id: 3, name: "01 gối Kymdan Glory Air (trị giá 2.571.000 VND)", shortName: "Glory Air", video: "/assets/Video/GloryAir.mp4" },
  { id: 4, name: "01 gối Kymdan TravelGo (trị giá 1.754.000 VND)", shortName: "TravelGo", video: "/assets/Video/TravelGo.mp4" },
  { id: 5, name: "01 gối Kymdan Comfy (trị giá 1.826.000 VND)", shortName: "Comfy", video: "/assets/Video/Comfy.mp4" },
  { id: 6, name: "01 gối Kymdan LumbarLatex Travel (trị giá 1.812.000 VND)", shortName: "LumbarLatex Travel", video: "/assets/Video/Lumbar.mp4" },
  { id: 7, name: "01 bộ 2 Voucher (giảm thêm 500.000 VND khi mua nệm + giảm thêm 300.000 VND khi mua gối)", shortName: "Bộ 2 Voucher", video: "/assets/Video/Voucher.mp4" },
];

export const GIFT_BY_ID = new Map(GIFTS.map((g) => [g.id, g]));
