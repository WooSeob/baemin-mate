export default interface Ack<T> {
  status: number;
  data: T;
}
