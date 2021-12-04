export interface MenuItem {
  id: string;
  name: string;
  quantity: number;
  description: string;
  price: number;
}

export interface TipBoundary {
  price: number;
  tip: number;
}
