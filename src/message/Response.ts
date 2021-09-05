import { Message } from "./Message";

export class Response {
  private _createdAt: string;
  private _messages: Message[];
  private _success: boolean;

  constructor(success: boolean, messages: Message | Message[]) {
    this._createdAt = new Date().toLocaleTimeString();
    this._messages = [messages].flat();
    this._success = success;
  }

  get createdAt() {
    return this._createdAt;
  }

  get messages() {
    return this._messages;
  }

  get success() {
    return this._success;
  }
}
