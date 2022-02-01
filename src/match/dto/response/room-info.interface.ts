export default interface RoomInfo {
  id: string;
  purchaser_info: {
    name: string;
  };
  shopName: string;
  _3rd_app_link: string;

  total: number;
  least_price: number;

  min_tip: number;
  max_tip: number;

  current_user: number;
  max_user: number;

  section: string;
}
