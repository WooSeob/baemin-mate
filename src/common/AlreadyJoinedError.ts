export default class AlreadyJoinedError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "AlreadyJoinedError"; // (2)
  }
}
