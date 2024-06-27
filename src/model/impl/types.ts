import type { Store, Event, Effect, EventCallable, Node } from 'effector';

export type Model<Props, Output, Api, Shape> = {
  type: 'model';
  // private
  create: (props: any, config: { onMount: Event<void> }) => any;
  // private
  readonly propsConfig: Props;
  readonly output: Output;
  // private
  readonly __lens: Shape;
  // private
  readonly api: Api;
  shape: Show<
    {
      [K in keyof Props]: Props[K] extends Store<infer V>
        ? StoreDef<V>
        : Props[K] extends StoreDef<unknown>
        ? Props[K]
        : Props[K] extends Event<infer V>
        ? EventDef<V>
        : Props[K] extends EventDef<unknown>
        ? Props[K]
        : Props[K] extends Effect<infer V, infer D, infer E>
        ? EffectDef<V, D, E>
        : Props[K] extends EffectDef<unknown, unknown, unknown>
        ? Props[K]
        : Props[K] extends (params: infer V) => infer D
        ? EffectDef<V, Awaited<D>, any>
        : StoreDef<Props[K]>;
    } & {
      [K in keyof Output]: Output[K] extends Store<infer V>
        ? StoreDef<V>
        : never;
    } & {
      [K in keyof Api]: Api[K] extends Event<infer V>
        ? EventDef<V>
        : Api[K] extends Effect<infer V, infer D, infer E>
        ? EffectDef<V, D, E>
        : never;
    }
  >;
  // private
  shapeInited: boolean;
};

export type Instance<Output, Api> = {
  type: 'instance';
  // private
  unmount(): void;
  readonly props: Output;
  // private
  region: Node;
  // private
  readonly inputs: Record<
    string,
    Store<any> | Event<any> | Effect<any, any, any>
  >;
  api: Api;
};

export type AnyDef<T> =
  | StoreDef<T>
  | EventDef<T>
  | EffectDef<T, unknown, unknown>;

export type StoreDef<T> = {
  type: 'storeDefinition';
  readonly __: T;
};

export type EventDef<T> = {
  type: 'eventDefinition';
  readonly __: T;
};

export type EffectDef<T, Result, Err> = {
  type: 'effectDefinition';
  readonly __: T;
  readonly res: Result;
  readonly err: Err;
};

export type EntityShapeDef<Shape> = {
  type: 'entityShapeDefinition';
  readonly shape: Shape;
};

export type EntityItemDef<T> = {
  type: 'entityItemDefinition';
  readonly __: T;
};

export type InstanceOf<T extends Model<unknown, unknown, unknown, unknown>> =
  T extends Model<any, infer Output, infer Api, any> ? Instance<Output, Api> : never;

export type KeyOrKeys = string | number | Array<string | number>;

export type LensShape<Shape> = {
  __type: 'lensShape';
} & Shape;

export type LensItem<T> = {
  __type: 'lensItem';
  store: Store<T>
};

export type LensStore<T> = {
  __type: 'lensStore';
  store: Store<T>
};

export type LensEvent<T> = {
  __type: 'lensEvent';
  __value: T;
};

type KeyStore = Store<string | number>;

export type ConvertToLensShape<Shape> = {
  [K in keyof Shape]: Shape[K] extends StoreDef<infer V>
    ? LensStore<V>
    : Shape[K] extends EventDef<infer V>
    ? LensEvent<V>
    : Shape[K] extends EntityShapeDef<infer ChildShape>
    ? (key: KeyStore) => LensShape<ConvertToLensShape<ChildShape>>
    : Shape[K] extends EntityItemDef<infer V>
    ? (key: KeyStore) => LensItem<V>
    : Shape[K] extends Store<infer V>
    ? LensStore<V>
    : Shape[K] extends Event<infer V>
    ? LensEvent<V>
    : Shape[K] extends EntityList<any, any, any, infer ChildShape>
    ? (key: KeyStore) => LensShape<ChildShape>
    : never;
};

export type EntityList<Input, Enriched extends Input, Api, Shape> = {
  type: 'entityList';
  api: {
    [K in keyof Api]: Api[K] extends EventCallable<infer V>
      ? EventCallable<
          | { key: string | number; data: V }
          | {
              key: Array<string | number>;
              data: V[];
            }
        >
      : never;
  };
  lens: (key: KeyStore) => Shape;
  $items: Store<Enriched[]>;
  $keys: Store<Array<string | number>>;
  edit: {
    /** Add one or multiple entities to the collection */
    add: EventCallable<Input | Input[]>;
    /** Add or replace one or multiple entities in the collection */
    set: EventCallable<Input | Input[]>;
    /** Update one or multiple entities in the collection. Supports partial updates */
    update: EventCallable<Partial<Input> | Partial<Input>[]>;
    /** Remove multiple entities from the collection, by id or by predicate */
    remove: EventCallable<KeyOrKeys | ((entity: Enriched) => boolean)>;
    /** Replace current collection with provided collection */
    replaceAll: EventCallable<Input[]>;
    /** Update multiple entities in the collection by defining a map function */
    map: EventCallable<{
      keys: KeyOrKeys;
      map: (entity: Enriched) => Partial<Input>;
    }>;
  };
};

type BuiltInObject =
  | Error
  | Date
  | RegExp
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | ReadonlyMap<unknown, unknown>
  | ReadonlySet<unknown>
  | WeakMap<object, unknown>
  | WeakSet<object>
  | ArrayBuffer
  | DataView
  | Function
  | Promise<unknown>
  | Generator;

/**
 * Force typescript to print real type instead of geneic types
 *
 * It's better to see {a: string; b: number}
 * instead of GetCombinedValue<{a: Store<string>; b: Store<number>}>
 * */
export type Show<A extends any> = A extends BuiltInObject
  ? A
  : {
      [K in keyof A]: A[K];
    }; // & {}
