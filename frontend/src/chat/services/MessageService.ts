import type { SecureMessage } from '../types/chat';

type MessageStateListener = (messages: SecureMessage[], draft: string) => void;

const MAX_HISTORY = 100;

export class MessageService {
  private _messages: SecureMessage[] = [];
  private _draft = '';
  private listeners: MessageStateListener[] = [];

  // ─── Read ─────────────────────────────────────────────────────────────────

  public get messages(): SecureMessage[] {
    return this._messages;
  }

  public get draft(): string {
    return this._draft;
  }

  // ─── Subscribe ────────────────────────────────────────────────────────────

  public subscribe(listener: MessageStateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this._messages, this._draft));
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  /**
   * Adds a new secure message.
   * Generates a UUID, records timestamps, and bounds history to MAX_HISTORY.
   */
  public addMessage(
    text: string,
    sender: 'me' | 'opponent',
    createdAt: Date = new Date()
  ): SecureMessage {
    const msg: SecureMessage = {
      id: crypto.randomUUID(),
      text,
      sender,
      createdAt,
      receivedAt: new Date(), // moment the message was added to local state
    };

    this._messages = [...this._messages, msg];
    if (this._messages.length > MAX_HISTORY) {
      this._messages = this._messages.slice(this._messages.length - MAX_HISTORY);
    }

    this.notify();
    return msg;
  }

  // ─── Draft ────────────────────────────────────────────────────────────────

  /**
   * Saves the active input draft text.
   * Called on every MessageInput onChange; persists across drawer close/open.
   */
  public setDraft(text: string): void {
    this._draft = text;
    this.notify();
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  /**
   * Wipes messages and draft. Called only when the game fully ends.
   */
  public clear(): void {
    this._messages = [];
    this._draft = '';
    this.notify();
  }
}
