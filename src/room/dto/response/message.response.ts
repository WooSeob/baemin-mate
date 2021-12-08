export interface Message<T> {
  id: string;
  idx: string;
  type: string;
  at: string;
  body: T;
}

export interface ChatBody {
  userId: string;
  name: string;
  message: string;
}

export interface SystemBody {
  action: string;
  data: any;
}
