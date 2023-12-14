import { EventModifiers } from './index.js';

export interface CreateElementProps extends Record<string, unknown> {
  ns?: string;
}

export type EventModifier = (typeof EventModifiers)[number];

export type EventHandler = (e: Event) => void;

export interface LibraryConfig {
  events?: {
    wrapper?: (event: Event, callback: EventHandler) => void;
    syntax?: {
      vue?: boolean;
      svelte?: boolean;
      react?: boolean;
    };
  };
  attributes?: {
    class?: {
      directive?: boolean;
      className?: boolean;
    };
  };
}

export interface ElementWithEvents extends Element {
  __events__: Record<string, EventHandler>;
}
